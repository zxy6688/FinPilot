export interface Topic {
  id: number;
  title: string;
  english: string;
  summary: string;
  domain: string;
  related_ids: number[];
}
export interface Article {
  id: number;
  title: string;
  source: string;
  content_type: "REAL_WORLD" | "EXPLAINER";
  source_kind: string;
  topics: { id: number; title: string }[];
  source_url: string | null;
  published_at: string | null;
  category: string;
  difficulty: string;
  summary: string;
  why_it_matters: string;
  topic_id: number;
  is_demo: boolean;
}
export interface AnswerResult {
  answer: number;
  correct: boolean;
  correct_answer: number;
  explanation: string;
}
export interface Question {
  id: number;
  question: string;
  options: string[];
  kind: string;
  record: AnswerResult | null;
}
export interface Lesson {
  question_count: number;
  topics: { id: number; title: string }[];
  id: number;
  title: string;
  path_id: number;
  topic_id: number;
  position: number;
  minutes: number;
  markdown: string;
  diagram: string[];
  completed?: boolean;
  questions?: Question[];
  next_id?: number | null;
}
export interface LearningPath {
  id: number;
  title: string;
  english: string;
  summary: string;
  color: string;
  progress: number;
  lessons: Lesson[];
}
export interface Lab {
  id: number;
  educational_notes: {
    exploring: string;
    observe: string;
    why: string;
    not_means: string;
  };
  slug: string;
  title: string;
  english: string;
  question: string;
  summary: string;
  topic_id: number;
  lesson_id: number;
}
export interface Post {
  user_id: number;
  topic_title: string;
  id: number;
  title: string;
  body: string;
  category: string;
  topic_id: number;
  author: string;
  learner_label: string;
  is_seed_persona: boolean;
  likes: number;
  comments: number;
  liked: boolean;
  is_demo: boolean;
  created_at: string;
  replies?: Reply[];
}
export interface Reply {
  id: number;
  author: string;
  learner_label: string;
  is_seed_persona: boolean;
  body: string;
  created_at: string;
}
export interface Profile {
  id: number;
  name: string;
  email: string;
  completed_lessons: number;
  completed_ids: number[];
  quiz_accuracy: number;
  answered_questions: number;
  streak: number;
  favorites: number;
  discussions: number;
  domains: { title: string; value: number }[];
  recent_activity: {
    id: string;
    title: string;
    url: string;
    created_at: string;
    kind: string;
  }[];
  interests: { id: number; title: string; count: number }[];
  review: {
    topic_id: number;
    title: string;
    count: number;
    lesson_id: number;
  }[];
}
export interface Badge {
  id: number;
  title: string;
  description: string;
  earned: boolean;
}
export interface Favorite {
  id: number;
  kind: string;
  target_id: number;
  item: { id: number; title: string; topic_id?: number };
}
export interface Recommendation {
  id: number;
  title: string;
  topic_id: number;
  reason: string;
  score: number;
}
export interface TopicDetail extends Topic {
  related: Topic[];
  relations: {
    id: number;
    from_topic_id: number;
    to_topic_id: number;
    from_title: string;
    to_title: string;
    relation_label: string;
  }[];
  articles: Article[];
  lessons: Lesson[];
  labs: Lab[];
  posts: Post[];
}
export interface Action {
  label: string;
  title: string;
  url: string;
}
export interface Message {
  role: string;
  content: string;
  metadata_json?: {
    actions?: Action[];
    provider?: string;
    context?: {
      source_type: string;
      title: string;
      source_id: number;
      action?: string;
      selected_text?: string;
      inputs?: Record<string, number>;
    };
  };
}
export interface ChatSession {
  id: number;
  mode: string;
  title: string;
  messages?: Message[];
}
export interface Simulation {
  points: { year: string | number; value: number; invested?: number }[];
  value: number | null;
  explanation: string;
}
export interface LabInputs {
  principal: number;
  monthly: number;
  rate: number;
  years: number;
  stocks: number;
  bonds: number;
  choice: number;
}
