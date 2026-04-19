import { useState, useEffect, useCallback, createContext, useContext } from "react";
import type { User, UserRole } from "@/types/auth";
import { DEFAULT_USERS, DEFAULT_USER_PASSWORDS, hasPermission } from "@/types/auth";

const AUTH_STORAGE_KEY = "arsip-auth-session";
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  const [passwords, setPasswords] = useState<Record<string, string>>(DEFAULT_USER_PASSWORDS);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing users data and session on mount
  useEffect(() => {
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
      // Fallback
      setUsers(DEFAULT_USERS);
      setPasswords(DEFAULT_USER_PASSWORDS);
    }

    const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      } catch {
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  // Save session whenever user changes
  useEffect(() => {
    if (user) {
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const expectedPassword = passwords[username.toLowerCase()];
    const foundUser = users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );

    if (foundUser && expectedPassword === password) {
      setUser(foundUser);
      return true;
    }
    return false;
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
    };

    const newUsers = [...users, newUser];
    const newPasswords = { ...passwords, [userData.username.toLowerCase()]: userData.password || "password123" };

    setUsers(newUsers);
    setPasswords(newPasswords);

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(newUsers));
    localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(newPasswords));

    return true;
  }, [users, passwords]);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
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
