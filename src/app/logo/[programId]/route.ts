import { connection } from "next/server"

import { loadCertificateAssets } from "@/lib/certificate-assets"

export async function GET(
  _request: Request,
  context: { params: Promise<{ programId: string }> },
) {
  await connection()
  const { programId } = await context.params
  const assets = await loadCertificateAssets(programId).catch(() => null)
  if (!assets?.logo) {
    return new Response(null, { status: 404 })
  }

  return new Response(Buffer.from(assets.logo.bytes), {
    headers: {
      "Content-Type": assets.logo.contentType,
      "Cache-Control": "private, no-store",
    },
  })
}
