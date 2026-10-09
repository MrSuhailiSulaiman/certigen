import { z } from "zod"

import type { AttendanceInput, ProgramInput } from "@/lib/types"

const dateField = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Tarikh tidak sah.")

const timeField = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/, "Masa tidak sah.")
  .transform((value) => value.slice(0, 5))

const optionalTimeField = z
  .string()
  .trim()
  .transform((value) =>
    /^\d{2}:\d{2}:\d{2}$/.test(value) ? value.slice(0, 5) : value,
  )
  .refine(
    (value) => value === "" || /^([01]\d|2[0-3]):[0-5]\d$/.test(value),
    "Masa tidak sah.",
  )

export const attendanceSchema = z.object({
  programId: z.string().trim().uuid("Program tidak sah."),
  fullName: z
    .string()
    .trim()
    .min(2, "Nama penuh diperlukan.")
    .max(120, "Nama terlalu panjang."),
  email: z
    .string()
    .trim()
    .max(160, "E-mel terlalu panjang.")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "E-mel tidak sah.")
    .transform((value) => value.toLowerCase()),
  organization: z
    .string()
    .trim()
    .min(2, "Nyatakan organisasi, atau tulis Individu.")
    .max(160, "Organisasi terlalu panjang."),
  phone: z
    .string()
    .trim()
    .max(30, "No. telefon terlalu panjang.")
    .regex(/^[0-9+\-\s()]*$/, "No. telefon tidak sah."),
})

export const programSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Tajuk program diperlukan.")
      .max(160, "Tajuk terlalu panjang."),
    description: z.string().trim().max(800, "Penerangan terlalu panjang."),
    organizer: z
      .string()
      .trim()
      .min(2, "Nama penganjur diperlukan.")
      .max(160, "Nama penganjur terlalu panjang."),
    venue: z
      .string()
      .trim()
      .min(2, "Tempat diperlukan.")
      .max(160, "Tempat terlalu panjang."),
    eventDate: dateField,
    eventEndDate: z.string().trim(),
    eventTime: optionalTimeField,
    signatoryName: z
      .string()
      .trim()
      .min(2, "Nama penandatangan diperlukan.")
      .max(120, "Nama penandatangan terlalu panjang."),
    signatoryRole: z.string().trim().max(120, "Jawatan terlalu panjang."),
    isOpen: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.eventEndDate && !/^\d{4}-\d{2}-\d{2}$/.test(value.eventEndDate)) {
      ctx.addIssue({
        code: "custom",
        path: ["eventEndDate"],
        message: "Tarikh tamat tidak sah.",
      })
      return
    }
    if (value.eventEndDate && value.eventEndDate < value.eventDate) {
      ctx.addIssue({
        code: "custom",
        path: ["eventEndDate"],
        message: "Tarikh tamat mesti pada atau selepas tarikh mula.",
      })
    }
  })
  .transform(
    (value): ProgramInput => ({
      ...value,
      eventEndDate: value.eventEndDate || null,
    }),
  )

export const programRegistrationSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Nama program diperlukan.")
    .max(160, "Nama program terlalu panjang."),
  eventDate: dateField,
  eventTime: timeField,
})

export const pinSchema = z.object({
  pin: z.string().trim().min(4, "PIN terlalu pendek.").max(80),
})

export function fieldErrors(error: z.ZodError) {
  const errors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path[0]
    if (typeof key === "string" && !errors[key]) {
      errors[key] = issue.message
    }
  }
  return errors
}

export function readAttendance(formData: FormData) {
  return attendanceSchema.safeParse({
    programId: formData.get("programId"),
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    organization: formData.get("organization"),
    phone: formData.get("phone") ?? "",
  })
}

export function readProgram(formData: FormData) {
  return programSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    organizer: formData.get("organizer"),
    venue: formData.get("venue"),
    eventDate: formData.get("eventDate"),
    eventEndDate: formData.get("eventEndDate") ?? "",
    eventTime: formData.get("eventTime") ?? "",
    signatoryName: formData.get("signatoryName"),
    signatoryRole: formData.get("signatoryRole") ?? "",
    isOpen: formData.get("isOpen") === "on",
  })
}

export function readProgramRegistration(formData: FormData) {
  return programRegistrationSchema.safeParse({
    title: formData.get("title") ?? "",
    eventDate: formData.get("eventDate") ?? "",
    eventTime: formData.get("eventTime") ?? "",
  })
}

export type ParsedAttendance = AttendanceInput
