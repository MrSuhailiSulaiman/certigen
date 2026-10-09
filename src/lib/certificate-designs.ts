export const certificateDesigns = [
  {
    id: "korporat",
    name: "Korporat",
    blurb: "Bingkai biru dan jalur merah",
    paper: "#ffffff",
    ink: "#1e2d52",
    accent: "#1c4f9e",
    second: "#b81e2e",
    muted: "#5b6578",
    chrome: "korporat",
  },
  {
    id: "navy",
    name: "Navy",
    blurb: "Latar biru gelap",
    paper: "#10233f",
    ink: "#f4f7fb",
    accent: "#d7e3f4",
    second: "#e23b4a",
    muted: "#c5d0e0",
    chrome: "navy",
  },
  {
    id: "jalur",
    name: "Jalur",
    blurb: "Jalur tepi biru dan merah",
    paper: "#ffffff",
    ink: "#1e2d52",
    accent: "#1c4f9e",
    second: "#b81e2e",
    muted: "#5b6578",
    chrome: "jalur",
  },
  {
    id: "merah",
    name: "Kepala merah",
    blurb: "Jalur atas merah",
    paper: "#ffffff",
    ink: "#1e2d52",
    accent: "#b81e2e",
    second: "#1c4f9e",
    muted: "#5b6578",
    chrome: "header",
  },
  {
    id: "biru",
    name: "Kepala biru",
    blurb: "Jalur atas biru",
    paper: "#ffffff",
    ink: "#1e2d52",
    accent: "#1c4f9e",
    second: "#b81e2e",
    muted: "#5b6578",
    chrome: "header-blue",
  },
  {
    id: "minimal",
    name: "Minimal",
    blurb: "Ruang putih dan garis nipis",
    paper: "#ffffff",
    ink: "#1a1a1a",
    accent: "#1c4f9e",
    second: "#b81e2e",
    muted: "#6b7280",
    chrome: "minimal",
  },
  {
    id: "sudut",
    name: "Sudut",
    blurb: "Sudut bingkai sahaja",
    paper: "#f7f9fc",
    ink: "#1e2d52",
    accent: "#1c4f9e",
    second: "#b81e2e",
    muted: "#5b6578",
    chrome: "sudut",
  },
  {
    id: "pingat",
    name: "Pingat",
    blurb: "Logo di tengah atas",
    paper: "#ffffff",
    ink: "#1e2d52",
    accent: "#1c4f9e",
    second: "#b81e2e",
    muted: "#5b6578",
    chrome: "pingat",
  },
  {
    id: "panel",
    name: "Panel",
    blurb: "Panel biru di bawah",
    paper: "#ffffff",
    ink: "#1e2d52",
    accent: "#1c4f9e",
    second: "#b81e2e",
    muted: "#5b6578",
    chrome: "panel",
  },
  {
    id: "formal",
    name: "Formal",
    blurb: "Tiga lapisan bingkai",
    paper: "#fffdf8",
    ink: "#1e2d52",
    accent: "#1c4f9e",
    second: "#b81e2e",
    muted: "#5b6578",
    chrome: "formal",
  },
] as const

export type CertificateDesignId = (typeof certificateDesigns)[number]["id"]
export type CertificateDesign = (typeof certificateDesigns)[number]

export function isCertificateDesign(value: string): value is CertificateDesignId {
  return certificateDesigns.some((design) => design.id === value)
}

export function getCertificateDesign(value: string | null | undefined): CertificateDesign {
  return (
    certificateDesigns.find((design) => design.id === value) ?? certificateDesigns[0]
  )
}
