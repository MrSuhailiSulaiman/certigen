import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"

import { getCertificateDesign, type CertificateDesignId } from "@/lib/certificate-designs"
import { StoreError } from "@/lib/errors"
import { supabaseConfig } from "@/lib/supabase"
import type { Program } from "@/lib/types"

const BUCKET = "certificates"

export type LogoFile = {
  bytes: Uint8Array
  contentType: "image/png" | "image/jpeg"
}

type StoredAssets = {
  design: CertificateDesignId
  logo: LogoFile | null
}

function localDir(programId: string) {
  return path.join(process.cwd(), "data", "certificates", programId)
}

function serviceConfig() {
  const url = (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ""
  )
    .trim()
    .replace(/\/$/, "")
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    ""
  ).trim()
  return { url, key, enabled: Boolean(url && key) }
}

export function sniffImage(bytes: Uint8Array): LogoFile["contentType"] | null {
  if (
    bytes.length > 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png"
  }
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg"
  }
  return null
}

let bucketReady: Promise<void> | null = null

async function ensureBucket() {
  const { url, key } = serviceConfig()
  if (!bucketReady) {
    bucketReady = (async () => {
      const response = await fetch(`${url}/storage/v1/bucket`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          apikey: key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false }),
      })
      if (response.ok || response.status === 409) return
      const text = await response.text()
      if (text.toLowerCase().includes("already exists")) return
      bucketReady = null
      throw new StoreError("Simpanan logo tidak dapat disediakan. Cuba sebentar lagi.")
    })()
  }
  await bucketReady
}

async function putObject(objectPath: string, body: Uint8Array | string, contentType: string) {
  const { url, key } = serviceConfig()
  await ensureBucket()
  const payload = typeof body === "string" ? new TextEncoder().encode(body) : body
  const response = await fetch(`${url}/storage/v1/object/${BUCKET}/${objectPath}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: Buffer.from(payload),
  })
  if (!response.ok) {
    throw new StoreError("Logo atau reka bentuk tidak dapat disimpan. Cuba sebentar lagi.")
  }
}

async function getObject(objectPath: string) {
  const { url, key } = serviceConfig()
  const response = await fetch(`${url}/storage/v1/object/${BUCKET}/${objectPath}`, {
    headers: { Authorization: `Bearer ${key}`, apikey: key },
    cache: "no-store",
  })
  if (response.status === 404 || response.status === 400) return null
  if (!response.ok) return null
  const bytes = new Uint8Array(await response.arrayBuffer())
  const contentType = response.headers.get("content-type") ?? ""
  return { bytes, contentType }
}

async function deleteObject(objectPath: string) {
  const { url, key } = serviceConfig()
  await fetch(`${url}/storage/v1/object/${BUCKET}/${objectPath}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${key}`, apikey: key },
  })
}

function designPath(programId: string) {
  return `programs/${programId}/design.txt`
}

function logoPath(programId: string) {
  return `programs/${programId}/logo`
}

export async function loadCertificateAssets(programId: string): Promise<StoredAssets> {
  const remote = serviceConfig().enabled
  if (remote && supabaseConfig().configured) {
    const [designObject, logoObject] = await Promise.all([
      getObject(designPath(programId)),
      getObject(logoPath(programId)),
    ])
    const designText = designObject ? new TextDecoder().decode(designObject.bytes).trim() : ""
    const design = getCertificateDesign(designText).id
    const sniffed = logoObject ? sniffImage(logoObject.bytes) : null
    return {
      design,
      logo: logoObject && sniffed ? { bytes: logoObject.bytes, contentType: sniffed } : null,
    }
  }

  try {
    const designText = (await readFile(path.join(localDir(programId), "design.txt"), "utf8")).trim()
    const design = getCertificateDesign(designText).id
    let logo: LogoFile | null = null
    try {
      const bytes = new Uint8Array(await readFile(path.join(localDir(programId), "logo")))
      const contentType = sniffImage(bytes)
      if (contentType) logo = { bytes, contentType }
    } catch {
      logo = null
    }
    return { design, logo }
  } catch {
    return { design: "korporat", logo: null }
  }
}

export async function saveCertificateDesign(programId: string, design: CertificateDesignId) {
  if (serviceConfig().enabled) {
    await putObject(designPath(programId), design, "text/plain")
    return
  }
  const directory = localDir(programId)
  await mkdir(directory, { recursive: true })
  await writeFile(path.join(directory, "design.txt"), design)
}

export async function saveCertificateLogo(programId: string, bytes: Uint8Array, contentType: LogoFile["contentType"]) {
  if (serviceConfig().enabled) {
    await putObject(logoPath(programId), bytes, contentType)
    return
  }
  const directory = localDir(programId)
  await mkdir(directory, { recursive: true })
  await writeFile(path.join(directory, "logo"), bytes)
}

export async function removeCertificateLogo(programId: string) {
  if (serviceConfig().enabled) {
    await deleteObject(logoPath(programId))
    return
  }
  await rm(path.join(localDir(programId), "logo"), { force: true })
}

export async function applyCertificateAssets(program: Program): Promise<Program> {
  const assets = await loadCertificateAssets(program.id)
  return {
    ...program,
    certificateDesign: assets.design,
    hasLogo: Boolean(assets.logo),
  }
}
