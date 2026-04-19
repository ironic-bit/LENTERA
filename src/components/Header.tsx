import { Database } from "lucide-react";
import { UserMenu } from "./UserMenu";

export function Header({ onViewChange }: { onViewChange?: (view: any) => void }) {
  return (
    <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg border-b border-amber-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo Section - Left */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <span className="text-slate-900 font-bold text-lg">L</span>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  <span className="text-white">LEN</span>
                  <span className="text-amber-400">TERA</span>
                </h1>
                <p className="text-slate-400 text-xs">Layanan Elektronik Pengelolaan Terpadu Arsip</p>
              </div>
            </div>
          </div>

          {/* Right Section - Badge & User Menu */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 bg-amber-500/10 px-4 py-2.5 rounded-lg backdrop-blur-sm border border-amber-500/20">
              <Database className="w-5 h-5 text-amber-400" />
              <div className="text-right">
                <p className="text-xs text-amber-200/70 leading-tight">LATSAR CPNS</p>
                <p className="text-sm font-medium text-amber-100 leading-tight">Aktualisasi</p>
              </div>
            </div>
        <UserMenu onViewChange={onViewChange} />
          </div>
        </div>
      </div>
    </header>
  );
}
