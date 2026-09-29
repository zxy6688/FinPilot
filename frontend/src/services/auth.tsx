import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { api } from "./api";
import type { Profile } from "../types";
interface Auth {
  user: Profile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
}
const Context = createContext<Auth>(null!);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null),
    [loading, setLoading] = useState(true);
  async function refresh() {
    if (!localStorage.getItem("finpilot_token")) {
      setUser(null);
      return;
    }
    setUser(await api<Profile>("/users/me"));
  }
  useEffect(() => {
    refresh()
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
    const expire = () => setUser(null);
    window.addEventListener("auth-expired", expire);
    return () => window.removeEventListener("auth-expired", expire);
  }, []);
  async function login(email: string, password: string, name?: string) {
    const r = await api<{ token: string }>(
      "/auth/" + (name ? "register" : "login"),
      "POST",
      { email, password, ...(name ? { name } : {}) },
    );
    localStorage.setItem("finpilot_token", r.token);
    await refresh();
  }
  async function logout() {
    try {
      await api("/auth/logout", "POST");
    } finally {
      localStorage.removeItem("finpilot_token");
      setUser(null);
    }
  }
  return (
    <Context.Provider value={{ user, loading, refresh, login, logout }}>
      {children}
    </Context.Provider>
  );
}
export const useAuth = () => useContext(Context);
