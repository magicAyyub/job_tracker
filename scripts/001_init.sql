-- Job application tracker: initial schema
-- Safe to run multiple times.

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

-- Trigger to keep updated_at fresh
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
