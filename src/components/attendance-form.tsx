"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"

import { submitAttendance } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { FormState } from "@/lib/types"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="h-11 px-5" disabled={pending}>
      {pending ? "Menyimpan kehadiran..." : "Hantar kehadiran dan jana sijil"}
    </Button>
  )
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function AttendanceForm({ programId }: { programId: string }) {
  const [state, action] = useActionState<FormState, FormData>(submitAttendance, null)
  const errors = state?.fieldErrors ?? {}

  return (
    <form action={action} className="grid gap-4" noValidate>
      <input type="hidden" name="programId" value={programId} />
      {state?.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <Field id="fullName" label="Nama penuh" error={errors.fullName}>
        <Input
          id="fullName"
          name="fullName"
          autoComplete="name"
          required
          className="h-11"
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby={errors.fullName ? "fullName-error" : undefined}
        />
      </Field>
      <Field id="email" label="E-mel" error={errors.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-11"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
      </Field>
      <Field
        id="organization"
        label="Organisasi atau institusi"
        hint="Tulis Individu jika anda hadir secara persendirian."
        error={errors.organization}
      >
        <Input
          id="organization"
          name="organization"
          autoComplete="organization"
          required
          className="h-11"
          aria-invalid={Boolean(errors.organization)}
          aria-describedby={errors.organization ? "organization-error" : undefined}
        />
      </Field>
      <Field id="phone" label="No. telefon" hint="Pilihan." error={errors.phone}>
        <Input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          className="h-11"
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? "phone-error" : undefined}
        />
      </Field>
      <SubmitButton />
    </form>
  )
}
