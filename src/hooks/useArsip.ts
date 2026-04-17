import { useState, useEffect, useCallback } from "react";
import type { Arsip } from "@/types/arsip";

const STORAGE_KEY = "arsip-digital-data-v2";

// Sample data for demo sesuai Perwako
const sampleData: Arsip[] = [
  {
    id: "1",
    kodeKlasifikasi: "000.5.3",
    nomorSurat: "090/001/SETDA/2024",
    judul: "Laporan Pengelolaan Arsip Dinamis Triwulan I",
    jenisNaskah: "Laporan",
    klasifikasiKeamanan: "B",
    tahun: 2024,
    tanggalSurat: "2024-03-15",
    deskripsi: "Laporan pelaksanaan pengelolaan arsip dinamis triwulan pertama",
    retensiAktif: 2,
    retensiInaktif: 3,
    keteranganRetensi: "Musnah",
    statusArsip: "Aktif",
    linkCloud: "https://drive.google.com/example1",
    tanggalRegistrasi: new Date().toISOString(),
    registeredBy: "Administrator",
  },
  {
    id: "2",
    kodeKlasifikasi: "000.5.11",
    nomorSurat: "090/002/SETDA/2024",
    judul: "Kebijakan Pengelolaan SIKN dan JIKN",
    jenisNaskah: "Keputusan",
    klasifikasiKeamanan: "T",
    tahun: 2024,
    tanggalSurat: "2024-02-20",
    deskripsi: "Kebijakan internal pengelolaan Sistem Informasi Kearsipan Nasional",
    retensiAktif: 2,
    retensiInaktif: 3,
    keteranganRetensi: "Permanen",
    statusArsip: "Aktif",
    linkCloud: "https://drive.google.com/example2",
    tanggalRegistrasi: new Date(Date.now() - 86400000).toISOString(),
    registeredBy: "Administrator",
  },
  {
    id: "3",
    kodeKlasifikasi: "000.5.6.2",
    nomorSurat: "090/003/SETDA/2023",
    judul: "Berita Acara Pemusnahan Arsip Inaktif",
    jenisNaskah: "Berita Acara",
    klasifikasiKeamanan: "R",
    tahun: 2023,
    tanggalSurat: "2023-12-10",
    deskripsi: "Berita acara pemusnahan arsip inaktif tahun 2020-2021",
    retensiAktif: 2,
    retensiInaktif: 1,
    keteranganRetensi: "Permanen",
    statusArsip: "Inaktif",
    linkCloud: "https://onedrive.live.com/example3",
    tanggalRegistrasi: new Date(Date.now() - 172800000).toISOString(),
    registeredBy: "Pegawai Umum",
  },
  {
    id: "4",
    kodeKlasifikasi: "000.5.2.11",
    nomorSurat: "090/004/SETDA/2024",
    judul: "Jadwal Retensi Arsip Dinas",
    jenisNaskah: "Peraturan",
    klasifikasiKeamanan: "B",
    tahun: 2024,
    tanggalSurat: "2024-01-05",
    deskripsi: "Penetapan jadwal retensi arsip sesuai Perwako 11/2025",
    retensiAktif: 2,
    retensiInaktif: 3,
    keteranganRetensi: "Permanen",
    statusArsip: "Aktif",
    linkCloud: "https://drive.google.com/example4",
    tanggalRegistrasi: new Date(Date.now() - 259200000).toISOString(),
    registeredBy: "Administrator",
  },
  {
    id: "5",
    kodeKlasifikasi: "000.5.4",
    nomorSurat: "090/005/SETDA/2023",
    judul: "Program Arsip Vital Daerah",
    jenisNaskah: "Program",
    klasifikasiKeamanan: "SR",
    tahun: 2023,
    tanggalSurat: "2023-06-15",
    deskripsi: "Program perlindungan dan pengamanan arsip vital daerah",
    retensiAktif: 2,
    retensiInaktif: 3,
    keteranganRetensi: "Permanen",
    statusArsip: "Aktif",
    linkCloud: "https://drive.google.com/example5",
    tanggalRegistrasi: new Date(Date.now() - 345600000).toISOString(),
    registeredBy: "Administrator",
  },
];

export function useArsip() {
  const [arsipList, setArsipList] = useState<Arsip[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setArsipList(parsed);
      } catch {
        setArsipList(sampleData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleData));
      }
    } else {
      // Initialize with sample data
      setArsipList(sampleData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleData));
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arsipList));
    }
  }, [arsipList, isLoaded]);

  const addArsip = useCallback(
    (arsipData: Omit<Arsip, "id" | "tanggalRegistrasi">) => {
      const newArsip: Arsip = {
        ...arsipData,
        id: crypto.randomUUID(),
        tanggalRegistrasi: new Date().toISOString(),
      };
      setArsipList((prev) => [newArsip, ...prev]);
      return newArsip;
    },
    []
  );

  const deleteArsip = useCallback((id: string) => {
    setArsipList((prev) => prev.filter((arsip) => arsip.id !== id));
  }, []);

  const updateArsip = useCallback(
    (id: string, updates: Partial<Arsip>) => {
      setArsipList((prev) =>
        prev.map((arsip) =>
          arsip.id === id ? { ...arsip, ...updates } : arsip
        )
      );
    },
    []
  );

  return {
    arsipList,
    isLoaded,
    addArsip,
    deleteArsip,
    updateArsip,
  };
}
