import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "../services/auth";
import { usePetLife } from "./PetLife";
import {
  direct,
  initialPet,
  type PetAction,
  type PetEvent,
} from "./PetDirector";
type Dock = "top-left" | "top-right" | "bottom-left" | "bottom-right";
type Prefs = {
  position?: { x: number; y: number };
  hidden: boolean;
  muted: boolean;
  reduced: boolean;
  lowPower: boolean;
  dock: Dock;
};
const key = "finpilot:fin-pet:prefs:v1";
const defaults: Prefs = {
  hidden: false,
  muted: true,
  reduced: false,
  lowPower: false,
  dock: "bottom-right",
};
function read(storageKey = key): Prefs {
  try {
    const p = JSON.parse(localStorage.getItem(storageKey) || "{}");
    return {
      ...defaults,
      ...Object.fromEntries(
        Object.entries(p).filter(([k, v]) =>
          k === "position"
            ? !!v &&
              typeof v === "object" &&
              Number.isFinite((v as { x: number }).x) &&
              Number.isFinite((v as { y: number }).y)
            : k === "dock"
              ? [
                  "top-left",
                  "top-right",
                  "bottom-left",
                  "bottom-right",
                ].includes(String(v))
              : k in defaults && typeof v === "boolean",
        ),
      ),
    };
  } catch {
    return defaults;
  }
}
function useStore() {
  const { user } = useAuth();
  const scope = user?.id ? key + ":" + user.id : key;
  const loadedScope = useRef(scope);
  const [prefs, setPrefs] = useState(() => read(scope)),
    [state, dispatch] = useReducer(
      (s: typeof initialPet, e: PetEvent) => direct(s, e),
      initialPet,
    ),
    [panel, setPanel] = useState(false),
    [systemReduced, setSystemReduced] = useState(false);
  useEffect(() => {
    const m = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReduced(m.matches);
    update();
    m.addEventListener("change", update);
    return () => m.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    try {
      if (loadedScope.current === scope)
        localStorage.setItem(scope, JSON.stringify(prefs));
    } catch {
      /* settings still work this session */
    }
  }, [prefs, scope]);
  useEffect(() => {
    dispatch({ type: "RESET" });
    setPanel(false);
    setPrefs(read(scope));
    loadedScope.current = scope;
  }, [user?.id]);
  useEffect(() => {
    const show = (e: Event) => {
      setPanel(true);
      if ((e as CustomEvent).detail?.tab === "纪念册") life.setTab("纪念册");
    };
    window.addEventListener("fin-pet-settings", show);
    return () => window.removeEventListener("fin-pet-settings", show);
  }, []);
  const update = (p: Partial<Prefs>) => setPrefs((old) => ({ ...old, ...p }));
  const act = (action: PetAction, contact?: { x: number; y: number }) =>
    dispatch({ type: "ACTION", action, source: "user", contact });
  const life = usePetLife(user?.id, (action,source='user')=>dispatch({type:'ACTION',action,source}), prefs, (saved) =>
    setPrefs((old) => ({
      ...old,
      ...Object.fromEntries(
        Object.entries(saved).filter(([k, v]) =>
          k === "dock"
            ? ["top-left", "top-right", "bottom-left", "bottom-right"].includes(
                String(v),
              )
            : k in defaults && typeof v === "boolean",
        ),
      ),
    })),
  );
  return {
    life,
    prefs,
    update,
    state,
    dispatch,
    act,
    panel,
    setPanel,
    reduced: prefs.reduced || systemReduced,
    systemReduced,
  };
}
const Context = createContext<ReturnType<typeof useStore> | null>(null);
export function PetProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function usePet() {
  const v = useContext(Context);
  if (!v) throw Error("PetProvider missing");
  return v;
}
