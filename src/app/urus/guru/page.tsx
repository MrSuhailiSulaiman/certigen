import Link from "next/link"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { Suspense } from "react"

import { RegisterGuruForm } from "@/components/register-guru-form"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getSession } from "@/lib/auth"
import { formatDateTime } from "@/lib/format"
import { listGurus, type Account } from "@/lib/users"

export const metadata = {
  title: "Daftar guru",
  robots: { index: false, follow: false },
}

export default function GuruPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-10">Memuatkan guru...</div>}>
      <GuruBody />
    </Suspense>
  )
}

async function GuruBody() {
  await connection()
  const session = await getSession()
  if (!session) redirect("/login?next=/urus/guru")
  if (session.role !== "admin") redirect("/urus")

  let gurus: Account[] = []
  let loadError = ""
  try {
    gurus = await listGurus()
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Senarai guru tidak dapat dimuatkan."
  }

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-8 px-4 py-10 sm:px-6">
      <section>
        <Link href="/urus" className="text-sm text-muted-foreground hover:text-foreground">
          Panel urus
        </Link>
        <p className="mt-3 flex items-center gap-2 text-sm font-semibold tracking-[0.14em] text-primary uppercase">
          <span aria-hidden className="size-1.5 bg-brand" />
          Admin
        </p>
        <h1 className="mt-3 font-heading text-4xl">Daftar guru</h1>
        <p className="mt-3 text-lg leading-8 text-muted-foreground">
          Guru yang didaftarkan boleh masuk, menambah program, dan berkongsi pautan
          borang kehadiran.
        </p>
      </section>

      <Card>
        <CardHeader>
          <h2 className="font-heading text-2xl">Akaun baharu</h2>
          <CardDescription>
            Nama pengguna tidak boleh sama dengan akaun yang sedia ada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterGuruForm />
        </CardContent>
      </Card>

      <section className="grid gap-4">
        <h2 className="font-heading text-2xl">Guru berdaftar</h2>
        {loadError ? (
          <Card>
            <CardHeader>
              <h3 className="font-heading text-xl">Senarai tidak dapat dimuatkan</h3>
              <CardDescription>{loadError}</CardDescription>
            </CardHeader>
          </Card>
        ) : gurus.length === 0 ? (
          <Card>
            <CardHeader>
              <h3 className="font-heading text-xl">Belum ada guru</h3>
              <CardDescription>
                Daftar guru pertama dengan nama, nama pengguna, dan kata laluan.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Nama pengguna</TableHead>
                    <TableHead>Didaftarkan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gurus.map((guru) => (
                    <TableRow key={guru.id}>
                      <TableCell>{guru.displayName}</TableCell>
                      <TableCell>{guru.username}</TableCell>
                      <TableCell>{formatDateTime(guru.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}
