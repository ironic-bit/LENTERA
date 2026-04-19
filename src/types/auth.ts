export type UserRole = "admin" | "user" | "viewer";

export interface User {
  id: string;
  username: string;
  nama: string;
  role: UserRole;
  email?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

// Hak akses berdasarkan role
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ["view", "create", "edit", "delete", "export", "manage_users"],
  user: ["view", "create", "edit"],
  viewer: ["view"],
};

export const DEFAULT_USERS: User[] = [
  {
    id: "1",
    username: "admin",
    nama: "Administrator",
    role: "admin",
    email: "admin@instansi.go.id",
  },
  {
    id: "2",
    username: "pegawai",
    nama: "Pegawai Umum",
    role: "user",
    email: "pegawai@instansi.go.id",
  },
  {
    id: "3",
    username: "viewer",
    nama: "Viewer Only",
    role: "viewer",
    email: "viewer@instansi.go.id",
  },
];

// Default Password untuk demo (dalam produksi harus di-hash)
export const DEFAULT_USER_PASSWORDS: Record<string, string> = {
  admin: "admin123",
  pegawai: "pegawai123",
  viewer: "viewer123",
};

export function hasPermission(role: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
