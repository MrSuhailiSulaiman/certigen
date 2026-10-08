import Link from "next/link"
import { connection } from "next/server"
import { Suspense } from "react"

import { createProgram, logoutOrganizer } from "@/app/actions"
import { LoginForm } from "@/components/login-form"
import { ProgramCard } from "@/components/program-card"
import { ProgramForm } from "@/components/program-form"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card"
import { organizerAccess, isOrganizer } from "@/lib/auth"
import { getStore } from "@/lib/store"

export const metadata = {
  title: "Panel penganjur",
  robots: { index: false, follow: false },
}

export default function OrganizerPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-4 py-10">Memuatkan panel...</div>}>
      <OrganizerBody />
    </Suspense>
  )
}

async function OrganizerBody() {
  await connection()
  const access = organizerAccess()
  if (!access.enabled) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <h1 className="font-heading text-3xl">Panel penganjur ditutup</h1>
        <p className="mt-3 text-muted-foreground">
          Tetapkan ORGANIZER_PIN pada persekitaran Vercel, kemudian deploy semula.
        </p>
      </div>
    )
  }

  if (!(await isOrganizer())) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <h1 className="font-heading text-3xl">Masuk sebagai penganjur</h1>
        <p className="mt-3 mb-6 text-muted-foreground">
          PIN ini membuka borang program dan senarai kehadiran. Peserta tidak
          memerlukannya untuk mengisi borang.
        </p>
        <LoginForm showDevPin={access.fallback} />
      </div>
    )
  }

  const programs = await getStore().listPrograms({ withCounts: true })

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-4xl">Panel penganjur</h1>
          <p className="mt-2 text-muted-foreground">
            Cipta program, tutup pendaftaran, dan semak nama yang hadir.
          </p>
        </div>
        <form action={logoutOrganizer}>
          <Button type="submit" variant="outline" className="h-10 px-4">
            Keluar
          </Button>
        </form>
      </div>

      <section className="grid gap-4">
        <h2 className="font-heading text-2xl">Program sedia ada</h2>
        {programs.length === 0 ? (
          <p className="text-muted-foreground">Belum ada program. Cipta yang pertama di bawah.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {programs.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                href={`/urus/program/${program.id}`}
                actionLabel="Lihat kehadiran"
              />
            ))}
          </div>
        )}
      </section>

      <Card>
        <CardHeader>
          <h2 className="font-heading text-2xl">Program baharu</h2>
          <CardDescription>
            Maklumat ini muncul pada borang peserta dan pada sijil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProgramForm action={createProgram} submitLabel="Simpan program" />
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Peserta mengisi borang dari{" "}
        <Link href="/" className="underline">
          senarai program
        </Link>
        .
      </p>
    </div>
  )
}
