import { connection } from "next/server"

import { isOrganizer } from "@/lib/auth"
import { formatDateTime, formatIdentity } from "@/lib/format"
import { getStore } from "@/lib/store"

function cell(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`
  return value
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await connection()
  if (!(await isOrganizer())) {
    return new Response("Tidak dibenarkan.", { status: 401 })
  }
  const { id } = await context.params
  const store = getStore()
  const program = await store.getProgramById(id)
  if (!program) {
    return new Response("Program tidak dijumpai.", { status: 404 })
  }
  const rows = await store.listAttendance(id)
  const header = ["Nama penuh", "No. kad pengenalan", "No. sijil", "Masa"]
  const lines = [
    header.join(","),
    ...rows.map((row) =>
      [
        row.fullName,
        formatIdentity(row.identityNo),
        row.certificateNo,
        formatDateTime(row.createdAt),
      ]
        .map(cell)
        .join(","),
    ),
  ]
  const body = `\uFEFF${lines.join("\n")}`
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kehadiran-${program.slug}.csv"`,
    },
  })
}
