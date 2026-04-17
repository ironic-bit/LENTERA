import { Button } from "@/components/ui/button";
import { FolderOpen, Shield, Database, Lock, ArrowRight, MapPin } from "lucide-react";

interface HomepageProps {
  onLoginClick: () => void;
}

export function Homepage({ onLoginClick }: HomepageProps) {
  const features = [
    {
      icon: FolderOpen,
      title: "Klasifikasi Perwako",
      description: "Sesuai Kode Klasifikasi Arsip Perwako 49/2022",
    },
    {
      icon: Shield,
      title: "Keamanan Terjamin",
      description: "Sistem klasifikasi keamanan SR, R, T, B (Perwako 31/2023)",
    },
    {
      icon: Database,
      title: "Retensi Arsip",
      description: "Jadwal retensi sesuai Perwako 11/2025",
    },
    {
      icon: Lock,
      title: "Akses Terkontrol",
      description: "Hak akses berbasis role (Admin, User, Viewer)",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div 
        className="relative flex-1 flex items-center justify-center"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(10, 22, 40, 0.85), rgba(15, 23, 42, 0.95)), url(/bg-sungaipenuh.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Overlay Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent" />
        
        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
          {/* Location Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 mb-8">
            <MapPin className="w-4 h-4 text-amber-400" />
            <span className="text-amber-300 text-sm font-medium">Pemerintah Kota Sungai Penuh</span>
          </div>

          {/* Main Title */}
          <h1 className="text-6xl md:text-7xl font-bold mb-4 tracking-tight">
            <span className="text-white">LEN</span>
            <span className="text-amber-400">TERA</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-amber-200/80 mb-3 font-light tracking-wide">
            Layanan Elektronik Pengelolaan Terpadu Arsip
          </p>
          
          {/* Tagline */}
          <p className="text-slate-400 mb-12 max-w-2xl mx-auto">
            Sistem registrasi arsip digital berbasis regulasi Perwako Kota Sungai Penuh 
            untuk pengelolaan arsip yang tertata, aman, dan terpercaya.
          </p>

          {/* CTA Button */}
          <Button
            onClick={onLoginClick}
            size="lg"
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-bold px-10 py-6 text-lg rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:scale-105 hover:shadow-amber-500/40"
          >
            Masuk ke Sistem
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          {/* Divider */}
          <div className="mt-16 flex items-center justify-center gap-4">
            <div className="h-px w-20 bg-gradient-to-r from-transparent to-amber-500/50" />
            <span className="text-amber-500/60 text-sm uppercase tracking-widest">Fitur Utama</span>
            <div className="h-px w-20 bg-gradient-to-l from-transparent to-amber-500/50" />
          </div>

          {/* Features Grid */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/70 hover:border-amber-500/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-6">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-slate-500 text-sm">
            © 2025 LENTERA - Dinas Pekerjaan Umum dan Perumahan Rakyat Kota Sungai Penuh
          </p>
          <p className="text-slate-600 text-xs mt-1">
            Dibuat untuk Aktualisasi LATSAR CPNS
          </p>
        </div>
      </footer>
    </div>
  );
}
