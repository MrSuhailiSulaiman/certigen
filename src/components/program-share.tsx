"use client"

import { useEffect, useId, useRef, useState } from "react"
import QRCode from "qrcode"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ProgramShare({ url, title }: { url: string; title: string }) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [image, setImage] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    let cancel = false
    QRCode.toDataURL(url, {
      margin: 1,
      width: 360,
      color: { dark: "#1c4f9e", light: "#ffffff" },
    })
      .then((value) => {
        if (!cancel) setImage(value)
      })
      .catch(() => {
        if (!cancel) setImage("")
      })
    return () => {
      cancel = true
    }
  }, [url])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setMessage("Pautan disalin.")
    } catch {
      inputRef.current?.focus()
      inputRef.current?.select()
      setMessage("Pautan dipilih. Salin secara manual jika perlu.")
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-[180px_1fr] sm:items-center">
      <div className="mx-auto grid size-[180px] place-items-center rounded-md border border-border bg-white p-2">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={`Kod QR borang kehadiran ${title}`}
            width={164}
            height={164}
            className="size-full"
          />
        ) : (
          <span className="text-xs text-muted-foreground">Menyediakan QR...</span>
        )}
      </div>
      <div className="grid gap-2">
        <p className="text-sm text-muted-foreground">
          Kongsi kod QR atau pautan ini. Peserta tidak perlu log masuk untuk mengisi
          borang kehadiran.
        </p>
        <label className="sr-only" htmlFor={inputId}>
          Pautan borang kehadiran {title}
        </label>
        <Input
          ref={inputRef}
          id={inputId}
          readOnly
          value={url}
          onFocus={(event) => event.currentTarget.select()}
          className="h-11"
        />
        <Button type="button" variant="outline" className="h-11" onClick={copyLink}>
          Salin pautan
        </Button>
        {message ? <p className="text-sm text-primary">{message}</p> : null}
      </div>
    </div>
  )
}
