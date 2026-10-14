// URL/local drafts are hints, never a trusted model result. Math remains server-side.
export function readDraft<T extends object>(
  raw: string | null,
  defaults: T,
): T {
  try {
    const parsed = JSON.parse(raw || "null");
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object")
      return structuredClone(defaults);
    const next = { ...defaults } as Record<string, unknown>;
    for (const [key, original] of Object.entries(defaults)) {
      const value = parsed[key];
      if (Array.isArray(original)) {
        if (
          Array.isArray(value) &&
          value.length <= 30 &&
          value.every(
            (e) =>
              e &&
              typeof e.name === "string" &&
              typeof e.amount === "number" &&
              ["fixed", "flexible", "once"].includes(e.kind),
          )
        )
          next[key] = value;
      } else if (typeof value === typeof original) next[key] = value;
    }
    return next as T;
  } catch {
    return structuredClone(defaults);
  }
}
export const numericDisplay = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : "";
