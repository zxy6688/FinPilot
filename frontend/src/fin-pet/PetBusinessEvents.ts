export const BUSINESS_EVENT = "finpilot:pet-confirmed";
export type ConfirmedEvent = { trigger: string; url: string; key: string };
export function reportPetResult(
  path: string,
  method: string,
  result: unknown,
  success: boolean,
) {
  if (method !== "POST") return;
  let trigger = "";
  let url = location.pathname;
  if (path === "/v3/artifacts" || /^\/labs\/\d+\/records$/.test(path)) {
    trigger = success ? "SAVE_OK" : "SAVE_FAILED";
    const row = result as { url?: string; id?: string } | null;
    if (
      success &&
      row?.url?.startsWith("/") &&
      !row.url.startsWith("//") &&
      row.id
    )
      url =
        row.url +
        (row.url.includes("?") ? "&" : "?") +
        "entry=" +
        encodeURIComponent(row.id);
  } else if (success && /^\/quizzes\/\d+\/answer$/.test(path)) {
    const r = result as { correct?: boolean };
    if (typeof r.correct === "boolean")
      trigger = r.correct ? "QUIZ_CORRECT" : "QUIZ_WRONG";
  } else if (success && /^\/progress\/\d+$/.test(path)) {
    trigger = "LESSON_COMPLETED";
    url = "/lessons/" + path.split("/").pop();
  } else if (success && path.startsWith("/v3/tools/")) trigger = "CALC_READY";
  if (trigger)
    window.dispatchEvent(
      new CustomEvent<ConfirmedEvent>(BUSINESS_EVENT, {
        detail: { trigger, url, key: path },
      }),
    );
}
