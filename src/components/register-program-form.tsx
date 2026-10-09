"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"

import { ProgramShare } from "@/components/program-share"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatDate, formatTime } from "@/lib/format"
import type { FormState } from "@/lib/types"
import { cn } from "@/lib/utils"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="h-11 px-5" disabled={pending}>
      {pending ? "Menyimpan..." : "Simpan program"}
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
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function RegisterProgramForm({
  action,
  origin,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>
  origin: string
}) {
  const [state, formAction] = useActionState<FormState, FormData>(action, null)
  const errors = state?.fieldErrors ?? {}
  const saved = state?.saved

  return (
    <div className="grid gap-4">
      {saved ? (
        <div
          className="grid gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3"
          role="status"
        >
          <p className="font-medium">Program telah disimpan.</p>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Nama Program</dt>
              <dd>{saved.title}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Lokasi</dt>
              <dd>{saved.venue}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Tarikh Program</dt>
              <dd>{formatDate(saved.eventDate)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Masa</dt>
              <dd>{formatTime(saved.eventTime)}</dd>
            </div>
          </dl>
          <ProgramShare url={`${origin}/program/${saved.slug}`} title={saved.title} />
          <Link
            href={`/program/${saved.slug}`}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 w-fit px-4")}
          >
            Buka borang kehadiran
          </Link>
        </div>
      ) : null}
      {state?.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <form key={saved?.id ?? "baharu"} action={formAction} className="grid gap-4">
        <Field id="title" label="Nama Program" error={errors.title}>
          <Input
            id="title"
            name="title"
            required
            minLength={3}
            maxLength={160}
            autoComplete="off"
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? "title-error" : undefined}
            className="h-11"
          />
        </Field>
        <Field id="venue" label="Lokasi" error={errors.venue}>
          <Input
            id="venue"
            name="venue"
            required
            minLength={2}
            maxLength={160}
            autoComplete="off"
            placeholder="Dewan atau alamat program"
            aria-invalid={Boolean(errors.venue)}
            aria-describedby={errors.venue ? "venue-error" : undefined}
            className="h-11"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="eventDate" label="Tarikh Program" error={errors.eventDate}>
            <Input
              id="eventDate"
              name="eventDate"
              type="date"
              required
              aria-invalid={Boolean(errors.eventDate)}
              aria-describedby={errors.eventDate ? "eventDate-error" : undefined}
              className="h-11"
            />
          </Field>
          <Field id="eventTime" label="Masa" error={errors.eventTime}>
            <Input
              id="eventTime"
              name="eventTime"
              type="time"
              required
              aria-invalid={Boolean(errors.eventTime)}
              aria-describedby={errors.eventTime ? "eventTime-error" : undefined}
              className="h-11"
            />
          </Field>
        </div>
        <SubmitButton />
      </form>
    </div>
  )
}
