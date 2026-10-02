import { ReactNode } from "react";
import Markdown from "react-markdown";
import { Lightbulb, FlaskConical, ScanLine } from "lucide-react";
export default function ReadingBlocks({
  markdown,
  quiz,
  next,
  compact = false,
  contextual,
}: {
  markdown: string;
  quiz?: ReactNode;
  next?: ReactNode;
  compact?: boolean;
  contextual?: (text: string, title: string) => ReactNode;
}) {
  const pieces = markdown.replace(/^# [^\n]*\n/, "").split(/^## /m);
  return (
    <div className={compact ? "structured-answer" : "reading-blocks"}>
      {pieces.map((piece, i) => {
        if (!piece.trim()) return null;
        if (i === 0)
          return (
            <Markdown key={i} skipHtml>
              {piece}
            </Markdown>
          );
        const end = piece.indexOf("\n"),
          title = end === -1 ? piece : piece.slice(0, end),
          body = end === -1 ? "" : piece.slice(end + 1);
        if (title === "Check Yourself" && quiz)
          return (
            <section className="lesson-quiz" id="check-yourself" key={i}>
              {quiz}
            </section>
          );
        if (title === "下一步" && next)
          return (
            <section className="lesson-next" key={i}>
              {next}
            </section>
          );
        const kind = /一句话/.test(title)
          ? "highlight"
          : /现实例子|举个例子|用例子/.test(title)
            ? "example"
            : /风险|边界|局限|误区|误会/.test(title)
              ? "boundary"
              : "plain";
        const Icon =
          kind === "highlight"
            ? Lightbulb
            : kind === "example"
              ? FlaskConical
              : ScanLine;
        const label =
          title === "Ask FinPilot"
            ? "带着问题，继续理解"
            : title === "Related Topics"
              ? "相关知识"
              : title;
        const myths = /误会|误区/.test(title)
          ? body
              .trim()
              .split("\n")
              .filter(Boolean)
              .map((line) => line.match(/^- [“\"](.+?)[”\"]：(.+)$/))
          : [];
        return (
          <section key={i} className={`reading-section ${kind}`}>
            <h2>
              {kind !== "plain" && <Icon size={20} />}
              <span>{label}</span>
            </h2>
            {myths.length > 0 && myths.every(Boolean) ? (
              <div className="myth-reality">
                {myths.map((match, index) => (
                  <div key={index}>
                    <p>
                      <span>常见误解</span>
                      <q>{match![1]}</q>
                    </p>
                    <p>
                      <span>再想一步</span>
                      {match![2]}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <Markdown skipHtml>{body}</Markdown>
            )}
            {contextual?.(body, title)}
          </section>
        );
      })}
    </div>
  );
}
