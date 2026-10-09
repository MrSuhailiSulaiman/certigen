-- Lokasi program disimpan pada lajur location.
-- Selamat dijalankan sekali lagi.

alter table public.programs
  add column if not exists location text not null default '';

update public.programs
set location = venue
where location = ''
  and venue <> '';
