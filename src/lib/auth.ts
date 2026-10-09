import { createHmac, timingSafeEqual } from "node:crypto"

import { cookies } from "next/headers"

import type { Role } from "@/lib/users"

const COOKIE = "sijil_session"
const MAX_AGE_MS = 60 * 60 * 12 * 1000

export type SessionUser = {
  id: string
  username: string
  displayName: string
  role: Role
}

function sessionSecret() {
  return (
    process.env.AUTH_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    "sijil-hadir-dev-session"
  )
}

function sign(body: string) {
  return createHmac("sha256", sessionSecret()).update(body).digest("base64url")
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function safeNext(value: unknown) {
  if (typeof value !== "string") return null
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null
  if (value.startsWith("/login")) return null
  return value
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies()
  const raw = jar.get(COOKIE)?.value
  if (!raw) return null
  const separator = raw.lastIndexOf(".")
  if (separator <= 0) return null
  const body = raw.slice(0, separator)
  const signature = raw.slice(separator + 1)
  if (!safeEqual(signature, sign(body))) return null

  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionUser & {
      exp?: number
    }
    if (typeof data.exp !== "number" || data.exp < Date.now()) return null
    if (data.role !== "admin" && data.role !== "guru") return null
    if (!data.id || !data.username) return null
    return {
      id: data.id,
      username: data.username,
      displayName: data.displayName || data.username,
      role: data.role,
    }
  } catch {
    return null
  }
}

export async function startSession(user: SessionUser) {
  const body = Buffer.from(
    JSON.stringify({ ...user, exp: Date.now() + MAX_AGE_MS }),
    "utf8",
  ).toString("base64url")
  const jar = await cookies()
  jar.set(COOKIE, `${body}.${sign(body)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_MS / 1000,
  })
}

export async function endSession() {
  const jar = await cookies()
  jar.delete(COOKIE)
}
