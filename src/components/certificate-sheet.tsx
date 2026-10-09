import localFont from "next/font/local"

import { CornerRibbons, EventMedallion, GoldSeal } from "@/components/certificate-ornaments"
import { formatCertificateDate, formatTime } from "@/lib/format"
import type { AttendanceWithProgram } from "@/lib/types"

const script = localFont({
  src: "../lib/fonts/GreatVibes-Regular.ttf",
  display: "swap",
})

export function CertificateSheet({ record }: { record: AttendanceWithProgram }) {
  const { program } = record
  const logoUrl = program.hasLogo ? `/logo/${program.id}` : null
  const year = program.eventDate.slice(0, 4)
  const when = formatCertificateDate(program.eventDate, program.eventEndDate)
  const time = formatTime(program.eventTime)

  return (
    <article className="relative mx-auto aspect-[210/297] w-full max-w-[680px] overflow-hidden bg-white text-[#1c1c1c] shadow-lg ring-1 ring-black/10">
      <CornerRibbons />
      <div className="relative z-10 flex h-full flex-col items-center px-10 pt-7 pb-5 text-center sm:px-14 sm:pt-9">
        {logoUrl ? (
          // Organiser logo, shown in the crest position of the certificate.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="h-14 w-auto max-w-[140px] object-contain" />
        ) : (
          <div className="grid size-14 place-items-center rounded-full border-2 border-[#e2a30b] text-[10px] font-bold tracking-widest text-[#8d1c24]">
            SIJIL
          </div>
        )}
        {program.organizer ? (
          <p className="mt-2 text-[10px] font-semibold tracking-[0.18em] uppercase sm:text-[11px]">
            {program.organizer}
          </p>
        ) : null}
        <h2 className={`${script.className} mt-3 mb-1 text-[2.7rem] leading-[1.35] text-[#d31224] sm:text-5xl`}>
          Sijil Penghargaan
        </h2>
        <p className="mt-1 font-serif text-sm italic text-[#333] sm:text-[15px]">
          Setinggi-tinggi penghargaan dan tahniah kepada
        </p>
        <p className="mt-2 max-w-[95%] text-sm font-bold tracking-wide uppercase sm:text-base">
          {record.fullName}
        </p>
        <p className="mt-3 text-xs italic sm:text-sm">atas sumbangan dan komitmen sebagai</p>
        <p className="mt-1 text-lg font-bold tracking-[0.14em] text-[#c41624] uppercase sm:text-xl">
          Peserta
        </p>
        <p className="mt-2 text-xs italic sm:text-sm">sempena</p>
        <div className="mt-2">
          <EventMedallion year={year} />
        </div>
        <p className="mt-1 max-w-[90%] text-xs font-bold tracking-wide uppercase sm:text-sm">
          {program.title}
        </p>
        {program.description ? (
          <p className="mt-1 line-clamp-2 max-w-[90%] text-[10px] tracking-[0.14em] text-[#555] uppercase">
            {program.description}
          </p>
        ) : null}
        <div className="relative mt-2 w-full">
          <GoldSeal className="absolute top-0 left-0 size-14 sm:size-16" />
          <p className="text-sm italic">pada</p>
          <p className="text-sm font-semibold tracking-wide uppercase">{when}</p>
          {time ? <p className="text-xs text-[#444]">{time}</p> : null}
          {program.venue ? <p className="text-xs text-[#444]">{program.venue}</p> : null}
        </div>

        <div className="mt-4 ml-auto w-[58%] pr-1 text-right">
          {program.signatoryName ? (
            <p className="text-xs font-bold tracking-wide uppercase sm:text-sm">
              {program.signatoryName}
            </p>
          ) : null}
          {program.signatoryRole ? (
            <p className="text-[10px] tracking-wide uppercase sm:text-xs">{program.signatoryRole}</p>
          ) : null}
          {program.organizer ? (
            <p className="text-[10px] tracking-wide uppercase sm:text-xs">{program.organizer}</p>
          ) : null}
        </div>

        <p className="mt-auto pt-4 text-[9px] tracking-[0.16em] text-[#666] uppercase">
          No. sijil {record.certificateNo}
        </p>
      </div>
    </article>
  )
}
