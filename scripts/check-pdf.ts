import assert from "node:assert/strict"

import { PDFDocument } from "pdf-lib"

import { certificateDesigns } from "../src/lib/certificate-designs"
import { buildCertificatePdf } from "../src/lib/certificate-pdf"
import { formatIdentity, formatTime } from "../src/lib/format"
import { attendanceSchema, programRegistrationSchema, programSchema } from "../src/lib/validators"

const samplePng = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  ),
)

async function main() {
const bytes = await buildCertificatePdf({
  id: "6f1c2a40-7b21-4a1e-9c31-0a11b2c3d4e5",
  programId: "8a2d4b51-1c32-4f6e-8d42-1b22c3d4e5f6",
  fullName: "Nur Aisyah binti Karim",
  identityNo: "990101145678",
  certificateNo: "ES-2026-6F1C2A",
  createdAt: "2026-10-08T04:00:00.000Z",
  program: {
    id: "8a2d4b51-1c32-4f6e-8d42-1b22c3d4e5f6",
    slug: "bengkel-contoh",
    title: "Bengkel Reka Bentuk Perkhidmatan Awam",
    description: "Sesi contoh.",
    organizer: "Akademi Pentadbiran Komuniti",
    venue: "Dewan Seminar, Putrajaya",
    eventDate: "2026-10-18",
    eventEndDate: null,
    eventTime: "09:00",
    signatoryName: "Dr. Amirah Zakaria",
    signatoryRole: "Pengarah Program",
    isOpen: true,
    certificateDesign: "korporat",
    hasLogo: false,
    createdAt: "2026-10-01T02:00:00.000Z",
  },
}, { design: "korporat", logo: null })

assert.ok(Buffer.from(bytes.subarray(0, 8)).toString("utf8").startsWith("%PDF-"))
assert.ok(bytes.length > 8000)

const document = await PDFDocument.load(bytes)
const { width, height } = document.getPage(0).getSize()
assert.ok(Math.abs(width - 595.28) < 0.2, `width ${width}`)
assert.ok(Math.abs(height - 841.89) < 0.2, `height ${height}`)

for (const design of certificateDesigns) {
  const variant = await buildCertificatePdf(
    {
      id: "6f1c2a40-7b21-4a1e-9c31-0a11b2c3d4e5",
      programId: "8a2d4b51-1c32-4f6e-8d42-1b22c3d4e5f6",
      fullName: "Nur Aisyah binti Karim",
      identityNo: "990101145678",
      certificateNo: "ES-2026-6F1C2A",
      createdAt: "2026-10-08T04:00:00.000Z",
      program: {
        id: "8a2d4b51-1c32-4f6e-8d42-1b22c3d4e5f6",
        slug: "bengkel-contoh",
        title: "Bengkel Reka Bentuk Perkhidmatan Awam",
        description: "Sesi contoh.",
        organizer: "Akademi Pentadbiran Komuniti",
        venue: "Dewan Seminar, Putrajaya",
        eventDate: "2026-10-18",
        eventEndDate: null,
        eventTime: "09:00",
        signatoryName: "Dr. Amirah Zakaria",
        signatoryRole: "Pengarah Program",
        isOpen: true,
        certificateDesign: design.id,
        hasLogo: true,
        createdAt: "2026-10-01T02:00:00.000Z",
      },
    },
    { design: design.id, logo: { bytes: samplePng, contentType: "image/png" } },
  )
  assert.ok(Buffer.from(variant.subarray(0, 8)).toString("utf8").startsWith("%PDF-"), design.id)
}

const parsedDesign = programSchema.safeParse({
  title: "Bengkel Contoh",
  description: "",
  organizer: "Akademi",
  venue: "Dewan Seminar",
  eventDate: "2026-10-18",
  eventEndDate: "",
  eventTime: "09:00",
  signatoryName: "Dr. Amirah Zakaria",
  signatoryRole: "Pengarah",
  isOpen: true,
  certificateDesign: "panel",
})
assert.equal(parsedDesign.success, true)
assert.equal(certificateDesigns.length, 10)

const valid = attendanceSchema.safeParse({
  programId: "6f1c2a40-7b21-4a1e-9c31-0a11b2c3d4e5",
  fullName: "Nur Aisyah",
  identityNo: "990101-14-5678",
})
assert.equal(valid.success, true)
if (valid.success) assert.equal(valid.data.identityNo, "990101145678")
assert.equal(formatIdentity("990101145678"), "990101-14-5678")

const invalid = attendanceSchema.safeParse({
  programId: "bukan-uuid",
  fullName: "A",
  identityNo: "123",
})
assert.equal(invalid.success, false)

const registered = programRegistrationSchema.safeParse({
  title: "Bengkel Contoh",
  venue: "Dewan Seminar, Putrajaya",
  eventDate: "2026-10-18",
  eventTime: "09:30:00",
})
assert.equal(registered.success, true)
if (registered.success) assert.equal(registered.data.eventTime, "09:30")
assert.equal(formatTime("09:00"), "9:00 pagi")
assert.equal(formatTime("14:30"), "2:30 petang")
assert.equal(formatTime("20:05"), "8:05 malam")

console.log(`PDF A4 ok (${bytes.length} bytes)`)
}

main()
