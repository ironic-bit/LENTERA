import { useState, useEffect, useCallback, createContext, useContext } from "react";
import type { User, UserRole, AksesKlasifikasi } from "@/types/auth";
import { DEFAULT_USERS, DEFAULT_USER_PASSWORDS, hasPermission } from "@/types/auth";
import { supabase } from "@/supabaseClient";

const USERS_STORAGE_KEY = "arsip-users-data";
const PASSWORDS_STORAGE_KEY = "arsip-passwords-data";

interface AuthContextType {
  user: User | null;
  users: User[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasAccess: (permission: string) => boolean;
  userRole: UserRole | null;
  addUser: (userData: Omit<User, "id"> & { password?: string }) => boolean;
  deleteUser: (id: string) => boolean;
  updateUser: (id: string, partialData: Partial<User>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  const [passwords, setPasswords] = useState<Record<string, string>>(DEFAULT_USER_PASSWORDS);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing users data and session on mount
  useEffect(() => {
    // Local storage logic (Fallback for demo accounts)
    try {
      const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
      const storedPasswords = localStorage.getItem(PASSWORDS_STORAGE_KEY);

      if (storedUsers && storedPasswords) {
        setUsers(JSON.parse(storedUsers));
        setPasswords(JSON.parse(storedPasswords));
      } else {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
        localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(DEFAULT_USER_PASSWORDS));
      }
    } catch {
      setUsers(DEFAULT_USERS);
      setPasswords(DEFAULT_USER_PASSWORDS);
    }

    // Supabase Auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Fetch profile data from public.profiles
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileData && !error) {
          setUser({
            id: profileData.id,
            username: profileData.username || profileData.email?.split('@')[0] || "user",
            nama: profileData.nama || "User",
            role: (profileData.role as UserRole) || "viewer",
            email: profileData.email || session.user.email,
            aksesKlasifikasi: (profileData.akses_klasifikasi as AksesKlasifikasi[]) || ["B"],
          });
        } else {
          // Fallback if profile doesn't exist yet
          setUser({
            id: session.user.id,
            username: session.user.email?.split('@')[0] || "user",
            nama: "User Baru",
            role: "viewer",
            email: session.user.email,
            aksesKlasifikasi: ["B"],
          });
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (identifier: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    let emailToUse = identifier;

    // Check if identifier is NOT an email (doesn't contain @)
    if (!identifier.includes('@')) {
      // It's a username or NIP. We need to look up the email in the profiles table.
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('email')
        .or(`username.eq.${identifier},nip.eq.${identifier}`)
        .limit(1);

      if (error || !profiles || profiles.length === 0) {
        // If not found in Supabase, fallback to local demo accounts if you still want them to work
        const expectedPassword = passwords[identifier.toLowerCase()] || passwords[identifier];
        const foundUser = users.find(
          (u) => u.username.toLowerCase() === identifier.toLowerCase()
        );

        if (foundUser && expectedPassword === password) {
          setUser(foundUser);
          setIsLoading(false);
          return true;
        }

        setIsLoading(false);
        return false;
      }

      emailToUse = profiles[0].email;
    }

    // Sign in with Supabase Auth using the resolved email
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password: password,
    });

    setIsLoading(false);

    if (signInError) {
      console.error("Login failed:", signInError.message);
      return false;
    }

    return true;
  }, [users, passwords]);

  const addUser = useCallback((userData: Omit<User, "id"> & { password?: string }): boolean => {
    if (users.some(u => u.username.toLowerCase() === userData.username.toLowerCase())) {
      return false; // Username already exists
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      username: userData.username,
      nama: userData.nama,
      role: userData.role,
      email: userData.email,
      aksesKlasifikasi: userData.aksesKlasifikasi || ["B"],
      statusAktif: userData.statusAktif ?? true,
    };

    const newUsers = [...users, newUser];
    const newPasswords = { ...passwords, [userData.username.toLowerCase()]: userData.password || "password123" };

    setUsers(newUsers);
    setPasswords(newPasswords);

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(newUsers));
    localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(newPasswords));

    return true;
  }, [users, passwords]);

  const deleteUser = useCallback((id: string): boolean => {
    // Prevent deleting self
    if (user?.id === id) return false;

    // Check if user exists
    const userToDelete = users.find(u => u.id === id);
    if (!userToDelete) return false;

    const newUsers = users.filter(u => u.id !== id);

    // We could remove password from passwords object too but since username is key,
    // it's not strictly necessary unless we want to clean up.
    // Let's clean it up:
    const newPasswords = { ...passwords };
    delete newPasswords[userToDelete.username.toLowerCase()];

    setUsers(newUsers);
    setPasswords(newPasswords);

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(newUsers));
    localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(newPasswords));

    return true;
  }, [users, passwords, user]);

  const updateUser = useCallback(async (id: string, partialData: Partial<User>): Promise<boolean> => {
    const userIndex = users.findIndex((u) => u.id === id);
    if (userIndex === -1) return false;

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
    await supabase.auth.signOut();
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
