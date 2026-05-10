import { useState, useEffect, useCallback } from "react";
import type { Arsip } from "@/types/arsip";
import { supabase } from "@/supabaseClient";

/**
 * Hook untuk mengelola data arsip dari Supabase (tabel_arsip).
 * Semua operasi CRUD langsung ke database - tidak lagi pakai localStorage.
 */

// Helper: mapping dari row database ke interface Arsip
function mapRowToArsip(row: Record<string, unknown>): Arsip {
  return {
    id: row.id as string,
    kodeKlasifikasi: (row.kode_klasifikasi as string) || "",
    nomorSurat: (row.nomor_surat as string) || "",
    judul: (row.judul as string) || "",
    jenisNaskah: (row.jenis_naskah as string) || "",
    klasifikasiKeamanan: (row.klasifikasi_keamanan as Arsip["klasifikasiKeamanan"]) || "B",
    tahun: (row.tahun as number) || new Date().getFullYear(),
    tanggalSurat: (row.tanggal_surat as string) || "",
    deskripsi: (row.deskripsi as string) || "",
    retensiAktif: (row.retensi_aktif as number) || 0,
    retensiInaktif: (row.retensi_inaktif as number) || 0,
    keteranganRetensi: (row.keterangan_retensi as Arsip["keteranganRetensi"]) || "Musnah",
    statusArsip: (row.status_arsip as Arsip["statusArsip"]) || "Aktif",
    linkCloud: (row.link_cloud as string) || "",
    tanggalRegistrasi: (row.tanggal_registrasi as string) || (row.created_at as string) || "",
    registeredBy: (row.registered_by as string) || "",
  };
}

// Helper: mapping dari interface Arsip ke kolom database
function mapArsipToRow(arsip: Omit<Arsip, "id" | "tanggalRegistrasi">) {
  return {
    kode_klasifikasi: arsip.kodeKlasifikasi,
    nomor_surat: arsip.nomorSurat,
    judul: arsip.judul,
    jenis_naskah: arsip.jenisNaskah,
    klasifikasi_keamanan: arsip.klasifikasiKeamanan,
    tahun: arsip.tahun,
    tanggal_surat: arsip.tanggalSurat,
    deskripsi: arsip.deskripsi,
    retensi_aktif: arsip.retensiAktif,
    retensi_inaktif: arsip.retensiInaktif,
    keterangan_retensi: arsip.keteranganRetensi,
    status_arsip: arsip.statusArsip,
    link_cloud: arsip.linkCloud,
    registered_by: arsip.registeredBy,
  };
}

export function useArsip() {
  const [arsipList, setArsipList] = useState<Arsip[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch semua arsip dari Supabase saat mount
  const fetchArsip = useCallback(async () => {
    setError(null);
    const { data, error: fetchError } = await supabase
      .from("tabel_arsip")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Gagal mengambil data arsip:", fetchError.message);
      setError(fetchError.message);
      setArsipList([]);
    } else {
      const mapped = (data || []).map(mapRowToArsip);
      setArsipList(mapped);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    fetchArsip();
  }, [fetchArsip]);

  // Tambah arsip baru ke Supabase
  const addArsip = useCallback(
    async (arsipData: Omit<Arsip, "id" | "tanggalRegistrasi">): Promise<Arsip | null> => {
      const row = mapArsipToRow(arsipData);

      const { data, error: insertError } = await supabase
        .from("tabel_arsip")
        .insert([row])
        .select()
        .single();

      if (insertError) {
        console.error("Gagal menyimpan arsip:", insertError.message);
        setError(insertError.message);
        return null;
      }

      const newArsip = mapRowToArsip(data);
      setArsipList((prev) => [newArsip, ...prev]);
      setError(null);
      return newArsip;
    },
    []
  );

  // Hapus arsip dari Supabase
  const deleteArsip = useCallback(async (id: string): Promise<boolean> => {
    const { error: deleteError } = await supabase
      .from("tabel_arsip")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Gagal menghapus arsip:", deleteError.message);
      setError(deleteError.message);
      return false;
    }

    setArsipList((prev) => prev.filter((arsip) => arsip.id !== id));
    setError(null);
    return true;
  }, []);

  // Update arsip di Supabase
  const updateArsip = useCallback(
    async (id: string, updates: Partial<Omit<Arsip, "id" | "tanggalRegistrasi">>): Promise<boolean> => {
      // Map field names camelCase -> snake_case hanya untuk field yang ada
      const dbUpdates: Record<string, unknown> = {};
      if (updates.kodeKlasifikasi !== undefined) dbUpdates.kode_klasifikasi = updates.kodeKlasifikasi;
      if (updates.nomorSurat !== undefined) dbUpdates.nomor_surat = updates.nomorSurat;
      if (updates.judul !== undefined) dbUpdates.judul = updates.judul;
      if (updates.jenisNaskah !== undefined) dbUpdates.jenis_naskah = updates.jenisNaskah;
      if (updates.klasifikasiKeamanan !== undefined) dbUpdates.klasifikasi_keamanan = updates.klasifikasiKeamanan;
      if (updates.tahun !== undefined) dbUpdates.tahun = updates.tahun;
      if (updates.tanggalSurat !== undefined) dbUpdates.tanggal_surat = updates.tanggalSurat;
      if (updates.deskripsi !== undefined) dbUpdates.deskripsi = updates.deskripsi;
      if (updates.retensiAktif !== undefined) dbUpdates.retensi_aktif = updates.retensiAktif;
      if (updates.retensiInaktif !== undefined) dbUpdates.retensi_inaktif = updates.retensiInaktif;
      if (updates.keteranganRetensi !== undefined) dbUpdates.keterangan_retensi = updates.keteranganRetensi;
      if (updates.statusArsip !== undefined) dbUpdates.status_arsip = updates.statusArsip;
      if (updates.linkCloud !== undefined) dbUpdates.link_cloud = updates.linkCloud;
      if (updates.registeredBy !== undefined) dbUpdates.registered_by = updates.registeredBy;

      const { error: updateError } = await supabase
        .from("tabel_arsip")
        .update(dbUpdates)
        .eq("id", id);

      if (updateError) {
        console.error("Gagal mengupdate arsip:", updateError.message);
        setError(updateError.message);
        return false;
      }

      setArsipList((prev) =>
        prev.map((arsip) =>
          arsip.id === id ? { ...arsip, ...updates } : arsip
        )
      );
      setError(null);
      return true;
    },
    []
  );

  // Refresh data dari database
  const refreshArsip = useCallback(() => {
    setIsLoaded(false);
    return fetchArsip();
  }, [fetchArsip]);

  return {
    arsipList,
    isLoaded,
    error,
    addArsip,
    deleteArsip,
    updateArsip,
    refreshArsip,
  };
}
