import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js"

import { certificateNumber, slugify } from "@/lib/format"
import { getSupabase } from "@/lib/supabase"
import { StoreError } from "@/lib/errors"
import type {
  Attendance,
  AttendanceInput,
  AttendanceStore,
  AttendanceWithProgram,
  Program,
  ProgramInput,
} from "@/lib/types"

type ProgramRow = {
  id: string
  slug: string
  title: string
  description: string
  organizer: string
  venue: string
  event_date: string
  event_end_date: string | null
  signatory_name: string
  signatory_role: string
  is_open: boolean
  created_at: string
  attendance?: { count: number }[]
}

type AttendanceRow = {
  id: string
  program_id: string
  full_name: string
  email: string
  organization: string
  phone: string
  certificate_no: string
  created_at: string
}

function fail(error: PostgrestError): never {
  const message = error.message ?? ""
  if (
    error.code === "42P01" ||
    message.includes("does not exist") ||
    message.includes("schema cache")
  ) {
    throw new StoreError(
      "Jadual Supabase belum wujud. Jalankan fail migrasi SQL dalam SQL Editor.",
      { cause: error },
    )
  }
  throw new StoreError("Tidak dapat berhubung dengan Supabase. Cuba sebentar lagi.", {
    cause: error,
  })
}

function client(): SupabaseClient {
  const supabase = getSupabase()
  if (!supabase) {
    throw new StoreError("Supabase belum dikonfigurasi.")
  }
  return supabase
}

function toProgram(row: ProgramRow): Program {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    organizer: row.organizer,
    venue: row.venue,
    eventDate: row.event_date,
    eventEndDate: row.event_end_date,
    signatoryName: row.signatory_name,
    signatoryRole: row.signatory_role,
    isOpen: row.is_open,
    createdAt: row.created_at,
    attendanceCount: row.attendance?.[0]?.count,
  }
}

function toAttendance(row: AttendanceRow): Attendance {
  return {
    id: row.id,
    programId: row.program_id,
    fullName: row.full_name,
    email: row.email,
    organization: row.organization,
    phone: row.phone,
    certificateNo: row.certificate_no,
    createdAt: row.created_at,
  }
}

function programPayload(input: ProgramInput, extra?: { id?: string; slug?: string }) {
  return {
    ...extra,
    title: input.title,
    description: input.description,
    organizer: input.organizer,
    venue: input.venue,
    event_date: input.eventDate,
    event_end_date: input.eventEndDate,
    signatory_name: input.signatoryName,
    signatory_role: input.signatoryRole,
    is_open: input.isOpen,
  }
}

export const supabaseStore: AttendanceStore = {
  mode: "supabase",

  async listPrograms(options) {
    const supabase = client()
    if (options?.withCounts) {
      const { data, error } = await supabase
        .from("programs")
        .select("*, attendance(count)")
        .order("event_date", { ascending: false })
      if (error) fail(error)
      return ((data ?? []) as unknown as ProgramRow[]).map(toProgram)
    }
    const { data, error } = await supabase
      .from("programs")
      .select("*")
      .order("event_date", { ascending: false })
    if (error) fail(error)
    return ((data ?? []) as ProgramRow[]).map(toProgram)
  },

  async getProgramBySlug(slug) {
    const supabase = client()
    const { data, error } = await supabase
      .from("programs")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
    if (error) fail(error)
    return data ? toProgram(data as ProgramRow) : null
  },

  async getProgramById(id) {
    const supabase = client()
    const { data, error } = await supabase
      .from("programs")
      .select("*")
      .eq("id", id)
      .maybeSingle()
    if (error) fail(error)
    return data ? toProgram(data as ProgramRow) : null
  },

  async createProgram(input) {
    const supabase = client()
    const row = programPayload(input, {
      id: crypto.randomUUID(),
      slug: slugify(input.title),
    })
    const { data, error } = await supabase
      .from("programs")
      .insert(row)
      .select("*")
      .single()
    if (error) fail(error)
    return toProgram(data as ProgramRow)
  },

  async updateProgram(id, input) {
    const supabase = client()
    const { data, error } = await supabase
      .from("programs")
      .update(programPayload(input))
      .eq("id", id)
      .select("*")
      .maybeSingle()
    if (error) fail(error)
    if (!data) throw new StoreError("Program tidak dijumpai.")
    return toProgram(data as ProgramRow)
  },

  async setProgramOpen(id, isOpen) {
    const supabase = client()
    const { data, error } = await supabase
      .from("programs")
      .update({ is_open: isOpen })
      .eq("id", id)
      .select("*")
      .maybeSingle()
    if (error) fail(error)
    if (!data) throw new StoreError("Program tidak dijumpai.")
    return toProgram(data as ProgramRow)
  },

  async recordAttendance(input: AttendanceInput) {
    const supabase = client()
    const program = await this.getProgramById(input.programId)
    if (!program) throw new StoreError("Program tidak dijumpai.")
    if (!program.isOpen) {
      throw new StoreError(
        "Pendaftaran kehadiran untuk program ini telah ditutup.",
      )
    }

    const email = input.email.toLowerCase()
    const existing = await this.findAttendanceByEmail(program.id, email)
    if (existing) return { attendance: existing, alreadyRecorded: true }

    const id = crypto.randomUUID()
    const { data, error } = await supabase
      .from("attendance")
      .insert({
        id,
        program_id: program.id,
        full_name: input.fullName,
        email,
        organization: input.organization,
        phone: input.phone,
        certificate_no: certificateNumber(id, program.eventDate),
      })
      .select("*")
      .single()

    if (error) {
      if (error.code === "23505") {
        const again = await this.findAttendanceByEmail(program.id, email)
        if (again) return { attendance: again, alreadyRecorded: true }
      }
      fail(error)
    }
    return { attendance: toAttendance(data as AttendanceRow), alreadyRecorded: false }
  },

  async getAttendance(id): Promise<AttendanceWithProgram | null> {
    const supabase = client()
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("id", id)
      .maybeSingle()
    if (error) fail(error)
    if (!data) return null
    const attendance = toAttendance(data as AttendanceRow)
    const program = await this.getProgramById(attendance.programId)
    if (!program) return null
    return { ...attendance, program }
  },

  async findAttendanceByEmail(programId, email) {
    const supabase = client()
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("program_id", programId)
      .eq("email", email.toLowerCase())
      .maybeSingle()
    if (error) fail(error)
    return data ? toAttendance(data as AttendanceRow) : null
  },

  async listAttendance(programId) {
    const supabase = client()
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("program_id", programId)
      .order("created_at", { ascending: false })
    if (error) fail(error)
    return ((data ?? []) as AttendanceRow[]).map(toAttendance)
  },
}
