import assert from "node:assert/strict"

import { PDFDocument } from "pdf-lib"

import { buildCertificatePdf } from "../src/lib/certificate-pdf"
import { attendanceSchema } from "../src/lib/validators"

async function main() {
const bytes = await buildCertificatePdf({
  id: "6f1c2a40-7b21-4a1e-9c31-0a11b2c3d4e5",
  programId: "8a2d4b51-1c32-4f6e-8d42-1b22c3d4e5f6",
  fullName: "Nur Aisyah binti Karim",
  email: "aisyah@contoh.my",
  organization: "Sekolah Contoh",
  phone: "0123456789",
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
    signatoryName: "Dr. Amirah Zakaria",
    signatoryRole: "Pengarah Program",
    isOpen: true,
    createdAt: "2026-10-01T02:00:00.000Z",
  },
})

assert.ok(Buffer.from(bytes.subarray(0, 8)).toString("utf8").startsWith("%PDF-"))
assert.ok(bytes.length > 8000)

const document = await PDFDocument.load(bytes)
const { width, height } = document.getPage(0).getSize()
assert.ok(Math.abs(width - 595.28) < 0.2, `width ${width}`)
assert.ok(Math.abs(height - 841.89) < 0.2, `height ${height}`)

const valid = attendanceSchema.safeParse({
  programId: "6f1c2a40-7b21-4a1e-9c31-0a11b2c3d4e5",
  fullName: "Nur Aisyah",
  email: "Aisyah@Contoh.my",
  organization: "Sekolah Contoh",
  phone: "",
})
assert.equal(valid.success, true)
if (valid.success) assert.equal(valid.data.email, "aisyah@contoh.my")

const invalid = attendanceSchema.safeParse({
  programId: "bukan-uuid",
  fullName: "A",
  email: "bukan-emel",
  organization: "",
  phone: "abc",
})
assert.equal(invalid.success, false)

console.log(`PDF A4 ok (${bytes.length} bytes)`)
}

main()
