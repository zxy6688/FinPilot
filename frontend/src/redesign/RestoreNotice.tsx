import { Link, useSearchParams } from "react-router-dom";
import { useNotebook } from "./state";

export function RestoreNotice() {
  const [params] = useSearchParams();
  const notebook = useNotebook();
  const id =
    params.get("receipt") || params.get("reading") || params.get("concept");
  if (
    !id ||
    notebook.loading ||
    notebook.entries.some((entry) => entry.id === id)
  )
    return null;
  return (
    <p role="alert" className="rd-notice">
      {notebook.error
        ? "暂时无法读取保存记录，请检查连接后刷新。"
        : "当前账户或浏览器中没有这条记录，请确认登录了保存时的账户。"}
      当前页面仍可试用，但下方参数不代表该记录已恢复。
      <Link to="/profile">查看我的发现手册 →</Link>
    </p>
  );
}
