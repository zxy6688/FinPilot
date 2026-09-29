export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
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
    if (response.status === 401 && token) {
      localStorage.removeItem("finpilot_token");
      window.dispatchEvent(new Event("auth-expired"));
    }
    throw new ApiError(
      response.status,
      typeof data.detail === "string"
        ? data.detail
        : "请检查表单内容与输入长度。",
    );
  }
  return data as T;
}
