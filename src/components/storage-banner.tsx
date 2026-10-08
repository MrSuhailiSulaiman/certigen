import { connection } from "next/server"

import { storageMode } from "@/lib/store"

export async function StorageBanner() {
  await connection()
  if (storageMode() === "supabase") {
    return (
      <p className="bg-primary px-4 py-2 text-center text-sm text-primary-foreground">
        Program dan kehadiran disimpan di Supabase.
      </p>
    )
  }

  return (
    <p className="bg-secondary px-4 py-2 text-center text-sm text-secondary-foreground">
      Supabase belum disambung. Rekod disimpan pada pelayan pembangunan ini sahaja
      dan tidak kekal selepas deploy Vercel. Tambah URL serta kunci service role,
      kemudian jalankan migrasi SQL.
    </p>
  )
}
