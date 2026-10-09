-- Rekod kehadiran menyimpan no. kad pengenalan.
-- Selamat dijalankan sekali lagi.

alter table public.attendance
  add column if not exists no_kad_pengenalan text not null default '';

alter table public.attendance
  alter column email set default '';

update public.attendance
set no_kad_pengenalan = phone
where no_kad_pengenalan = ''
  and phone ~ '^[0-9]{12}$';

alter table public.attendance
  drop constraint if exists attendance_program_id_email_key;

create unique index if not exists attendance_program_identity_uidx
  on public.attendance (program_id, no_kad_pengenalan)
  where no_kad_pengenalan <> '';
