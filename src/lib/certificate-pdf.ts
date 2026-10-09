import { readFile } from "node:fs/promises"
import path from "node:path"

import fontkit from "@pdf-lib/fontkit"
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib"

import { formatSchedule } from "@/lib/format"
import type { AttendanceWithProgram } from "@/lib/types"

const A4: [number, number] = [595.28, 841.89]

const paper = rgb(0.973, 0.949, 0.906)
const ink = rgb(0.145, 0.165, 0.15)
const green = rgb(0.133, 0.275, 0.216)
const gold = rgb(0.66, 0.52, 0.27)
const muted = rgb(0.38, 0.34, 0.29)

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
  color: ReturnType<typeof rgb>,
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
  color: ReturnType<typeof rgb>,
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

export async function buildCertificatePdf(record: AttendanceWithProgram) {
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

  page.drawRectangle({ x: 0, y: 0, width, height, color: paper })
  page.drawRectangle({
    x: 22,
    y: 22,
    width: width - 44,
    height: height - 44,
    borderColor: green,
    borderWidth: 1.6,
  })
  page.drawRectangle({
    x: 30,
    y: 30,
    width: width - 60,
    height: height - 60,
    borderColor: gold,
    borderWidth: 0.7,
  })

  const corner = 18
  const inset = 40
  const corners: Array<[number, number, number, number]> = [
    [inset, height - inset, corner, -corner],
    [width - inset, height - inset, -corner, -corner],
    [inset, inset, corner, corner],
    [width - inset, inset, -corner, corner],
  ]
  for (const [x, y, dx, dy] of corners) {
    page.drawLine({
      start: { x, y },
      end: { x: x + dx, y },
      thickness: 1.2,
      color: green,
    })
    page.drawLine({
      start: { x, y },
      end: { x, y: y + dy },
      thickness: 1.2,
      color: green,
    })
  }

  const contentWidth = width - 140
  let y = height - 108

  drawTracked(page, "E-SIJIL KEHADIRAN", y, regular, 10, gold, 2.2)
  y -= 36
  y = drawCentered(page, "Sijil Penyertaan", y, bold, 30, green, contentWidth, 4)
  y -= 8

  const ruleWidth = 92
  page.drawLine({
    start: { x: (width - ruleWidth) / 2, y },
    end: { x: (width + ruleWidth) / 2, y },
    thickness: 0.8,
    color: gold,
  })
  y -= 36
  y = drawCentered(
    page,
    "Dengan ini disahkan bahawa",
    y,
    italic,
    12,
    muted,
    contentWidth,
  )
  y -= 10
  y = drawCentered(page, record.fullName, y, bold, 24, ink, contentWidth, 4)
  y -= 6
  page.drawLine({
    start: { x: width / 2 - 70, y: y + 4 },
    end: { x: width / 2 + 70, y: y + 4 },
    thickness: 0.6,
    color: gold,
  })
  y -= 28
  y = drawCentered(
    page,
    "telah hadir dan menyertai",
    y,
    italic,
    12,
    muted,
    contentWidth,
  )
  y -= 8
  y = drawCentered(page, record.program.title, y, bold, 16, green, contentWidth, 4)
  y -= 14
  y = drawCentered(
    page,
    formatSchedule(
      record.program.eventDate,
      record.program.eventEndDate,
      record.program.eventTime,
    ),
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
    y = drawCentered(
      page,
      `Anjuran ${record.program.organizer}`,
      y,
      regular,
      12,
      ink,
      contentWidth,
    )
  }

  page.drawEllipse({
    x: 118,
    y: 132,
    xScale: 28,
    yScale: 28,
    borderColor: gold,
    borderWidth: 1.1,
  })
  page.drawEllipse({
    x: 118,
    y: 132,
    xScale: 23,
    yScale: 23,
    borderColor: green,
    borderWidth: 0.6,
  })
  const seal = "HADIR"
  const sealWidth = bold.widthOfTextAtSize(seal, 8)
  page.drawText(seal, {
    x: 118 - sealWidth / 2,
    y: 128,
    size: 8,
    font: bold,
    color: green,
  })

  page.drawText("No. sijil", {
    x: 78,
    y: 78,
    size: 9,
    font: regular,
    color: muted,
  })
  page.drawText(record.certificateNo, {
    x: 78,
    y: 64,
    size: 11,
    font: bold,
    color: ink,
  })

  const signX = width - 230
  page.drawLine({
    start: { x: signX, y: 108 },
    end: { x: signX + 140, y: 108 },
    thickness: 0.7,
    color: ink,
  })
  if (record.program.signatoryName) {
    page.drawText(record.program.signatoryName, {
      x: signX,
      y: 92,
      size: 11,
      font: bold,
      color: ink,
    })
  }
  if (record.program.signatoryRole) {
    page.drawText(record.program.signatoryRole, {
      x: signX,
      y: 78,
      size: 9,
      font: italic,
      color: muted,
    })
  }

  const footer = "Sijil ini dijana secara digital selepas borang kehadiran dihantar."
  const footerWidth = regular.widthOfTextAtSize(footer, 8)
  page.drawText(footer, {
    x: (width - footerWidth) / 2,
    y: 46,
    size: 8,
    font: regular,
    color: muted,
  })

  return pdf.save()
}
