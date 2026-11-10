/** C4: independent learning evidence flags; no implied mastery score. */
export type ConceptEvidence = {
  viewed: boolean;
  hasLocalAnswer: boolean;
  formalAnswerRecorded: boolean;
  noteSaved: boolean;
  relatedCourseCompleted: boolean;
};
/**
 * Different evidence is intentionally not reduced into a percentage or a
 * "mastered" label. Use a successful server response to set formalAnswerRecorded,
 * never simply infer it from a local answer or the existence of an original ID.
 */
export function evidenceLabels(e: ConceptEvidence): string[] {
  const output: string[] = [];
  if (e.viewed) output.push("看过");
  if (e.hasLocalAnswer) output.push("已做即时题");
  if (e.formalAnswerRecorded) output.push("已提交正式作答");
  if (e.noteSaved) output.push("已保存笔记");
  if (e.relatedCourseCompleted) output.push("相关课程已完成");
  return output.length ? output : ["未开始"];
}
/**
 * Used only for rendering allowed actions: quizId does not guarantee an answer
 * was recorded. The server acknowledgement is authoritative.
 */
export function maySubmitFormalAnswer(quizId: unknown, loggedIn: boolean): boolean {
  return loggedIn && Number.isInteger(quizId) && (quizId as number) > 0;
}
