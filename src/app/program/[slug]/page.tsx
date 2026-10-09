import Link from "next/link"
import { notFound } from "next/navigation"
import { connection } from "next/server"
import { Suspense } from "react"

import { AttendanceForm } from "@/components/attendance-form"
import { LookupForm } from "@/components/lookup-form"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatSchedule, formatTime } from "@/lib/format"
import { getStore } from "@/lib/store"

export const metadata = {
  title: "Borang kehadiran",
}

export default function ProgramPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-4 py-10">Memuatkan program...</div>}>
      <ProgramBody params={params} />
    </Suspense>
  )
}

async function ProgramBody({ params }: { params: Promise<{ slug: string }> }) {
  await connection()
  const { slug } = await params
  const program = await getStore().getProgramBySlug(slug)
  if (!program) notFound()

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          Semua program
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant={program.isOpen ? "default" : "secondary"}>
            {program.isOpen ? "Pendaftaran dibuka" : "Pendaftaran ditutup"}
          </Badge>
        </div>
        <h1 className="mt-3 font-heading text-4xl leading-tight">{program.title}</h1>
        {program.description ? (
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            {program.description}
          </p>
        ) : null}
        <dl className="mt-6 grid gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Tarikh Program</dt>
            <dd>{formatSchedule(program.eventDate, program.eventEndDate, "")}</dd>
          </div>
          {program.eventTime ? (
            <div>
              <dt className="text-muted-foreground">Masa</dt>
              <dd>{formatTime(program.eventTime)}</dd>
            </div>
          ) : null}
          {program.venue ? (
            <div>
              <dt className="text-muted-foreground">Tempat</dt>
              <dd>{program.venue}</dd>
            </div>
          ) : null}
          {program.organizer ? (
            <div>
              <dt className="text-muted-foreground">Penganjur</dt>
              <dd>{program.organizer}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <h2 className="font-heading text-2xl">Borang kehadiran</h2>
            <CardDescription>
              Selepas dihantar, sijil penyertaan A4 sedia dimuat turun.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {program.isOpen ? (
              <AttendanceForm programId={program.id} />
            ) : (
              <p>
                Pendaftaran kehadiran untuk program ini telah ditutup. Jika anda
                sudah mendaftar, cari sijil dengan no. kad pengenalan di bawah.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-heading text-xl">Sudah mendaftar?</h2>
            <CardDescription>
              Muat turun semula sijil dengan no. kad pengenalan yang sama.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Separator className="mb-4" />
            <LookupForm programId={program.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
