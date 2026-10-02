import type { Article, Lab } from "./types";
export type EvidenceState =
  "unexplored" | "exploring" | "building" | "established";
export interface EvidenceTopic {
  id: number;
  title: string;
  state: EvidenceState;
  evidence: number;
  recent_at: number;
  completed_lessons: number;
  lesson_count: number;
  answered_questions: number;
  correct_questions: number;
  question_count: number;
  wrong_questions: number;
  repeated_errors: number;
  lab_count: number;
  lab_participation: number;
  engaged: boolean;
  weights: Record<string, number>;
  lesson_id: number | null;
  reason?: string;
}
export interface RelevantArticle extends Article {
  reason: string;
  known_topics: EvidenceTopic[];
  to_explore: EvidenceTopic[];
}
export interface Workspace {
  name: string | null;
  has_evidence: boolean;
  continue_learning: {
    id: number;
    title: string;
    path_title: string;
    progress: number;
    reason: string;
  } | null;
  recent_topics: EvidenceTopic[];
  needs_review: EvidenceTopic[];
  next_related_topics: (EvidenceTopic & {
    from_title: string;
    relation_label: string;
    reason: string;
  })[];
  relevant_real_world_items: RelevantArticle[];
  recommended_lab: (Lab & { reason: string; personalized: boolean }) | null;
  route_target: number;
  route_reason: string;
}
export interface Understanding {
  notice: string;
  has_evidence: boolean;
  topics: EvidenceTopic[];
  domains: {
    id: number;
    title: string;
    english: string;
    topic_ids: number[];
    covered: number;
    total: number;
    completed_lessons: number;
    lesson_count: number;
    needs_review: number;
  }[];
  needs_review: EvidenceTopic[];
  recent_topics: EvidenceTopic[];
  suggested_route: number;
}
export interface Connection {
  id: number;
  from_topic_id: number;
  to_topic_id: number;
  from_title: string;
  to_title: string;
  relation_label: string;
  explanation?: string;
  lesson_id?: number;
  traversed_reverse?: boolean;
}
export interface LearningRoute {
  target_topic_id: number;
  kind: "directed" | "connection" | "already_known" | "no_path";
  personalized: boolean;
  reason: string;
  steps: (EvidenceTopic & {
    is_target: boolean;
    is_next: boolean;
    lab_id: number | null;
  })[];
  relations: Connection[];
}
