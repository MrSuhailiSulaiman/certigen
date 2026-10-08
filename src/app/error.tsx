"use client"

import { Button } from "@/components/ui/button"

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="font-heading text-4xl">Ada gangguan</h1>
      <p className="mt-3 text-muted-foreground">
        Halaman ini tidak dapat dimuatkan. Cuba lagi, atau kembali ke senarai
        program.
      </p>
      <Button type="button" className="mt-6 h-11 px-4" onClick={() => reset()}>
        Cuba lagi
      </Button>
    </div>
  )
}
