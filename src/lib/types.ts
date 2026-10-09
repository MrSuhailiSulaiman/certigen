export type Program = {
  id: string
  slug: string
  title: string
  description: string
  organizer: string
  venue: string
  eventDate: string
  eventEndDate: string | null
  eventTime: string
  signatoryName: string
  signatoryRole: string
  isOpen: boolean
  createdAt: string
  attendanceCount?: number
}

export type Attendance = {
  id: string
  programId: string
  fullName: string
  identityNo: string
  certificateNo: string
  createdAt: string
}

export type AttendanceWithProgram = Attendance & {
  program: Program
}

export type ProgramInput = {
  title: string
  description: string
  organizer: string
  venue: string
  eventDate: string
  eventEndDate: string | null
  eventTime: string
  signatoryName: string
  signatoryRole: string
  isOpen: boolean
}

export type SavedProgram = {
  id: string
  slug: string
  title: string
  venue: string
  eventDate: string
  eventTime: string
}

export type AttendanceInput = {
  programId: string
  fullName: string
  identityNo: string
}

export type FormState = {
  error?: string
  fieldErrors?: Record<string, string>
  saved?: SavedProgram
} | null

export interface AttendanceStore {
  mode: "supabase" | "local"
  listPrograms(options?: { withCounts?: boolean }): Promise<Program[]>
  getProgramBySlug(slug: string): Promise<Program | null>
  getProgramById(id: string): Promise<Program | null>
  createProgram(input: ProgramInput): Promise<Program>
  updateProgram(id: string, input: ProgramInput): Promise<Program>
  setProgramOpen(id: string, isOpen: boolean): Promise<Program>
  recordAttendance(
    input: AttendanceInput,
  ): Promise<{ attendance: Attendance; alreadyRecorded: boolean }>
  getAttendance(id: string): Promise<AttendanceWithProgram | null>
  findAttendanceByIdentity(
    programId: string,
    identityNo: string,
  ): Promise<Attendance | null>
  listAttendance(programId: string): Promise<Attendance[]>
}
