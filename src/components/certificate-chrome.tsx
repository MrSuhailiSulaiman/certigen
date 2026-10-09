import type { CertificateDesign } from "@/lib/certificate-designs"

export function CertificateChrome({ design }: { design: CertificateDesign }) {
  const { chrome, accent, second } = design

  if (chrome === "korporat") {
    return (
      <>
        <div className="absolute inset-x-0 top-0 h-2" style={{ background: accent }} />
        <div className="absolute inset-x-0 top-2 h-1" style={{ background: second }} />
        <div className="pointer-events-none absolute inset-3 border-2" style={{ borderColor: accent }} />
        <div className="pointer-events-none absolute inset-5 border" style={{ borderColor: second }} />
      </>
    )
  }

  if (chrome === "navy") {
    return (
      <div className="pointer-events-none absolute inset-3 border" style={{ borderColor: accent }} />
    )
  }

  if (chrome === "jalur") {
    return (
      <>
        <div className="absolute inset-y-0 left-0 w-3" style={{ background: accent }} />
        <div className="absolute inset-y-0 right-0 w-3" style={{ background: second }} />
        <div className="pointer-events-none absolute inset-6 border" style={{ borderColor: accent }} />
      </>
    )
  }

  if (chrome === "header" || chrome === "header-blue") {
    return (
      <>
        <div className="absolute inset-x-0 top-0 h-14" style={{ background: accent }} />
        <div className="absolute inset-x-0 top-14 h-1" style={{ background: second }} />
      </>
    )
  }

  if (chrome === "minimal") {
    return (
      <>
        <div className="absolute inset-x-8 top-4 h-px" style={{ background: accent }} />
        <div className="absolute inset-x-8 bottom-4 h-px" style={{ background: second }} />
      </>
    )
  }

  if (chrome === "sudut") {
    return (
      <>
        <Corner className="top-4 left-4" accent={accent} />
        <Corner className="top-4 right-4 rotate-90" accent={accent} />
        <Corner className="bottom-4 left-4 -rotate-90" accent={accent} />
        <Corner className="right-4 bottom-4 rotate-180" accent={accent} />
      </>
    )
  }

  if (chrome === "pingat") {
    return (
      <div className="pointer-events-none absolute inset-4 border-2" style={{ borderColor: accent }} />
    )
  }

  if (chrome === "panel") {
    return (
      <>
        <div className="pointer-events-none absolute inset-3 border" style={{ borderColor: accent }} />
        <div className="absolute inset-x-0 bottom-0 h-16" style={{ background: accent }} />
      </>
    )
  }

  return (
    <>
      <div className="pointer-events-none absolute inset-2 border" style={{ borderColor: accent }} />
      <div className="pointer-events-none absolute inset-4 border" style={{ borderColor: second }} />
      <div className="pointer-events-none absolute inset-6 border" style={{ borderColor: accent }} />
    </>
  )
}

function Corner({ className, accent }: { className: string; accent: string }) {
  return (
    <span
      className={`absolute size-5 border-t-2 border-l-2 ${className}`}
      style={{ borderColor: accent }}
    />
  )
}
