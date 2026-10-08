-- SijilHadir: program dan rekod kehadiran.
-- Jalankan skrip ini sekali dalam Supabase SQL Editor
-- selepas projek Supabase disambungkan kepada Vercel.

create extension if not exists pgcrypto;

create table if not exists public.programs (
  id uuid primary key,
  slug text not null unique,
  title text not null,
  description text not null default '',
  organizer text not null,
  venue text not null,
  event_date date not null,
  event_end_date date,
  signatory_name text not null,
  signatory_role text not null default '',
  is_open boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.attendance (
  id uuid primary key,
  program_id uuid not null references public.programs (id) on delete cascade,
  full_name text not null,
  email text not null,
  organization text not null default '',
  phone text not null default '',
  certificate_no text not null unique,
  created_at timestamptz not null default now(),
  unique (program_id, email)
);

create index if not exists attendance_program_idx
  on public.attendance (program_id, created_at desc);

alter table public.programs enable row level security;
alter table public.attendance enable row level security;

revoke all on public.programs from anon, authenticated;
revoke all on public.attendance from anon, authenticated;
grant all on public.programs to service_role;
grant all on public.attendance to service_role;
