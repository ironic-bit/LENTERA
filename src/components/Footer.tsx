import { FileDigit, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-800 text-slate-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600/20 p-2 rounded-lg">
              <FileDigit className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-white">Sistem Registrasi Arsip Digital</p>
              <p className="text-xs text-slate-400">
                Solusi digitalisasi arsip berbasis cloud
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>arsip.digital@instansi.go.id</span>
            </div>
          </div>

          <div className="text-xs text-slate-500">
            <p>© 2024 - Dibuat untuk Aktualisasi LATSAR CPNS</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
