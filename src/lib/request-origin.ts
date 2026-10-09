import { headers } from "next/headers"

export async function requestOrigin() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (configured) return configured.replace(/\/$/, "")

  const headerStore = await headers()
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000"
  const forwardedProto = headerStore.get("x-forwarded-proto")
  const proto =
    forwardedProto ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https")
  return `${proto}://${host}`
}

export function attendanceUrl(origin: string, slug: string) {
  return `${origin}/program/${slug}`
}
