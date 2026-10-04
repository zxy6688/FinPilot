import { useEffect, useRef, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../services/auth";
import { api } from "../services/api";
import Fin from "./Fin";
export interface Moment {
  id: number;
  kind: string;
  title: string;
  detail: string;
  severity: string;
  created_at: string;
  seen_at: string | null;
}
export default function MomentHost() {
  const { user } = useAuth();
  const location = useLocation();
  const [moment, setMoment] = useState<Moment | null>(null);
  const busy = useRef(false);
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const check = () => {
      if (!user || busy.current || location.pathname === "/review") return;
      busy.current = true;
      api<Moment | null>("/v3/moments/claim", "POST")
        .then((m) => {
          if (active && m) {
            setMoment(m);
            timer = setTimeout(
              () => setMoment(null),
              m.severity === "major" ? 2000 : 5000,
            );
          }
        })
        .catch(() => {})
        .finally(() => {
          busy.current = false;
        });
    };
    check();
    window.addEventListener("living-updated", check);
    return () => {
      active = false;
      clearTimeout(timer);
      window.removeEventListener("living-updated", check);
      setMoment(null);
    };
  }, [user?.id, location.pathname]);
  return moment ? (
    <div className={"moment-toast moment-" + moment.severity} role="status">
      <Fin size={moment.severity === "major" ? 48 : 28} mood="bright" />
      <div>
        <b>{moment.title}</b>
        <p>{moment.detail}</p>
        <Link to="/profile?tab=memories">留在 Fin 的记忆里 →</Link>
      </div>
      <button
        aria-label="关闭这条记忆"
        className="icon-button"
        onClick={() => setMoment(null)}
      >
        ×
      </button>
    </div>
  ) : null;
}
