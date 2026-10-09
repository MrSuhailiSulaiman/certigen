-- Tambah masa program untuk borang daftar.
-- Selamat dijalankan sekali lagi jika lajur sudah wujud.

alter table public.programs
  add column if not exists event_time text not null default '';
