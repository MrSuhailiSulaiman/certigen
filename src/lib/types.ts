export type Program = {
  id: string
  slug: string
  title: string
  description: string
  organizer: string
  venue: string
  eventDate: string
  eventEndDate: string | null
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
  email: string
  organization: string
  phone: string
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
  signatoryName: string
  signatoryRole: string
  isOpen: boolean
}

export type AttendanceInput = {
  programId: string
  fullName: string
  email: string
  organization: string
  phone: string
}

export type FormState = {
  error?: string
  fieldErrors?: Record<string, string>
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
  findAttendanceByEmail(
    programId: string,
    email: string,
  ): Promise<Attendance | null>
  listAttendance(programId: string): Promise<Attendance[]>
}
