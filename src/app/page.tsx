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

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-heading text-2xl">Program</h1>
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
  if (!session) return null
  return (
    <Link href="/daftar" className={cn(buttonVariants({ size: "lg" }), "h-10 px-4")}>
      Daftar program
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
        {session ? (
          <CardContent>
            <Link href="/daftar" className={cn(buttonVariants({ size: "lg" }), "h-10 px-4")}>
              Daftar program
            </Link>
          </CardContent>
        ) : null}
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
