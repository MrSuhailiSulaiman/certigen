export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="h-0.5 bg-brand" />
      <div className="h-1 bg-primary" />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:px-6">
        <p className="font-semibold tracking-tight text-foreground">SijilHadir</p>
        <p>Sijil penyertaan dijana sebagai PDF A4 selepas borang kehadiran dihantar.</p>
        <p>Rekod program dan kehadiran disimpan di Supabase. Aplikasi ini sedia dihoskan di Vercel melalui GitHub.</p>
      </div>
    </footer>
  )
}
