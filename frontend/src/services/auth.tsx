import { setLearningScope } from "./learningStorage";
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
      setLearningScope();
      setUser(null);
      return;
    }
    const token = localStorage.getItem("finpilot_token");
    const profile = await api<Profile>("/users/me");
    if (token !== localStorage.getItem("finpilot_token")) return;
    setLearningScope(profile.id);
    setUser(profile);
  }
  useEffect(() => {
    refresh()
      .catch(() => {
        setLearningScope();
        setUser(null);
      })
      .finally(() => setLoading(false));
    const expire = () => {
      setLearningScope();
      setUser(null);
    };
    const changed = (event: StorageEvent) => {
      if (event.key !== "finpilot_token") return;
      setLoading(true);
      refresh()
        .catch(expire)
        .finally(() => setLoading(false));
    };
    window.addEventListener("auth-expired", expire);
    window.addEventListener("storage", changed);
    return () => {
      window.removeEventListener("auth-expired", expire);
      window.removeEventListener("storage", changed);
    };
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
      setLearningScope();
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
