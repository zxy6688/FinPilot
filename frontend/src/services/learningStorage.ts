// No migration of unscoped answers: their owner cannot be established safely.
let scope = "guest";
export function setLearningScope(id?: number) {
  scope = id === undefined ? "guest" : String(id);
}
const prefix = () => `finpilot:px:${scope}:`;
export const learningStorage = {
  getItem: (key: string) => sessionStorage.getItem(prefix() + key),
  setItem: (key: string, value: string) =>
    sessionStorage.setItem(prefix() + key, value),
  removeItem: (key: string) => sessionStorage.removeItem(prefix() + key),
  keys: () =>
    Object.keys(sessionStorage)
      .filter((k) => k.startsWith(prefix()))
      .map((k) => k.slice(prefix().length)),
};
