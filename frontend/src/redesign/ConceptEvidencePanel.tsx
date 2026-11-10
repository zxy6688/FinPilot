import { useLoad } from "../components/ui";
import { useAuth } from "../services/auth";
import type { LearningPath } from "../types";
import { evidenceLabels } from "./conceptEvidence";
export function ConceptEvidencePanel({
  answer,
  noteSaved,
  quizId,
  lessonIds,
}: {
  answer: boolean;
  noteSaved: boolean;
  quizId?: number;
  lessonIds: number[];
}) {
  const { user } = useAuth();
  const labels = evidenceLabels({
    viewed: true,
    hasLocalAnswer: answer,
    noteSaved,
    formalAnswerRecorded: false,
    relatedCourseCompleted: false,
  });
  return (
    <aside className="concept-evidence" aria-label="学习记录状态">
      <strong>学习记录</strong>
      <p>{labels.join(" · ")}</p>
      {user && <AccountEvidence quizId={quizId} lessonIds={lessonIds} />}
      <small>
        浏览、即时答案、笔记、课程与复习是不同记录，不合并为掌握率。
      </small>
    </aside>
  );
}
function AccountEvidence({
  quizId,
  lessonIds,
}: {
  quizId?: number;
  lessonIds: number[];
}) {
  const memory = useLoad<{ reviews: { item_key: string; due_at: string }[] }>(
    "/v3/memory",
  );
  const paths = useLoad<LearningPath[]>("/learning-paths");
  const review = memory.data?.reviews.find((r) => r.item_key === `q:${quizId}`);
  const done = new Set(
    paths.data?.flatMap((p) =>
      p.lessons.filter((l) => l.completed).map((l) => l.id),
    ) || [],
  );
  return (
    <>
      <p>
        {memory.loading || paths.loading
          ? "正在核对账户记录…"
          : memory.error || paths.error
            ? "账户学习状态暂不可用，不推断已完成。"
            : `${review ? "已有正式作答记录" : "未查到对应正式作答记录"} · 关联课程已完成 ${lessonIds.filter((id) => done.has(id)).length}/${lessonIds.length}`}
      </p>
      {review && (
        <p>下次复习：{new Date(review.due_at).toLocaleDateString("zh-CN")}</p>
      )}
    </>
  );
}
