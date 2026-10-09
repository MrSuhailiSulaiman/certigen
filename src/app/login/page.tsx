import { redirect } from "next/navigation"
import { connection } from "next/server"
import { Suspense } from "react"

import { LoginForm } from "@/components/login-form"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { getSession, safeNext } from "@/lib/auth"

export const metadata = {
  title: "Masuk",
  robots: { index: false, follow: false },
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-12">Memuatkan log masuk...</div>}>
      <LoginBody searchParams={searchParams} />
    </Suspense>
  )
}

async function LoginBody({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  await connection()
  const session = await getSession()
  const next = safeNext((await searchParams).next) ?? "/urus"
  if (session) redirect(next)

  return (
    <div className="mx-auto grid w-full max-w-md gap-6 px-4 py-12 sm:px-6">
      <section>
        <p className="flex items-center gap-2 text-sm font-semibold tracking-[0.14em] text-primary uppercase">
          <span aria-hidden className="size-1.5 bg-brand" />
          Akaun
        </p>
        <h1 className="mt-3 font-heading text-4xl">Masuk</h1>
        <p className="mt-3 text-muted-foreground">
          Admin mendaftar guru. Guru menambah program dan berkongsi borang kehadiran.
          Peserta tidak perlu akaun.
        </p>
      </section>
      <Card>
        <CardHeader>
          <h2 className="font-heading text-2xl">Nama pengguna</h2>
          <CardDescription>Gunakan akaun admin atau akaun guru yang didaftarkan.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm next={next} />
        </CardContent>
      </Card>
    </div>
  )
}
