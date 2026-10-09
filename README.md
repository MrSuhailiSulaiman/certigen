# SijilHadir

Aplikasi web untuk merekod kehadiran program dan menjana sijil penyertaan PDF bersaiz A4. Peserta mengisi borang. Penganjur mengurus program. Rekod disimpan di Supabase, dan aplikasi sedia dihoskan di Vercel melalui GitHub.

## Aliran

1. Buka `/daftar` dan isi nama program, tarikh, serta masa. Rekod disimpan di Supabase.
2. Penganjur boleh masuk ke panel `/urus` untuk menambah tempat, penganjur, dan penandatangan.
3. Peserta buka program, isi nama, e-mel, organisasi, dan nombor telefon.
4. Sistem simpan kehadiran, kemudian peserta muat turun sijil PDF A4.
5. E-mel yang sama untuk program yang sama boleh memuat turun sijil semula tanpa rekod berganda.

## Jalankan secara tempatan

```bash
npm install
npm run dev
```

Pelayan pembangunan: [http://127.0.0.1:43123](http://127.0.0.1:43123) jika anda memulakannya dengan `--port 43123`. `npm run dev` biasa menggunakan port 3000.

Tanpa pembolehubah Supabase, rekod ditulis ke `data/store.json` pada mesin pembangunan. Fail itu tidak dihantar ke git dan tidak kekal pada fungsi Vercel. Dua program contoh dimuatkan supaya borang dan sijil boleh diuji serta-merta.

PIN panel penganjur dalam pembangunan, jika `ORGANIZER_PIN` belum ditetapkan: `hadir-2026`.

## Projek yang disambungkan

- GitHub: https://github.com/MrSuhailiSulaiman/certigen
- Supabase: https://dhgevqfinjoyxlfotkec.supabase.co

Kunci anon disimpan dalam `.env.local` pada pelayan pembangunan, bukan dalam git. Selepas kunci itu dibaca, aplikasi bercakap dengan projek Supabase ini. Jadual `programs` dan `attendance` perlu diwujudkan sekali dengan fail migrasi di bawah, kerana kunci anon tidak boleh mencipta jadual.

## Sambung Supabase, GitHub, dan Vercel

1. Cipta repositori GitHub untuk projek ini, kemudian sambungkan cawangan yang mengandungi kod.
2. Import repositori itu sebagai projek Vercel. Next.js dikesan secara automatik. Setiap push ke GitHub menghasilkan deployment.
3. Pasang Supabase dari Vercel Marketplace:

```bash
vercel integration add supabase
vercel env pull .env.local --yes
```

4. Dalam Supabase SQL Editor, jalankan `supabase/migrations/20261008120000_init.sql`. Jika jadual sudah wujud sebelum lajur masa ditambah, jalankan juga `supabase/migrations/20261009120000_program_time.sql`. Skrip ini mencipta jadual `programs` dan `attendance`, menyimpan nama, tarikh, dan masa program, kemudian membenarkan kunci anon membaca program, menulis kehadiran, dan mengurus program.
5. Pastikan pembolehubah berikut wujud pada Vercel untuk Production, Preview, dan Development:

| Nama | Kegunaan |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` atau `SUPABASE_URL` | URL projek Supabase |
| `SUPABASE_ANON_KEY` atau `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Kunci anon. Cukup untuk borang kehadiran selepas migrasi SQL dijalankan. |
| `SUPABASE_SERVICE_ROLE_KEY` atau `SUPABASE_SECRET_KEY` | Pilihan. Kunci pelayan yang memintas RLS. |
| `ORGANIZER_PIN` | PIN panel `/urus`. Minimum 4 aksara. |

6. Deploy semula selepas pembolehubah dan jadual sedia. Banner di atas halaman bertukar kepada “disimpan di Supabase” apabila sambungan berjaya.

Salin `.env.example` ke `.env.local` untuk pembangunan tempatan dengan projek Supabase anda sendiri.

## Perintah

```bash
npm run dev
npm run lint
npm run check:pdf
npm run build
```

`check:pdf` menjana sijil contoh dan mengesahkan saiz halaman A4 (210 × 297 mm).

Fon sijil ialah Libre Baskerville, dilesenkan di bawah SIL Open Font License. Teks lesen ada di `src/lib/fonts/OFL.txt`.
