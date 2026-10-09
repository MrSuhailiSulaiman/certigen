import { formatSchedule } from "@/lib/format"
import type { AttendanceWithProgram } from "@/lib/types"

export function CertificateSheet({ record }: { record: AttendanceWithProgram }) {
  const { program } = record
  return (
    <article className="mx-auto flex aspect-[210/297] w-full max-w-[640px] flex-col bg-white text-[#1e2d52] shadow-lg ring-1 ring-[#1c4f9e]/15">
      <div className="h-2 shrink-0 bg-[#1c4f9e]" />
      <div className="h-1 shrink-0 bg-[#b81e2e]" />
      <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
        <div className="flex h-full flex-col border-2 border-[#1c4f9e] p-1.5">
          <div className="flex h-full flex-col border border-[#b81e2e] px-6 py-8 text-center sm:px-10">
            <p className="text-[10px] font-semibold tracking-[0.28em] text-[#b81e2e] uppercase">
              E-sijil kehadiran
            </p>
            <h2 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-[#1c4f9e] sm:text-4xl">
              Sijil Penyertaan
            </h2>
            <div className="mx-auto mt-4 h-px w-20 bg-[#b81e2e]" />
            <p className="mt-8 text-sm text-[#5b6578]">Dengan ini disahkan bahawa</p>
            <p className="mt-4 font-serif text-2xl leading-tight font-semibold sm:text-3xl">
              {record.fullName}
            </p>
            <div className="mx-auto mt-3 h-px w-28 bg-[#b81e2e]" />
            <p className="mt-6 text-sm text-[#5b6578]">telah hadir dan menyertai</p>
            <p className="mt-3 font-serif text-xl font-semibold text-[#1c4f9e]">
              {program.title}
            </p>
            <p className="mt-5 text-sm">
              {formatSchedule(program.eventDate, program.eventEndDate, program.eventTime)}
            </p>
            {program.venue ? <p className="text-sm">{program.venue}</p> : null}
            {program.organizer ? (
              <p className="mt-2 text-sm">Anjuran {program.organizer}</p>
            ) : null}
            <div className="mt-auto grid grid-cols-[auto_1fr] items-end gap-6 pt-10 text-left">
              <div>
                <div className="grid size-14 place-items-center rounded-full border-2 border-[#b81e2e] text-[10px] font-semibold tracking-widest text-[#1c4f9e]">
                  HADIR
                </div>
                <p className="mt-3 text-[10px] font-semibold tracking-wide text-[#5b6578] uppercase">
                  No. sijil
                </p>
                <p className="text-sm font-semibold">{record.certificateNo}</p>
              </div>
              <div className="justify-self-end text-left">
                <div className="mb-2 h-px w-36 bg-[#1e2d52]" />
                {program.signatoryName ? (
                  <p className="text-sm font-semibold">{program.signatoryName}</p>
                ) : null}
                {program.signatoryRole ? (
                  <p className="text-xs text-[#5b6578]">{program.signatoryRole}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
