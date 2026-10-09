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
  event_time text not null default '',
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

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update on table public.programs to anon, authenticated;
grant select, insert on table public.attendance to anon, authenticated;
grant all on table public.programs to service_role;
grant all on table public.attendance to service_role;

drop policy if exists programs_read on public.programs;
create policy programs_read on public.programs
  for select to anon, authenticated
  using (true);

drop policy if exists programs_insert on public.programs;
create policy programs_insert on public.programs
  for insert to anon, authenticated
  with check (true);

drop policy if exists programs_update on public.programs;
create policy programs_update on public.programs
  for update to anon, authenticated
  using (true)
  with check (true);

drop policy if exists attendance_read on public.attendance;
create policy attendance_read on public.attendance
  for select to anon, authenticated
  using (true);

drop policy if exists attendance_insert on public.attendance;
create policy attendance_insert on public.attendance
  for insert to anon, authenticated
  with check (
    exists (
      select 1
      from public.programs
      where programs.id = attendance.program_id
        and programs.is_open
    )
  );
