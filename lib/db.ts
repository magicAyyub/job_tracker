import "server-only"
import { Pool } from "pg"

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined
  // eslint-disable-next-line no-var
  var __dbInitialized: Promise<void> | undefined
}

function getConnectionString() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add it in Project Settings > Vars to connect to your Postgres database.",
    )
  }
  return url
}

function needsSSL(url: string) {
  // Local docker typically doesn't need SSL; Neon and most hosted Postgres do.
  if (/sslmode=require/i.test(url)) return true
  if (/localhost|127\.0\.0\.1|host\.docker\.internal/.test(url)) return false
  // Default to SSL for remote hosts
  return true
}

export function getPool(): Pool {
  if (!global.__pgPool) {
    const connectionString = getConnectionString()
    global.__pgPool = new Pool({
      connectionString,
      ssl: needsSSL(connectionString) ? { rejectUnauthorized: false } : undefined,
      max: 5,
      idleTimeoutMillis: 30_000,
    })
  }
  return global.__pgPool
}

const SCHEMA_SQL = `
create extension if not exists "pgcrypto";

create table if not exists applications (
  id           uuid primary key default gen_random_uuid(),
  company      text not null,
  role         text not null,
  location     text,
  url          text,
  description  text,
  notes        text,
  status       text not null default 'applied'
               check (status in ('applied','interviewing','offer','rejected','ghosted','withdrawn')),
  applied_at   timestamptz not null default now(),
  response_at  timestamptz,
  response_text text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_applications_status      on applications(status);
create index if not exists idx_applications_applied_at  on applications(applied_at desc);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_applications_updated_at on applications;
create trigger trg_applications_updated_at
before update on applications
for each row execute function set_updated_at();
`

export async function initDb() {
  if (!global.__dbInitialized) {
    global.__dbInitialized = (async () => {
      const pool = getPool()
      await pool.query(SCHEMA_SQL)
    })().catch((err) => {
      // Allow re-initialization on next call if it failed
      global.__dbInitialized = undefined
      throw err
    })
  }
  return global.__dbInitialized
}

export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[] }> {
  await initDb()
  const pool = getPool()
  const res = await pool.query(text, params)
  return { rows: res.rows as T[] }
}
