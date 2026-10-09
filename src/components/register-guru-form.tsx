"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"

import { registerTeacher } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { FormState } from "@/lib/types"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="h-11 px-5" disabled={pending}>
      {pending ? "Mendaftar..." : "Daftar guru"}
    </Button>
  )
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}

export function RegisterGuruForm() {
  const [state, action] = useActionState<FormState, FormData>(registerTeacher, null)
  const errors = state?.fieldErrors ?? {}

  return (
    <form key={state?.notice ?? "baharu"} action={action} className="grid gap-4">
      {state?.notice ? (
        <p className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm" role="status">
          {state.notice}
        </p>
      ) : null}
      {state?.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <Field id="displayName" label="Nama guru" error={errors.displayName}>
        <Input id="displayName" name="displayName" required minLength={2} className="h-11" />
      </Field>
      <Field id="guru-username" label="Nama pengguna" error={errors.username}>
        <Input
          id="guru-username"
          name="username"
          required
          autoComplete="off"
          className="h-11"
          placeholder="cth. ahmad.ali"
        />
      </Field>
      <Field id="guru-password" label="Kata laluan" error={errors.password}>
        <Input
          id="guru-password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="h-11"
        />
      </Field>
      <SubmitButton />
    </form>
  )
}
