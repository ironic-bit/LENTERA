export type UserRole = "admin" | "user" | "viewer";

export type AksesKlasifikasi = "B" | "T" | "R" | "SR";

export interface User {
  id: string;
  username: string;
  nama: string;
  role: UserRole;
  email?: string;
  aksesKlasifikasi?: AksesKlasifikasi[];
  statusAktif?: boolean;
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

export function hasPermission(role: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
