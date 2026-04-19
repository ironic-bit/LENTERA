import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import type { UserRole, AksesKlasifikasi } from "@/types/auth";
import { ShieldAlert, Users, PlusCircle, Trash2 } from "lucide-react";

export function ManajemenUser() {
  const { user, userRole, users, addUser, deleteUser } = useAuth();

  const [username, setUsername] = useState("");
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [akses, setAkses] = useState<AksesKlasifikasi[]>(["B"]);

  if (userRole !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">Akses Ditolak</h2>
        <p className="text-slate-500 mt-2">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !nama || !password) {
      toast.error("Gagal menambahkan", { description: "Username, Nama, dan Password wajib diisi." });
      return;
    }

    const success = addUser({
      username,
      nama,
      email,
      role,
      password,
      aksesKlasifikasi: akses
    });

    if (success) {
      toast.success("User ditambahkan", { description: `User ${username} berhasil dibuat.` });
      // Reset form
      setUsername("");
      setNama("");
      setEmail("");
      setPassword("");
      setRole("user");
      setAkses(["B"]);
    } else {
      toast.error("Gagal menambahkan", { description: `Username ${username} sudah digunakan.` });
    }
  };

  const handleToggleAkses = (klasifikasi: AksesKlasifikasi) => {
    setAkses(prev =>
      prev.includes(klasifikasi)
        ? prev.filter(k => k !== klasifikasi)
        : [...prev, klasifikasi]
    );
  };

  const handleDelete = (id: string, namaUser: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus user ${namaUser}?`)) {
      if (deleteUser(id)) {
        toast.success("User dihapus", { description: `User ${namaUser} berhasil dihapus.` });
      } else {
        toast.error("Gagal menghapus", { description: "Terjadi kesalahan atau Anda mencoba menghapus akun Anda sendiri." });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form Tambah User */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                Tambah User Baru
              </CardTitle>
              <CardDescription>
                Buat akun pengguna baru dengan hak akses spesifik.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nama">Nama Lengkap</Label>
                  <Input
                    id="nama"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Minimal 4 karakter"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="budi@instansi.go.id"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan sandi awal"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role Pengguna</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin - Akses Penuh</SelectItem>
                      <SelectItem value="user">User - View, Create, Edit</SelectItem>
                      <SelectItem value="viewer">Viewer - Read Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3 pt-2 pb-2">
                  <Label>Hak Akses Arsip (Klasifikasi Keamanan)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "B", label: "Biasa (B)" },
                      { id: "T", label: "Terbatas (T)" },
                      { id: "R", label: "Rahasia (R)" },
                      { id: "SR", label: "Sangat Rahasia (SR)" }
                    ].map((item) => (
                      <div key={item.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`akses-${item.id}`}
                          checked={akses.includes(item.id as AksesKlasifikasi)}
                          onCheckedChange={() => handleToggleAkses(item.id as AksesKlasifikasi)}
                        />
                        <label
                          htmlFor={`akses-${item.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {item.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">
                    Pilih tingkat keamanan arsip yang dapat dilihat oleh user ini.
                  </p>
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                  Simpan Akun
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Daftar User */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-600" />
                Daftar Pengguna Sistem
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border border-slate-200">
                  <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Nama Lengkap</th>
                      <th className="px-4 py-3">Username</th>
                      <th className="px-4 py-3 text-center">Akses Arsip</th>
                      <th className="px-4 py-3 text-center">Role</th>
                      <th className="px-4 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users && users.map((u) => (
                      <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-medium text-slate-900">{u.nama}</td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-xs">{u.username}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-1 flex-wrap">
                            {u.aksesKlasifikasi?.map(ak => (
                              <span key={ak} className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                ak === 'SR' ? 'bg-red-100 text-red-800' :
                                ak === 'R' ? 'bg-orange-100 text-orange-800' :
                                ak === 'T' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {ak}
                              </span>
                            )) || <span className="text-xs text-slate-400">-</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            u.role === 'admin' ? 'bg-amber-100 text-amber-800' :
                            u.role === 'user' ? 'bg-blue-100 text-blue-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(u.id, u.nama)}
                            disabled={user?.id === u.id}
                            title={user?.id === u.id ? "Tidak dapat menghapus akun sendiri" : "Hapus User"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {(!users || users.length === 0) && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                          Tidak ada pengguna ditemukan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
