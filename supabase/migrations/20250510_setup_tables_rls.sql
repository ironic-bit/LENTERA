-- ============================================================================
-- LENTERA - Migration Script
-- Jalankan di Supabase Dashboard → SQL Editor
-- ============================================================================

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. TABEL PROFILES (jika belum ada)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  username text UNIQUE,
  nama text,
  nip text,
  role text DEFAULT 'viewer' CHECK (role IN ('admin', 'user', 'viewer')),
  akses_klasifikasi text[] DEFAULT ARRAY['B'],
  status_aktif boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index untuk login via username/nip
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_nip ON public.profiles(nip);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. TABEL TABEL_ARSIP
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.tabel_arsip (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kode_klasifikasi text NOT NULL,
  nomor_surat text NOT NULL,
  judul text NOT NULL,
  jenis_naskah text,
  klasifikasi_keamanan text DEFAULT 'B' CHECK (klasifikasi_keamanan IN ('B', 'T', 'R', 'SR')),
  tahun integer NOT NULL,
  tanggal_surat date,
  deskripsi text,
  retensi_aktif integer DEFAULT 2,
  retensi_inaktif integer DEFAULT 1,
  keterangan_retensi text DEFAULT 'Musnah' CHECK (keterangan_retensi IN ('Musnah', 'Permanen')),
  status_arsip text DEFAULT 'Aktif' CHECK (status_arsip IN ('Aktif', 'Inaktif')),
  link_cloud text,
  registered_by text,
  tanggal_registrasi timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Index untuk pencarian & filter
CREATE INDEX IF NOT EXISTS idx_arsip_tahun ON public.tabel_arsip(tahun);
CREATE INDEX IF NOT EXISTS idx_arsip_klasifikasi ON public.tabel_arsip(klasifikasi_keamanan);
CREATE INDEX IF NOT EXISTS idx_arsip_status ON public.tabel_arsip(status_arsip);
CREATE INDEX IF NOT EXISTS idx_arsip_created ON public.tabel_arsip(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════════════════════

-- === PROFILES ===
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Semua authenticated user bisa lihat profiles (untuk resolve username saat login)
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

-- User bisa update profile sendiri
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin bisa update semua profile (via Edge Function dengan service_role, jadi ini opsional)
DROP POLICY IF EXISTS "Admin can update all profiles" ON public.profiles;
CREATE POLICY "Admin can update all profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Insert hanya bisa dilakukan oleh trigger atau service_role (Edge Function)
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
CREATE POLICY "Service role can insert profiles" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- === TABEL_ARSIP ===
ALTER TABLE public.tabel_arsip ENABLE ROW LEVEL SECURITY;

-- Semua authenticated user bisa lihat arsip
DROP POLICY IF EXISTS "Authenticated users can view arsip" ON public.tabel_arsip;
CREATE POLICY "Authenticated users can view arsip" ON public.tabel_arsip
  FOR SELECT TO authenticated
  USING (true);

-- User dengan role admin/user bisa insert arsip
DROP POLICY IF EXISTS "Admin and User can insert arsip" ON public.tabel_arsip;
CREATE POLICY "Admin and User can insert arsip" ON public.tabel_arsip
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'user')
    )
  );

-- User dengan role admin/user bisa update arsip
DROP POLICY IF EXISTS "Admin and User can update arsip" ON public.tabel_arsip;
CREATE POLICY "Admin and User can update arsip" ON public.tabel_arsip
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'user')
    )
  );

-- Hanya admin bisa delete arsip
DROP POLICY IF EXISTS "Admin can delete arsip" ON public.tabel_arsip;
CREATE POLICY "Admin can delete arsip" ON public.tabel_arsip
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. TRIGGER: Auto-create profile saat user baru signup
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, nama, role, akses_klasifikasi, status_aktif)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'nama', 'User Baru'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer'),
    ARRAY['B'],
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger dulu kalau sudah ada
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Buat trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. SEED: Buat Admin Pertama (GANTI email & password sesuai kebutuhan)
-- ═══════════════════════════════════════════════════════════════════════════════
-- 
-- CATATAN: Bagian ini TIDAK bisa dijalankan via SQL Editor biasa.
-- Gunakan Supabase Dashboard → Authentication → Add User:
--
--   Email    : admin@instansi.go.id
--   Password : (password kuat yang Anda tentukan)
--
-- Setelah user dibuat, jalankan SQL berikut untuk set role admin:

-- UPDATE public.profiles 
-- SET 
--   role = 'admin',
--   nama = 'Administrator',
--   username = 'admin',
--   akses_klasifikasi = ARRAY['B', 'T', 'R', 'SR']
-- WHERE email = 'admin@instansi.go.id';

-- ═══════════════════════════════════════════════════════════════════════════════
-- SELESAI! 
-- ═══════════════════════════════════════════════════════════════════════════════
