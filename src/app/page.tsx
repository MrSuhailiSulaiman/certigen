import Link from "next/link"
import { Suspense } from "react"
import { connection } from "next/server"

import { ProgramCard } from "@/components/program-card"
import { buttonVariants } from "@/components/ui/button"
import { getSession } from "@/lib/auth"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card"
import { getStore } from "@/lib/store"
import type { Program } from "@/lib/types"
import { cn } from "@/lib/utils"

const steps = [
  {
    title: "Cipta program",
    body: "Guru atau admin isi nama program, lokasi, tarikh, dan masa, kemudian kongsi pautan.",
  },
  {
    title: "Isi kehadiran",
    body: "Peserta tulis nama penuh dan no. kad pengenalan pada borang program.",
  },
  {
    title: "Muat turun sijil",
    body: "Sijil penyertaan PDF A4 disimpan ke telefon atau komputer.",
  },
]

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="max-w-2xl">
        <p className="flex items-center gap-2 text-sm font-semibold tracking-[0.14em] text-primary uppercase">
          <span aria-hidden className="size-1.5 bg-brand" />
          Borang kehadiran
        </p>
        <h1 className="mt-3 font-heading text-4xl leading-tight tracking-tight sm:text-5xl">
          Nama yang hadir, sijil yang terus boleh dimuat turun.
        </h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">
          Peserta mengisi borang. Sistem merekod program dan kehadiran, kemudian
          menjana sijil penyertaan dalam PDF bersaiz A4.
        </p>
      </section>

      <ol className="mt-10 grid gap-4 sm:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title}>
            <Card>
              <CardHeader>
                <p className="text-sm font-semibold tracking-wide text-brand">0{index + 1}</p>
                <h2 className="font-heading text-xl">{step.title}</h2>
              </CardHeader>
              <CardContent>
                <p>{step.body}</p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>

      <section className="mt-14">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-heading text-2xl">Program</h2>
          <Suspense fallback={null}>
            <RegisterLink />
          </Suspense>
        </div>
        <Suspense fallback={<ProgramListFallback />}>
          <ProgramList />
        </Suspense>
      </section>
    </div>
  )
}

async function RegisterLink() {
  await connection()
  const session = await getSession()
  return (
    <Link
      href={session ? "/daftar" : "/login?next=/daftar"}
      className={cn(buttonVariants({ size: "lg" }), "h-10 px-4")}
    >
      {session ? "Daftar program" : "Masuk untuk daftar"}
    </Link>
  )
}

function ProgramListFallback() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="h-52 animate-pulse rounded-xl bg-muted" />
      <div className="h-52 animate-pulse rounded-xl bg-muted" />
    </div>
  )
}

async function ProgramList() {
  await connection()
  const session = await getSession()
  let programs: Program[] = []
  let loadError = ""
  try {
    programs = await getStore().listPrograms()
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Senarai program tidak dapat dimuatkan."
  }

  if (loadError) {
    return (
      <Card>
        <CardHeader>
          <h3 className="font-heading text-xl">Senarai tidak dapat dimuatkan</h3>
          <CardDescription>{loadError}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (programs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="font-heading text-xl">Belum ada program</h3>
          <CardDescription>
            Daftar program baharu dengan nama, tarikh, dan masa. Peserta akan
            nampak program di sini sebaik sahaja ia disimpan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href={session ? "/daftar" : "/login?next=/daftar"}
            className={cn(buttonVariants({ size: "lg" }), "h-10 px-4")}
          >
            {session ? "Daftar program" : "Masuk untuk daftar"}
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {programs.map((program) => (
        <ProgramCard
          key={program.id}
          program={program}
          href={`/program/${program.slug}`}
        />
      ))}
    </div>
  )
}
