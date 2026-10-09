import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import path from "node:path"

import { certificateNumber, slugify } from "@/lib/format"
import type {
  Attendance,
  AttendanceInput,
  AttendanceStore,
  AttendanceWithProgram,
  Program,
  ProgramInput,
} from "@/lib/types"
import { StoreError } from "@/lib/errors"

type Database = {
  programs: Program[]
  attendance: Attendance[]
}

const filePath = path.join(process.cwd(), "data", "store.json")

const seedPrograms: Program[] = [
  {
    id: "6f1c2a40-7b21-4a1e-9c31-0a11b2c3d4e5",
    slug: "bengkel-reka-bentuk-perkhidmatan-awam",
    title: "Bengkel Reka Bentuk Perkhidmatan Awam",
    description:
      "Sesi sehari untuk memeta perjalanan pengguna dan menulis cadangan penambahbaikan perkhidmatan kaunter.",
    organizer: "Akademi Pentadbiran Komuniti",
    venue: "Dewan Seminar, Putrajaya",
    eventDate: "2026-10-18",
    eventEndDate: null,
    eventTime: "09:00",
    signatoryName: "Dr. Amirah Zakaria",
    signatoryRole: "Pengarah Program",
    isOpen: true,
    createdAt: "2026-10-01T02:00:00.000Z",
  },
  {
    id: "8a2d4b51-1c32-4f6e-8d42-1b22c3d4e5f6",
    slug: "forum-belia-dan-ekonomi-hijau",
    title: "Forum Belia dan Ekonomi Hijau",
    description:
      "Perbincangan dua hari tentang perniagaan rendah karbon, pembiayaan awal, dan kerjasama komuniti.",
    organizer: "Jaringan Usahawan Muda",
    venue: "Pusat Konvensyen Shah Alam",
    eventDate: "2026-11-02",
    eventEndDate: "2026-11-03",
    eventTime: "14:30",
    signatoryName: "Encik Hafiz Rahman",
    signatoryRole: "Pengerusi Penganjur",
    isOpen: true,
    createdAt: "2026-10-02T02:00:00.000Z",
  },
]

let queue: Promise<unknown> = Promise.resolve()

function withLock<T>(task: () => Promise<T>) {
  const run = queue.then(task, task)
  queue = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

async function readDatabase(): Promise<Database> {
  try {
    const raw = await readFile(filePath, "utf8")
    const parsed = JSON.parse(raw) as Database
    if (!Array.isArray(parsed.programs) || !Array.isArray(parsed.attendance)) {
      throw new Error("invalid store")
    }
    return parsed
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException
    if (nodeError.code && nodeError.code !== "ENOENT") {
      throw new StoreError("Rekod tempatan tidak dapat dibaca.", { cause: error })
    }
    const fresh = { programs: seedPrograms, attendance: [] }
    await writeDatabase(fresh)
    return fresh
  }
}

async function writeDatabase(data: Database) {
  const directory = path.dirname(filePath)
  await mkdir(directory, { recursive: true })
  const temporary = `${filePath}.${process.pid}.tmp`
  await writeFile(temporary, JSON.stringify(data, null, 2))
  await rename(temporary, filePath)
}

function normalizeProgram(program: Program): Program {
  return {
    ...program,
    eventTime: program.eventTime ?? "",
    description: program.description ?? "",
    organizer: program.organizer ?? "",
    venue: program.venue ?? "",
    signatoryName: program.signatoryName ?? "",
    signatoryRole: program.signatoryRole ?? "",
  }
}

function withCounts(data: Database, programs: Program[], withCounts: boolean) {
  if (!withCounts) return programs
  return programs.map((program) => ({
    ...program,
    attendanceCount: data.attendance.filter(
      (row) => row.programId === program.id,
    ).length,
  }))
}

export const localStore: AttendanceStore = {
  mode: "local",

  async listPrograms(options) {
    return withLock(async () => {
      const data = await readDatabase()
      const programs = data.programs
        .map(normalizeProgram)
        .sort((a, b) => (a.eventDate < b.eventDate ? 1 : -1))
      return withCounts(data, programs, Boolean(options?.withCounts))
    })
  },

  async getProgramBySlug(slug) {
    const data = await readDatabase()
    const program = data.programs.find((item) => item.slug === slug)
    return program ? normalizeProgram(program) : null
  },

  async getProgramById(id) {
    const data = await readDatabase()
    const program = data.programs.find((item) => item.id === id)
    return program ? normalizeProgram(program) : null
  },

  async createProgram(input: ProgramInput) {
    return withLock(async () => {
      const data = await readDatabase()
      const program: Program = {
        ...input,
        id: crypto.randomUUID(),
        slug: slugify(input.title),
        createdAt: new Date().toISOString(),
      }
      data.programs.push(program)
      await writeDatabase(data)
      return program
    })
  },

  async updateProgram(id, input) {
    return withLock(async () => {
      const data = await readDatabase()
      const index = data.programs.findIndex((program) => program.id === id)
      if (index < 0) throw new StoreError("Program tidak dijumpai.")
      const next = { ...data.programs[index], ...input }
      data.programs[index] = next
      await writeDatabase(data)
      return next
    })
  },

  async setProgramOpen(id, isOpen) {
    return withLock(async () => {
      const data = await readDatabase()
      const index = data.programs.findIndex((program) => program.id === id)
      if (index < 0) throw new StoreError("Program tidak dijumpai.")
      data.programs[index] = { ...data.programs[index], isOpen }
      await writeDatabase(data)
      return data.programs[index]
    })
  },

  async recordAttendance(input: AttendanceInput) {
    return withLock(async () => {
      const data = await readDatabase()
      const program = data.programs.find((item) => item.id === input.programId)
      if (!program) throw new StoreError("Program tidak dijumpai.")
      if (!program.isOpen) {
        throw new StoreError(
          "Pendaftaran kehadiran untuk program ini telah ditutup.",
        )
      }
      const email = input.email.toLowerCase()
      const existing = data.attendance.find(
        (row) => row.programId === program.id && row.email === email,
      )
      if (existing) return { attendance: existing, alreadyRecorded: true }

      const id = crypto.randomUUID()
      const attendance: Attendance = {
        id,
        programId: program.id,
        fullName: input.fullName,
        email,
        organization: input.organization,
        phone: input.phone,
        certificateNo: certificateNumber(id, program.eventDate),
        createdAt: new Date().toISOString(),
      }
      data.attendance.push(attendance)
      await writeDatabase(data)
      return { attendance, alreadyRecorded: false }
    })
  },

  async getAttendance(id): Promise<AttendanceWithProgram | null> {
    const data = await readDatabase()
    const attendance = data.attendance.find((row) => row.id === id)
    if (!attendance) return null
    const program = data.programs.find((item) => item.id === attendance.programId)
    if (!program) return null
    return { ...attendance, program: normalizeProgram(program) }
  },

  async findAttendanceByEmail(programId, email) {
    const data = await readDatabase()
    const normalized = email.toLowerCase()
    return (
      data.attendance.find(
        (row) => row.programId === programId && row.email === normalized,
      ) ?? null
    )
  },

  async listAttendance(programId) {
    const data = await readDatabase()
    return data.attendance
      .filter((row) => row.programId === programId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  },
}
