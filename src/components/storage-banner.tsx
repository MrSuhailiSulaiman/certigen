import { connection } from "next/server"

import { getStore } from "@/lib/store"
import { supabaseConfig } from "@/lib/supabase"

function projectRef(url: string) {
  return url.replace(/^https?:\/\//, "").split(".")[0]
}

export async function StorageBanner() {
  await connection()
  const { configured, url } = supabaseConfig()
  if (!configured) {
    return (
      <p className="bg-secondary px-4 py-2 text-center text-sm text-secondary-foreground">
        Supabase belum disambung. Rekod disimpan pada pelayan pembangunan ini sahaja
        dan tidak kekal selepas deploy Vercel. Tambah URL serta kunci service role,
        kemudian jalankan migrasi SQL.
      </p>
    )
  }

  try {
    await getStore().listPrograms()
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Tidak dapat berhubung dengan Supabase."
    return (
      <p className="bg-secondary px-4 py-2 text-center text-sm text-secondary-foreground">
        Supabase {projectRef(url)} tidak dapat dibaca. {message}
      </p>
    )
  }

  return (
    <p className="bg-primary px-4 py-2 text-center text-sm text-primary-foreground">
      Program dan kehadiran disimpan di Supabase ({projectRef(url)}).
    </p>
  )
}
