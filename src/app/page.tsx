import Link from "next/link"
import { Suspense } from "react"
import { connection } from "next/server"

import { ProgramCard } from "@/components/program-card"
import { buttonVariants } from "@/components/ui/button"
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
    body: "Penganjur isi tajuk, tarikh, tempat, dan nama penandatangan.",
  },
  {
    title: "Isi kehadiran",
    body: "Peserta tulis nama, e-mel, dan organisasi pada borang program.",
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
        <p className="text-sm font-medium tracking-wide text-primary uppercase">
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
                <p className="text-sm text-muted-foreground">0{index + 1}</p>
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
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="font-heading text-2xl">Program</h2>
        </div>
        <Suspense fallback={<ProgramListFallback />}>
          <ProgramList />
        </Suspense>
      </section>
    </div>
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
            Penganjur boleh cipta program di panel urus. Peserta akan nampak
            program di sini sebaik sahaja ia disimpan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/urus" className={cn(buttonVariants({ size: "lg" }), "h-10 px-4")}>
            Buka panel urus
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
