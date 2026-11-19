import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { api, tokenStore, User } from "../lib/api";

const USER_KEY = "fh_user";

interface Ctx {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  signUp: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
}
const AuthContext = createContext<Ctx | null>(null);

function tokenValid(token: string | null) {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

function readUser(): User | null {
  try {
    if (!tokenValid(tokenStore.get())) {
      tokenStore.clear();
      localStorage.removeItem(USER_KEY);
      return null;
    }
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readUser);

  const persist = (token: string, u: User) => {
    tokenStore.set(token);
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(u));
    } catch {
      /* ignore */
    }
    setUser(u);
  };

  const logout = useCallback(() => {
    tokenStore.clear();
    try {
      localStorage.removeItem(USER_KEY);
    } catch {
      /* ignore */
    }
    setUser(null);
  }, []);

  // Expired/invalid token reported by the API client → sign out everywhere.
  useEffect(() => {
    window.addEventListener("fh:unauthorized", logout);
    const tick = window.setInterval(() => {
      if (tokenStore.get() && !tokenValid(tokenStore.get())) logout();
    }, 30_000);
    return () => {
      window.removeEventListener("fh:unauthorized", logout);
      window.clearInterval(tick);
    };
  }, [logout]);

  const login = async (email: string, password: string) => {
    const r = await api.post<{ token: string; user: User }>("/auth/login", { email, password });
    persist(r.token, r.user);
    return r.user;
  };

  const signUp = async (name: string, email: string, password: string) => {
    const r = await api.post<{ token: string; user: User }>("/auth/register", { name, email, password });
    persist(r.token, r.user);
    return r.user;
  };

  return <AuthContext.Provider value={{ user, login, signUp, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
