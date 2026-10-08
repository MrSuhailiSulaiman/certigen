export function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number)
  if (!year || !month || !day) return isoDate
  return new Intl.DateTimeFormat("ms-MY", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

export function formatDateRange(start: string, end: string | null) {
  if (!end || end === start) return formatDate(start)
  return `${formatDate(start)} hingga ${formatDate(end)}`
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("ms-MY", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(iso))
}

export function slugify(input: string) {
  const base = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${base || "program"}-${suffix}`
}

export function certificateNumber(id: string, eventDate: string) {
  const year = eventDate.slice(0, 4) || String(new Date().getFullYear())
  const token = id.replace(/-/g, "").slice(0, 6).toUpperCase()
  return `ES-${year}-${token}`
}

export function certificateFilename(name: string) {
  const safe = name
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60)
  return `Sijil-Penyertaan-${safe || "peserta"}.pdf`
}
