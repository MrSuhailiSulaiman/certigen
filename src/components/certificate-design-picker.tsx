"use client"

import { useState } from "react"

import { CertificateChrome } from "@/components/certificate-chrome"
import { certificateDesigns, type CertificateDesign } from "@/lib/certificate-designs"

function Swatch({ design }: { design: CertificateDesign }) {
  return (
    <span
      className="relative block aspect-[210/140] overflow-hidden rounded-sm border border-black/10"
      style={{ background: design.paper }}
    >
      <CertificateChrome design={design} />
      <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-3">
        <span className="h-0.5 w-8" style={{ background: design.second }} />
        <span className="h-1.5 w-12" style={{ background: design.accent }} />
        <span className="h-0.5 w-9 opacity-70" style={{ background: design.ink }} />
      </span>
    </span>
  )
}

export function CertificateDesignPicker({
  value,
  error,
}: {
  value?: string
  error?: string
}) {
  const selected = value && certificateDesigns.some((design) => design.id === value) ? value : "korporat"

  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-medium">Reka bentuk sijil</legend>
      <p className="text-sm text-muted-foreground">
        Pilih satu daripada 10 reka bentuk. Pilihan ini dipakai pada pratonton dan PDF A4.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {certificateDesigns.map((design) => (
          <label
            key={design.id}
            className="grid cursor-pointer gap-2 rounded-lg border border-border p-2 has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-primary"
          >
            <input
              type="radio"
              name="certificateDesign"
              value={design.id}
              defaultChecked={design.id === selected}
              className="sr-only"
            />
            <Swatch design={design} />
            <span className="text-sm font-medium">{design.name}</span>
            <span className="text-xs leading-4 text-muted-foreground">{design.blurb}</span>
          </label>
        ))}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </fieldset>
  )
}

export function LogoField({
  programId,
  hasLogo,
}: {
  programId?: string
  hasLogo?: boolean
}) {
  const [preview, setPreview] = useState<string | null>(null)

  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-medium">Logo pada sijil</legend>
      <p className="text-sm text-muted-foreground">
        Muat naik PNG atau JPEG, maksimum 1.5 MB. Logo diletakkan di bahagian atas sijil.
      </p>
      {hasLogo && programId ? (
        <div className="flex flex-wrap items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview ?? `/logo/${programId}`}
            alt="Logo semasa"
            className="h-16 w-auto max-w-40 rounded-md border border-border bg-white object-contain p-1"
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="removeLogo" className="size-4 accent-primary" />
            Buang logo
          </label>
        </div>
      ) : preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Pratonton logo"
          className="h-16 w-auto max-w-40 rounded-md border border-border bg-white object-contain p-1"
        />
      ) : null}
      <input
        id="logo"
        name="logo"
        type="file"
        accept="image/png,image/jpeg,.png,.jpg,.jpeg"
        className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium file:text-secondary-foreground"
        onChange={(event) => {
          const file = event.target.files?.[0]
          setPreview(file ? URL.createObjectURL(file) : null)
        }}
      />
    </fieldset>
  )
}
