// Run: node scripts/dump_local.mjs > scripts/002_seed_from_local.sql
import pg from "pg"
import { writeFileSync } from "fs"

const { Pool } = pg

const pool = new Pool({
  connectionString: "postgresql://postgres:root@localhost:5433/job",
  ssl: false,
})

function escape(val) {
  if (val === null || val === undefined) return "NULL"
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE"
  const str = String(val).replace(/'/g, "''")
  return `'${str}'`
}

const columns = [
  "id", "company", "role", "location", "url", "description", "notes",
  "status", "applied_at", "response_at", "response_text", "created_at", "updated_at",
]

const { rows } = await pool.query(
  `SELECT ${columns.join(", ")} FROM applications ORDER BY applied_at ASC`,
)

const lines = [
  "-- Seed from local DB export",
  "-- Run this in your Neon SQL editor after the schema is created.",
  "",
]

for (const row of rows) {
  const vals = columns.map((c) => escape(row[c])).join(", ")
  lines.push(`INSERT INTO applications (${columns.join(", ")}) VALUES (${vals}) ON CONFLICT (id) DO NOTHING;`)
}

lines.push("")
const sql = lines.join("\n")

writeFileSync("scripts/002_seed_from_local.sql", sql, "utf8")
console.log(`Exported ${rows.length} rows → scripts/002_seed_from_local.sql`)

await pool.end()
