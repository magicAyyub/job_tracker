"use server"

import { revalidatePath } from "next/cache"
import { query } from "@/lib/db"
import { STATUSES, type Application, type ApplicationStatus } from "@/lib/types"

function assertStatus(v: unknown): ApplicationStatus {
  if (typeof v === "string" && (STATUSES as readonly string[]).includes(v)) {
    return v as ApplicationStatus
  }
  return "applied"
}

function emptyToNull(v: FormDataEntryValue | null): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s.length === 0 ? null : s
}

export async function listApplications(): Promise<Application[]> {
  const { rows } = await query<Application>(
    `select * from applications order by applied_at desc, created_at desc`,
  )
  return rows
}

export async function createApplication(formData: FormData) {
  const company = String(formData.get("company") ?? "").trim()
  const role = String(formData.get("role") ?? "").trim()
  if (!company || !role) {
    throw new Error("Company and role are required")
  }
  const url = emptyToNull(formData.get("url"))
  const location = emptyToNull(formData.get("location"))
  const description = emptyToNull(formData.get("description"))
  const notes = emptyToNull(formData.get("notes"))
  const appliedAtRaw = emptyToNull(formData.get("applied_at"))
  const appliedAt = appliedAtRaw ? new Date(appliedAtRaw) : new Date()

  await query(
    `insert into applications (company, role, url, location, description, notes, applied_at)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [company, role, url, location, description, notes, appliedAt],
  )
  revalidatePath("/")
}

export async function updateApplication(id: string, patch: Partial<Application>) {
  const fields: string[] = []
  const values: any[] = []
  let i = 1

  const allowed: (keyof Application)[] = [
    "company",
    "role",
    "location",
    "url",
    "description",
    "notes",
    "status",
    "response_text",
    "applied_at",
    "response_at",
  ]

  for (const key of allowed) {
    if (key in patch) {
      let val: any = (patch as any)[key]
      if (key === "status") val = assertStatus(val)
      if (key === "applied_at") { if (!val) continue } // applied_at is NOT NULL, skip if falsy
      else if (typeof val === "string" && val.trim() === "") val = null
      fields.push(`${key} = $${i++}`)
      values.push(val)
    }
  }

  // If moving to a "response received" status and response_at is not manually set, stamp it.
  if (patch.status && ["rejected", "offer", "interviewing"].includes(patch.status) && !("response_at" in patch)) {
    fields.push(`response_at = coalesce(response_at, now())`)
  }
  // If moving back to 'applied', clear response_at.
  if (patch.status === "applied") {
    fields.push(`response_at = null`)
  }

  if (fields.length === 0) return

  values.push(id)
  await query(`update applications set ${fields.join(", ")} where id = $${i}`, values)
  revalidatePath("/")
}

export async function deleteApplication(id: string) {
  await query(`delete from applications where id = $1`, [id])
  revalidatePath("/")
}

export async function exportApplications(): Promise<{
  json: string
  csv: string
  count: number
}> {
  const { rows } = await query<Application>(
    `select * from applications order by applied_at desc, created_at desc`,
  )

  // JSON export
  const json = JSON.stringify(rows, null, 2)

  // CSV export
  const headers = [
    "id",
    "company",
    "role",
    "location",
    "url",
    "description",
    "notes",
    "status",
    "applied_at",
    "response_at",
    "response_text",
    "created_at",
    "updated_at",
  ]

  const escapeCSV = (val: unknown): string => {
    if (val == null) return ""
    const str = String(val)
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const csvRows = [headers.join(",")]
  for (const row of rows) {
    csvRows.push(headers.map((h) => escapeCSV((row as any)[h])).join(","))
  }
  const csv = csvRows.join("\n")

  return { json, csv, count: rows.length }
}