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
import { formatCertificateDate, formatTime } from "@/lib/format"
import type { AttendanceWithProgram } from "@/lib/types"

const A4: [number, number] = [595.28, 841.89]

const maroon = rgb(0.48, 0.08, 0.11)
const gold = rgb(0.886, 0.639, 0.043)
const yellow = rgb(0.953, 0.773, 0.2)
const scriptRed = rgb(0.827, 0.07, 0.141)
const ink = rgb(0.11, 0.11, 0.11)
const muted = rgb(0.33, 0.33, 0.33)
const cream = rgb(1, 0.98, 0.95)
const paper = rgb(1, 1, 1)

type Rgb = ReturnType<typeof rgb>

async function loadFontBytes() {
  const directory = path.join(process.cwd(), "src/lib/fonts")
  const [regular, bold, italic, script] = await Promise.all([
    readFile(path.join(directory, "LibreBaskerville-Regular.ttf")),
    readFile(path.join(directory, "LibreBaskerville-Bold.ttf")),
    readFile(path.join(directory, "LibreBaskerville-Italic.ttf")),
    readFile(path.join(directory, "GreatVibes-Regular.ttf")),
  ])
  return { regular, bold, italic, script }
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
  gap = 4,
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
  return total
}

function drawRight(
  page: PDFPage,
  text: string,
  right: number,
  y: number,
  font: PDFFont,
  size: number,
  color: Rgb,
) {
  const width = font.widthOfTextAtSize(text, size)
  page.drawText(text, { x: right - width, y, size, font, color })
}

function drawBand(
  page: PDFPage,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  offset: number,
  thickness: number,
  color: Rgb,
) {
  const dx = x1 - x0
  const dy = y1 - y0
  const length = Math.hypot(dx, dy) || 1
  const nx = -dy / length
  const ny = dx / length
  page.drawLine({
    start: { x: x0 + nx * offset, y: y0 + ny * offset },
    end: { x: x1 + nx * offset, y: y1 + ny * offset },
    thickness,
    color,
  })
}

function drawRibbons(page: PDFPage) {
  const { width, height } = page.getSize()
  const bands: Array<[number, number, Rgb]> = [
    [0, 18, maroon],
    [20, 12, gold],
    [36, 16, yellow],
    [54, 12, rgb(0.6, 0.11, 0.14)],
  ]
  for (const [offset, thickness, color] of bands) {
    drawBand(page, -40, height + 10, 168, height - 130, offset, thickness, color)
    drawBand(page, width - 150, 130, width + 30, -10, offset, thickness, color)
  }
}

function drawSeal(page: PDFPage, cx: number, cy: number) {
  for (let index = 0; index < 18; index += 1) {
    const angle = (index / 18) * Math.PI * 2
    page.drawEllipse({
      x: cx + Math.cos(angle) * 24,
      y: cy + Math.sin(angle) * 24,
      xScale: 7,
      yScale: 7,
      color: index % 2 === 0 ? rgb(0.9, 0.7, 0.22) : rgb(0.72, 0.5, 0.1),
    })
  }
  page.drawEllipse({ x: cx, y: cy, xScale: 22, yScale: 22, color: rgb(0.93, 0.75, 0.28) })
  page.drawEllipse({
    x: cx,
    y: cy,
    xScale: 16,
    yScale: 16,
    borderColor: rgb(1, 0.96, 0.82),
    borderWidth: 1,
  })
  page.drawEllipse({ x: cx, y: cy, xScale: 4, yScale: 4, color: rgb(0.98, 0.91, 0.65) })
}

function drawMedallion(page: PDFPage, cx: number, cy: number, year: string, font: PDFFont) {
  page.drawEllipse({
    x: cx,
    y: cy,
    xScale: 46,
    yScale: 46,
    borderColor: gold,
    borderWidth: 3,
    color: cream,
  })
  page.drawEllipse({
    x: cx,
    y: cy,
    xScale: 40,
    yScale: 40,
    borderColor: gold,
    borderWidth: 1,
  })
  const width = font.widthOfTextAtSize(year, 22)
  page.drawText(year, {
    x: cx - width / 2,
    y: cy - 8,
    size: 22,
    font,
    color: maroon,
  })
}

async function embedLogo(pdf: PDFDocument, logo: LogoFile) {
  if (logo.contentType === "image/png") return pdf.embedPng(logo.bytes)
  return pdf.embedJpg(logo.bytes)
}

function drawLogo(page: PDFPage, image: PDFImage, centerX: number, top: number, maxW: number, maxH: number) {
  const scale = Math.min(maxW / image.width, maxH / image.height)
  const width = image.width * scale
  const height = image.height * scale
  const x = centerX - width / 2
  const y = top - height
  page.drawImage(image, { x, y, width, height })
  return height
}

export async function buildCertificatePdf(
  record: AttendanceWithProgram,
  options?: { design?: string; logo?: LogoFile | null },
) {
  const stored = options
    ? null
    : await loadCertificateAssets(record.program.id).catch(() => null)
  const logo = options ? (options.logo ?? null) : (stored?.logo ?? null)

  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  const page = pdf.addPage(A4)
  const { width, height } = page.getSize()

  let regular: PDFFont
  let bold: PDFFont
  let italic: PDFFont
  let script: PDFFont
  try {
    const bytes = await loadFontBytes()
    regular = await pdf.embedFont(bytes.regular, { subset: true })
    bold = await pdf.embedFont(bytes.bold, { subset: true })
    italic = await pdf.embedFont(bytes.italic, { subset: true })
    script = await pdf.embedFont(bytes.script, { subset: true })
  } catch {
    regular = await pdf.embedFont(StandardFonts.TimesRoman)
    bold = await pdf.embedFont(StandardFonts.TimesRomanBold)
    italic = await pdf.embedFont(StandardFonts.TimesRomanItalic)
    script = italic
  }

  page.drawRectangle({ x: 0, y: 0, width, height, color: paper })
  drawRibbons(page)

  let image: PDFImage | null = null
  if (logo) {
    try {
      image = await embedLogo(pdf, logo)
    } catch {
      image = null
    }
  }

  const contentWidth = width - 180
  let y = height - 64
  if (image) {
    const used = drawLogo(page, image, width / 2, y, 72, 48)
    y -= used + 16
  }

  if (record.program.organizer) {
    const label = record.program.organizer.toUpperCase()
    let labelSize = 8
    while (labelSize > 6 && bold.widthOfTextAtSize(label, labelSize) > contentWidth) {
      labelSize -= 0.5
    }
    y = drawCentered(page, label, y, bold, labelSize, ink, contentWidth)
    y -= 10
  }

  const title = "Sijil Penghargaan"
  let titleSize = 40
  while (titleSize > 28 && script.widthOfTextAtSize(title, titleSize) > contentWidth) {
    titleSize -= 1
  }
  y -= titleSize + 6
  y = drawCentered(page, title, y, script, titleSize, scriptRed, contentWidth, 2)
  y -= 16
  y = drawCentered(
    page,
    "Setinggi-tinggi penghargaan dan tahniah kepada",
    y,
    italic,
    11,
    ink,
    contentWidth,
  )
  y -= 10
  y = drawCentered(page, record.fullName.toUpperCase(), y, bold, 12, ink, contentWidth, 3)
  y -= 10
  y = drawCentered(page, "atas sumbangan dan komitmen sebagai", y, italic, 11, ink, contentWidth)
  y -= 8
  drawTracked(page, "PESERTA", y, bold, 15, scriptRed, 1.6)
  y -= 26
  y = drawCentered(page, "sempena", y, italic, 11, ink, contentWidth)
  y -= 62
  const medallionCenter = y
  drawMedallion(page, width / 2, medallionCenter, record.program.eventDate.slice(0, 4) || "", bold)
  y = medallionCenter - 58
  y = drawCentered(page, record.program.title.toUpperCase(), y, bold, 11, ink, contentWidth, 3)
  if (record.program.description) {
    y -= 2
    y = drawCentered(
      page,
      record.program.description.toUpperCase(),
      y,
      italic,
      8,
      muted,
      contentWidth,
    )
  }
  y -= 10
  const padaY = y
  y = drawCentered(page, "pada", y, italic, 12, ink, contentWidth)
  y -= 2
  y = drawCentered(
    page,
    formatCertificateDate(record.program.eventDate, record.program.eventEndDate),
    y,
    bold,
    12,
    ink,
    contentWidth,
  )
  const clock = formatTime(record.program.eventTime)
  if (clock) y = drawCentered(page, clock, y, regular, 10, muted, contentWidth)
  if (record.program.venue) y = drawCentered(page, record.program.venue, y, regular, 10, muted, contentWidth)

  drawSeal(page, 96, (padaY + y) / 2)

  const right = width - 64
  let signY = y - 28
  if (record.program.signatoryName) {
    drawRight(page, record.program.signatoryName.toUpperCase(), right, signY, bold, 10, ink)
    signY -= 14
  }
  if (record.program.signatoryRole) {
    drawRight(page, record.program.signatoryRole.toUpperCase(), right, signY, regular, 8, ink)
    signY -= 12
  }
  if (record.program.organizer) {
    drawRight(page, record.program.organizer.toUpperCase(), right, signY, regular, 8, ink)
    signY -= 12
  }

  const footerY = Math.max(28, signY - 22)
  const footer = `NO. SIJIL ${record.certificateNo}`
  const footerWidth = regular.widthOfTextAtSize(footer, 8)
  page.drawText(footer, {
    x: (width - footerWidth) / 2,
    y: footerY,
    size: 8,
    font: regular,
    color: muted,
  })

  return pdf.save()
}
