import Link from "next/link"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { Suspense } from "react"

import { createProgram } from "@/app/actions"
import { ProgramCard } from "@/components/program-card"
import { ProgramForm } from "@/components/program-form"
import { ProgramShare } from "@/components/program-share"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { getSession } from "@/lib/auth"
import { attendanceUrl, requestOrigin } from "@/lib/request-origin"
import { getStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export const metadata = {
  title: "Panel urus",
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
  const session = await getSession()
  if (!session) redirect("/login?next=/urus")

  const [programs, origin] = await Promise.all([
    getStore().listPrograms({ withCounts: true }),
    requestOrigin(),
  ])

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold tracking-[0.14em] text-primary uppercase">
            <span aria-hidden className="size-1.5 bg-brand" />
            {session.role === "admin" ? "Admin" : "Guru"}
          </p>
          <h1 className="mt-3 font-heading text-4xl">Panel urus</h1>
          <p className="mt-2 text-muted-foreground">
            {session.displayName} boleh menambah program dan berkongsi borang kehadiran.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {session.role === "admin" ? (
            <Link
              href="/urus/guru"
              className={cn(buttonVariants({ size: "lg" }), "h-10 px-4")}
            >
              Daftar guru
            </Link>
          ) : null}
          <form action="/api/logout" method="post">
            <Button type="submit" variant="outline" className="h-10 px-4">
              Keluar
            </Button>
          </form>
        </div>
      </div>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-heading text-2xl">Program</h2>
          <Link href="/daftar" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 px-4")}>
            Borang ringkas
          </Link>
        </div>
        {programs.length === 0 ? (
          <p className="text-muted-foreground">Belum ada program. Cipta yang pertama di bawah.</p>
        ) : (
          <div className="grid gap-4">
            {programs.map((program) => (
              <div key={program.id} className="grid gap-3">
                <ProgramCard
                  program={program}
                  href={`/urus/program/${program.id}`}
                  actionLabel="Urus program"
                />
                <details className="rounded-xl border border-border bg-card px-4 py-3">
                  <summary className="cursor-pointer text-sm font-semibold text-primary">
                    Kongsi {program.title}
                  </summary>
                  <div className="pt-4">
                    <ProgramShare
                      url={attendanceUrl(origin, program.slug)}
                      title={program.title}
                    />
                  </div>
                </details>
              </div>
            ))}
          </div>
        )}
      </section>

      <Card>
        <CardHeader>
          <h2 className="font-heading text-2xl">Program baharu</h2>
          <CardDescription>
            Maklumat ini muncul pada borang peserta dan pada sijil. Borang ringkas
            di halaman daftar hanya meminta nama, lokasi, tarikh, dan masa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProgramForm action={createProgram} submitLabel="Simpan program" />
        </CardContent>
      </Card>
    </div>
  )
}
