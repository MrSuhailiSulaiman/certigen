"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"

import { lookupAttendance } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { FormState } from "@/lib/types"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="outline" className="h-11 px-5" disabled={pending}>
      {pending ? "Mencari..." : "Cari sijil"}
    </Button>
  )
}

export function LookupForm({ programId }: { programId: string }) {
  const [state, action] = useActionState<FormState, FormData>(lookupAttendance, null)

  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="programId" value={programId} />
      <div className="grid gap-1.5">
        <Label htmlFor="lookup-email">E-mel yang digunakan semasa daftar</Label>
        <Input id="lookup-email" name="email" type="email" required className="h-11" />
        {state?.fieldErrors?.email ? (
          <p className="text-sm text-destructive">{state.fieldErrors.email}</p>
        ) : null}
      </div>
      {state?.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  )
}
