import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Lock, User, Eye, EyeOff, Shield, Users, EyeIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const success = await login(username, password);
    if (!success) {
      setError("Username atau password salah!");
    }

    setIsLoading(false);
  };

  const demoAccounts = [
    { role: "Admin", username: "admin", password: "admin123", desc: "Akses penuh" },
    { role: "User", username: "pegawai", password: "pegawai123", desc: "View, Create, Edit" },
    { role: "Viewer", username: "viewer", password: "viewer123", desc: "View only" },
  ];

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(10, 22, 40, 0.95), rgba(15, 23, 42, 0.98)), url(/bg-sungaipenuh.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Login Form */}
        <Card className="border-0 shadow-2xl bg-slate-800/80 backdrop-blur-sm border border-slate-700/50">
          <CardHeader className="space-y-1 pb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <span className="text-slate-900 font-bold text-2xl">L</span>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center text-white">
              LENTERA
            </CardTitle>
            <CardDescription className="text-center text-slate-400">
              Layanan Elektronik Pengelolaan Terpadu Arsip
            </CardDescription>
            <p className="text-center text-amber-400/80 text-sm mt-2">
              Masukkan kredensial Anda untuk mengakses sistem
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-300 font-medium">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input
                    id="username"
                    placeholder="Masukkan username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 h-12 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300 font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-bold text-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full" />
                    Memuat...
                  </span>
                ) : (
                  "Masuk"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right Side - Demo Accounts */}
        <div className="space-y-6">
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold text-white mb-2">
              Hak Akses Pengguna
            </h2>
            <p className="text-slate-400">
              Sistem ini memiliki 3 level akses dengan hak berbeda:
            </p>
          </div>

          <div className="space-y-4">
            {demoAccounts.map((account, index) => (
              <Card
                key={index}
                className="border-0 shadow-lg bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 hover:border-amber-500/30 transition-all cursor-pointer group"
                onClick={() => {
                  setUsername(account.username);
                  setPassword(account.password);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-xl ${
                        account.role === "Admin"
                          ? "bg-amber-500/20 text-amber-400"
                          : account.role === "User"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-slate-500/20 text-slate-400"
                      }`}
                    >
                      {account.role === "Admin" ? (
                        <Shield className="w-6 h-6" />
                      ) : account.role === "User" ? (
                        <Users className="w-6 h-6" />
                      ) : (
                        <EyeIcon className="w-6 h-6" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white">
                          {account.role}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            account.role === "Admin"
                              ? "border-amber-500/50 text-amber-400"
                              : account.role === "User"
                              ? "border-blue-500/50 text-blue-400"
                              : "border-slate-500/50 text-slate-400"
                          }`}
                        >
                          {account.desc}
                        </Badge>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs text-amber-400 font-medium">
                        Klik untuk isi
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <p className="text-sm text-amber-300">
              <strong>💡 Tips:</strong> Klik salah satu kartu di atas untuk mengisi otomatis username dan password. 
              Setiap role memiliki hak akses yang berbeda terhadap data arsip.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
