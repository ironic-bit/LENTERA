import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Arsip } from "@/types/arsip";
import { KODE_KLASIFIKASI, JENIS_NASKAH, KLASIFIKASI_KEAMANAN, KETERANGAN_RETENSI, STATUS_ARSIP } from "@/types/arsip";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Cloud, Lock, Shield, FileText } from "lucide-react";
import { supabase } from "../supabaseClient";

interface FormRegistrasiProps {
  onSubmit: (arsip: Omit<Arsip, "id" | "tanggalRegistrasi">) => void;
}

export function FormRegistrasi({ onSubmit }: FormRegistrasiProps) {
  const { hasAccess, user } = useAuth();
  const canCreate = hasAccess("create");

  const [formData, setFormData] = useState({
    kodeKlasifikasi: "",
    nomorSurat: "",
    judul: "",
    jenisNaskah: "",
    klasifikasiKeamanan: "B" as "SR" | "R" | "T" | "B",
    tahun: new Date().getFullYear(),
    tanggalSurat: new Date().toISOString().split("T")[0],
    deskripsi: "",
    retensiAktif: 2,
    retensiInaktif: 1,
    keteranganRetensi: "Musnah" as "Musnah" | "Permanen",
    statusArsip: "Aktif" as "Aktif" | "Inaktif",
    linkCloud: "",
  });

  const handleSubmit = async (e: React.FormEvent) => { // <-- Perhatikan tambahan kata 'async' di sini
  e.preventDefault();
  if (!canCreate) return;

  // --- 1. MENGIRIM DATA KE SUPABASE ---
  const { error } = await supabase
    .from('arsip') // GANTI dengan nama tabel asli Bapak di Supabase (misal: 'arsip' atau 'tabel_arsip')
    .insert([
      {
        // Kiri: Nama kolom di Supabase | Kanan: Data dari form LENTERA
        kode_klasifikasi: formData.kodeKlasifikasi,
        nomor_surat: formData.nomorSurat,
        judul: formData.judul,
        jenis_naskah: formData.jenisNaskah,
        klasifikasi_keamanan: formData.klasifikasiKeamanan,
        tahun: formData.tahun,
        tanggal_surat: formData.tanggalSurat,
        deskripsi: formData.deskripsi,
        retensi_aktif: formData.retensiAktif,
        retensi_inaktif: formData.retensiInaktif,
        keterangan_retensi: formData.keteranganRetensi,
        status_arsip: formData.statusArsip,
        linkcloud: formData.linkcloud,
        registered_by: user?.nama || "Unknown"
      }
    ]);

  if (error) {
    console.error("Gagal menyimpan ke database:", error.message);
    alert("Waduh, gagal registrasi ke database LENTERA. Cek log error.");
    return; // Berhenti di sini jika gagal, agar form tidak langsung terhapus
  }

  // --- 2. MEMPERBARUI TAMPILAN (Kode bawaan Bapak) ---
  onSubmit({
    ...formData,
    registeredBy: user?.nama || "Unknown",
  });

  // --- 3. MERESET FORMULIR (Kode bawaan Bapak) ---
  setFormData({
    kodeKlasifikasi: "",
    nomorSurat: "",
    judul: "",
    jenisNaskah: "",
    klasifikasiKeamanan: "B",
    tahun: new Date().getFullYear(),
    tanggalSurat: new Date().toISOString().split("T")[0],
    deskripsi: "",
    retensiAktif: 2,
    retensiInaktif: 1,
    keteranganRetensi: "Musnah",
    statusArsip: "Aktif",
    linkcloud: "",
  });

  alert("Mantap! Arsip berhasil diregistrasi ke sistem LENTERA.");
};

  // Jika tidak punya akses create, tampilkan pesan
  if (!canCreate) {
    return (
      <Card className="border-amber-200 shadow-md">
        <CardHeader className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="w-5 h-5" />
            Akses Dibatasi
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Anda Tidak Memiliki Akses
            </h3>
            <p className="text-slate-600 text-sm">
              Role Anda (<span className="font-medium capitalize">viewer</span>) hanya dapat melihat data arsip. 
              Hubungi administrator untuk mendapatkan akses lebih.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getKeamananLabel = (value: string) => {
    return KLASIFIKASI_KEAMANAN.find((k) => k.value === value)?.label || value;
  };

  return (
    <Card className="border-blue-100 shadow-md">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="w-5 h-5" />
          Registrasi Arsip Digital
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Kode Klasifikasi */}
          <div className="space-y-2">
            <Label htmlFor="kodeKlasifikasi" className="text-slate-700 font-medium">
              Kode Klasifikasi <span className="text-red-500">*</span>
              <span className="text-xs text-slate-500 font-normal ml-2">(Perwako 49/2022)</span>
            </Label>
            <Select
              value={formData.kodeKlasifikasi}
              onValueChange={(value) => setFormData({ ...formData, kodeKlasifikasi: value })}
            >
              <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Pilih kode klasifikasi" />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {KODE_KLASIFIKASI.map((kode) => (
                  <SelectItem key={kode.kode} value={kode.kode}>
                    <span className="font-mono text-blue-600">{kode.kode}</span> - {kode.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nomor Surat */}
          <div className="space-y-2">
            <Label htmlFor="nomorSurat" className="text-slate-700 font-medium">
              Nomor Surat/Naskah <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nomorSurat"
              placeholder="Contoh: 090/123/SETDA/2024"
              value={formData.nomorSurat}
              onChange={(e) => setFormData({ ...formData, nomorSurat: e.target.value })}
              required
              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Judul */}
          <div className="space-y-2">
            <Label htmlFor="judul" className="text-slate-700 font-medium">
              Judul/Perihal Arsip <span className="text-red-500">*</span>
            </Label>
            <Input
              id="judul"
              placeholder="Masukkan judul atau perihal arsip"
              value={formData.judul}
              onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
              required
              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Jenis Naskah */}
          <div className="space-y-2">
            <Label htmlFor="jenisNaskah" className="text-slate-700 font-medium">
              Jenis Naskah <span className="text-red-500">*</span>
              <span className="text-xs text-slate-500 font-normal ml-2">(Perwako 31/2023)</span>
            </Label>
            <Select
              value={formData.jenisNaskah}
              onValueChange={(value) => setFormData({ ...formData, jenisNaskah: value })}
            >
              <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Pilih jenis naskah" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {JENIS_NASKAH.map((jenis) => (
                  <SelectItem key={jenis.value} value={jenis.value}>
                    {jenis.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Klasifikasi Keamanan */}
          <div className="space-y-2">
            <Label htmlFor="klasifikasiKeamanan" className="text-slate-700 font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Klasifikasi Keamanan <span className="text-red-500">*</span>
              <span className="text-xs text-slate-500 font-normal ml-2">(Perwako 31/2023)</span>
            </Label>
            <Select
              value={formData.klasifikasiKeamanan}
              onValueChange={(value) => setFormData({ ...formData, klasifikasiKeamanan: value as "SR" | "R" | "T" | "B" })}
            >
              <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Pilih klasifikasi keamanan" />
              </SelectTrigger>
              <SelectContent>
                {KLASIFIKASI_KEAMANAN.map((k) => (
                  <SelectItem key={k.value} value={k.value}>
                    <span className="font-mono font-bold">{k.value}</span> - {k.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              Terpilih: <span className="font-medium">{getKeamananLabel(formData.klasifikasiKeamanan)}</span>
            </p>
          </div>

          {/* Tahun & Tanggal Surat */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tahun" className="text-slate-700 font-medium">
                Tahun <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tahun"
                type="number"
                value={formData.tahun}
                onChange={(e) => setFormData({ ...formData, tahun: parseInt(e.target.value) })}
                required
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tanggalSurat" className="text-slate-700 font-medium">
                Tanggal Surat <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tanggalSurat"
                type="date"
                value={formData.tanggalSurat}
                onChange={(e) => setFormData({ ...formData, tanggalSurat: e.target.value })}
                required
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Deskripsi */}
          <div className="space-y-2">
            <Label htmlFor="deskripsi" className="text-slate-700 font-medium">
              Deskripsi
            </Label>
            <Textarea
              id="deskripsi"
              placeholder="Deskripsi singkat tentang arsip"
              value={formData.deskripsi}
              onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
              rows={2}
              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Retensi Arsip */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Retensi Arsip <span className="text-xs font-normal text-slate-500">(Perwako 11/2025)</span>
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="retensiAktif" className="text-xs text-slate-600">
                  Jangka Waktu Aktif (Tahun)
                </Label>
                <Input
                  id="retensiAktif"
                  type="number"
                  min={0}
                  value={formData.retensiAktif}
                  onChange={(e) => setFormData({ ...formData, retensiAktif: parseInt(e.target.value) })}
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retensiInaktif" className="text-xs text-slate-600">
                  Jangka Waktu Inaktif (Tahun)
                </Label>
                <Input
                  id="retensiInaktif"
                  type="number"
                  min={0}
                  value={formData.retensiInaktif}
                  onChange={(e) => setFormData({ ...formData, retensiInaktif: parseInt(e.target.value) })}
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div className="space-y-2">
                <Label htmlFor="keteranganRetensi" className="text-xs text-slate-600">
                  Keterangan Retensi
                </Label>
                <Select
                  value={formData.keteranganRetensi}
                  onValueChange={(value) => setFormData({ ...formData, keteranganRetensi: value as "Musnah" | "Permanen" })}
                >
                  <SelectTrigger className="border-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KETERANGAN_RETENSI.map((k) => (
                      <SelectItem key={k.value} value={k.value}>
                        {k.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="statusArsip" className="text-xs text-slate-600">
                  Status Arsip
                </Label>
                <Select
                  value={formData.statusArsip}
                  onValueChange={(value) => setFormData({ ...formData, statusArsip: value as "Aktif" | "Inaktif" })}
                >
                  <SelectTrigger className="border-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_ARSIP.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Link Cloud */}
          <div className="space-y-2">
            <Label htmlFor="linkCloud" className="text-slate-700 font-medium">
              <span className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-blue-500" />
                Link Cloud Storage <span className="text-red-500">*</span>
              </span>
            </Label>
            <Input
              id="linkCloud"
              type="url"
              placeholder="https://drive.google.com/... atau https://onedrive.live.com/..."
              value={formData.linkCloud}
              onChange={(e) => setFormData({ ...formData, linkCloud: e.target.value })}
              required
              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500">
              Masukkan link Google Drive, OneDrive, Dropbox, atau cloud storage lainnya
            </p>
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            Simpan Registrasi Arsip
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
