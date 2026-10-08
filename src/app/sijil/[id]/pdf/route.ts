import { connection } from "next/server"

import { buildCertificatePdf } from "@/lib/certificate-pdf"
import { certificateFilename } from "@/lib/format"
import { getStore } from "@/lib/store"

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await connection()
  const { id } = await context.params
  const record = await getStore().getAttendance(id)
  if (!record) {
    return new Response("Sijil tidak dijumpai.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  }

  const bytes = await buildCertificatePdf(record)
  const filename = certificateFilename(record.fullName)
  const asciiName = filename.replace(/[^\w.\-]+/g, "_")

  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "private, no-store",
    },
  })
}
