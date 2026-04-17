export interface Arsip {
  id: string;
  kodeKlasifikasi: string;
  nomorSurat: string;
  judul: string;
  jenisNaskah: string;
  klasifikasiKeamanan: "SR" | "R" | "T" | "B";
  tahun: number;
  tanggalSurat: string;
  deskripsi: string;
  retensiAktif: number;
  retensiInaktif: number;
  keteranganRetensi: "Musnah" | "Permanen";
  statusArsip: "Aktif" | "Inaktif";
  linkCloud: string;
  tanggalRegistrasi: string;
  registeredBy: string;
}

// Kode Klasifikasi Arsip sesuai Perwako 49/2022
export const KODE_KLASIFIKASI = [
  // UMUM - 000
  { kode: "000.1.1", nama: "Telekomunikasi" },
  { kode: "000.1.2.1", nama: "Perjalanan Dinas Dalam Negeri - Kepala Daerah" },
  { kode: "000.1.2.2", nama: "Perjalanan Dinas Dalam Negeri - DPRD" },
  { kode: "000.1.2.3", nama: "Perjalanan Dinas Dalam Negeri - Pegawai" },
  { kode: "000.1.3.1", nama: "Perjalanan Dinas Luar Negeri - Kepala Daerah" },
  { kode: "000.1.3.2", nama: "Perjalanan Dinas Luar Negeri - DPRD" },
  { kode: "000.1.3.3", nama: "Perjalanan Dinas Luar Negeri - Pegawai" },
  { kode: "000.1.4", nama: "Penggunaan Fasilitas Kantor" },
  { kode: "000.1.5", nama: "Rapat Pimpinan" },
  { kode: "000.1.6", nama: "Penyediaan Konsumsi" },
  { kode: "000.1.7", nama: "Pengurusan Kendaraan Dinas" },
  { kode: "000.1.8", nama: "Pemeliharaan Gedung, Taman dan Peralatan Kantor" },
  { kode: "000.1.9", nama: "Pengelolaan Jaringan Listrik, Air, Telepon dan Komputer" },
  { kode: "000.1.10", nama: "Ketertiban dan Keamanan" },
  { kode: "000.1.11", nama: "Administrasi Pengelolaan Parkir" },
  { kode: "000.1.12", nama: "Administrasi Pakaian Dinas Pegawai" },
  { kode: "000.2", nama: "PERLENGKAPAN" },
  { kode: "000.3", nama: "PENGADAAN" },
  { kode: "000.4", nama: "PERPUSTAKAAN" },
  { kode: "000.5", nama: "KEARSIPAN" },
  { kode: "000.5.1", nama: "Kebijakan di Bidang Kearsipan" },
  { kode: "000.5.2", nama: "Pembinaan Kearsipan" },
  { kode: "000.5.3", nama: "Pengelolaan Arsip Dinamis" },
  { kode: "000.5.4", nama: "Program Arsip Vital" },
  { kode: "000.5.5", nama: "Pengelolaan Arsip Terjaga" },
  { kode: "000.5.6", nama: "Penyusutan Arsip" },
  { kode: "000.5.7", nama: "Alih Media Arsip" },
  { kode: "000.5.8", nama: "Database Pengelolaan Arsip Dinamis" },
  { kode: "000.5.9", nama: "Pengelolaan Arsip Statis" },
  { kode: "000.5.10", nama: "Jasa Kearsipan" },
  { kode: "000.5.11", nama: "Pengelolaan SIKN dan JIKN" },
  { kode: "000.5.12", nama: "Pelindungan dan Penyelamatan Arsip Akibat Bencana" },
  { kode: "000.5.13", nama: "Penyelamatan Arsip Perangkat Daerah" },
  { kode: "000.5.14", nama: "Penerbitan Izin Penggunaan Arsip Tertutup" },
  { kode: "000.5.15", nama: "Pengawasan Kearsipan" },
  { kode: "000.6", nama: "PERSANDIAN" },
  { kode: "000.7", nama: "PERENCANAAN PEMBANGUNAN" },
  { kode: "000.8", nama: "ORGANISASI DAN TATA LAKSANA" },
  { kode: "000.9", nama: "PENELITIAN, PENGKAJIAN, DAN PENGEMBANGAN" },
  // PEMERINTAHAN - 100
  { kode: "100.1", nama: "OTONOMI DAERAH" },
  { kode: "100.2", nama: "PEMERINTAHAN UMUM" },
  { kode: "100.3", nama: "HUKUM" },
  // POLITIK - 200
  { kode: "200.1", nama: "KESATUAN BANGSA DAN POLITIK" },
  { kode: "200.2", nama: "PEMILU" },
] as const;

// Jenis Naskah Dinas sesuai Perwako 31/2023
export const JENIS_NASKAH = [
  { value: "Surat Masuk", label: "Surat Masuk" },
  { value: "Surat Keluar", label: "Surat Keluar" },
  { value: "Keputusan", label: "Keputusan" },
  { value: "Peraturan", label: "Peraturan" },
  { value: "Nota Dinas", label: "Nota Dinas" },
  { value: "Memo", label: "Memo" },
  { value: "Disposisi", label: "Disposisi" },
  { value: "Surat Perintah", label: "Surat Perintah" },
  { value: "Surat Tugas", label: "Surat Tugas" },
  { value: "Surat Perjalanan Dinas", label: "Surat Perjalanan Dinas" },
  { value: "Surat Edaran", label: "Surat Edaran" },
  { value: "Surat Kuasa", label: "Surat Kuasa" },
  { value: "Berita Acara", label: "Berita Acara" },
  { value: "Surat Keterangan", label: "Surat Keterangan" },
  { value: "Surat Pengantar", label: "Surat Pengantar" },
  { value: "Pengumuman", label: "Pengumuman" },
  { value: "Laporan", label: "Laporan" },
  { value: "Telaahan Staf", label: "Telaahan Staf" },
  { value: "Notula", label: "Notula" },
  { value: "Surat Undangan", label: "Surat Undangan" },
  { value: "Surat Izin", label: "Surat Izin" },
  { value: "Rekomendasi", label: "Rekomendasi" },
  { value: "Sertifikat", label: "Sertifikat" },
  { value: "Piagam", label: "Piagam" },
  { value: "Surat Perjanjian", label: "Surat Perjanjian" },
  { value: "SOP", label: "Standar Operasional Prosedur" },
  { value: "Lainnya", label: "Lainnya" },
] as const;

// Klasifikasi Keamanan sesuai Perwako 31/2023
export const KLASIFIKASI_KEAMANAN = [
  { value: "B", label: "Biasa/Terbuka", color: "bg-green-100 text-green-800 border-green-200" },
  { value: "T", label: "Terbatas", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { value: "R", label: "Rahasia", color: "bg-orange-100 text-orange-800 border-orange-200" },
  { value: "SR", label: "Sangat Rahasia", color: "bg-red-100 text-red-800 border-red-200" },
] as const;

// Retensi Arsip sesuai Perwako 11/2025
export const KETERANGAN_RETENSI = [
  { value: "Musnah", label: "Musnah", color: "bg-slate-100 text-slate-800" },
  { value: "Permanen", label: "Permanen", color: "bg-blue-100 text-blue-800" },
] as const;

export const STATUS_ARSIP = [
  { value: "Aktif", label: "Aktif", color: "bg-emerald-100 text-emerald-800" },
  { value: "Inaktif", label: "Inaktif", color: "bg-amber-100 text-amber-800" },
] as const;
