import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="font-heading text-4xl">Halaman tidak dijumpai</h1>
      <p className="mt-3 text-muted-foreground">
        Program atau sijil itu tiada dalam rekod.
      </p>
      <Link href="/" className={cn(buttonVariants({ size: "lg" }), "mt-6 h-11 px-4")}>
        Kembali ke senarai program
      </Link>
    </div>
  )
}
