export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
function validationMessage(detail: unknown) {
  if (typeof detail === "string") return detail;
  if (!Array.isArray(detail)) return "请检查输入后重试。";
  const labels: Record<string, string> = {
    principal: "本金/借款金额",
    monthly: "每月存入",
    months: "期数（月）",
    years: "年数",
    rate: "年利率",
    upfront: "期初费用",
    monthly_fee: "每月费用",
    income: "可用收入",
    reserve: "计划储备",
    amount: "支出金额",
    name: "支出名称",
    inflation: "通胀率",
    growth: "金额增长率",
    yield_rate: "市场收益率",
    coupon: "票息率",
    target: "目标金额",
  };
  return detail
    .map(
      (issue: {
        loc?: (string | number)[];
        type?: string;
        ctx?: Record<string, number>;
        msg?: string;
      }) => {
        const path = (issue.loc || []).filter((p) => p !== "body"),
          last = String(path.at(-1) || "");
        const label =
          (path.includes("expenses")
            ? `第 ${Number(path[1]) + 1} 项支出：`
            : "") + (labels[last] || last);
        const c = issue.ctx || {};
        const message =
          issue.type === "greater_than_equal"
            ? `不能小于 ${c.ge}`
            : issue.type === "less_than_equal"
              ? `不能大于 ${c.le}`
              : issue.type?.startsWith("int_")
                ? "必须填写整数"
                : issue.type?.startsWith("float_") ||
                    issue.type === "finite_number"
                  ? "请填写有效数字"
                  : issue.msg?.replace(/^Value error, /, "") || "请检查此项";
        return label ? `${label}：${message}` : message;
      },
    )
    .join("；");
}
export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const token = localStorage.getItem("finpilot_token");
  let response: Response;
  try {
    response = await fetch("/api" + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new ApiError(0, "暂时没有连接到 FinPilot 服务。请稍后重试。");
  }
  const data = await response
    .json()
    .catch(() => ({ detail: "服务器返回了无法读取的响应。" }));
  if (!response.ok) {
    if (
      response.status === 401 &&
      token &&
      localStorage.getItem("finpilot_token") === token
    ) {
      localStorage.removeItem("finpilot_token");
      window.dispatchEvent(new Event("auth-expired"));
    }
    throw new ApiError(response.status, validationMessage(data.detail));
  }
  return data as T;
}
