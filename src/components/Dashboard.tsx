import { useState, useMemo, useRef } from "react";
import {
  Archive,
  UploadCloud,
  Search,
  Bell,
  Bot,
  FolderOpen,
  FileText,
  ShieldCheck,
  Clock3,
  LayoutDashboard,
  Settings,
  Users,
  BarChart3,
  CheckCircle2,
  Sparkles,
  Menu,
  X,
  Loader2,
  LogOut,
} from "lucide-react";
import { motion } from "framer-motion";
import { useArsip } from "@/hooks/useArsip";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/supabaseClient";
import type { Arsip } from "@/types/arsip";
import { FormRegistrasi } from "@/components/FormRegistrasi";
import { DaftarArsip } from "@/components/DaftarArsip";
import { ManajemenUser } from "@/components/ManajemenUser";
import { toast } from "sonner";

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// ─── Types ────────────────────────────────────────────────────────────────────
type DashboardView = "dashboard" | "registrasi" | "arsip" | "drive" | "analitik" | "pengguna" | "pengaturan";

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({
  open,
  onClose,
  activeView,
  onViewChange,
  userRole,
}: {
  open: boolean;
  onClose: () => void;
  activeView: DashboardView;
  onViewChange: (view: DashboardView) => void;
  userRole: string | null;
}) {
  const { logout } = useAuth();

  const navigation: { label: string; icon: typeof LayoutDashboard; view: DashboardView; adminOnly?: boolean }[] = [
    { label: "Dashboard", icon: LayoutDashboard, view: "dashboard" },
    { label: "Registrasi Arsip", icon: UploadCloud, view: "registrasi" },
    { label: "Daftar Arsip", icon: Archive, view: "arsip" },
    { label: "Google Drive", icon: FolderOpen, view: "drive" },
    { label: "Analitik", icon: BarChart3, view: "analitik" },
    { label: "Pengguna", icon: Users, view: "pengguna", adminOnly: true },
    { label: "Pengaturan", icon: Settings, view: "pengaturan" },
  ];

  return (
    <>
      <div
        className={classNames(
          "fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm lg:hidden",
          open ? "block" : "hidden"
        )}
        onClick={onClose}
      />

      <aside
        className={classNames(
          "fixed left-0 top-0 z-40 h-full w-72 border-r border-white/70 bg-white/80 p-5 shadow-2xl shadow-slate-200/60 backdrop-blur-2xl transition-transform duration-300 lg:static lg:translate-x-0 lg:shadow-none",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/25">
              <Archive size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-950">LENTERA</h1>
              <p className="text-xs text-slate-500">AI Archive Workspace</p>
            </div>
          </div>
          <button className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 lg:hidden" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <nav className="mt-8 space-y-2">
          {navigation
            .filter((item) => !item.adminOnly || userRole === "admin")
            .map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    onViewChange(item.view);
                    onClose();
                  }}
                  className={classNames(
                    "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                    activeView === item.view
                      ? "bg-slate-950 text-white shadow-lg shadow-slate-300/70"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  )}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
        </nav>

        <div className="mt-8 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
            <Sparkles size={20} />
          </div>
          <h3 className="text-sm font-semibold text-slate-950">AI Assistant aktif</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Gemini mengekstrak metadata, klasifikasi kode, dan organize Google Drive.
          </p>
        </div>

        <button
          onClick={logout}
          className="mt-4 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition"
        >
          <LogOut size={18} />
          Keluar
        </button>
      </aside>
    </>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ item, index }: { item: { label: string; value: string; change: string; icon: typeof Archive }; index: number }) {
  const Icon = item.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="rounded-[28px] border border-white/70 bg-white/75 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{item.label}</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{item.value}</h2>
          <p className="mt-2 text-xs font-medium text-emerald-600">{item.change}</p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
          <Icon size={21} />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Upload Panel ─────────────────────────────────────────────────────────────
function UploadPanel({ onUploadSuccess }: { onUploadSuccess: () => void }) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Format tidak didukung", { description: "Gunakan JPG, PNG, WebP, atau PDF." });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error("File terlalu besar", { description: "Maksimal 20MB." });
      return;
    }

    setIsExtracting(true);
    setResult(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        toast.error("Sesi tidak valid. Login ulang.");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("opd", "Dinas-PUPR");

      const { data, error } = await supabase.functions.invoke("process-arsip", {
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (error || !data?.success) {
        toast.error("Gagal memproses", { description: error?.message || data?.error });
        return;
      }

      setResult(data.data);
      toast.success("Dokumen berhasil diproses AI!", {
        description: `${data.data.judul || "Dokumen"} → ${data.data.kodeKlasifikasi || "?"}`,
      });
      onUploadSuccess();
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan saat memproses file.");
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-200/70 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Registrasi Arsip via AI</h2>
          <p className="mt-1 text-sm text-slate-500">Upload file, AI membaca metadata, lalu organize ke Google Drive.</p>
        </div>
        <div className="hidden rounded-2xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 sm:block">
          Gemini + Drive
        </div>
      </div>

      <div className="mt-5 rounded-[28px] border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50/80 to-white p-6 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-white text-blue-600 shadow-lg shadow-blue-100">
          <UploadCloud size={26} />
        </div>
        <h3 className="mt-4 text-base font-semibold text-slate-950">
          {isExtracting ? "AI sedang memproses..." : "Upload arsip untuk diproses AI"}
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Mendukung PDF, scan, gambar dokumen. AI otomatis extract metadata + upload ke Google Drive.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
          onChange={handleUpload}
          className="hidden"
        />
        <button
          disabled={isExtracting}
          onClick={() => fileInputRef.current?.click()}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-300 transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50"
        >
          {isExtracting ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
          {isExtracting ? "Memproses..." : "Pilih File Arsip"}
        </button>
      </div>

      {/* Result Preview */}
      {result && (
        <div className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="text-emerald-600" size={18} />
            <h4 className="text-sm font-semibold text-emerald-800">Hasil Ekstraksi AI</h4>
          </div>
          <div className="grid gap-2 text-sm">
            {result.nomorSurat && <p><span className="text-slate-500">Nomor:</span> <span className="font-medium">{String(result.nomorSurat)}</span></p>}
            {result.judul && <p><span className="text-slate-500">Judul:</span> <span className="font-medium">{String(result.judul)}</span></p>}
            {result.kodeKlasifikasi && <p><span className="text-slate-500">Kode:</span> <span className="font-mono font-bold text-blue-700">{String(result.kodeKlasifikasi)}</span></p>}
            {result.jenisNaskah && <p><span className="text-slate-500">Jenis:</span> <span className="font-medium">{String(result.jenisNaskah)}</span></p>}
            {result.linkCloud && <p><span className="text-slate-500">Drive:</span> <a href={String(result.linkCloud)} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Buka file</a></p>}
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-4">
          <FileText className="text-blue-600" size={20} />
          <p className="mt-2 text-sm font-semibold text-slate-900">Ekstraksi Metadata</p>
          <p className="mt-1 text-xs text-slate-500">Judul, tanggal, unit, kode klasifikasi.</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <Bot className="text-indigo-600" size={20} />
          <p className="mt-2 text-sm font-semibold text-slate-900">AI Classification</p>
          <p className="mt-1 text-xs text-slate-500">Kode Perwako 49/2022 otomatis.</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <FolderOpen className="text-emerald-600" size={20} />
          <p className="mt-2 text-sm font-semibold text-slate-900">Organize Drive</p>
          <p className="mt-1 text-xs text-slate-500">Folder otomatis per tahun/kode.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Recent Archive Table ─────────────────────────────────────────────────────
function RecentArchiveTable({ arsipList, onViewAll }: { arsipList: Arsip[]; onViewAll: () => void }) {
  const recent = arsipList.slice(0, 5);

  return (
    <div className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-200/70 backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Arsip Terbaru</h2>
          <p className="text-sm text-slate-500">Dokumen yang baru diproses LENTERA.</p>
        </div>
        <button onClick={onViewAll} className="text-sm font-semibold text-blue-700">Lihat semua</button>
      </div>

      <div className="space-y-3">
        {recent.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-8">Belum ada arsip.</p>
        ) : (
          recent.map((archive) => (
            <div key={archive.id} className="rounded-3xl border border-slate-100 bg-white p-4 transition hover:border-blue-100 hover:shadow-lg hover:shadow-slate-100">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-950 line-clamp-1">{archive.judul}</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {archive.jenisNaskah} • Kode {archive.kodeKlasifikasi} • {archive.tanggalSurat}
                    </p>
                  </div>
                </div>
                <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {archive.statusArsip}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Right Panel ──────────────────────────────────────────────────────────────
function RightPanel({ arsipList }: { arsipList: Arsip[] }) {
  const totalArsip = arsipList.length;
  const arsipBulanIni = arsipList.filter((a) => {
    const d = new Date(a.tanggalRegistrasi || "");
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const driveTree = ["LENTERA", "2026", "Dinas-PUPR", "Arsip-Aktif", "{Kategori}", "{Kode}"];

  return (
    <div className="space-y-5">
      {/* AI Insight */}
      <div className="rounded-[32px] border border-white/70 bg-slate-950 p-5 text-white shadow-xl shadow-slate-300/70">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10">
            <Bot size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold">AI Insight</h2>
            <p className="text-sm text-slate-300">Gemini + Google Drive</p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          <div className="flex gap-3 rounded-2xl bg-white/10 p-3">
            <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-300" size={17} />
            <p className="text-sm leading-5 text-slate-100">Total {totalArsip} arsip terkelola dalam sistem</p>
          </div>
          <div className="flex gap-3 rounded-2xl bg-white/10 p-3">
            <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-300" size={17} />
            <p className="text-sm leading-5 text-slate-100">{arsipBulanIni} arsip baru bulan ini</p>
          </div>
          <div className="flex gap-3 rounded-2xl bg-white/10 p-3">
            <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-300" size={17} />
            <p className="text-sm leading-5 text-slate-100">AI extract + classify + upload otomatis</p>
          </div>
        </div>
      </div>

      {/* Google Drive Preview */}
      <div className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-200/70 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
            <FolderOpen size={21} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-950">Google Drive</h2>
            <p className="text-sm text-slate-500">Struktur folder otomatis</p>
          </div>
        </div>
        <div className="mt-5 rounded-3xl bg-slate-50 p-4 font-mono text-sm text-slate-700">
          {driveTree.map((item, index) => (
            <div key={item} className="py-1" style={{ paddingLeft: `${index * 14}px` }}>
              {index > 0 && "└── "}{item}/
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-200/70 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-700">
            <ShieldCheck size={21} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-950">Keamanan</h2>
            <p className="text-sm text-slate-500">Perwako 31/2023</p>
          </div>
        </div>
        <div className="mt-5 space-y-2 text-sm text-slate-600">
          <p>• Klasifikasi B/T/R/SR otomatis</p>
          <p>• Audit trail setiap aksi</p>
          <p>• Role-based access control</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard Component ─────────────────────────────────────────────────
export function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<DashboardView>("dashboard");
  const { arsipList, isLoaded, addArsip, deleteArsip } = useArsip();
  const { user, userRole } = useAuth();

  const handleAddArsip = async (arsipData: Parameters<typeof addArsip>[0]): Promise<boolean> => {
    const result = await addArsip(arsipData);
    if (result) {
      toast.success("Arsip berhasil diregistrasi!", {
        description: `${arsipData.nomorSurat} - ${arsipData.judul}`,
      });
      return true;
    } else {
      toast.error("Gagal menyimpan arsip");
      return false;
    }
  };

  const handleDeleteArsip = async (id: string) => {
    const arsip = arsipList.find((a) => a.id === id);
    if (arsip) {
      const success = await deleteArsip(id);
      if (success) {
        toast.info("Arsip telah dihapus");
      } else {
        toast.error("Gagal menghapus arsip");
      }
    }
  };

  // Stats computed from real data
  const stats = useMemo(() => {
    const total = arsipList.length;
    const aktif = arsipList.filter((a) => a.statusArsip === "Aktif").length;
    const bulanIni = arsipList.filter((a) => {
      const d = new Date(a.tanggalRegistrasi || "");
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    return [
      { label: "Total Arsip", value: total.toLocaleString(), change: `+${bulanIni} bulan ini`, icon: Archive },
      { label: "Arsip Aktif", value: aktif.toLocaleString(), change: "Terkelola otomatis", icon: FolderOpen },
      { label: "Arsip Inaktif", value: (total - aktif).toLocaleString(), change: "Perlu review retensi", icon: Clock3 },
      { label: "AI Powered", value: "Gemini", change: "Extract + Classify + Drive", icon: Bot },
    ];
  }, [arsipList]);

  // Render content based on active view
  const renderContent = () => {
    switch (activeView) {
      case "registrasi":
        return (
          <div className="max-w-3xl mx-auto">
            <FormRegistrasi onSubmit={handleAddArsip} />
          </div>
        );
      case "arsip":
        return <DaftarArsip arsipList={arsipList} onDelete={handleDeleteArsip} />;
      case "pengguna":
        return <ManajemenUser />;
      case "dashboard":
      default:
        return (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((item, index) => (
                <StatCard key={item.label} item={item} index={index} />
              ))}
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
              <div className="space-y-6">
                <UploadPanel onUploadSuccess={() => {}} />
                <RecentArchiveTable arsipList={arsipList} onViewAll={() => setActiveView("arsip")} />
              </div>
              <RightPanel arsipList={arsipList} />
            </section>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_35%),linear-gradient(180deg,#f8fafc,#eef2ff)] text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeView={activeView}
          onViewChange={setActiveView}
          userRole={userRole}
        />

        <main className="min-w-0 flex-1 p-4 lg:p-8">
          {/* Header */}
          <header className="mb-6 flex flex-col gap-4 rounded-[30px] border border-white/70 bg-white/70 p-4 shadow-xl shadow-slate-200/60 backdrop-blur-2xl md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <button className="rounded-2xl bg-white p-3 shadow-sm lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-950 md:text-2xl">
                  {activeView === "dashboard" && "Dashboard Arsip Dinamis"}
                  {activeView === "registrasi" && "Registrasi Arsip"}
                  {activeView === "arsip" && "Daftar Arsip"}
                  {activeView === "pengguna" && "Manajemen Pengguna"}
                  {activeView === "drive" && "Google Drive"}
                  {activeView === "analitik" && "Analitik"}
                  {activeView === "pengaturan" && "Pengaturan"}
                </h1>
                <p className="text-sm text-slate-500">
                  Halo, {user?.nama || "User"} • {userRole || "viewer"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm md:flex">
                <Search size={18} className="text-slate-400" />
                <input
                  className="w-64 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  placeholder="Cari arsip, kode, unit..."
                />
              </div>
              <button className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-slate-600 shadow-sm">
                <Bell size={19} />
              </button>
            </div>
          </header>

          {/* Content */}
          {!isLoaded ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : (
            renderContent()
          )}
        </main>
      </div>
    </div>
  );
}
