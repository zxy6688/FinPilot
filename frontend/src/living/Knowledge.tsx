import { Link } from "react-router-dom";
import { State, useLoad } from "../components/ui";
import Constellation from "./Constellation";
import type { World } from "./types";
export default function Knowledge() {
  const r = useLoad<World>("/v3/world?mode=explore");
  return (
    <>
      <header className="living-heading">
        <span className="eyebrow">KNOWLEDGE CONSTELLATION / EXPLORE</span>
        <h1>概念不是孤立的点。</h1>
        <p>
          沿一条真实关系，看看钱、市场和选择怎样互相连接。点击节点，可以就地读定义、找课程或问
          Fin。
        </p>
        <Link className="text-link" to="/profile?tab=knowledge">
          查看我的学习状态 →
        </Link>
      </header>
      <State loading={r.loading} error={r.error} retry={r.reload}>
        {r.data && <Constellation world={r.data} />}
      </State>
    </>
  );
}
