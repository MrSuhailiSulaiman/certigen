"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getSession } from "@/lib/auth"
import {
  removeCertificateLogo,
  saveCertificateDesign,
  saveCertificateLogo,
  sniffImage,
} from "@/lib/certificate-assets"
import type { CertificateDesignId } from "@/lib/certificate-designs"
import { normalizeIdentity } from "@/lib/format"
import { getStore, StoreError } from "@/lib/store"
import type { FormState } from "@/lib/types"
import { registerGuru } from "@/lib/users"
import {
  fieldErrors,
  guruSchema,
  readAttendance,
  readProgram,
  readProgramRegistration,
} from "@/lib/validators"

async function storeCertificateChoices(programId: string, formData: FormData, design: string) {
  await saveCertificateDesign(programId, design as CertificateDesignId)
  const file = formData.get("logo")
  if (file instanceof File && file.size > 0) {
    if (file.size > 1_500_000) {
      throw new StoreError("Logo terlalu besar. Had saiz ialah 1.5 MB.")
    }
    const bytes = new Uint8Array(await file.arrayBuffer())
    const contentType = sniffImage(bytes)
    if (!contentType) {
      throw new StoreError("Logo mesti fail PNG atau JPEG.")
    }
    await saveCertificateLogo(programId, bytes, contentType)
    return
  }
  if (formData.get("removeLogo") === "on") {
    await removeCertificateLogo(programId)
  }
}

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
  const identityNo = normalizeIdentity(String(formData.get("identityNo") ?? ""))
  if (!/^\d{12}$/.test(identityNo)) {
    return { fieldErrors: { identityNo: "No. kad pengenalan mesti 12 digit." } }
  }

  let attendanceId = ""
  try {
    const attendance = await getStore().findAttendanceByIdentity(programId, identityNo)
    if (!attendance) {
      return {
        error: "No. kad pengenalan ini belum direkod untuk program tersebut.",
      }
    }
    attendanceId = attendance.id
  } catch (error) {
    return failure(error)
  }
  redirect(`/sijil/${attendanceId}`)
}

async function requireStaff() {
  const session = await getSession()
  if (!session) return null
  return session
}

export async function registerProgram(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!(await requireStaff())) {
    return { error: "Sila masuk sebagai guru atau admin untuk mendaftar program." }
  }
  const parsed = readProgramRegistration(formData)
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) }

  try {
    const program = await getStore().createProgram({
      title: parsed.data.title,
      description: "",
      organizer: "",
      venue: parsed.data.venue,
      eventDate: parsed.data.eventDate,
      eventEndDate: null,
      eventTime: parsed.data.eventTime,
      signatoryName: "",
      signatoryRole: "",
      isOpen: true,
      certificateDesign: "korporat",
    })
    revalidatePath("/")
    revalidatePath("/daftar")
    revalidatePath("/urus")
    return {
      saved: {
        id: program.id,
        slug: program.slug,
        title: program.title,
        venue: program.venue,
        eventDate: program.eventDate,
        eventTime: program.eventTime,
      },
    }
  } catch (error) {
    return failure(error)
  }
}

export async function createProgram(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!(await requireStaff())) return { error: "Sesi telah tamat. Sila masuk semula." }
  const parsed = readProgram(formData)
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) }

  let id = ""
  try {
    const program = await getStore().createProgram(parsed.data)
    id = program.id
    await storeCertificateChoices(program.id, formData, parsed.data.certificateDesign)
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
  if (!(await requireStaff())) return { error: "Sesi telah tamat. Sila masuk semula." }
  const parsed = readProgram(formData)
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) }

  let slug = ""
  try {
    const program = await getStore().updateProgram(id, parsed.data)
    await storeCertificateChoices(program.id, formData, parsed.data.certificateDesign)
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

export async function registerTeacher(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await getSession()
  if (session?.role !== "admin") {
    return { error: "Hanya admin boleh mendaftar guru." }
  }
  const parsed = guruSchema.safeParse({
    displayName: formData.get("displayName"),
    username: formData.get("username"),
    password: formData.get("password"),
  })
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) }

  try {
    const guru = await registerGuru(parsed.data)
    revalidatePath("/urus/guru")
    return { notice: `Guru ${guru.displayName} telah didaftarkan.` }
  } catch (error) {
    return failure(error)
  }
}

export async function toggleProgram(formData: FormData) {
  if (!(await requireStaff())) redirect("/login?next=/urus")
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
