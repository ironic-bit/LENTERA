import { useState, useEffect, useCallback, createContext, useContext } from "react";
import type { User, UserRole, AksesKlasifikasi } from "@/types/auth";
import { hasPermission } from "@/types/auth";
import { supabase } from "@/supabaseClient";

// ─── Helper: Map Supabase profile row → User interface ────────────────────────
function mapProfileToUser(
  profile: Record<string, unknown>,
  fallbackEmail?: string
): User {
  return {
    id: profile.id as string,
    username: (profile.username as string) || (profile.email as string)?.split("@")[0] || "user",
    nama: (profile.nama as string) || "User",
    role: ((profile.role as string) || "viewer") as UserRole,
    email: (profile.email as string) || fallbackEmail,
    aksesKlasifikasi: (profile.akses_klasifikasi as AksesKlasifikasi[]) || ["B"],
    statusAktif: (profile.status_aktif as boolean) ?? true,
  };
}

// ─── Helper: Fetch a single profile from Supabase ─────────────────────────────
async function fetchProfileById(
  userId: string,
  fallbackEmail?: string
): Promise<User | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return mapProfileToUser(data, fallbackEmail);
}

// ─── Context Type ─────────────────────────────────────────────────────────────
interface AuthContextType {
  user: User | null;
  users: User[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasAccess: (permission: string) => boolean;
  userRole: UserRole | null;
  addUser: (userData: Omit<User, "id"> & { password?: string }) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  updateUser: (id: string, partialData: Partial<User> & { password?: string }) => Promise<boolean>;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Auth Provider ────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all users from profiles table
  const fetchUsers = useCallback(async () => {
    const { data: profiles, error } = await supabase.from("profiles").select("*");
    if (profiles && !error) {
      setUsers(profiles.map((p) => mapProfileToUser(p)));
    }
  }, []);

  // Initialize: listen to auth state + fetch users
  useEffect(() => {
    fetchUsers();

    // Supabase Auth listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session?.user) {
          const profile = await fetchProfileById(session.user.id, session.user.email);
          if (profile) {
            setUser(profile);
          } else {
            // Fallback if profile not found yet
            setUser({
              id: session.user.id,
              username: session.user.email?.split("@")[0] || "user",
              nama: "User Baru",
              role: "viewer",
              email: session.user.email,
              aksesKlasifikasi: ["B"],
            });
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Error in onAuthStateChange:", err);
      } finally {
        setIsLoading(false);
      }
    });

    // Check initial session (handles page refresh)
    supabase.auth
      .getSession()
      .then(async ({ data: { session }, error }) => {
        if (error || !session) {
          setIsLoading(false);
          return;
        }
        try {
          const profile = await fetchProfileById(session.user.id, session.user.email);
          if (profile) {
            setUser(profile);
          } else {
            setUser({
              id: session.user.id,
              username: session.user.email?.split("@")[0] || "user",
              nama: "User Baru",
              role: "viewer",
              email: session.user.email,
              aksesKlasifikasi: ["B"],
            });
          }
        } catch (err) {
          console.error("Error fetching initial profile:", err);
        } finally {
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Exception getting session:", err);
        setIsLoading(false);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUsers]);

  // ─── Login ────────────────────────────────────────────────────────────────────
  const login = useCallback(async (identifier: string, password: string): Promise<boolean> => {
    const normalizedIdentifier = identifier.trim();
    let emailToUse = normalizedIdentifier;

    try {
      // Resolve username/NIP to email if not already an email
      if (!normalizedIdentifier.includes("@")) {
        const { data: profiles, error } = await supabase
          .from("profiles")
          .select("email")
          .or(`username.eq.${normalizedIdentifier},nip.eq.${normalizedIdentifier}`)
          .limit(1);

        if (error || !profiles || profiles.length === 0 || !profiles[0].email) {
          return false;
        }
        emailToUse = profiles[0].email;
      }

      // Sign in with Supabase Auth
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });

      if (signInError || !authData.user) {
        console.error("Login failed:", signInError?.message);
        return false;
      }

      // Fetch profile and verify status
      const profile = await fetchProfileById(authData.user.id, authData.user.email);

      if (profile) {
        if (profile.statusAktif === false) {
          await supabase.auth.signOut();
          setUser(null);
          return false;
        }
        setUser(profile);
      } else {
        setUser({
          id: authData.user.id,
          username: authData.user.email?.split("@")[0] || "user",
          nama: "User Baru",
          role: "viewer",
          email: authData.user.email,
          aksesKlasifikasi: ["B"],
        });
      }

      setIsLoading(false);
      return true;
    } catch (err) {
      console.error("Login exception:", err);
      return false;
    }
  }, []);

  // ─── Logout ───────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  // ─── User CRUD (Admin operations via Edge Functions) ──────────────────────────

  const getAuthToken = async (): Promise<string | null> => {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  };

  const addUser = useCallback(
    async (userData: Omit<User, "id"> & { password?: string }): Promise<boolean> => {
      const token = await getAuthToken();
      if (!token) return false;

      const { data, error } = await supabase.functions.invoke("create-user", {
        headers: { Authorization: `Bearer ${token}` },
        body: {
          email: userData.email,
          password: userData.password || "password123",
          username: userData.username,
          nama: userData.nama,
          role: userData.role,
          aksesKlasifikasi: userData.aksesKlasifikasi || ["B"],
          statusAktif: userData.statusAktif ?? true,
        },
      });

      if (error || !data?.success) {
        console.error("Failed to add user:", error?.message || data?.error);
        return false;
      }

      // Refresh user list from database
      await fetchUsers();
      return true;
    },
    [fetchUsers]
  );

  const deleteUser = useCallback(
    async (id: string): Promise<boolean> => {
      // Prevent deleting self
      if (user?.id === id) return false;

      const token = await getAuthToken();
      if (!token) return false;

      const { data, error } = await supabase.functions.invoke("delete-user", {
        headers: { Authorization: `Bearer ${token}` },
        body: { userId: id },
      });

      if (error || !data?.success) {
        console.error("Failed to delete user:", error?.message || data?.error);
        return false;
      }

      // Refresh user list from database
      await fetchUsers();
      return true;
    },
    [user, fetchUsers]
  );

  const updateUser = useCallback(
    async (id: string, partialData: Partial<User> & { password?: string }): Promise<boolean> => {
      const token = await getAuthToken();
      if (!token) return false;

      // If updating own password, use Supabase client directly
      if (partialData.password && user?.id === id) {
        const { error: pwError } = await supabase.auth.updateUser({
          password: partialData.password,
        });
        if (pwError) {
          console.error("Failed to update own password:", pwError.message);
          return false;
        }
      }

      // For updating another user (or profile fields), use the Edge Function
      const { data, error } = await supabase.functions.invoke("update-user", {
        headers: { Authorization: `Bearer ${token}` },
        body: {
          userId: id,
          email: partialData.email,
          password: user?.id !== id ? partialData.password : undefined, // Only send password to EF for other users
          username: partialData.username,
          nama: partialData.nama,
          role: partialData.role,
          aksesKlasifikasi: partialData.aksesKlasifikasi,
          statusAktif: partialData.statusAktif,
        },
      });

      if (error || !data?.success) {
        console.error("Failed to update user:", error?.message || data?.error);
        return false;
      }

      // Refresh user list and current user profile
      await fetchUsers();
      if (user?.id === id) {
        const updatedProfile = await fetchProfileById(id, user.email);
        if (updatedProfile) setUser(updatedProfile);
      }

      return true;
    },
    [user, fetchUsers]
  );

  // ─── Permissions ──────────────────────────────────────────────────────────────
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
    refreshUsers: fetchUsers,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ───────────────────────────────────────────────────────────────────────
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
