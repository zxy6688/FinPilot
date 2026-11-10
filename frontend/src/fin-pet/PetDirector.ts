// P0/P1 deterministic director. No financial inputs, mood inference or AI calls.
export const actions = {
  Idle: "呼吸与眨眼",
  Blink: "眨眼",
  Tilt: "歪头",
  Walk: "走动",
  Jump: "轻跳",
  Sit: "坐下",
  Seated: "安静坐着",
  LieDown: "蜷身休息",
  Rise: "起身",
  Sleep: "睡觉",
  Wake: "醒来",
  Pet: "摸头",
  Wave: "挥手",
  Run: "快步",
  Stretch: "伸懒腰",
  Groom: "整理叶冠",
  Prone: "趴下",
  Shy: "害羞",
} as const;
export type PetAction = keyof typeof actions;
export type PetEvent =
  | {
      type: "ACTION";
      action: PetAction;
      source: "user" | "ambient";
      contact?: { x: number; y: number };
    }
  | { type: "FINISHED"; sequence: number }
  | { type: "RESET" };
export type PetState = {
  action: PetAction;
  sequence: number;
  resting: "Idle" | "Seated" | "Sleep";
  lastUserAt: number;
  pending?: PetAction[];
  contact?: { x: number; y: number };
};
export const initialPet: PetState = {
  action: "Idle",
  sequence: 0,
  resting: "Idle",
  lastUserAt: 0,
};
export function direct(
  state: PetState,
  event: PetEvent,
  now = Date.now(),
): PetState {
  if (event.type === "RESET")
    return { ...initialPet, sequence: state.sequence + 1 };
  if (event.type === "FINISHED") {
    if (event.sequence !== state.sequence) return state;
    if (state.pending?.length)
      return {
        ...state,
        action: state.pending[0],
        pending: state.pending.slice(1),
        sequence: state.sequence + 1,
      };
    const resting =
      state.action === "Sit"
        ? "Seated"
        : state.action === "Wake" || state.action === "Rise"
          ? "Idle"
          : state.resting;
    return { ...state, resting, action: resting, sequence: state.sequence + 1 };
  }
  if (!(event.action in actions)) return state;
  if (
    event.source === "ambient" &&
    (state.resting === "Sleep" || now - state.lastUserAt < 20000)
  )
    return state;
  if (event.source === "user" && now - state.lastUserAt < 450) return state;
  let sequence: PetAction[] = [event.action];
  if (event.action === "Sleep")
    sequence =
      state.action === "Sleep"
        ? ["Sleep"]
        : state.action === "Seated"
          ? ["LieDown", "Sleep"]
          : ["Sit", "LieDown", "Sleep"];
  else if (state.action === "Sleep")
    sequence =
      event.action === "Wake" || event.action === "Idle"
        ? ["Wake"]
        : ["Wake", event.action];
  else if (state.action === "Seated" && event.action !== "Seated")
    sequence =
      event.action === "Wake" || event.action === "Idle"
        ? ["Rise"]
        : ["Rise", event.action];
  else if (event.action === "Wake") sequence = ["Idle"];
  const resting =
    event.action === "Sleep"
      ? "Sleep"
      : event.action === "Seated"
        ? "Seated"
        : event.action === "Wake" ||
            event.action === "Idle" ||
            state.action === "Sleep" ||
            state.action === "Seated"
          ? "Idle"
          : state.resting;
  return {
    ...state,
    action: sequence[0],
    pending: sequence.slice(1),
    contact: event.contact,
    sequence: state.sequence + 1,
    resting,
    lastUserAt: event.source === "user" ? now : state.lastUserAt,
  };
}
export const loops = new Set<PetAction>(["Idle", "Seated", "Sleep"]);
