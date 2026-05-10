import { useState, useRef } from "react";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Arsip } from "@/types/arsip";
import { KODE_KLASIFIKASI, JENIS_NASKAH, KLASIFIKASI_KEAMANAN, KETERANGAN_RETENSI, STATUS_ARSIP } from "@/types/arsip";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/supabaseClient";
import { Plus, Cloud, Lock, Shield, FileText, Check, ChevronsUpDown, Upload, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormRegistrasiProps {
  onSubmit: (arsip: Omit<Arsip, "id" | "tanggalRegistrasi">) => Promise<boolean>;
}

export function FormRegistrasi({ onSubmit }: FormRegistrasiProps) {
  const { hasAccess, user } = useAuth();
  const canCreate = hasAccess("create");
  const [openKlasifikasi, setOpenKlasifikasi] = useState(false);

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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle AI extraction from uploaded image
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      alert("Format file tidak didukung. Gunakan JPG, PNG, WebP, atau PDF.");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("Ukuran file terlalu besar. Maksimal 10MB.");
      return;
    }

    setIsExtracting(true);
    try {
      // Get auth token
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        alert("Sesi login tidak valid. Silakan login ulang.");
        return;
      }

      // Send file to Edge Function
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const { data, error } = await supabase.functions.invoke("extract-arsip", {
        headers: { Authorization: `Bearer ${token}` },
        body: formDataUpload,
      });

      if (error || !data?.success) {
        console.error("Extraction failed:", error?.message || data?.error);
        alert("Gagal mengekstrak data dari file. Coba lagi atau isi manual.");
        return;
      }

      const extracted = data.data;

      // Auto-fill form fields with extracted data
      setFormData((prev) => ({
        ...prev,
        nomorSurat: extracted.nomorSurat || prev.nomorSurat,
        judul: extracted.judul || prev.judul,
        jenisNaskah: extracted.jenisNaskah || prev.jenisNaskah,
        tanggalSurat: extracted.tanggalSurat || prev.tanggalSurat,
        tahun: extracted.tahun || prev.tahun,
        deskripsi: extracted.deskripsi || prev.deskripsi,
        klasifikasiKeamanan: (["B", "T", "R", "SR"].includes(extracted.klasifikasiKeamanan) 
          ? extracted.klasifikasiKeamanan 
          : prev.klasifikasiKeamanan) as "SR" | "R" | "T" | "B",
      }));

      alert("Data berhasil diekstrak dari dokumen! Periksa dan lengkapi field yang kosong.");
    } catch (err) {
      console.error("Upload error:", err);
      alert("Terjadi kesalahan saat memproses file.");
    } finally {
      setIsExtracting(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate || isSubmitting) return;

    // Validasi manual untuk field yang pakai custom component (bukan native HTML)
    if (!formData.kodeKlasifikasi) {
      alert("Kode Klasifikasi wajib dipilih.");
      return;
    }
    if (!formData.jenisNaskah) {
      alert("Jenis Naskah wajib dipilih.");
      return;
    }
    if (!formData.nomorSurat || !formData.judul || !formData.linkCloud) {
      alert("Mohon lengkapi semua field yang bertanda *.");
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onSubmit({
        ...formData,
        registeredBy: user?.nama || "Unknown",
      });

      if (success) {
        // Reset formulir setelah berhasil
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
          linkCloud: "",
        });
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert("Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSubmitting(false);
    }
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
          {/* AI Auto-Fill Section */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <h4 className="text-sm font-semibold text-purple-800">AI Auto-Fill</h4>
            </div>
            <p className="text-xs text-purple-600 mb-3">
              Upload foto/scan surat untuk mengisi form otomatis menggunakan AI
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
              onChange={handleFileUpload}
              className="hidden"
              id="ai-file-upload"
            />
            <Button
              type="button"
              variant="outline"
              disabled={isExtracting}
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-purple-300 text-purple-700 hover:bg-purple-100 hover:text-purple-800"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Mengekstrak data dengan AI...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Foto Surat
                </>
              )}
            </Button>
          </div>

          {/* Kode Klasifikasi */}
          <div className="space-y-2 flex flex-col">
            <Label htmlFor="kodeKlasifikasi" className="text-slate-700 font-medium">
              Kode Klasifikasi <span className="text-red-500">*</span>
              <span className="text-xs text-slate-500 font-normal ml-2">(Perwako 49/2022)</span>
            </Label>
            <Popover open={openKlasifikasi} onOpenChange={setOpenKlasifikasi}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openKlasifikasi}
                  className="justify-between border-slate-300 focus:border-blue-500 focus:ring-blue-500 font-normal"
                >
                  {formData.kodeKlasifikasi
                    ? (
                      <span className="truncate">
                        <span className="font-mono text-blue-600 mr-2">{formData.kodeKlasifikasi}</span>
                        {KODE_KLASIFIKASI.find((k) => k.kode === formData.kodeKlasifikasi)?.nama}
                      </span>
                    )
                    : "Cari atau pilih kode klasifikasi..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Cari kode atau nama klasifikasi..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>Kode klasifikasi tidak ditemukan.</CommandEmpty>
                    <CommandGroup>
                      {KODE_KLASIFIKASI.map((kode) => (
                        <CommandItem
                          key={kode.kode}
                          value={`${kode.kode} ${kode.nama}`}
                          onSelect={() => {
                            setFormData({ ...formData, kodeKlasifikasi: kode.kode });
                            setOpenKlasifikasi(false);
                          }}
                        >
                          <span className="font-mono text-blue-600 w-24 shrink-0">{kode.kode}</span>
                          <span className="truncate">{kode.nama}</span>
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              formData.kodeKlasifikasi === kode.kode ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500">
              Masukkan link Google Drive, OneDrive, Dropbox, atau cloud storage lainnya
            </p>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            {isSubmitting ? "Menyimpan..." : "Simpan Registrasi Arsip"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
