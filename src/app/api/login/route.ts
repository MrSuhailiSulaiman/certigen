import { NextResponse } from "next/server"

import { createSessionValue, safeNext, sessionCookieOptions } from "@/lib/auth"
import { StoreError } from "@/lib/errors"
import { authenticate, ensureAdmin } from "@/lib/users"
import { fieldErrors, loginSchema } from "@/lib/validators"

function wantsJson(request: Request) {
  return request.headers.get("accept")?.includes("application/json") ?? false
}

function loginRedirect(request: Request, next: string, message: string) {
  const url = new URL("/login", request.url)
  if (next) url.searchParams.set("next", next)
  url.searchParams.set("ralat", message)
  return NextResponse.redirect(url, 303)
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const next = safeNext(formData.get("next")) ?? ""
  const json = wantsJson(request)
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  })
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error)
    if (!json) return loginRedirect(request, next, Object.values(errors)[0] ?? "Semakan gagal.")
    return NextResponse.json({ fieldErrors: errors }, { status: 400 })
  }

  try {
    await ensureAdmin()
    const account = await authenticate(parsed.data.username, parsed.data.password)
    if (!account) {
      const message = "Nama pengguna atau kata laluan tidak sepadan."
      if (!json) return loginRedirect(request, next, message)
      return NextResponse.json({ error: message }, { status: 401 })
    }
    const destination = next || "/urus"
    const response = json
      ? NextResponse.json({ next: destination })
      : NextResponse.redirect(new URL(destination, request.url), 303)
    response.cookies.set({
      ...sessionCookieOptions(),
      value: createSessionValue(account),
    })
    return response
  } catch (error) {
    const message =
      error instanceof StoreError
        ? error.message
        : "Log masuk tidak dapat disemak. Cuba sebentar lagi."
    if (!json) return loginRedirect(request, next, message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
