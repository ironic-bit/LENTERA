import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FormRegistrasi } from "@/components/FormRegistrasi";
import { DaftarArsip } from "@/components/DaftarArsip";
import { StatistikArsip } from "@/components/StatistikArsip";
import { LoginPage } from "@/components/LoginPage";
import { Homepage } from "@/components/Homepage";
import { ManajemenUser } from "@/components/ManajemenUser";
import { useArsip } from "@/hooks/useArsip";
import { useAuth, AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormInput, List } from "lucide-react";

type AppView = "homepage" | "login" | "dashboard" | "manajemen_user";

function AppContent() {
  const [view, setView] = useState<AppView>("homepage");
  const { arsipList, addArsip, deleteArsip } = useArsip();
  const { isAuthenticated, isLoading, userRole } = useAuth();

  // Auto-redirect: when authenticated, go to dashboard. When not, go to homepage.
  useEffect(() => {
    if (isAuthenticated && (view === "login" || view === "homepage")) {
      setView("dashboard");
    }
    if (!isAuthenticated && !isLoading && view !== "homepage" && view !== "login") {
      setView("homepage");
    }
  }, [isAuthenticated, isLoading, view]);

  const handleLoginClick = () => {
    setView("login");
  };

  const handleAddArsip = async (arsipData: Parameters<typeof addArsip>[0]): Promise<boolean> => {
    const result = await addArsip(arsipData);
    if (result) {
      toast.success("Arsip berhasil diregistrasi!", {
        description: `${arsipData.nomorSurat} - ${arsipData.judul}`,
      });
      return true;
    } else {
      toast.error("Gagal menyimpan arsip", {
        description: "Terjadi kesalahan saat menyimpan ke database.",
      });
      return false;
    }
  };

  const handleDeleteArsip = async (id: string) => {
    const arsip = arsipList.find((a) => a.id === id);
    if (arsip) {
      const success = await deleteArsip(id);
      if (success) {
        toast.info("Arsip telah dihapus", {
          description: `${arsip.nomorSurat} - ${arsip.judul}`,
        });
      } else {
        toast.error("Gagal menghapus arsip");
      }
    }
  };

  // Show loading while auth state is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-blue-600 font-medium">
          Memuat sistem...
        </div>
      </div>
    );
  }

  // Show homepage
  if (view === "homepage" && !isAuthenticated) {
    return <Homepage onLoginClick={handleLoginClick} />;
  }

  // Show login page
  if (view === "login" && !isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <LoginPage />
        <button
          onClick={() => setView("homepage")}
          className="absolute top-4 left-4 text-white/70 hover:text-white flex items-center gap-2"
        >
          ← Kembali
        </button>
      </div>
    );
  }

  // Not authenticated and not on login/homepage (shouldn't happen, but safety)
  if (!isAuthenticated) {
    return <Homepage onLoginClick={handleLoginClick} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header onViewChange={(v: string) => setView(v as AppView)} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {view === "manajemen_user" && userRole === "admin" ? (
          <ManajemenUser />
        ) : (
          <>
            {/* Statistik */}
            <div className="mb-8">
              <StatistikArsip arsipList={arsipList} />
            </div>

            {/* Layout Utama dengan Tabs */}
            <Tabs defaultValue="arsip" className="space-y-6">
              <TabsList className="grid w-full bg-white border border-slate-200 p-1 grid-cols-1 max-w-[200px]">
                <TabsTrigger value="arsip" className="flex items-center gap-2">
                  <List className="w-4 h-4" />
                  <span>Sistem Arsip</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="arsip" className="space-y-6">
                <Tabs defaultValue="daftar" className="space-y-6 lg:hidden">
                  <TabsList className="grid w-full grid-cols-2 bg-white border border-slate-200 p-1">
                    <TabsTrigger value="daftar" className="flex items-center gap-2">
                      <List className="w-4 h-4" />
                      <span className="hidden sm:inline">Daftar Arsip</span>
                      <span className="sm:hidden">Daftar</span>
                    </TabsTrigger>
                    <TabsTrigger value="registrasi" className="flex items-center gap-2">
                      <FormInput className="w-4 h-4" />
                      <span className="hidden sm:inline">Registrasi Baru</span>
                      <span className="sm:hidden">Registrasi</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="daftar" className="space-y-6">
                    <DaftarArsip arsipList={arsipList} onDelete={handleDeleteArsip} />
                  </TabsContent>

                  <TabsContent value="registrasi" className="space-y-6">
                    <div className="max-w-2xl mx-auto">
                      <FormRegistrasi onSubmit={handleAddArsip} />
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Desktop Layout - Side by Side */}
                <div className="hidden lg:grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1">
                    <FormRegistrasi onSubmit={handleAddArsip} />
                  </div>
                  <div className="lg:col-span-2">
                    <DaftarArsip arsipList={arsipList} onDelete={handleDeleteArsip} />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>

      <Footer />
      <Toaster position="top-right" richColors />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
