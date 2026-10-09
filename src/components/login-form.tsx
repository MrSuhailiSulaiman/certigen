"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"

import { login } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { FormState } from "@/lib/types"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="h-11 px-5" disabled={pending}>
      {pending ? "Menyemak..." : "Masuk"}
    </Button>
  )
}

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState<FormState, FormData>(login, null)
  const errors = state?.fieldErrors ?? {}

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="next" value={next} />
      {state?.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {state.error}
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
          aria-invalid={Boolean(errors.username)}
        />
        {errors.username ? <p className="text-sm text-destructive">{errors.username}</p> : null}
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
          aria-invalid={Boolean(errors.password)}
        />
        {errors.password ? <p className="text-sm text-destructive">{errors.password}</p> : null}
      </div>
      <SubmitButton />
    </form>
  )
}
