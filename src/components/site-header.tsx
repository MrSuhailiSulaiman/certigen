import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-card">
      <div className="h-1 bg-primary" />
      <div className="h-0.5 bg-brand" />
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="relative grid size-9 place-items-center rounded-md bg-primary text-lg font-semibold text-primary-foreground">
            S
            <span className="absolute -right-1 -bottom-1 size-2.5 rounded-[2px] bg-brand ring-2 ring-card" />
          </span>
          <span className="leading-tight">
            <span className="block font-heading text-lg tracking-tight">SijilHadir</span>
            <span className="block text-xs text-muted-foreground">
              Kehadiran dan e-sijil
            </span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "h-10 px-3")}
          >
            Program
          </Link>
          <Link
            href="/daftar"
            className={cn(buttonVariants({ size: "lg" }), "h-10 px-3")}
          >
            Daftar
          </Link>
          <Link
            href="/urus"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 px-3")}
          >
            Urus
          </Link>
        </nav>
      </div>
    </header>
  )
}
