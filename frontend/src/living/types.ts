export type FinMood = "calm" | "curious" | "thinking" | "bright" | "resting";
export interface Companion {
  mood: FinMood;
  domains_awakened: number[];
  connections_unlocked: number;
  review_due_count: number;
  recent_event: string | null;
  companion_form: string;
  message: string;
}
export interface LivingTopic {
  id: number;
  title: string;
  english: string;
  summary: string;
  state: "unexplored" | "exploring" | "building" | "established";
  evidence: number;
  completed_lessons: number;
  lesson_id: number | null;
  lab_id: number | null;
  signal_id: number | null;
  recent_at: number;
}
export interface LivingEdge {
  id: number;
  from_topic_id: number;
  to_topic_id: number;
  relation_label: string;
  unlocked: boolean;
}
export interface World {
  topics: LivingTopic[];
  relations: LivingEdge[];
  companion: Companion;
  summary: { explored: number; connections: number; review_due: number };
}
export interface Task {
  kind: string;
  eyebrow: string;
  title: string;
  detail: string;
  url: string;
  duration: string;
}
export interface HomeData {
  capsule?: { completed: boolean; url: string } | null;
  name: string | null;
  has_evidence: boolean;
  today: Task;
  continue: Task[];
  signal: {
    id: number;
    topic_id: number;
    title: string;
    summary: string;
    source: string;
    published_at: string;
    reason?: string;
  } | null;
  world: World;
}
