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
        <Label htmlFor="lookup-identity">No. kad pengenalan yang digunakan semasa daftar</Label>
        <Input
          id="lookup-identity"
          name="identityNo"
          inputMode="numeric"
          autoComplete="off"
          required
          maxLength={14}
          placeholder="990101-14-1234"
          className="h-11"
        />
        {state?.fieldErrors?.identityNo ? (
          <p className="text-sm text-destructive">{state.fieldErrors.identityNo}</p>
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
