import { localStore } from "@/lib/local-store"
import { supabaseConfig } from "@/lib/supabase"
import { supabaseStore } from "@/lib/supabase-store"
import type { AttendanceStore } from "@/lib/types"

export { StoreError } from "@/lib/errors"

export function storageMode(): "supabase" | "local" {
  return supabaseConfig().configured ? "supabase" : "local"
}

export function getStore(): AttendanceStore {
  return storageMode() === "supabase" ? supabaseStore : localStore
}
