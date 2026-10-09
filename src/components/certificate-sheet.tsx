import { CertificateChrome } from "@/components/certificate-chrome"
import { getCertificateDesign } from "@/lib/certificate-designs"
import { formatSchedule } from "@/lib/format"
import type { AttendanceWithProgram } from "@/lib/types"

export function CertificateSheet({ record }: { record: AttendanceWithProgram }) {
  const { program } = record
  const design = getCertificateDesign(program.certificateDesign)
  const logoUrl = program.hasLogo ? `/logo/${program.id}` : null
  const header = design.chrome === "header" || design.chrome === "header-blue"

  return (
    <article
      className="relative mx-auto flex aspect-[210/297] w-full max-w-[640px] flex-col overflow-hidden shadow-lg ring-1 ring-black/10"
      style={{ background: design.paper, color: design.ink }}
    >
      <CertificateChrome design={design} />
      <div
        className={`relative z-10 flex min-h-0 flex-1 flex-col px-8 text-center sm:px-12 ${
          header ? "pt-20" : "pt-10"
        } ${design.chrome === "panel" ? "pb-20" : "pb-8"} ${design.chrome === "jalur" ? "px-12 sm:px-16" : ""}`}
      >
        {logoUrl ? (
          // The logo is uploaded by the organiser and served from this app.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt=""
            className={`mx-auto mb-4 max-h-16 w-auto object-contain ${
              design.chrome === "navy" ? "bg-white p-1" : ""
            }`}
          />
        ) : design.chrome === "pingat" ? (
          <div
            className="mx-auto mb-4 grid size-14 place-items-center rounded-full border-2 text-[10px] font-semibold tracking-widest"
            style={{ borderColor: design.second, color: design.accent }}
          >
            HADIR
          </div>
        ) : null}

        {header ? (
          <p className="absolute inset-x-0 top-5 text-[10px] font-semibold tracking-[0.28em] text-white uppercase">
            E-sijil kehadiran
          </p>
        ) : (
          <p
            className="text-[10px] font-semibold tracking-[0.28em] uppercase"
            style={{ color: design.second }}
          >
            E-sijil kehadiran
          </p>
        )}
        <h2
          className="mt-3 font-serif text-3xl font-semibold tracking-tight sm:text-4xl"
          style={{ color: design.chrome === "navy" ? design.ink : design.accent }}
        >
          Sijil Penyertaan
        </h2>
        <div className="mx-auto mt-4 h-px w-20" style={{ background: design.second }} />
        <p className="mt-6 text-sm" style={{ color: design.muted }}>
          Dengan ini disahkan bahawa
        </p>
        <p className="mt-3 font-serif text-2xl leading-tight font-semibold sm:text-3xl">
          {record.fullName}
        </p>
        <div className="mx-auto mt-3 h-px w-28" style={{ background: design.second }} />
        <p className="mt-5 text-sm" style={{ color: design.muted }}>
          telah hadir dan menyertai
        </p>
        <p className="mt-3 font-serif text-xl font-semibold" style={{ color: design.accent }}>
          {program.title}
        </p>
        <p className="mt-4 text-sm">
          {formatSchedule(program.eventDate, program.eventEndDate, program.eventTime)}
        </p>
        {program.venue ? <p className="text-sm">{program.venue}</p> : null}
        {program.organizer ? <p className="mt-2 text-sm">Anjuran {program.organizer}</p> : null}

        <div className="mt-auto grid grid-cols-[auto_1fr] items-end gap-6 pt-8 text-left">
          <div>
            {design.chrome === "pingat" ? null : (
              <div
                className="grid size-14 place-items-center rounded-full border-2 text-[10px] font-semibold tracking-widest"
                style={{ borderColor: design.second, color: design.accent }}
              >
                HADIR
              </div>
            )}
            <p
              className="mt-3 text-[10px] font-semibold tracking-wide uppercase"
              style={{ color: design.muted }}
            >
              No. sijil
            </p>
            <p className="text-sm font-semibold">{record.certificateNo}</p>
          </div>
          <div className="justify-self-end text-left">
            <div className="mb-2 h-px w-36" style={{ background: design.ink }} />
            {program.signatoryName ? (
              <p className="text-sm font-semibold">{program.signatoryName}</p>
            ) : null}
            {program.signatoryRole ? (
              <p className="text-xs" style={{ color: design.muted }}>
                {program.signatoryRole}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  )
}
