import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { connection } from "next/server"
import { Suspense } from "react"

import { toggleProgram, updateProgram } from "@/app/actions"
import { ProgramForm } from "@/components/program-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { buttonVariants } from "@/components/ui/button"
import { isOrganizer } from "@/lib/auth"
import { formatDateTime, formatIdentity } from "@/lib/format"
import { getStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export const metadata = {
  title: "Kehadiran program",
  robots: { index: false, follow: false },
}

export default function OrganizerProgramPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-4 py-10">Memuatkan kehadiran...</div>}>
      <OrganizerProgramBody params={params} />
    </Suspense>
  )
}

async function OrganizerProgramBody({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await connection()
  if (!(await isOrganizer())) redirect("/urus")
  const { id } = await params
  const store = getStore()
  const [program, attendance] = await Promise.all([
    store.getProgramById(id),
    store.listAttendance(id),
  ])
  if (!program) notFound()
  const update = updateProgram.bind(null, program.id)

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:px-6">
      <div>
        <Link href="/urus" className="text-sm text-muted-foreground hover:text-foreground">
          Panel penganjur
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant={program.isOpen ? "default" : "secondary"}>
            {program.isOpen ? "Dibuka" : "Ditutup"}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {attendance.length} kehadiran
          </span>
        </div>
        <h1 className="mt-2 font-heading text-4xl leading-tight">{program.title}</h1>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/program/${program.slug}`}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 px-4")}
          >
            Buka borang peserta
          </Link>
          <a
            href={`/urus/program/${program.id}/eksport`}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 px-4")}
          >
            Muat turun CSV
          </a>
          <form action={toggleProgram}>
            <input type="hidden" name="id" value={program.id} />
            <input type="hidden" name="isOpen" value={program.isOpen ? "false" : "true"} />
            <Button type="submit" variant="secondary" className="h-10 px-4">
              {program.isOpen ? "Tutup pendaftaran" : "Buka pendaftaran"}
            </Button>
          </form>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-heading text-2xl">Senarai kehadiran</h2>
          <CardDescription>
            Setiap baris boleh memuat turun sijil dari pautan no. sijil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attendance.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada peserta.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama penuh</TableHead>
                  <TableHead>No. kad pengenalan</TableHead>
                  <TableHead>No. sijil</TableHead>
                  <TableHead>Masa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.fullName}</TableCell>
                    <TableCell>{formatIdentity(row.identityNo)}</TableCell>
                    <TableCell>
                      <Link href={`/sijil/${row.id}`} className="underline">
                        {row.certificateNo}
                      </Link>
                    </TableCell>
                    <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-heading text-2xl">Kemaskini program</h2>
          <CardDescription>
            Perubahan tajuk, tarikh, dan penandatangan dipakai pada sijil baharu
            dan pada muat turun semula.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProgramForm
            action={update}
            program={program}
            submitLabel="Simpan perubahan"
          />
        </CardContent>
      </Card>
    </div>
  )
}
