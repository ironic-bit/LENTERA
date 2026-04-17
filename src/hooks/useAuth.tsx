import { useState, useEffect, useCallback, createContext, useContext } from "react";
import type { User, UserRole } from "@/types/auth";
import { DEFAULT_USERS, USER_PASSWORDS, hasPermission } from "@/types/auth";

const AUTH_STORAGE_KEY = "arsip-auth-session";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasAccess: (permission: string) => boolean;
  userRole: UserRole | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
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

    const expectedPassword = USER_PASSWORDS[username.toLowerCase()];
    const foundUser = DEFAULT_USERS.find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );

    if (foundUser && expectedPassword === password) {
      setUser(foundUser);
      return true;
    }
    return false;
  }, []);

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
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasAccess,
    userRole: user?.role || null,
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
