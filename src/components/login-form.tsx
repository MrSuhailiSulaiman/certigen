"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginForm({ next, initialError = "" }: { next: string; initialError?: string }) {
  const [error, setError] = useState(initialError)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [pending, setPending] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError("")
    setFieldErrors({})
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(event.currentTarget),
      })
      const data = (await response.json()) as {
        error?: string
        fieldErrors?: Record<string, string>
        next?: string
      }
      if (!response.ok) {
        setError(data.error ?? "Log masuk gagal.")
        setFieldErrors(data.fieldErrors ?? {})
        setPending(false)
        return
      }
      window.location.assign(data.next || "/urus")
    } catch {
      setError("Log masuk tidak dapat disemak. Cuba sebentar lagi.")
      setPending(false)
    }
  }

  return (
    <form action="/api/login" method="post" onSubmit={onSubmit} className="grid gap-4">
      <input type="hidden" name="next" value={next} />
      {error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div className="grid gap-1.5">
        <Label htmlFor="username">Nama pengguna</Label>
        <Input
          id="username"
          name="username"
          autoComplete="username"
          required
          className="h-11"
          aria-invalid={Boolean(fieldErrors.username)}
        />
        {fieldErrors.username ? (
          <p className="text-sm text-destructive">{fieldErrors.username}</p>
        ) : null}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="password">Kata laluan</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-11"
          aria-invalid={Boolean(fieldErrors.password)}
        />
        {fieldErrors.password ? (
          <p className="text-sm text-destructive">{fieldErrors.password}</p>
        ) : null}
      </div>
      <Button type="submit" className="h-11 px-5" disabled={pending}>
        {pending ? "Menyemak..." : "Masuk"}
      </Button>
    </form>
  )
}
