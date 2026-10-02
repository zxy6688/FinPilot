import { Link } from "react-router-dom";
import ContextAI from "./ContextAI";
import { State, useLoad } from "./ui";
import type { Connection } from "../v2types";
export default function RelationDetail({
  topicId,
  relationId,
}: {
  topicId: number;
  relationId: number;
}) {
  const r = useLoad<Connection[]>("/v2/topics/" + topicId + "/connections"),
    c = r.data?.find((x) => x.id === relationId);
  return (
    <State loading={r.loading} error={r.error} retry={r.reload}>
      {c && (
        <div className="relation-detail">
          <h3>
            {c.from_title} → {c.relation_label} → {c.to_title}
          </h3>
          <p>{c.explanation}</p>
          {c.lesson_id && (
            <Link className="text-link" to={"/lessons/" + c.lesson_id}>
              阅读相关课程 →
            </Link>
          )}
          <ContextAI
            context={{ source_type: "relation", source_id: c.id }}
            title={c.from_title + "与" + c.to_title}
            actions={["why", "next"]}
          />
        </div>
      )}
    </State>
  );
}
