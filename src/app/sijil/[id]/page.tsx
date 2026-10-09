import Link from "next/link"
import { notFound } from "next/navigation"
import { connection } from "next/server"
import { Suspense } from "react"

import { CertificateSheet } from "@/components/certificate-sheet"
import { buttonVariants } from "@/components/ui/button"
import { certificateFilename, formatIdentity } from "@/lib/format"
import { getStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export const metadata = {
  title: "Sijil penyertaan",
}

export default function CertificatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ sudah?: string }>
}) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-4 py-10">Menyediakan sijil...</div>}>
      <CertificateBody params={params} searchParams={searchParams} />
    </Suspense>
  )
}

async function CertificateBody({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ sudah?: string }>
}) {
  await connection()
  const [{ id }, query] = await Promise.all([params, searchParams])
  const record = await getStore().getAttendance(id)
  if (!record) notFound()
  const filename = certificateFilename(record.fullName)

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_280px]">
      <CertificateSheet record={record} />
      <aside className="lg:pt-6">
        <p className="text-sm font-medium tracking-wide text-primary uppercase">
          {query.sudah === "1" ? "Kehadiran sudah direkod" : "Kehadiran direkod"}
        </p>
        <h1 className="mt-2 font-heading text-3xl leading-tight">
          {query.sudah === "1"
            ? "Sijil anda sedia dimuat turun semula."
            : "Sijil penyertaan anda sudah sedia."}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {record.fullName} ({formatIdentity(record.identityNo)}) direkod untuk{" "}
          {record.program.title}. Fail PDF menggunakan saiz kertas A4.
        </p>
        <div className="mt-5 grid gap-2">
          <a
            href={`/sijil/${record.id}/pdf`}
            download={filename}
            className={cn(buttonVariants({ size: "lg" }), "h-11 px-4")}
          >
            Muat turun PDF A4
          </a>
          <Link
            href={`/program/${record.program.slug}`}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 px-4")}
          >
            Kembali ke program
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          No. sijil {record.certificateNo}
        </p>
      </aside>
    </div>
  )
}
