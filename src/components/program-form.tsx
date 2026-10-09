"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { FormState, Program } from "@/lib/types"

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="h-11 px-5" disabled={pending}>
      {pending ? "Menyimpan..." : label}
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

export function ProgramForm({
  action,
  program,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>
  program?: Program
  submitLabel: string
}) {
  const [state, formAction] = useActionState<FormState, FormData>(action, null)
  const errors = state?.fieldErrors ?? {}

  return (
    <form action={formAction} className="grid gap-4">
      {state?.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <Field id="title" label="Tajuk program" error={errors.title}>
        <Input id="title" name="title" required defaultValue={program?.title} className="h-11" />
      </Field>
      <Field id="description" label="Penerangan" error={errors.description}>
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={program?.description}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="organizer" label="Penganjur" error={errors.organizer}>
          <Input
            id="organizer"
            name="organizer"
            required
            defaultValue={program?.organizer}
            className="h-11"
          />
        </Field>
        <Field id="venue" label="Lokasi" error={errors.venue}>
          <Input id="venue" name="venue" required defaultValue={program?.venue} className="h-11" />
        </Field>
        <Field id="eventDate" label="Tarikh mula" error={errors.eventDate}>
          <Input
            id="eventDate"
            name="eventDate"
            type="date"
            required
            defaultValue={program?.eventDate}
            className="h-11"
          />
        </Field>
        <Field id="eventEndDate" label="Tarikh tamat" error={errors.eventEndDate}>
          <Input
            id="eventEndDate"
            name="eventEndDate"
            type="date"
            defaultValue={program?.eventEndDate ?? ""}
            className="h-11"
          />
        </Field>
        <Field id="eventTime" label="Masa" error={errors.eventTime}>
          <Input
            id="eventTime"
            name="eventTime"
            type="time"
            defaultValue={program?.eventTime ?? ""}
            className="h-11"
          />
        </Field>
        <Field id="signatoryName" label="Nama penandatangan" error={errors.signatoryName}>
          <Input
            id="signatoryName"
            name="signatoryName"
            required
            defaultValue={program?.signatoryName}
            className="h-11"
          />
        </Field>
        <Field id="signatoryRole" label="Jawatan penandatangan" error={errors.signatoryRole}>
          <Input
            id="signatoryRole"
            name="signatoryRole"
            defaultValue={program?.signatoryRole}
            className="h-11"
          />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isOpen"
          defaultChecked={program?.isOpen ?? true}
          className="size-4 accent-primary"
        />
        Buka pendaftaran kehadiran
      </label>
      <SubmitButton label={submitLabel} />
    </form>
  )
}
