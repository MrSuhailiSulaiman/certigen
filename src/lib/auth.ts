import { createHmac, timingSafeEqual } from "node:crypto"

import { cookies } from "next/headers"

const COOKIE = "sijil_urus"
const DEV_PIN = "hadir-2026"

export function organizerAccess() {
  const configured = process.env.ORGANIZER_PIN?.trim() ?? ""
  if (configured.length >= 4) {
    return { pin: configured, fallback: false, enabled: true }
  }
  if (process.env.NODE_ENV !== "production") {
    return { pin: DEV_PIN, fallback: true, enabled: true }
  }
  return { pin: "", fallback: false, enabled: false }
}

function digest(value: string) {
  return createHmac("sha256", "sijil-hadir-pin").update(value).digest()
}

function sameSecret(left: string, right: string) {
  return timingSafeEqual(digest(left), digest(right))
}

function sessionToken(pin: string) {
  return createHmac("sha256", pin).update("sijil-urus-session").digest("hex")
}

export async function isOrganizer() {
  const access = organizerAccess()
  if (!access.enabled) return false
  const jar = await cookies()
  const value = jar.get(COOKIE)?.value
  if (!value) return false
  return sameSecret(value, sessionToken(access.pin))
}

export async function startOrganizerSession(pinAttempt: string) {
  const access = organizerAccess()
  if (!access.enabled || !sameSecret(pinAttempt, access.pin)) return false
  const jar = await cookies()
  jar.set(COOKIE, sessionToken(access.pin), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  })
  return true
}

export async function endOrganizerSession() {
  const jar = await cookies()
  jar.delete(COOKIE)
}
