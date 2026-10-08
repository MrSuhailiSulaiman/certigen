export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <div className="h-8 w-40 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-12 w-2/3 animate-pulse rounded bg-muted" />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  )
}
