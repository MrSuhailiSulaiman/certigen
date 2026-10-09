import { createHmac, timingSafeEqual } from "node:crypto"

import { cookies, headers } from "next/headers"

import type { Role } from "@/lib/users"

export const SESSION_COOKIE = "sijil_session"
const MAX_AGE_SECONDS = 60 * 60 * 12

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

export function sessionCookieOptions() {
  return {
    name: SESSION_COOKIE,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  }
}

export function createSessionValue(user: SessionUser) {
  const body = Buffer.from(
    JSON.stringify({
      ...user,
      exp: Date.now() + MAX_AGE_SECONDS * 1000,
    }),
    "utf8",
  ).toString("base64url")
  return `${body}.${sign(body)}`
}

function readCookie(header: string, name: string) {
  for (const part of header.split(";")) {
    const separator = part.indexOf("=")
    if (separator === -1) continue
    if (part.slice(0, separator).trim() !== name) continue
    return decodeURIComponent(part.slice(separator + 1).trim())
  }
  return ""
}

function parseSession(raw: string): SessionUser | null {
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

async function sessionCookieValue() {
  try {
    const jar = await cookies()
    return jar.get(SESSION_COOKIE)?.value ?? ""
  } catch {
    const headerStore = await headers()
    return readCookie(headerStore.get("cookie") ?? "", SESSION_COOKIE)
  }
}

export async function getSession(): Promise<SessionUser | null> {
  return parseSession(await sessionCookieValue())
}
