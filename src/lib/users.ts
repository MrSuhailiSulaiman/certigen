import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import { StoreError } from "@/lib/errors"

export type Role = "admin" | "guru"

export type Account = {
  id: string
  username: string
  displayName: string
  role: Role
  createdAt: string
}

type LocalAccount = Account & { passwordHash: string }

const ADMIN_USERNAME = "admin"
const ADMIN_PASSWORD = "admin123"
const ADMIN_NAME = "Admin"
const EMAIL_DOMAIN = "users.sijilhadir.local"

function authConfig() {
  const url = (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ""
  ).trim().replace(/\/$/, "")
  const anon = (
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""
  ).trim()
  const service = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    ""
  ).trim()
  return { url, anon, service, remote: Boolean(url && (anon || service)) }
}

export function accountEmail(username: string) {
  return `${username}@${EMAIL_DOMAIN}`
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url")
  const hash = scryptSync(password, salt, 32).toString("base64url")
  return `scrypt$${salt}$${hash}`
}

function verifyPassword(password: string, stored: string) {
  const [scheme, salt, hash] = stored.split("$")
  if (scheme !== "scrypt" || !salt || !hash) return false
  const actual = scryptSync(password, salt, 32)
  const expected = Buffer.from(hash, "base64url")
  if (actual.length !== expected.length) return false
  return timingSafeEqual(actual, expected)
}

function usersFile() {
  return path.join(process.cwd(), "data", "users.json")
}

async function readLocalUsers(): Promise<LocalAccount[]> {
  try {
    const raw = await readFile(usersFile(), "utf8")
    const parsed = JSON.parse(raw) as LocalAccount[]
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return []
    throw error
  }
}

async function writeLocalUsers(users: LocalAccount[]) {
  const file = usersFile()
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(users, null, 2))
}

async function authRequest(pathName: string, key: string, body?: unknown, method = "POST") {
  const { url } = authConfig()
  const response = await fetch(`${url}${pathName}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  })
  const text = await response.text()
  let json: Record<string, unknown> | null = null
  if (text) {
    try {
      json = JSON.parse(text) as Record<string, unknown>
    } catch {
      json = null
    }
  }
  return { response, json }
}

function accountFromAuth(user: Record<string, unknown>): Account | null {
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>
  const role = metadata.role
  const username = String(metadata.username ?? "").toLowerCase()
  if ((role !== "admin" && role !== "guru") || !username || typeof user.id !== "string") {
    return null
  }
  return {
    id: user.id,
    username,
    displayName: String(metadata.display_name || username),
    role,
    createdAt: typeof user.created_at === "string" ? user.created_at : new Date().toISOString(),
  }
}

function duplicateEmail(json: Record<string, unknown> | null) {
  return json?.error_code === "email_exists" || json?.code === "email_exists"
}

async function createRemoteAccount(input: {
  username: string
  password: string
  displayName: string
  role: Role
}) {
  const { service } = authConfig()
  if (!service) {
    throw new StoreError(
      "Akaun tidak dapat didaftarkan. Tetapkan SUPABASE_SERVICE_ROLE_KEY pada pelayan.",
    )
  }
  const { response, json } = await authRequest("/auth/v1/admin/users", service, {
    email: accountEmail(input.username),
    password: input.password,
    email_confirm: true,
    user_metadata: {
      username: input.username,
      role: input.role,
      display_name: input.displayName,
    },
  })
  if (response.status === 422 && duplicateEmail(json)) {
    throw new StoreError("Nama pengguna sudah digunakan.")
  }
  if (!response.ok || !json) {
    throw new StoreError("Akaun tidak dapat didaftarkan. Cuba sebentar lagi.")
  }
  const account = accountFromAuth(json)
  if (!account) throw new StoreError("Akaun tidak dapat didaftarkan. Cuba sebentar lagi.")
  return account
}

export async function ensureAdmin() {
  const config = authConfig()
  if (!config.remote) {
    const users = await readLocalUsers()
    if (users.some((user) => user.username === ADMIN_USERNAME)) return
    users.push({
      id: crypto.randomUUID(),
      username: ADMIN_USERNAME,
      displayName: ADMIN_NAME,
      role: "admin",
      passwordHash: hashPassword(ADMIN_PASSWORD),
      createdAt: new Date().toISOString(),
    })
    await writeLocalUsers(users)
    return
  }

  if (!config.service) return
  const { response, json } = await authRequest("/auth/v1/admin/users", config.service, {
    email: accountEmail(ADMIN_USERNAME),
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: {
      username: ADMIN_USERNAME,
      role: "admin",
      display_name: ADMIN_NAME,
    },
  })
  if (response.ok || (response.status === 422 && duplicateEmail(json))) return
  throw new StoreError("Akaun admin tidak dapat disediakan. Cuba sebentar lagi.")
}

export async function authenticate(username: string, password: string) {
  const normalized = username.trim().toLowerCase()
  const config = authConfig()
  if (!config.remote) {
    const user = (await readLocalUsers()).find((item) => item.username === normalized)
    if (!user || !verifyPassword(password, user.passwordHash)) return null
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      createdAt: user.createdAt,
    } satisfies Account
  }

  const key = config.anon || config.service
  const { response, json } = await authRequest("/auth/v1/token?grant_type=password", key, {
    email: accountEmail(normalized),
    password,
  })
  if (response.status === 400) return null
  if (!response.ok || !json) {
    throw new StoreError("Log masuk tidak dapat disemak. Cuba sebentar lagi.")
  }
  const user = json.user
  if (!user || typeof user !== "object") return null
  return accountFromAuth(user as Record<string, unknown>)
}

export async function registerGuru(input: {
  username: string
  password: string
  displayName: string
}) {
  const config = authConfig()
  if (!config.remote) {
    const users = await readLocalUsers()
    if (users.some((user) => user.username === input.username)) {
      throw new StoreError("Nama pengguna sudah digunakan.")
    }
    const account: LocalAccount = {
      id: crypto.randomUUID(),
      username: input.username,
      displayName: input.displayName,
      role: "guru",
      passwordHash: hashPassword(input.password),
      createdAt: new Date().toISOString(),
    }
    users.push(account)
    await writeLocalUsers(users)
    return account
  }
  return createRemoteAccount({ ...input, role: "guru" })
}

export async function listGurus() {
  const config = authConfig()
  if (!config.remote) {
    return (await readLocalUsers())
      .filter((user) => user.role === "guru")
      .map((user) => ({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        createdAt: user.createdAt,
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
  if (!config.service) {
    throw new StoreError(
      "Senarai guru tidak dapat dibaca. Tetapkan SUPABASE_SERVICE_ROLE_KEY pada pelayan.",
    )
  }

  const accounts: Account[] = []
  for (let page = 1; page <= 10; page += 1) {
    const { response, json } = await authRequest(
      `/auth/v1/admin/users?page=${page}&per_page=200`,
      config.service,
      undefined,
      "GET",
    )
    if (!response.ok || !json || !Array.isArray(json.users)) {
      throw new StoreError("Senarai guru tidak dapat dibaca. Cuba sebentar lagi.")
    }
    const users = json.users as Record<string, unknown>[]
    for (const user of users) {
      const account = accountFromAuth(user)
      if (account?.role === "guru") accounts.push(account)
    }
    if (users.length < 200) break
  }
  return accounts.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
