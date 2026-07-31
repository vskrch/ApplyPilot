export interface JobSummary {
  url: string;
  title: string | null;
  salary: string | null;
  location: string | null;
  site: string | null;
  fit_score: number | null;
  score_reasoning: string | null;
  discovered_at: string | null;
  applied_at: string | null;
  apply_status: string | null;
  tailored_resume_path: string | null;
  cover_letter_path: string | null;
}

export interface JobDetail extends JobSummary {
  description: string | null;
  full_description: string | null;
  application_url: string | null;
  detail_scraped_at: string | null;
  detail_error: string | null;
  scored_at: string | null;
  tailored_at: string | null;
  tailor_attempts: number | null;
  cover_letter_at: string | null;
  cover_attempts: number | null;
  apply_error: string | null;
  apply_attempts: number | null;
  agent_id: string | null;
  last_attempted_at: string | null;
  apply_duration_ms: number | null;
  strategy: string | null;
  verification_confidence: string | null;
}

export interface JobListResponse {
  jobs: JobSummary[];
  total: number;
  page: number;
  pages: number;
}

export interface PipelineConfig {
  stages: string[];
  min_score: number;
  workers: number;
  stream: boolean;
  validation: string;
  dry_run: boolean;
}

export interface PipelineStatus {
  running: boolean;
  task_id: string | null;
  elapsed: number;
}

export interface StageResult {
  stage: string;
  status: string;
  elapsed: number;
}

export interface ApplyConfig {
  limit: number;
  workers: number;
  min_score: number;
  model: string;
  headless: boolean;
  dry_run: boolean;
  continuous: boolean;
  url: string | null;
}

export interface WorkerInfo {
  worker_id: number;
  status: string;
  job_title: string;
  company: string;
  score: number;
  elapsed: string;
  actions: number;
  last_action: string;
  jobs_applied: number;
  jobs_failed: number;
  total_cost: number;
}

export interface ApplyStatus {
  running: boolean;
  workers: WorkerInfo[];
  totals: { applied: number; failed: number; cost: number };
}

export interface DoctorCheck {
  name: string;
  status: string;
  note: string;
}

export interface DoctorResponse {
  tier: number;
  tier_label: string;
  checks: DoctorCheck[];
}

export interface EnvConfig {
  gemini_key_set: boolean;
  openai_key_set: boolean;
  llm_url: string | null;
  llm_model: string | null;
  capsolver_key_set: boolean;
}

export interface Profile {
  personal?: Record<string, string>;
  work_authorization?: Record<string, unknown>;
  availability?: Record<string, unknown>;
  compensation?: Record<string, unknown>;
  experience?: Record<string, unknown>;
  skills_boundary?: Record<string, unknown>;
  resume_facts?: Record<string, unknown>;
  eeo_voluntary?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface Stats {
  total: number;
  by_site: [string, number][];
  pending_detail: number;
  with_description: number;
  detail_errors: number;
  scored: number;
  unscored: number;
  score_distribution: [number, number][];
  tailored: number;
  untailored_eligible: number;
  tailor_exhausted: number;
  with_cover_letter: number;
  cover_exhausted: number;
  applied: number;
  apply_errors: number;
  ready_to_apply: number;
}

export interface PipelineEvent {
  type: string;
  stage?: string;
  status?: string;
  elapsed?: number;
  result?: Record<string, unknown>;
  error?: string;
  stats?: Stats;
  [key: string]: unknown;
}

export interface ApplyEvent {
  type: string;
  workers?: WorkerInfo[];
  totals?: { applied: number; failed: number; cost: number };
  timestamp?: string;
  message?: string;
  url?: string;
  title?: string;
  duration_ms?: number;
  reason?: string;
  [key: string]: unknown;
}

export interface JobResumeResponse {
  original: string;
  tailored: string | null;
}

export interface MatchJob {
  title: string | null;
  company: string | null;
  location: string | null;
  description: string | null;
  url: string;
  posting_date: string | null;
  username: string | null;
}

export interface MatchJobsResponse {
  date: string;
  count: number;
  jobs: MatchJob[];
}

export interface MatchRunResponse {
  task_id: string;
  status: string;
}

export interface MatchResult {
  task_id: string;
  count: number;
  path: string;
  criteria: Record<string, unknown>;
}

export type SortDir = "asc" | "desc";
