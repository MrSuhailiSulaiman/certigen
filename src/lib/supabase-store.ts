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
  location?: string | null
  event_date: string
  event_end_date: string | null
  event_time: string | null
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
  no_kad_pengenalan?: string | null
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
      "Jadual Supabase belum wujud. Jalankan supabase/migrations/20261008120000_init.sql dalam SQL Editor.",
      { cause: error },
    )
  }
  if (error.code === "PGRST204" || message.includes("event_time")) {
    throw new StoreError(
      "Lajur masa belum wujud. Jalankan supabase/migrations/20261009120000_program_time.sql dalam SQL Editor.",
      { cause: error },
    )
  }
  if (error.code === "42703" || message.includes("programs.location")) {
    throw new StoreError(
      "Lajur location belum wujud. Jalankan supabase/migrations/20261009160000_program_location.sql dalam SQL Editor.",
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
    venue: (row.location ?? "").trim() || row.venue,
    eventDate: row.event_date,
    eventEndDate: row.event_end_date,
    eventTime: row.event_time ?? "",
    signatoryName: row.signatory_name,
    signatoryRole: row.signatory_role,
    isOpen: row.is_open,
    createdAt: row.created_at,
    attendanceCount: row.attendance?.[0]?.count,
  }
}

function digits(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "")
}

function identityFromRow(row: AttendanceRow) {
  for (const value of [row.no_kad_pengenalan, row.phone, row.email]) {
    const identity = digits(value)
    if (/^\d{12}$/.test(identity)) return identity
  }
  return (row.no_kad_pengenalan ?? "").trim()
}

function toAttendance(row: AttendanceRow): Attendance {
  return {
    id: row.id,
    programId: row.program_id,
    fullName: row.full_name,
    identityNo: identityFromRow(row),
    certificateNo: row.certificate_no,
    createdAt: row.created_at,
  }
}

let identityColumn: boolean | null = null
let locationColumn: boolean | null = null

async function hasLocationColumn(supabase: SupabaseClient) {
  if (locationColumn === true) return true
  const { error } = await supabase.from("programs").select("location").limit(1)
  if (!error) {
    locationColumn = true
    return true
  }
  if (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    error.message.includes("location")
  ) {
    return false
  }
  fail(error)
}

async function hasIdentityColumn(supabase: SupabaseClient) {
  if (identityColumn !== null) return identityColumn
  const { error } = await supabase.from("attendance").select("no_kad_pengenalan").limit(1)
  if (!error) {
    identityColumn = true
    return true
  }
  if (error.code === "PGRST204" || error.message.includes("no_kad_pengenalan")) {
    identityColumn = false
    return false
  }
  fail(error)
}

function programPayload(
  input: ProgramInput,
  extra?: { id?: string; slug?: string },
  includeLocation = false,
) {
  return {
    ...extra,
    title: input.title,
    description: input.description,
    organizer: input.organizer,
    venue: input.venue,
    ...(includeLocation ? { location: input.venue } : {}),
    event_date: input.eventDate,
    event_end_date: input.eventEndDate,
    event_time: input.eventTime,
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
    const row = programPayload(
      input,
      {
        id: crypto.randomUUID(),
        slug: slugify(input.title),
      },
      await hasLocationColumn(supabase),
    )
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
      .update(programPayload(input, undefined, await hasLocationColumn(supabase)))
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

    const identityNo = input.identityNo
    const existing = await this.findAttendanceByIdentity(program.id, identityNo)
    if (existing) return { attendance: existing, alreadyRecorded: true }

    const id = crypto.randomUUID()
    const withIdentityColumn = await hasIdentityColumn(supabase)
    const row: Record<string, string> = {
      id,
      program_id: program.id,
      full_name: input.fullName,
      email: identityNo,
      organization: "",
      phone: identityNo,
      certificate_no: certificateNumber(id, program.eventDate),
    }
    if (withIdentityColumn) row.no_kad_pengenalan = identityNo
    const { data, error } = await supabase.from("attendance").insert(row).select("*").single()

    if (error) {
      if (error.code === "23505") {
        const again = await this.findAttendanceByIdentity(program.id, identityNo)
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

  async findAttendanceByIdentity(programId, identityNo) {
    const supabase = client()
    const withIdentityColumn = await hasIdentityColumn(supabase)
    let query = supabase.from("attendance").select("*").eq("program_id", programId)
    query = withIdentityColumn
      ? query.or(`no_kad_pengenalan.eq.${identityNo},phone.eq.${identityNo},email.eq.${identityNo}`)
      : query.or(`phone.eq.${identityNo},email.eq.${identityNo}`)
    const { data, error } = await query.maybeSingle()
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
