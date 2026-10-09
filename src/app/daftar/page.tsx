import Link from "next/link"
import { connection } from "next/server"
import { Suspense } from "react"

import { registerProgram } from "@/app/actions"
import { RegisterProgramForm } from "@/components/register-program-form"
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
import { formatDate, formatTime } from "@/lib/format"
import { getStore } from "@/lib/store"
import type { Program } from "@/lib/types"

export const metadata = {
  title: "Daftar program",
}

export default function RegisterProgramPage() {
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-8 px-4 py-10 sm:px-6">
      <section>
        <p className="flex items-center gap-2 text-sm font-semibold tracking-[0.14em] text-primary uppercase">
          <span aria-hidden className="size-1.5 bg-brand" />
          Borang daftar
        </p>
        <h1 className="mt-3 font-heading text-4xl leading-tight">Daftar program</h1>
        <p className="mt-3 text-lg leading-8 text-muted-foreground">
          Isi nama program, lokasi, tarikh, dan masa. Rekod disimpan di Supabase
          dan terus muncul pada senarai program.
        </p>
      </section>

      <Card>
        <CardHeader>
          <h2 className="font-heading text-2xl">Maklumat program</h2>
          <CardDescription>
            Keempat-empat medan wajib diisi sebelum rekod disimpan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterProgramForm action={registerProgram} />
        </CardContent>
      </Card>

      <Suspense fallback={<p className="text-sm text-muted-foreground">Memuatkan rekod...</p>}>
        <SavedPrograms />
      </Suspense>
    </div>
  )
}

async function SavedPrograms() {
  await connection()
  let programs: Program[] = []
  let loadError = ""
  try {
    programs = await getStore().listPrograms()
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Rekod program tidak dapat dimuatkan."
  }

  return (
    <section className="grid gap-4">
      <h2 className="font-heading text-2xl">Rekod yang disimpan</h2>
      {loadError ? (
        <Card>
          <CardHeader>
            <h3 className="font-heading text-xl">Rekod tidak dapat dimuatkan</h3>
            <CardDescription>{loadError}</CardDescription>
          </CardHeader>
        </Card>
      ) : programs.length === 0 ? (
        <Card>
          <CardHeader>
            <h3 className="font-heading text-xl">Belum ada program</h3>
            <CardDescription>
              Program yang didaftarkan akan disenaraikan di sini selepas borang
              disimpan.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Program</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead>Tarikh Program</TableHead>
                  <TableHead>Masa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programs.map((program) => (
                  <TableRow key={program.id}>
                    <TableCell>
                      <Link href={`/program/${program.slug}`} className="underline">
                        {program.title}
                      </Link>
                    </TableCell>
                    <TableCell>{program.venue || "—"}</TableCell>
                    <TableCell>{formatDate(program.eventDate)}</TableCell>
                    <TableCell>{formatTime(program.eventTime) || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </section>
  )
}
