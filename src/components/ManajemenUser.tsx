import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { UserRole, AksesKlasifikasi, User } from "@/types/auth";
import { ShieldAlert, Users, PlusCircle, Trash2, Edit, UserCheck, UserX } from "lucide-react";

export function ManajemenUser() {
  const { user, userRole, users, addUser, deleteUser, updateUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [akses, setAkses] = useState<AksesKlasifikasi[]>(["B"]);
  const [statusAktif, setStatusAktif] = useState(true);

  if (userRole !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">Akses Ditolak</h2>
        <p className="text-slate-500 mt-2">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
      </div>
    );
  }

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setUsername("");
    setNama("");
    setEmail("");
    setPassword("");
    setRole("user");
    setAkses(["B"]);
    setStatusAktif(true);
  };

  const handleEditClick = (u: User) => {
    setIsEditing(true);
    setEditingId(u.id);
    setUsername(u.username);
    setNama(u.nama);
    setEmail(u.email || "");
    setPassword(""); // Leave empty unless changing
    setRole(u.role);
    setAkses(u.aksesKlasifikasi || ["B"]);
    setStatusAktif(u.statusAktif ?? true);
  };

  const handleToggleStatus = async (u: User) => {
    if (user?.id === u.id) {
      toast.error("Gagal", { description: "Anda tidak dapat menonaktifkan akun Anda sendiri." });
      return;
    }
    const newStatus = !(u.statusAktif ?? true);
    const success = await updateUser(u.id, { statusAktif: newStatus });
    if (success) {
      toast.success("Status diperbarui", { description: `User ${u.nama} sekarang ${newStatus ? 'Aktif' : 'Inaktif'}.` });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !nama) {
      toast.error("Gagal", { description: "Username dan Nama wajib diisi." });
      return;
    }

    if (isEditing && editingId) {
      const updateData: Partial<User> & { password?: string } = {
        username,
        nama,
        email,
        role,
        aksesKlasifikasi: akses,
        statusAktif
      };
      if (password) updateData.password = password; // Only update if provided

      const success = await updateUser(editingId, updateData);
      if (success) {
        toast.success("User diperbarui", { description: `Data user ${username} berhasil disimpan.` });
        resetForm();
      } else {
        toast.error("Gagal", { description: "Terjadi kesalahan saat menyimpan data." });
      }
    } else {
      if (!password) {
        toast.error("Gagal", { description: "Password wajib diisi untuk user baru." });
        return;
      }

      const success = await addUser({
        username,
        nama,
        email,
        role,
        password,
        aksesKlasifikasi: akses,
        statusAktif
      });

      if (success) {
        toast.success("User ditambahkan", { description: `User ${username} berhasil dibuat.` });
        resetForm();
      } else {
        toast.error("Gagal menambahkan", { description: `Username atau email mungkin sudah digunakan, atau Edge Function gagal.` });
      }
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
                {isEditing ? <Edit className="w-5 h-5 text-amber-600" /> : <PlusCircle className="w-5 h-5 text-blue-600" />}
                {isEditing ? "Edit User" : "Tambah User Baru"}
              </CardTitle>
              <CardDescription>
                {isEditing ? "Perbarui detail dan hak akses pengguna." : "Buat akun pengguna baru dengan hak akses spesifik."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {isEditing && (
                  <div className="flex items-center justify-between bg-amber-50 p-3 rounded-md mb-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="statusAktif"
                        checked={statusAktif}
                        onCheckedChange={setStatusAktif}
                      />
                      <Label htmlFor="statusAktif" className="font-medium">
                        {statusAktif ? <span className="text-green-600">Akun Aktif</span> : <span className="text-red-600">Akun Inaktif</span>}
                      </Label>
                    </div>
                  </div>
                )}

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
                  <Label htmlFor="password">Password {isEditing && <span className="text-xs text-slate-400 font-normal">(Opsional - Kosongkan jika tidak diubah)</span>}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isEditing ? "Kosongkan jika tidak mengubah sandi" : "Masukkan sandi awal"}
                    required={!isEditing}
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

                <div className="flex gap-2">
                  <Button type="submit" className={`w-full ${isEditing ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                    {isEditing ? "Simpan Perubahan" : "Simpan Akun"}
                  </Button>
                  {isEditing && (
                    <Button type="button" variant="outline" onClick={resetForm} className="w-1/3">
                      Batal
                    </Button>
                  )}
                </div>
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
                      <tr key={u.id} className={`border-b border-slate-100 hover:bg-slate-50/50 ${u.statusAktif === false ? 'opacity-60 bg-slate-50' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{u.nama}</div>
                          {u.statusAktif === false && (
                            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">INAKTIF</span>
                          )}
                        </td>
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
                        <td className="px-4 py-3 text-center flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-500 hover:text-amber-700 hover:bg-amber-50"
                            onClick={() => handleEditClick(u)}
                            title="Edit User"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${u.statusAktif === false ? 'text-green-500 hover:text-green-700 hover:bg-green-50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                            onClick={() => handleToggleStatus(u)}
                            disabled={user?.id === u.id}
                            title={user?.id === u.id ? "Tidak dapat menonaktifkan akun sendiri" : (u.statusAktif === false ? "Aktifkan User" : "Nonaktifkan User")}
                          >
                            {u.statusAktif === false ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                          </Button>
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
