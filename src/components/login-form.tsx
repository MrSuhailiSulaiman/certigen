"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"

import { loginOrganizer } from "@/app/actions"
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

export function LoginForm({ showDevPin }: { showDevPin: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(loginOrganizer, null)

  return (
    <form action={action} className="grid max-w-sm gap-4">
      {showDevPin ? (
        <p className="rounded-lg bg-secondary px-3 py-2 text-sm">
          Pembangunan: PIN lalai ialah <strong>hadir-2026</strong>. Tetapkan
          ORGANIZER_PIN sebelum production.
        </p>
      ) : null}
      {state?.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="grid gap-1.5">
        <Label htmlFor="pin">PIN penganjur</Label>
        <Input id="pin" name="pin" type="password" autoComplete="current-password" required className="h-11" />
        {state?.fieldErrors?.pin ? (
          <p className="text-sm text-destructive">{state.fieldErrors.pin}</p>
        ) : null}
      </div>
      <SubmitButton />
    </form>
  )
}
