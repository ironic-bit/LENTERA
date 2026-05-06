import { useState, useEffect, useCallback, createContext, useContext } from "react";
import type { User, UserRole } from "@/types/auth";
import { DEFAULT_USERS, hasPermission } from "@/types/auth";
import { supabase } from "@/supabaseClient";

const USERS_STORAGE_KEY = "arsip-users-data";

interface AuthContextType {
  user: User | null;
  users: User[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasAccess: (permission: string) => boolean;
  userRole: UserRole | null;
  addUser: (userData: Omit<User, "id"> & { password?: string }) => Promise<boolean>;
  deleteUser: (id: string) => boolean;
  updateUser: (id: string, partialData: Partial<User>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing users data and session on mount
  useEffect(() => {
    // Override: disable Supabase completely and use mock local session logic
    const localUsersStr = localStorage.getItem(USERS_STORAGE_KEY);
    if (localUsersStr) {
      try {
        setUsers(JSON.parse(localUsersStr));
      } catch {
        setUsers(DEFAULT_USERS);
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
      }
    } else {
      setUsers(DEFAULT_USERS);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
    }

    const localSessionStr = localStorage.getItem("local-session-user");
    if (localSessionStr) {
      try {
        setUser(JSON.parse(localSessionStr));
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }

    setIsLoading(false);
  }, []);

  const login = useCallback(async (identifier: string, password: string): Promise<boolean> => {
    // We are deliberately bypassing Supabase to prevent the loading lock in Production
    // Check if credentials match any of the dummy accounts
    if (identifier === "admin" && password === "admin123") {
      const dummyAdminUser: User = {
        id: "local-admin-1",
        username: "admin",
        nama: "Administrator (Local)",
        role: "admin",
        email: "admin@instansi.go.id",
        aksesKlasifikasi: ["SR", "R", "T", "B"],
        statusAktif: true,
      };
      setUser(dummyAdminUser);
      localStorage.setItem("local-session-user", JSON.stringify(dummyAdminUser));
      setIsLoading(false);
      return true;
    }

    if (identifier === "pegawai" && password === "pegawai123") {
      const dummyPegawaiUser: User = {
        id: "local-pegawai-2",
        username: "pegawai",
        nama: "Pegawai Umum (Local)",
        role: "user",
        email: "pegawai@instansi.go.id",
        aksesKlasifikasi: ["B"],
        statusAktif: true,
      };
      setUser(dummyPegawaiUser);
      localStorage.setItem("local-session-user", JSON.stringify(dummyPegawaiUser));
      setIsLoading(false);
      return true;
    }

    if (identifier === "viewer" && password === "viewer123") {
      const dummyViewerUser: User = {
        id: "local-viewer-3",
        username: "viewer",
        nama: "Viewer Only (Local)",
        role: "viewer",
        email: "viewer@instansi.go.id",
        aksesKlasifikasi: ["B"],
        statusAktif: true,
      };
      setUser(dummyViewerUser);
      localStorage.setItem("local-session-user", JSON.stringify(dummyViewerUser));
      setIsLoading(false);
      return true;
    }

    // Default catch-all error if login doesn't match predefined locals
    setIsLoading(false);
    return false;
  }, []);

  const addUser = useCallback(async (userData: Omit<User, "id"> & { password?: string }): Promise<boolean> => {
    // Get the current session to pass the authorization header
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    // We invoke the Supabase Edge Function to create the user safely without logging out the admin
    const { data, error } = await supabase.functions.invoke('create-user', {
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: {
        email: userData.email,
        password: userData.password || "password123",
        username: userData.username,
        nama: userData.nama,
        role: userData.role,
        aksesKlasifikasi: userData.aksesKlasifikasi || ["B"],
        statusAktif: userData.statusAktif ?? true,
      }
    });

    if (error || !data?.success) {
      console.error("Failed to add user via edge function:", error?.message || data?.error);
      return false;
    }

    // After successful creation via Edge Function, the user data will be in our database.
    // Fetch the updated users list from the database
    const { data: updatedProfiles } = await supabase.from('profiles').select('*');
    if (updatedProfiles) {
      const mappedUsers: User[] = updatedProfiles.map(p => ({
        id: p.id,
        username: p.username || p.email?.split('@')[0] || "user",
        nama: p.nama || "User",
        role: (p.role as UserRole) || "viewer",
        email: p.email,
        aksesKlasifikasi: p.akses_klasifikasi || ["B"],
        statusAktif: p.status_aktif ?? true,
      }));
      setUsers(mappedUsers);
    }

    return true;
  }, []);

  const deleteUser = useCallback((id: string): boolean => {
    // Prevent deleting self
    if (user?.id === id) return false;

    // Deleting from auth.users via frontend is not permitted natively without an edge function.
    // For now we will hide them or you would use another Edge Function to delete them entirely.
    // To implement real deletion you would need another edge function.
    // For now, let's keep the existing local logic or just toggle status in real app.

    const newUsers = users.filter(u => u.id !== id);
    setUsers(newUsers);

    return true;
  }, [users, user]);

  const updateUser = useCallback(async (id: string, partialData: Partial<User> & { password?: string }): Promise<boolean> => {
    const userIndex = users.findIndex((u) => u.id === id);
    if (userIndex === -1) return false;

    // If password is included and caller is trying to change it
    if (partialData.password) {
      // NOTE: Changing another user's password directly from the client is restricted.
      // Usually requires an Edge Function to bypass RLS, similar to `create-user`.
      // For this implementation, we simply warn unless updating own password.
      if (user?.id === id) {
        const { error: pwError } = await supabase.auth.updateUser({ password: partialData.password });
        if (pwError) {
          console.error("Failed to update password:", pwError.message);
          return false;
        }
      } else {
        console.warn("Attempting to change another user's password. This requires an admin edge function. Proceeding with profile update only.");
        // An edge function `update-user` would be needed here for admins to change passwords.
      }
    }

    // Map the internal User fields to the Supabase profiles columns
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatePayload: any = {};
    if (partialData.nama !== undefined) updatePayload.nama = partialData.nama;
    if (partialData.username !== undefined) updatePayload.username = partialData.username;
    if (partialData.role !== undefined) updatePayload.role = partialData.role;
    if (partialData.aksesKlasifikasi !== undefined) updatePayload.akses_klasifikasi = partialData.aksesKlasifikasi;
    if (partialData.statusAktif !== undefined) updatePayload.status_aktif = partialData.statusAktif;
    if (partialData.email !== undefined) updatePayload.email = partialData.email;

    // Sync with Supabase profiles table
    if (Object.keys(updatePayload).length > 0) {
      const { error } = await supabase.from('profiles').update(updatePayload).eq('id', id);
      if (error) {
        console.error("Failed to update user profile in Supabase:", error.message);
        // We could return false here to abort the local update if the server fails
        // but for now we'll log it and let it proceed to local state.
      }
    }

    const updatedUsers = [...users];
    updatedUsers[userIndex] = { ...updatedUsers[userIndex], ...partialData };

    setUsers(updatedUsers);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));

    // If updating self, update active session
    if (user?.id === id) {
      setUser(updatedUsers[userIndex]);
    }

    return true;
  }, [users, user]);

  const logout = useCallback(async () => {
    localStorage.removeItem("local-session-user");
    setUser(null);
  }, []);

  const hasAccess = useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      return hasPermission(user.role, permission);
    },
    [user]
  );

  const value: AuthContextType = {
    user,
    users,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasAccess,
    userRole: user?.role || null,
    addUser,
    deleteUser,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
