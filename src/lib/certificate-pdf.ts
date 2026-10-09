import { readFile } from "node:fs/promises"
import path from "node:path"

import fontkit from "@pdf-lib/fontkit"
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from "pdf-lib"

import { loadCertificateAssets, type LogoFile } from "@/lib/certificate-assets"
import { getCertificateDesign, type CertificateDesign } from "@/lib/certificate-designs"
import { formatSchedule } from "@/lib/format"
import type { AttendanceWithProgram } from "@/lib/types"

const A4: [number, number] = [595.28, 841.89]

type Rgb = ReturnType<typeof rgb>

function hex(value: string): Rgb {
  const raw = value.replace("#", "")
  return rgb(
    Number.parseInt(raw.slice(0, 2), 16) / 255,
    Number.parseInt(raw.slice(2, 4), 16) / 255,
    Number.parseInt(raw.slice(4, 6), 16) / 255,
  )
}

async function loadFontBytes() {
  const directory = path.join(process.cwd(), "src/lib/fonts")
  const [regular, bold, italic] = await Promise.all([
    readFile(path.join(directory, "LibreBaskerville-Regular.ttf")),
    readFile(path.join(directory, "LibreBaskerville-Bold.ttf")),
    readFile(path.join(directory, "LibreBaskerville-Italic.ttf")),
  ])
  return { regular, bold, italic }
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ""
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (font.widthOfTextAtSize(next, size) > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines.length > 0 ? lines : [""]
}

function drawCentered(
  page: PDFPage,
  text: string,
  y: number,
  font: PDFFont,
  size: number,
  color: Rgb,
  maxWidth: number,
  gap = 5,
) {
  const lines = wrapText(text, font, size, maxWidth)
  for (const line of lines) {
    const width = font.widthOfTextAtSize(line, size)
    page.drawText(line, {
      x: (page.getWidth() - width) / 2,
      y,
      size,
      font,
      color,
    })
    y -= size + gap
  }
  return y
}

function drawTracked(
  page: PDFPage,
  text: string,
  y: number,
  font: PDFFont,
  size: number,
  color: Rgb,
  tracking: number,
) {
  const chars = [...text]
  const widths = chars.map((char) => font.widthOfTextAtSize(char, size))
  const total =
    widths.reduce((sum, width) => sum + width, 0) + tracking * Math.max(chars.length - 1, 0)
  let x = (page.getWidth() - total) / 2
  chars.forEach((char, index) => {
    page.drawText(char, { x, y, size, font, color })
    x += widths[index] + tracking
  })
}

function paintChrome(page: PDFPage, design: CertificateDesign) {
  const { width, height } = page.getSize()
  const accent = hex(design.accent)
  const second = hex(design.second)
  page.drawRectangle({ x: 0, y: 0, width, height, color: hex(design.paper) })

  if (design.chrome === "korporat") {
    page.drawRectangle({ x: 0, y: height - 12, width, height: 12, color: accent })
    page.drawRectangle({ x: 0, y: height - 16, width, height: 4, color: second })
    page.drawRectangle({
      x: 22,
      y: 22,
      width: width - 44,
      height: height - 44,
      borderColor: accent,
      borderWidth: 1.6,
    })
    page.drawRectangle({
      x: 30,
      y: 30,
      width: width - 60,
      height: height - 60,
      borderColor: second,
      borderWidth: 0.7,
    })
    return
  }

  if (design.chrome === "navy") {
    page.drawRectangle({
      x: 18,
      y: 18,
      width: width - 36,
      height: height - 36,
      borderColor: accent,
      borderWidth: 1,
    })
    return
  }

  if (design.chrome === "jalur") {
    page.drawRectangle({ x: 0, y: 0, width: 16, height, color: accent })
    page.drawRectangle({ x: width - 16, y: 0, width: 16, height, color: second })
    page.drawRectangle({
      x: 32,
      y: 28,
      width: width - 64,
      height: height - 56,
      borderColor: accent,
      borderWidth: 0.8,
    })
    return
  }

  if (design.chrome === "header" || design.chrome === "header-blue") {
    page.drawRectangle({ x: 0, y: height - 64, width, height: 64, color: accent })
    page.drawRectangle({ x: 0, y: height - 68, width, height: 4, color: second })
    return
  }

  if (design.chrome === "minimal") {
    page.drawLine({
      start: { x: 48, y: height - 28 },
      end: { x: width - 48, y: height - 28 },
      thickness: 0.8,
      color: accent,
    })
    page.drawLine({
      start: { x: 48, y: 28 },
      end: { x: width - 48, y: 28 },
      thickness: 0.8,
      color: second,
    })
    return
  }

  if (design.chrome === "sudut") {
    const corner = 22
    const inset = 36
    const marks: Array<[number, number, number, number]> = [
      [inset, height - inset, corner, -corner],
      [width - inset, height - inset, -corner, -corner],
      [inset, inset, corner, corner],
      [width - inset, inset, -corner, corner],
    ]
    for (const [x, y, dx, dy] of marks) {
      page.drawLine({ start: { x, y }, end: { x: x + dx, y }, thickness: 1.4, color: accent })
      page.drawLine({ start: { x, y }, end: { x, y: y + dy }, thickness: 1.4, color: accent })
    }
    return
  }

  if (design.chrome === "pingat") {
    page.drawRectangle({
      x: 24,
      y: 24,
      width: width - 48,
      height: height - 48,
      borderColor: accent,
      borderWidth: 1.8,
    })
    return
  }

  if (design.chrome === "panel") {
    page.drawRectangle({
      x: 20,
      y: 86,
      width: width - 40,
      height: height - 106,
      borderColor: accent,
      borderWidth: 1,
    })
    page.drawRectangle({ x: 0, y: 0, width, height: 78, color: accent })
    return
  }

  page.drawRectangle({
    x: 14,
    y: 14,
    width: width - 28,
    height: height - 28,
    borderColor: accent,
    borderWidth: 1.2,
  })
  page.drawRectangle({
    x: 22,
    y: 22,
    width: width - 44,
    height: height - 44,
    borderColor: second,
    borderWidth: 0.7,
  })
  page.drawRectangle({
    x: 30,
    y: 30,
    width: width - 60,
    height: height - 60,
    borderColor: accent,
    borderWidth: 0.6,
  })
}

async function embedLogo(pdf: PDFDocument, logo: LogoFile) {
  if (logo.contentType === "image/png") return pdf.embedPng(logo.bytes)
  return pdf.embedJpg(logo.bytes)
}

function drawLogo(page: PDFPage, image: PDFImage, top: number, plate: boolean) {
  const maxW = 92
  const maxH = 64
  const scale = Math.min(maxW / image.width, maxH / image.height)
  const width = image.width * scale
  const height = image.height * scale
  const x = (page.getWidth() - width) / 2
  const y = top - height
  if (plate) {
    page.drawRectangle({
      x: x - 6,
      y: y - 6,
      width: width + 12,
      height: height + 12,
      color: rgb(1, 1, 1),
    })
  }
  page.drawImage(image, { x, y, width, height })
  return height + (plate ? 12 : 0)
}

function drawSeal(page: PDFPage, x: number, y: number, font: PDFFont, accent: Rgb, second: Rgb) {
  page.drawEllipse({ x, y, xScale: 28, yScale: 28, borderColor: second, borderWidth: 1.1 })
  page.drawEllipse({ x, y, xScale: 23, yScale: 23, borderColor: accent, borderWidth: 0.6 })
  const seal = "HADIR"
  const sealWidth = font.widthOfTextAtSize(seal, 8)
  page.drawText(seal, { x: x - sealWidth / 2, y: y - 3, size: 8, font, color: accent })
}

export async function buildCertificatePdf(
  record: AttendanceWithProgram,
  options?: { design?: string; logo?: LogoFile | null },
) {
  const stored = options
    ? null
    : await loadCertificateAssets(record.program.id).catch(() => null)
  const design = getCertificateDesign(
    options?.design ?? stored?.design ?? record.program.certificateDesign,
  )
  const logo = options ? (options.logo ?? null) : (stored?.logo ?? null)

  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  const page = pdf.addPage(A4)
  const { width, height } = page.getSize()

  let regular: PDFFont
  let bold: PDFFont
  let italic: PDFFont
  try {
    const bytes = await loadFontBytes()
    regular = await pdf.embedFont(bytes.regular, { subset: true })
    bold = await pdf.embedFont(bytes.bold, { subset: true })
    italic = await pdf.embedFont(bytes.italic, { subset: true })
  } catch {
    regular = await pdf.embedFont(StandardFonts.TimesRoman)
    bold = await pdf.embedFont(StandardFonts.TimesRomanBold)
    italic = await pdf.embedFont(StandardFonts.TimesRomanItalic)
  }

  paintChrome(page, design)
  const accent = hex(design.accent)
  const second = hex(design.second)
  const ink = hex(design.ink)
  const muted = hex(design.muted)
  const onPanel = design.chrome === "panel"
  const light = rgb(1, 1, 1)

  const contentWidth = width - 160
  let y =
    design.chrome === "header" || design.chrome === "header-blue" ? height - 96 : height - 78

  let image: PDFImage | null = null
  if (logo) {
    try {
      image = await embedLogo(pdf, logo)
    } catch {
      image = null
    }
  }

  if (image) {
    const used = drawLogo(page, image, y + 8, design.chrome === "navy")
    y -= used + 18
  } else if (design.chrome === "pingat") {
    drawSeal(page, width / 2, y - 8, bold, accent, second)
    y -= 52
  }

  if (design.chrome === "header" || design.chrome === "header-blue") {
    drawTracked(page, "E-SIJIL KEHADIRAN", height - 40, regular, 10, light, 2.2)
  } else {
    drawTracked(page, "E-SIJIL KEHADIRAN", y, regular, 10, second, 2.2)
    y -= 28
  }

  y = drawCentered(page, "Sijil Penyertaan", y, bold, 28, design.chrome === "navy" ? ink : accent, contentWidth, 4)
  y -= 8
  page.drawLine({
    start: { x: (width - 92) / 2, y },
    end: { x: (width + 92) / 2, y },
    thickness: 0.8,
    color: second,
  })
  y -= 30
  y = drawCentered(page, "Dengan ini disahkan bahawa", y, italic, 12, muted, contentWidth)
  y -= 8
  y = drawCentered(page, record.fullName, y, bold, 22, ink, contentWidth, 4)
  y -= 4
  page.drawLine({
    start: { x: width / 2 - 70, y: y + 2 },
    end: { x: width / 2 + 70, y: y + 2 },
    thickness: 0.6,
    color: second,
  })
  y -= 24
  y = drawCentered(page, "telah hadir dan menyertai", y, italic, 12, muted, contentWidth)
  y -= 6
  y = drawCentered(page, record.program.title, y, bold, 16, accent, contentWidth, 4)
  y -= 12
  y = drawCentered(
    page,
    formatSchedule(record.program.eventDate, record.program.eventEndDate, record.program.eventTime),
    y,
    regular,
    12,
    ink,
    contentWidth,
  )
  if (record.program.venue) {
    y = drawCentered(page, record.program.venue, y, regular, 12, ink, contentWidth)
  }
  if (record.program.organizer) {
    y -= 4
    y = drawCentered(page, `Anjuran ${record.program.organizer}`, y, regular, 12, ink, contentWidth)
  }

  const footInk = onPanel ? light : ink
  const footMuted = onPanel ? rgb(0.93, 0.95, 0.98) : muted
  if (design.chrome !== "pingat" && !onPanel) {
    drawSeal(page, 118, 132, bold, accent, second)
  }

  const metaY = onPanel ? 28 : 78
  page.drawText("No. sijil", { x: design.chrome === "pingat" ? 78 : 78, y: metaY, size: 9, font: regular, color: footMuted })
  page.drawText(record.certificateNo, {
    x: 78,
    y: metaY - 14,
    size: 11,
    font: bold,
    color: footInk,
  })

  const signX = width - 230
  const signLine = onPanel ? 48 : 108
  page.drawLine({
    start: { x: signX, y: signLine },
    end: { x: signX + 140, y: signLine },
    thickness: 0.7,
    color: footInk,
  })
  if (record.program.signatoryName) {
    page.drawText(record.program.signatoryName, {
      x: signX,
      y: signLine - 16,
      size: 11,
      font: bold,
      color: footInk,
    })
  }
  if (record.program.signatoryRole) {
    page.drawText(record.program.signatoryRole, {
      x: signX,
      y: signLine - 30,
      size: 9,
      font: italic,
      color: footMuted,
    })
  }

  if (!onPanel) {
    const footer = "Sijil ini dijana secara digital selepas borang kehadiran dihantar."
    const footerWidth = regular.widthOfTextAtSize(footer, 8)
    page.drawText(footer, {
      x: (width - footerWidth) / 2,
      y: 46,
      size: 8,
      font: regular,
      color: muted,
    })
  }

  return pdf.save()
}
