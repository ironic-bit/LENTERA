import { useState, useEffect } from "react";
import { LoginPage } from "@/components/LoginPage";
import { Homepage } from "@/components/Homepage";
import { Dashboard } from "@/components/Dashboard";
import { useAuth, AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/sonner";

type AppView = "homepage" | "login" | "dashboard";

function AppContent() {
  const [view, setView] = useState<AppView>("homepage");
  const { isAuthenticated, isLoading } = useAuth();

  // Handle view transitions based on auth state changes
  useEffect(() => {
    if (isAuthenticated && (view === "login" || view === "homepage")) {
      setView("dashboard");
    } else if (!isAuthenticated && view === "dashboard") {
      setView("homepage");
    }
  }, [isAuthenticated, view]);

  const handleLoginClick = () => {
    setView("login");
  };

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
          &larr; Kembali
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-blue-600 font-medium">
          Memuat sistem...
        </div>
      </div>
    );
  }

  // If not authenticated, show homepage
  if (!isAuthenticated) {
    return <Homepage onLoginClick={handleLoginClick} />;
  }

  // Authenticated → show new Dashboard
  return (
    <>
      <Dashboard />
      <Toaster position="top-right" richColors />
    </>
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
