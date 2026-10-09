import { formatSchedule } from "@/lib/format"
import type { AttendanceWithProgram } from "@/lib/types"

export function CertificateSheet({ record }: { record: AttendanceWithProgram }) {
  const { program } = record
  return (
    <article className="mx-auto aspect-[210/297] w-full max-w-[640px] bg-[#f8f2e7] p-3 text-[#243028] shadow-lg ring-1 ring-[#1f4636]/20 sm:p-4">
      <div className="flex h-full flex-col border-2 border-[#1f4636] p-2">
        <div className="flex h-full flex-col border border-[#a88445] px-6 py-8 text-center sm:px-10">
          <p className="text-[10px] tracking-[0.28em] text-[#a88445] uppercase">
            E-sijil kehadiran
          </p>
          <h2 className="mt-4 font-heading text-3xl text-[#1f4636] sm:text-4xl">
            Sijil Penyertaan
          </h2>
          <div className="mx-auto mt-4 h-px w-20 bg-[#a88445]" />
          <p className="mt-8 text-sm italic text-[#62584c]">
            Dengan ini disahkan bahawa
          </p>
          <p className="mt-4 font-heading text-2xl leading-tight sm:text-3xl">
            {record.fullName}
          </p>
          <div className="mx-auto mt-3 h-px w-28 bg-[#a88445]" />
          <p className="mt-6 text-sm italic text-[#62584c]">
            telah hadir dan menyertai
          </p>
          <p className="mt-3 font-heading text-xl text-[#1f4636]">{program.title}</p>
          <p className="mt-5 text-sm">
            {formatSchedule(program.eventDate, program.eventEndDate, program.eventTime)}
          </p>
          {program.venue ? <p className="text-sm">{program.venue}</p> : null}
          {program.organizer ? (
            <p className="mt-2 text-sm">Anjuran {program.organizer}</p>
          ) : null}
          <div className="mt-auto grid grid-cols-[auto_1fr] items-end gap-6 pt-10 text-left">
            <div>
              <div className="grid size-14 place-items-center rounded-full border border-[#a88445] text-[10px] font-semibold tracking-widest text-[#1f4636]">
                HADIR
              </div>
              <p className="mt-3 text-[10px] tracking-wide text-[#62584c] uppercase">
                No. sijil
              </p>
              <p className="text-sm font-semibold">{record.certificateNo}</p>
            </div>
            <div className="justify-self-end text-left">
              <div className="mb-2 h-px w-36 bg-[#243028]" />
              {program.signatoryName ? (
                <p className="text-sm font-semibold">{program.signatoryName}</p>
              ) : null}
              {program.signatoryRole ? (
                <p className="text-xs italic text-[#62584c]">{program.signatoryRole}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
