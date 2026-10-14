import { defaults, useSavings } from "./MoneyLab";
import { money } from "./state";

export function SavingsPreview() {
  const { result, busy, error } = useSavings(defaults);
  const max = Math.max(result?.balance || 1, 1);
  const points = result?.points
    .map(
      (p) =>
        `${8 + (p.month / defaults.months) * 272},${65 - (p.balance / max) * 54}`,
    )
    .join(" ");
  return (
    <div className="a1-savings-preview" aria-busy={busy}>
      <div>
        <span>24 个月后 · 计算预览</span>
        <strong>
          {error
            ? "暂不可用"
            : busy
              ? "计算中…"
              : "¥ " + money(result!.balance)}
        </strong>
      </div>
      {result && (
        <svg
          viewBox="0 0 288 74"
          role="img"
          aria-label="真实储蓄模型逐月余额预览"
        >
          <path d="M8 66H280M8 39H280" stroke="#d2e5e3" strokeDasharray="3 5" />
          <polyline
            points={points}
            fill="none"
            stroke="#267b78"
            strokeWidth="3"
          />
          <circle cx="280" cy="11" r="4" fill="#267b78" />
        </svg>
      )}
      <small>初始 2,000 · 月存 500 · 假设年利率 2%</small>
    </div>
  );
}
