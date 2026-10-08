"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { isOrganizer, startOrganizerSession, endOrganizerSession } from "@/lib/auth"
import { getStore, StoreError } from "@/lib/store"
import type { FormState } from "@/lib/types"
import { fieldErrors, pinSchema, readAttendance, readProgram } from "@/lib/validators"

function failure(error: unknown): FormState {
  if (error instanceof StoreError) return { error: error.message }
  console.error(error)
  return { error: "Tidak dapat menyimpan rekod. Cuba sebentar lagi." }
}

export async function submitAttendance(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = readAttendance(formData)
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error) }
  }

  let attendanceId = ""
  let alreadyRecorded = false
  try {
    const result = await getStore().recordAttendance(parsed.data)
    attendanceId = result.attendance.id
    alreadyRecorded = result.alreadyRecorded
    revalidatePath("/")
    revalidatePath("/urus")
  } catch (error) {
    return failure(error)
  }

  const query = alreadyRecorded ? "?sudah=1" : ""
  redirect(`/sijil/${attendanceId}${query}`)
}

export async function lookupAttendance(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const programId = String(formData.get("programId") ?? "")
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { fieldErrors: { email: "E-mel tidak sah." } }
  }

  let attendanceId = ""
  try {
    const attendance = await getStore().findAttendanceByEmail(programId, email)
    if (!attendance) {
      return {
        error: "E-mel ini belum direkod untuk program tersebut.",
      }
    }
    attendanceId = attendance.id
  } catch (error) {
    return failure(error)
  }
  redirect(`/sijil/${attendanceId}`)
}

export async function loginOrganizer(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = pinSchema.safeParse({ pin: formData.get("pin") })
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) }
  const ok = await startOrganizerSession(parsed.data.pin)
  if (!ok) return { error: "PIN tidak sepadan." }
  redirect("/urus")
}

export async function logoutOrganizer() {
  await endOrganizerSession()
  redirect("/urus")
}

export async function createProgram(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!(await isOrganizer())) return { error: "Sesi penganjur telah tamat." }
  const parsed = readProgram(formData)
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) }

  let id = ""
  try {
    const program = await getStore().createProgram(parsed.data)
    id = program.id
    revalidatePath("/")
    revalidatePath("/urus")
  } catch (error) {
    return failure(error)
  }
  redirect(`/urus/program/${id}`)
}

export async function updateProgram(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!(await isOrganizer())) return { error: "Sesi penganjur telah tamat." }
  const parsed = readProgram(formData)
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) }

  let slug = ""
  try {
    const program = await getStore().updateProgram(id, parsed.data)
    slug = program.slug
    revalidatePath("/")
    revalidatePath("/urus")
    revalidatePath(`/urus/program/${id}`)
    revalidatePath(`/program/${slug}`)
  } catch (error) {
    return failure(error)
  }
  redirect(`/urus/program/${id}`)
}

export async function toggleProgram(formData: FormData) {
  if (!(await isOrganizer())) redirect("/urus")
  const id = String(formData.get("id") ?? "")
  const isOpen = formData.get("isOpen") === "true"
  try {
    const program = await getStore().setProgramOpen(id, isOpen)
    revalidatePath("/")
    revalidatePath("/urus")
    revalidatePath(`/urus/program/${program.id}`)
    revalidatePath(`/program/${program.slug}`)
  } catch (error) {
    console.error(error)
  }
  redirect(`/urus/program/${id}`)
}
