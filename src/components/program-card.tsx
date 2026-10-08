import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { formatDateRange } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Program } from "@/lib/types"

export function ProgramCard({
  program,
  href,
  actionLabel = "Isi kehadiran",
}: {
  program: Program
  href: string
  actionLabel?: string
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-heading text-xl leading-snug">
            <Link href={href} className="hover:underline">
              {program.title}
            </Link>
          </h2>
          <Badge variant={program.isOpen ? "default" : "secondary"}>
            {program.isOpen ? "Dibuka" : "Ditutup"}
          </Badge>
        </div>
        <CardDescription>
          {formatDateRange(program.eventDate, program.eventEndDate)}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm">
        {program.description ? (
          <p className="text-foreground/80">{program.description}</p>
        ) : null}
        <p>
          <span className="text-muted-foreground">Tempat </span>
          {program.venue}
        </p>
        <p>
          <span className="text-muted-foreground">Anjuran </span>
          {program.organizer}
        </p>
        {typeof program.attendanceCount === "number" ? (
          <p>
            <span className="text-muted-foreground">Kehadiran </span>
            {program.attendanceCount}
          </p>
        ) : null}
      </CardContent>
      <CardFooter>
        <Link href={href} className={cn(buttonVariants({ size: "lg" }), "h-10 px-4")}>
          {actionLabel}
        </Link>
      </CardFooter>
    </Card>
  )
}
