# LENTERA

LENTERA adalah aplikasi Vite + React untuk Layanan Elektronik Pengelolaan Terpadu Arsip.

## Menjalankan lokal

```bash
npm install
npm run dev
```

## Konfigurasi Supabase

Aplikasi membutuhkan environment variable berikut saat build:

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<supabase-anon-or-publishable-key>
```

Untuk Vercel, tambahkan keduanya di **Project Settings → Environment Variables** dan pastikan scope **Production** aktif. Setelah mengubah env, lakukan redeploy production karena Vite membaca `VITE_*` pada waktu build.

## Checklist login di Vercel production

Jika login hanya bermasalah di domain utama production:

1. Pastikan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` tersedia untuk environment **Production**, bukan hanya Preview/Development.
2. Redeploy production setelah env diperbarui.
3. Di Supabase Dashboard, pastikan domain utama production terdaftar pada konfigurasi Auth URL/Redirect URL bila memakai flow yang membutuhkan redirect, seperti magic link, reset password, invite, atau OAuth.
4. Pastikan `package-lock.json` selalu sinkron dengan `package.json` agar Vercel memasang dependency yang sama dengan repo.

Aplikasi juga menyetel storage key Supabase Auth yang stabil (`lentera-supabase-auth`) supaya sesi login konsisten pada domain production yang sama.
