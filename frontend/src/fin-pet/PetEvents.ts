// Reserved P2 contract. Nothing emits/subscribes to learning signals in P0/P1.
// No financial values, form text, inferred emotions or user profile in payloads.
export type LearningSignal =
  | { type: "SAVE_SUCCESS"; confirmed: true; recordId: string }
  | { type: "SAVE_ERROR" }
  | { type: "QUIZ_CORRECT" | "QUIZ_WRONG"; confirmed: true; questionId: number }
  | { type: "LESSON_FINISHED"; confirmed: true; lessonId: number };
export const PET_SIGNAL = "finpilot:pet-learning-signal";
export function emitPetSignal(signal: LearningSignal) {
  window.dispatchEvent(new CustomEvent(PET_SIGNAL, { detail: signal }));
}
