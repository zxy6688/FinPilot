import { Link } from "react-router-dom";
import { Section, State, useLoad } from "./ui";
import type { RelevantArticle } from "../v2types";
export default function RelevantDiscover() {
  const r = useLoad<RelevantArticle[]>("/v2/discover/relevant");
  return (
    <State loading={r.loading} error={r.error} retry={r.reload}>
      {r.data && r.data.length > 0 && (
        <Section title="与你的学习有关" en="RELEVANT TO YOU">
          <div className="grid three">
            {r.data.slice(0, 3).map((a) => (
              <article className="card personal-material" key={a.id}>
                <span className="tag">REAL WORLD → KNOWLEDGE</span>
                <h3>{a.title}</h3>
                <p>{a.reason}</p>
                <p className="small">
                  已有学习证据：
                  {a.known_topics.map((t) => t.title).join(" · ") ||
                    "还在建立中"}
                  <br />
                  可以继续探索：
                  {a.to_explore.map((t) => t.title).join(" · ") ||
                    "回看已有概念的边界"}
                </p>
                <div className="row wrap">
                  {a.topics.map((t) => (
                    <Link key={t.id} className="tag" to={"/topics/" + t.id}>
                      {t.title}
                    </Link>
                  ))}
                </div>
                <Link
                  className="text-link"
                  to={"/learn/routes/" + (a.to_explore[0]?.id || a.topic_id)}
                >
                  Learn the chain →
                </Link>
              </article>
            ))}
          </div>
        </Section>
      )}
    </State>
  );
}
