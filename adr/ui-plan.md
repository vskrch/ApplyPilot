# ApplyPilot Web UI — Architecture & Implementation Plan

> **ADR-001** · Created 2026-07-31 · Status: **PROPOSED**
> 
> Full-stack interactive web UI that retains 100% of existing CLI features and provides a visual command center for the entire 6-stage job application pipeline.

---

## Table of Contents

1. [Codebase Audit Summary](#1-codebase-audit-summary)
2. [Design Philosophy](#2-design-philosophy)
3. [Technology Stack](#3-technology-stack)
4. [Architecture Overview](#4-architecture-overview)
5. [Backend API Design](#5-backend-api-design)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Feature Parity Matrix](#7-feature-parity-matrix)
8. [Database & Data Flow](#8-database--data-flow)
9. [Real-Time Communication](#9-real-time-communication)
10. [Page-by-Page Specification](#10-page-by-page-specification)
11. [Authentication & Security](#11-authentication--security)
12. [Implementation Phases](#12-implementation-phases)
13. [File Structure](#13-file-structure)
14. [Migration Strategy](#14-migration-strategy)
15. [Testing Plan](#15-testing-plan)

---

## 1. Codebase Audit Summary

### 1.1 Module Inventory

| Module | Path | Lines | Responsibility |
|--------|------|-------|----------------|
| **CLI** | `src/applypilot/cli.py` | 458 | Typer app: `init`, `run`, `apply`, `status`, `dashboard`, `doctor` |
| **Config** | `src/applypilot/config.py` | 261 | Paths, tier detection, profile/search/sites loaders, Chrome detection |
| **Database** | `src/applypilot/database.py` | 425 | SQLite schema (30 columns), migrations, stats, job CRUD |
| **LLM Client** | `src/applypilot/llm.py` | 298 | Multi-provider (Gemini/OpenAI/Local), rate-limit retry, native Gemini fallback |
| **Pipeline** | `src/applypilot/pipeline.py` | 541 | Stage orchestration: sequential & streaming (concurrent) mode |
| **View** | `src/applypilot/view.py` | 407 | Static HTML dashboard generator with client-side filters |
| **JobSpy** | `src/applypilot/discovery/jobspy.py` | 479 | Indeed/LinkedIn/Glassdoor/ZipRecruiter scraping via python-jobspy |
| **Workday** | `src/applypilot/discovery/workday.py` | 544 | Workday CXS API scraper for 48+ employer portals |
| **SmartExtract** | `src/applypilot/discovery/smartextract.py` | 1119 | AI-powered extraction from 30+ direct career sites |
| **Detail Enrichment** | `src/applypilot/enrichment/detail.py` | 895 | 3-tier description extraction: JSON-LD → CSS → LLM |
| **Scorer** | `src/applypilot/scoring/scorer.py` | 181 | LLM fit scoring (1-10) with structured output parsing |
| **Tailor** | `src/applypilot/scoring/tailor.py` | 591 | LLM resume tailoring with JSON output, judge layer, fresh-context retries |
| **Cover Letter** | `src/applypilot/scoring/cover_letter.py` | 306 | LLM cover letter generation with validation |
| **Validator** | `src/applypilot/scoring/validator.py` | 346 | Banned words, fabrication detection, structural checks |
| **PDF** | `src/applypilot/scoring/pdf.py` | 441 | Text→HTML→PDF via Playwright Chromium |
| **Apply Launcher** | `src/applypilot/apply/launcher.py` | 795 | Job acquisition, Claude Code sessions, parallel workers, result parsing |
| **Apply Prompt** | `src/applypilot/apply/prompt.py` | 625 | Profile-driven prompt builder for autonomous form filling |
| **Chrome** | `src/applypilot/apply/chrome.py` | 322 | Chrome lifecycle: profile cloning, CDP launch, process cleanup |
| **Live Dashboard** | `src/applypilot/apply/dashboard.py` | 204 | Rich terminal live dashboard for apply progress |
| **Wizard** | `src/applypilot/wizard/init.py` | 394 | Interactive first-time setup: resume, profile, searches, API keys |

**Total: ~8,641 lines of Python across 20 modules.**

### 1.2 Data Architecture

**Database:** SQLite with WAL mode, thread-local connections, 30 columns across 6 stages:

```
jobs (
  -- Discovery (8 cols): url PK, title, salary, description, location, site, strategy, discovered_at
  -- Enrichment (4 cols): full_description, application_url, detail_scraped_at, detail_error
  -- Scoring (3 cols): fit_score, score_reasoning, scored_at
  -- Tailoring (3 cols): tailored_resume_path, tailored_at, tailor_attempts
  -- Cover Letter (3 cols): cover_letter_path, cover_letter_at, cover_attempts
  -- Application (9 cols): applied_at, apply_status, apply_error, apply_attempts,
                           agent_id, last_attempted_at, apply_duration_ms,
                           apply_task_id, verification_confidence
)
```

**Config files** (all in `~/.applypilot/`):
- `profile.json` — 7 sections: personal, work_authorization, availability, compensation, experience, skills_boundary, resume_facts, eeo_voluntary
- `searches.yaml` — search queries, locations, boards, location accept/reject
- `.env` — API keys (GEMINI, OPENAI, LLM_URL, CAPSOLVER)
- `resume.txt` / `resume.pdf` — master resume

**Package configs** (shipped):
- `config/employers.yaml` — 48 Workday employer portals
- `config/sites.yaml` — 30+ direct career sites, blocked sites, manual ATS, base URLs, blocked SSO
- `config/searches.example.yaml` — example search configuration

### 1.3 Tier System

| Tier | Label | Requirements | Unlocks |
|------|-------|-------------|---------|
| 1 | Discovery | Python 3.11+ | `init`, `run discover/enrich`, `status`, `dashboard` |
| 2 | AI Scoring & Tailoring | + LLM API key | `run score/tailor/cover/pdf`, `run` (all) |
| 3 | Full Auto-Apply | + Claude Code CLI + Chrome + Node.js | `apply` |

### 1.4 Pipeline Flow

```
discover → enrich → score → tailor → cover → pdf → apply
   ↓          ↓        ↓        ↓        ↓       ↓      ↓
 JobSpy    3-tier   LLM 1-10  LLM JSON  LLM    HTML→  Claude
 Workday   cascade  scoring   + judge   gen    PDF    Code
 Smart     extract           + retry          (PW)   + MCP
 Extract   (JSON-LD                                  + Chrome
            CSS,LLM)
```

---

## 2. Design Philosophy

### 2.1 Core Principles

1. **CLI parity first** — Every CLI command/flag must have a UI equivalent. The CLI remains the canonical execution engine; the web UI is a control plane and dashboard.
2. **Backend = API wrapper around existing modules** — No re-implementing pipeline logic. The FastAPI backend imports and calls the same functions the CLI does.
3. **Real-time visibility** — Pipeline runs, apply sessions, and worker status stream live to the UI via WebSockets.
4. **Profile-first UX** — The setup wizard becomes a guided, visual onboarding flow. Config editing replaces raw YAML/JSON editing.
5. **Progressive disclosure** — Tier 1 users see discovery+enrichment. Tier 2 unlocks scoring/tailoring. Tier 3 unlocks apply. No feature clutter.

### 2.2 What the Web UI Adds Beyond CLI

- **Visual pipeline monitor** with per-stage progress bars, job counts flowing between stages
- **Interactive job table** with sorting, filtering, inline score reasoning, side-panel detail view
- **Resume diff viewer** — original vs. tailored, side-by-side
- **Cover letter preview** with inline editing before PDF generation
- **Apply session live view** — worker status cards, action log, cost tracking, current screenshot
- **Configuration editor** — profile, searches, employers, sites — all with validation
- **Score distribution & analytics** — charts, source breakdown, fit heatmap

---

## 3. Technology Stack

### 3.1 Backend

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Framework** | FastAPI | Async, WebSocket support, auto-generated OpenAPI, Pydantic models |
| **Server** | Uvicorn | ASGI, production-grade, hot-reload in dev |
| **Database** | Existing SQLite (shared) | No migration needed — same `applypilot.db` the CLI uses |
| **Task Queue** | In-process `asyncio.to_thread` + background tasks | Pipeline stages are CPU/IO bound; FastAPI background tasks sufficient for single-user |
| **WebSocket** | FastAPI WebSocket | Real-time pipeline status, apply dashboard, log streaming |
| **Validation** | Pydantic v2 | Type-safe request/response models, profile schema validation |

### 3.2 Frontend

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Framework** | Next.js 15 (App Router) | SSR for initial load, client components for interactivity, file-based routing |
| **Language** | TypeScript | Type safety, better DX |
| **Styling** | Tailwind CSS v4 | Rapid prototyping, dark mode, responsive, design tokens |
| **State** | Zustand | Lightweight, no boilerplate, WebSocket-friendly |
| **Charts** | Recharts | React-native charts, lightweight, composable |
| **Icons** | Lucide React | Clean, consistent, tree-shakeable |
| **Tables** | TanStack Table v8 | Headless, sortable, filterable, virtualizable for 1000+ jobs |
| **Forms** | React Hook Form + Zod | Declarative validation, profile/search config editing |
| **WebSocket** | Native + reconnecting-websocket | Auto-reconnect, binary support |
| **Diff Viewer** | react-diff-viewer-continued | Side-by-side resume comparison |
| **PDF Preview** | react-pdf | In-browser tailored resume preview |
| **Toast/Notifications** | sonner | Minimal, accessible |
| **Code Editor** | Monaco (lazy) | For advanced YAML/JSON config editing |

### 3.3 Monorepo Layout

```
ApplyPilot/
├── src/applypilot/          # Existing Python package (UNTOUCHED)
├── web/
│   ├── api/                 # FastAPI backend
│   │   ├── main.py          # App factory, CORS, lifespan
│   │   ├── routers/         # Route modules
│   │   │   ├── pipeline.py  # /api/pipeline/*
│   │   │   ├── jobs.py      # /api/jobs/*
│   │   │   ├── config.py    # /api/config/*
│   │   │   ├── apply.py     # /api/apply/*
│   │   │   ├── doctor.py    # /api/doctor
│   │   │   └── ws.py        # WebSocket endpoints
│   │   ├── models/          # Pydantic schemas
│   │   ├── services/        # Bridge to applypilot modules
│   │   └── deps.py          # Shared dependencies
│   └── ui/                  # Next.js frontend
│       ├── app/             # App Router pages
│       ├── components/      # UI components
│       ├── lib/             # Utilities, API client, WebSocket
│       ├── stores/          # Zustand stores
│       └── hooks/           # Custom React hooks
├── pyproject.toml           # Existing (add FastAPI deps)
└── adr/                     # Architecture Decision Records
```

---

## 4. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Next.js)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Dashboard │ │   Jobs   │ │ Pipeline │ │  Apply   │  ...      │
│  └─────┬────┘ └─────┬────┘ └─────┬────┘ └─────┬────┘           │
│        │            │            │            │                  │
│        └────────────┴────────────┴────────────┘                  │
│                          │                                       │
│               REST (fetch) + WebSocket                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────────┐
│                    FastAPI Backend (Uvicorn)                      │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    API Routers                              │  │
│  │  /api/pipeline  /api/jobs  /api/config  /api/apply  /ws/*  │  │
│  └──────────┬─────────────────────────────────────────────────┘  │
│             │                                                    │
│  ┌──────────┴─────────────────────────────────────────────────┐  │
│  │                   Service Layer                             │  │
│  │  PipelineService  JobService  ConfigService  ApplyService   │  │
│  └──────────┬─────────────────────────────────────────────────┘  │
│             │                                                    │
│  ┌──────────┴─────────────────────────────────────────────────┐  │
│  │            Existing applypilot Package (UNCHANGED)          │  │
│  │  pipeline.py  database.py  llm.py  config.py  scoring/*    │  │
│  │  discovery/*  enrichment/*  apply/*  wizard/*               │  │
│  └──────────┬─────────────────────────────────────────────────┘  │
│             │                                                    │
│       ┌─────┴─────┐                                              │
│       │ SQLite DB  │  ~/.applypilot/applypilot.db                │
│       └───────────┘                                              │
└──────────────────────────────────────────────────────────────────┘
```

**Key architectural decisions:**

1. **Service Layer as Bridge** — Each service class wraps calls to existing `applypilot` modules, adding async wrappers, event emission, and error handling. This means **zero changes** to the existing Python package.

2. **Shared Database** — The API reads/writes the same SQLite database the CLI uses. WAL mode already supports concurrent readers. For write contention, the service layer serializes pipeline runs.

3. **Background Task Execution** — Pipeline stages run as `asyncio.to_thread()` background tasks. A task registry tracks active runs, allows cancellation, and emits progress events via WebSocket.

4. **WebSocket Event Bus** — A central event bus collects events from pipeline stages (via callback injection) and broadcasts to connected WebSocket clients. Events are typed (stage_progress, job_scored, apply_status, etc.).

---

## 5. Backend API Design

### 5.1 REST Endpoints

#### Pipeline Control (`/api/pipeline`)

```
POST   /api/pipeline/run
       Body: { stages: ["all"], min_score: 7, workers: 1, stream: false, 
               validation: "normal", dry_run: false }
       → 202 { task_id: "uuid", status: "started" }

GET    /api/pipeline/status
       → 200 { running: bool, task_id: str|null, current_stage: str|null,
               stages_completed: [...], elapsed: float }

POST   /api/pipeline/cancel
       → 200 { cancelled: true }

GET    /api/pipeline/history
       → 200 [ { task_id, started_at, stages, result, elapsed } ]
```

#### Jobs (`/api/jobs`)

```
GET    /api/jobs
       Query: stage?, min_score?, max_score?, site?, search?, 
              sort_by?, sort_dir?, page?, limit?
       → 200 { jobs: [...], total: int, page: int, pages: int }

GET    /api/jobs/:url (URL-encoded)
       → 200 { ...full_job_with_all_columns }

GET    /api/jobs/:url/resume
       → 200 { original: str, tailored: str, pdf_url: str|null, report: dict }

GET    /api/jobs/:url/cover-letter
       → 200 { text: str, pdf_url: str|null }

PUT    /api/jobs/:url/score
       Body: { score: int, reasoning: str }
       → 200 { updated: true }  // Manual score override

POST   /api/jobs/:url/tailor
       Body: { validation_mode: "normal" }
       → 202 { task_id: str }  // Trigger re-tailoring for one job

POST   /api/jobs/:url/cover-letter
       Body: { validation_mode: "normal" }
       → 202 { task_id: str }  // Trigger cover letter regen

DELETE /api/jobs/:url
       → 200 { deleted: true }
```

#### Statistics (`/api/stats`)

```
GET    /api/stats
       → 200 { ...full_stats_from_get_stats() }

GET    /api/stats/score-distribution
       → 200 [ { score: int, count: int } ]

GET    /api/stats/by-site
       → 200 [ { site: str, total: int, high_fit: int, avg_score: float } ]

GET    /api/stats/timeline
       → 200 [ { date: str, discovered: int, scored: int, applied: int } ]
```

#### Configuration (`/api/config`)

```
GET    /api/config/profile
       → 200 { ...profile.json contents }

PUT    /api/config/profile
       Body: { ...profile_fields }
       → 200 { saved: true }

GET    /api/config/searches
       → 200 { ...searches.yaml contents }

PUT    /api/config/searches
       Body: { ...search_config }
       → 200 { saved: true }

GET    /api/config/env
       → 200 { gemini_key_set: bool, openai_key_set: bool, 
               llm_url: str|null, capsolver_key_set: bool,
               llm_model: str|null }  // Never expose raw keys

PUT    /api/config/env
       Body: { gemini_api_key?: str, openai_api_key?: str, 
               llm_url?: str, llm_model?: str, capsolver_api_key?: str }
       → 200 { saved: true, tier: int }

GET    /api/config/employers
       → 200 { ...employers.yaml contents }

GET    /api/config/sites
       → 200 { ...sites.yaml contents }

GET    /api/config/resume
       → 200 { text: str, has_pdf: bool }

PUT    /api/config/resume
       Body: multipart/form-data (txt_file?, pdf_file?)
       → 200 { saved: true }
```

#### Doctor (`/api/doctor`)

```
GET    /api/doctor
       → 200 { tier: int, tier_label: str, checks: [
           { name: str, status: "ok"|"missing"|"warn"|"optional", 
             note: str }
         ] }
```

#### Apply (`/api/apply`)

```
POST   /api/apply/start
       Body: { limit: 1, workers: 1, min_score: 7, model: "haiku",
               headless: false, dry_run: false, continuous: false,
               url?: str }
       → 202 { task_id: str, status: "started" }

POST   /api/apply/stop
       → 200 { stopped: true }

GET    /api/apply/status
       → 200 { running: bool, workers: [ { ...WorkerState fields } ],
               totals: { applied: int, failed: int, cost: float } }

POST   /api/apply/mark
       Body: { url: str, status: "applied"|"failed", reason?: str }
       → 200 { marked: true }

POST   /api/apply/reset-failed
       → 200 { reset_count: int }

POST   /api/apply/gen-prompt
       Body: { url: str, model: "haiku" }
       → 200 { prompt: str, mcp_config: dict, command: str }
```

#### Files (`/api/files`)

```
GET    /api/files/resume/:filename
       → 200 (binary PDF or text file)

GET    /api/files/cover-letter/:filename
       → 200 (binary PDF or text file)

GET    /api/files/log/:filename
       → 200 (text log file)
```

### 5.2 WebSocket Endpoints

```
WS /ws/pipeline
   Events emitted:
   - { type: "stage_start", stage: str, timestamp: str }
   - { type: "stage_progress", stage: str, processed: int, total: int, rate: float }
   - { type: "stage_complete", stage: str, status: str, elapsed: float }
   - { type: "job_discovered", count: int, source: str }
   - { type: "job_enriched", url: str, has_description: bool }
   - { type: "job_scored", url: str, title: str, score: int }
   - { type: "job_tailored", url: str, title: str, status: str }
   - { type: "pipeline_complete", result: dict }
   - { type: "pipeline_error", stage: str, error: str }
   - { type: "stats_update", stats: dict }  // Periodic DB stats refresh

WS /ws/apply
   Events emitted:
   - { type: "worker_update", worker_id: int, ...WorkerState }
   - { type: "event", timestamp: str, message: str }
   - { type: "job_applied", url: str, title: str, duration_ms: int }
   - { type: "job_failed", url: str, title: str, reason: str }
   - { type: "apply_complete", totals: dict }

WS /ws/logs
   Bidirectional:
   - Client sends: { subscribe: "worker-0" } or { subscribe: "pipeline" }
   - Server streams: { type: "log_line", source: str, line: str }
```

---

## 6. Frontend Architecture

### 6.1 Page Structure (App Router)

```
app/
├── layout.tsx              # Root layout: sidebar nav, dark mode, WebSocket provider
├── page.tsx                # Dashboard (home)
├── jobs/
│   ├── page.tsx            # Job list with filters + table
│   └── [url]/
│       └── page.tsx        # Job detail: description, score, resume, cover letter
├── pipeline/
│   └── page.tsx            # Pipeline control + live monitor
├── apply/
│   └── page.tsx            # Apply control + live worker dashboard
├── config/
│   ├── page.tsx            # Config overview
│   ├── profile/page.tsx    # Profile editor (form)
│   ├── searches/page.tsx   # Search config editor
│   ├── resume/page.tsx     # Resume upload/preview
│   └── env/page.tsx        # API keys / environment
├── doctor/
│   └── page.tsx            # Setup health check
└── analytics/
    └── page.tsx            # Score distributions, source breakdown, timeline
```

### 6.2 Component Library

```
components/
├── layout/
│   ├── Sidebar.tsx         # Navigation sidebar with tier-aware items
│   ├── Header.tsx          # Page header with breadcrumbs
│   └── StatusBar.tsx       # Bottom bar: DB path, tier, pipeline status
├── dashboard/
│   ├── StatsCards.tsx       # Summary stat cards (total, enriched, scored, high-fit)
│   ├── ScoreChart.tsx      # Score distribution bar chart
│   ├── SourceBreakdown.tsx # Jobs by source donut chart
│   ├── PipelineFlow.tsx    # Visual pipeline stage flow with counts
│   └── RecentActivity.tsx  # Timeline of recent events
├── jobs/
│   ├── JobTable.tsx        # TanStack table with virtual scroll
│   ├── JobFilters.tsx      # Filter bar (stage, score range, site, search)
│   ├── JobCard.tsx         # Card view for job
│   ├── JobDetail.tsx       # Full job detail panel
│   ├── ScoreBadge.tsx      # Color-coded score pill
│   └── ResumeDiff.tsx      # Side-by-side original vs tailored
├── pipeline/
│   ├── PipelineControl.tsx # Start/stop buttons, stage selector, options
│   ├── StageCard.tsx       # Individual stage status card
│   ├── StageProgress.tsx   # Progress bar with job count
│   └── PipelineLog.tsx     # Scrolling log output
├── apply/
│   ├── ApplyControl.tsx    # Start/stop, worker count, model selector
│   ├── WorkerCard.tsx      # Worker status card (mirrors Rich dashboard)
│   ├── EventLog.tsx        # Scrolling event timeline
│   └── ApplyStats.tsx      # Applied/failed/cost summary
├── config/
│   ├── ProfileForm.tsx     # Multi-section profile editor
│   ├── SearchEditor.tsx    # Visual search query builder
│   ├── EnvEditor.tsx       # API key management (masked inputs)
│   └── ResumeUpload.tsx    # Drag-and-drop resume upload + preview
├── shared/
│   ├── DataTable.tsx       # Reusable table wrapper
│   ├── EmptyState.tsx      # Illustrated empty state
│   ├── LoadingSpinner.tsx  # Skeleton loaders
│   ├── ConfirmDialog.tsx   # Confirmation modal
│   └── TierGate.tsx        # Wraps features behind tier checks
└── icons/                  # Custom SVG icons
```

### 6.3 State Management (Zustand)

```typescript
// stores/pipeline.ts
interface PipelineStore {
  isRunning: boolean;
  taskId: string | null;
  currentStage: string | null;
  stageResults: Record<string, StageResult>;
  logs: LogLine[];
  startPipeline: (config: PipelineConfig) => Promise<void>;
  cancelPipeline: () => Promise<void>;
  handleWSEvent: (event: PipelineEvent) => void;
}

// stores/jobs.ts
interface JobStore {
  jobs: Job[];
  total: number;
  filters: JobFilters;
  selectedJob: Job | null;
  fetchJobs: () => Promise<void>;
  setFilters: (f: Partial<JobFilters>) => void;
  selectJob: (url: string) => void;
}

// stores/apply.ts
interface ApplyStore {
  isRunning: boolean;
  workers: WorkerState[];
  events: ApplyEvent[];
  totals: ApplyTotals;
  startApply: (config: ApplyConfig) => Promise<void>;
  stopApply: () => Promise<void>;
  handleWSEvent: (event: ApplyEvent) => void;
}

// stores/config.ts
interface ConfigStore {
  profile: Profile | null;
  searches: SearchConfig | null;
  tier: number;
  doctorChecks: DoctorCheck[];
  fetchProfile: () => Promise<void>;
  saveProfile: (p: Profile) => Promise<void>;
  fetchDoctor: () => Promise<void>;
}
```

### 6.4 WebSocket Integration

```typescript
// lib/ws.ts
class ApplyPilotWS {
  private pipeline: WebSocket | null = null;
  private apply: WebSocket | null = null;

  connectPipeline(onEvent: (e: PipelineEvent) => void) {
    this.pipeline = new ReconnectingWebSocket(`ws://${host}/ws/pipeline`);
    this.pipeline.onmessage = (msg) => onEvent(JSON.parse(msg.data));
  }

  connectApply(onEvent: (e: ApplyEvent) => void) {
    this.apply = new ReconnectingWebSocket(`ws://${host}/ws/apply`);
    this.apply.onmessage = (msg) => onEvent(JSON.parse(msg.data));
  }
}
```

---

## 7. Feature Parity Matrix

Every CLI feature mapped to its UI equivalent:

| CLI Command / Flag | UI Equivalent | Page |
|---|---|---|
| `applypilot init` | Guided onboarding wizard (stepper form) | `/config/*` |
| `applypilot doctor` | Health check card grid with status indicators | `/doctor` |
| `applypilot run` | Pipeline control panel with stage toggles | `/pipeline` |
| `applypilot run discover enrich` | Stage multi-select checkboxes | `/pipeline` |
| `applypilot run --workers 4` | Worker count slider | `/pipeline` |
| `applypilot run --stream` | Toggle: sequential vs concurrent | `/pipeline` |
| `applypilot run --min-score 8` | Score threshold slider | `/pipeline` |
| `applypilot run --dry-run` | Dry-run toggle switch | `/pipeline` |
| `applypilot run --validation strict\|normal\|lenient` | Validation mode dropdown | `/pipeline` |
| `applypilot apply` | Apply control panel | `/apply` |
| `applypilot apply --workers 3` | Worker count selector | `/apply` |
| `applypilot apply --model haiku` | Model dropdown | `/apply` |
| `applypilot apply --continuous` | Continuous mode toggle | `/apply` |
| `applypilot apply --dry-run` | Dry-run toggle | `/apply` |
| `applypilot apply --headless` | Headless mode toggle | `/apply` |
| `applypilot apply --url URL` | "Apply to specific URL" input field | `/apply` |
| `applypilot apply --mark-applied URL` | Right-click → "Mark Applied" in job table | `/jobs` |
| `applypilot apply --mark-failed URL` | Right-click → "Mark Failed" in job table | `/jobs` |
| `applypilot apply --reset-failed` | "Reset All Failed" button | `/apply` |
| `applypilot apply --gen --url URL` | "Generate Prompt" button → shows prompt + command | `/jobs/[url]` |
| `applypilot status` | Stats cards on dashboard + stats page | `/` (dashboard) |
| `applypilot dashboard` | Full job list with charts (replaces HTML generation) | `/jobs` + `/analytics` |
| Profile editing (JSON) | Multi-section form with validation | `/config/profile` |
| `searches.yaml` editing | Visual search builder with preview | `/config/searches` |
| `.env` editing | Masked API key inputs | `/config/env` |
| Resume management | Drag-drop upload + inline preview | `/config/resume` |
| Score distribution (Rich table) | Interactive bar chart | `/analytics` |
| Jobs by source (Rich table) | Donut chart + breakdown table | `/analytics` |
| Worker dashboard (Rich Live) | Real-time worker cards with WebSocket | `/apply` |
| Worker logs | Streaming log panel with filters | `/apply` |

---

## 8. Database & Data Flow

### 8.1 No Schema Changes Required

The existing SQLite schema covers all web UI needs. The `get_stats()`, `get_jobs_by_stage()`, and `store_jobs()` functions are sufficient for all API endpoints.

### 8.2 New Indexes for UI Performance

```sql
-- Fast job listing with score filter
CREATE INDEX IF NOT EXISTS idx_jobs_score_desc 
  ON jobs(fit_score DESC) WHERE fit_score IS NOT NULL;

-- Fast stage-based queries
CREATE INDEX IF NOT EXISTS idx_jobs_stage
  ON jobs(detail_scraped_at, fit_score, tailored_resume_path, applied_at);

-- Fast site breakdown
CREATE INDEX IF NOT EXISTS idx_jobs_site ON jobs(site);
```

### 8.3 Data Flow for Pipeline Run via UI

```
1. User clicks "Run Pipeline" with config
2. POST /api/pipeline/run → FastAPI creates background task
3. Background task calls pipeline.run_pipeline() in a thread
4. Pipeline stages emit events via injected callback
5. Events are pushed to WebSocket event bus
6. Frontend Zustand store updates → React re-renders
7. On completion, POST result summary, update task history
```

### 8.4 File Serving

Tailored resumes, cover letters, and PDFs live in `~/.applypilot/tailored_resumes/` and `~/.applypilot/cover_letters/`. The `/api/files/` endpoints serve these as static files, with proper MIME types.

---

## 9. Real-Time Communication

### 9.1 Event Bus Design

```python
# web/api/services/event_bus.py
class EventBus:
    """Central event bus for broadcasting to WebSocket clients."""
    
    def __init__(self):
        self._subscribers: dict[str, set[asyncio.Queue]] = {
            "pipeline": set(),
            "apply": set(),
            "logs": set(),
        }
    
    async def subscribe(self, channel: str) -> asyncio.Queue:
        queue = asyncio.Queue(maxsize=100)
        self._subscribers[channel].add(queue)
        return queue
    
    async def publish(self, channel: str, event: dict):
        dead = set()
        for queue in self._subscribers[channel]:
            try:
                queue.put_nowait(event)
            except asyncio.QueueFull:
                dead.add(queue)
        self._subscribers[channel] -= dead
```

### 9.2 Pipeline Integration

The service layer injects a callback into pipeline stages that emits events:

```python
# web/api/services/pipeline_service.py
class PipelineService:
    def __init__(self, event_bus: EventBus):
        self.event_bus = event_bus
        self._active_task: asyncio.Task | None = None
    
    async def run(self, config: PipelineConfig) -> str:
        task_id = str(uuid4())
        self._active_task = asyncio.create_task(
            self._run_in_thread(task_id, config)
        )
        return task_id
    
    async def _run_in_thread(self, task_id: str, config: PipelineConfig):
        # Run the existing pipeline.run_pipeline() in a thread
        result = await asyncio.to_thread(
            pipeline.run_pipeline,
            stages=config.stages,
            min_score=config.min_score,
            # ... all CLI flags
        )
        await self.event_bus.publish("pipeline", {
            "type": "pipeline_complete",
            "task_id": task_id,
            "result": result,
        })
```

### 9.3 Apply Dashboard Integration

For the apply dashboard, the existing `dashboard.py` module's `WorkerState` dataclass and event system are polled periodically and pushed to WebSocket clients:

```python
async def _poll_apply_status(self):
    """Poll the in-memory apply dashboard state and push to WS."""
    while self._apply_running:
        states = {wid: asdict(get_state(wid)) for wid in range(self._workers)}
        await self.event_bus.publish("apply", {
            "type": "workers_update",
            "workers": states,
            "totals": get_totals(),
        })
        await asyncio.sleep(0.5)
```

---

## 10. Page-by-Page Specification

### 10.1 Dashboard (`/`)

**Layout:** Full-width, dark theme, 4-column stat card row → 2-column chart row → pipeline flow → recent activity

**Components:**
- **Stats Cards** (4): Total Jobs, Enriched, Scored, Strong Fit (7+), Applied — each with trend indicator
- **Pipeline Flow** — Horizontal stage flow: Discover → Enrich → Score → Tailor → Cover → PDF → Apply. Each stage shows job count at that stage, color-coded by status.
- **Score Distribution** — Vertical bar chart (10→1), green/yellow/red color coding
- **Source Breakdown** — Horizontal bars per site with job counts
- **Recent Activity** — Timeline of last 20 events (discoveries, scores, applications)
- **Quick Actions** — "Run Full Pipeline", "Start Apply", "Open Config"

**Data Source:** `GET /api/stats` + `WS /ws/pipeline` for live updates

### 10.2 Jobs (`/jobs`)

**Layout:** Full-width table with left filter panel, right slide-out detail panel

**Table Columns:** Score (pill), Title (link), Company/Site, Location, Salary, Stage (badge), Applied (date/status), Actions (dropdown)

**Filters:**
- Stage: All / Discovered / Enriched / Scored / Tailored / Ready to Apply / Applied / Failed
- Score: Range slider (1-10)
- Site: Multi-select from discovered sites
- Search: Full-text across title, description, location
- Sort: Score ↑↓, Date ↑↓, Title A-Z

**Detail Panel (slide-out):**
- Job header: title, company, location, salary, score with reasoning
- Tabs: Description | Tailored Resume | Cover Letter | Apply History
- Description tab: full_description with keyword highlighting
- Tailored Resume tab: side-by-side diff (original → tailored), PDF preview, re-tailor button
- Cover Letter tab: text preview, PDF preview, regenerate button
- Apply History tab: attempts, status, error, duration, logs link

**Actions dropdown per job:**
- View Detail
- Re-score / Re-tailor / Re-generate Cover Letter
- Mark as Applied
- Mark as Failed (with reason input)
- Generate Apply Prompt
- Delete Job

### 10.3 Pipeline (`/pipeline`)

**Layout:** Control panel on left, live monitor on right

**Control Panel:**
- Stage toggles (checkboxes): ☑ Discover ☑ Enrich ☑ Score ☑ Tailor ☑ Cover ☑ PDF
- Quick preset buttons: "Full Pipeline", "Discovery Only", "AI Stages Only"
- Options:
  - Min Score: slider (1-10, default 7)
  - Workers: slider (1-8, default 1)
  - Mode: Sequential / Streaming toggle
  - Validation: Strict / Normal / Lenient radio
  - Dry Run: toggle
- Big "Run Pipeline" button (becomes "Cancel" when running)
- Tier gate: AI stages disabled if Tier < 2

**Live Monitor:**
- Pipeline progress stepper: stages as connected circles, current stage pulsing
- Per-stage card: status icon, job count processed, elapsed time, error count
- Live stats: jobs discovered / enriched / scored / tailored in this run
- Log panel: scrolling terminal-style output from pipeline runner

### 10.4 Apply (`/apply`)

**Layout:** Control panel → worker cards grid → event log → totals bar

**Control Panel:**
- Workers: 1-8 selector
- Model: dropdown (haiku, sonnet, opus)
- Min Score: slider
- Limit: number input (0 = continuous)
- Toggles: Headless, Dry Run, Continuous
- Specific URL: text input (optional)
- "Start Apply" / "Stop" button
- "Reset All Failed" button
- Tier gate: entire page disabled if Tier < 3

**Worker Cards (1 per worker):**
- Worker ID
- Status badge (idle/applying/applied/failed/captcha/done)
- Current job: title @ company
- Score pill
- Elapsed time (live counter)
- Action count
- Last action description
- Applied / Failed counts
- Cost ($0.000)

**Event Log:**
- Scrolling list of timestamped events (same as Rich terminal)
- Color-coded by event type

**Totals Bar:**
- Total Applied | Total Failed | Total Cost | Avg Duration

### 10.5 Config (`/config/*`)

#### Profile (`/config/profile`)

Multi-section accordion form matching `profile.json` structure:

1. **Personal Information** — full_name, preferred_name, email, password, phone, address fields, URLs
2. **Work Authorization** — legally_authorized, require_sponsorship, work_permit_type
3. **Availability** — earliest_start_date, full_time, contract
4. **Compensation** — salary_expectation, currency, range min/max, conversion_note
5. **Experience** — years_total, education_level, current_title, current_company, target_role
6. **Skills Boundary** — dynamic key-value editor for languages, frameworks, devops, databases, tools
7. **Resume Facts** — preserved_companies (tag input), preserved_projects, preserved_school, real_metrics
8. **EEO Voluntary** — gender, race, veteran, disability (dropdowns with standard options)

Each section has: Save button, validation feedback, reset to saved state.

#### Search Config (`/config/searches`)

- Visual query builder: add/remove search entries
- Each entry: query text, location, boards (multi-select), max results
- Location config: accept patterns (tag input), reject patterns
- Preview: shows what searches will run
- Advanced: raw YAML editor (Monaco)

#### Resume (`/config/resume`)

- Drag-drop zone for .txt or .pdf
- Current resume preview (scrollable text)
- "Replace Resume" button
- PDF status indicator

#### Environment (`/config/env`)

- Gemini API Key: masked input with show/hide toggle, "Test Connection" button
- OpenAI API Key: same
- Local LLM URL: text input with test
- LLM Model Override: text input
- CapSolver API Key: masked input
- Current Tier: displayed with explanation

### 10.6 Doctor (`/doctor`)

**Layout:** Card grid showing all health checks

Each check card:
- Name (e.g., "profile.json", "Chrome/Chromium", "Claude Code CLI")
- Status icon: ✅ OK / ❌ MISSING / ⚠️ WARN / ○ Optional
- Note (path or instruction)
- Action button where applicable ("Run `applypilot init`", "Install from ...")

Bottom: Current Tier summary with upgrade instructions.

### 10.7 Analytics (`/analytics`)

- **Score Distribution** — Interactive bar chart, click to filter jobs
- **Source Performance** — Stacked bar chart: total vs. high-fit by source
- **Discovery Timeline** — Line chart: cumulative jobs over time (by discovered_at)
- **Score Heatmap** — Score × Site matrix
- **Pipeline Funnel** — Funnel visualization: Discovered → Enriched → Scored → High Fit → Tailored → Applied
- **Apply Results** — Pie chart: applied / failed / captcha / expired / login_issue

---

## 11. Authentication & Security

### 11.1 Single-User Local App

ApplyPilot is a **local, single-user tool**. The web UI runs on `localhost` only. No authentication is needed for v1.

### 11.2 Security Measures

- **CORS:** Restrict to `localhost:3000` (Next.js dev) and `localhost:8000` (API)
- **API keys:** Never exposed in GET responses. Only `*_key_set: bool` returned.
- **File serving:** Restricted to `~/.applypilot/` directory tree. Path traversal protection.
- **No external access:** Uvicorn binds to `127.0.0.1` only.
- **Profile password:** Stored in `profile.json` (job site password, not user auth). Masked in UI.

### 11.3 Future: Multi-User

If multi-user is needed later:
- Add JWT auth with `python-jose`
- Per-user `APP_DIR` isolation
- Database per user or multi-tenant schema

---

## 12. Implementation Phases

### Phase 1: Foundation (Backend API + Basic UI Shell)
**Estimated: 3-4 days**

- [ ] Set up FastAPI project structure in `web/api/`
- [ ] Implement Pydantic models for all data types
- [ ] Build service layer bridge to existing modules
- [ ] Implement REST endpoints: `/api/stats`, `/api/jobs` (read-only), `/api/doctor`, `/api/config/profile` (read)
- [ ] Set up Next.js project in `web/ui/`
- [ ] Build layout: sidebar nav, dark theme, responsive shell
- [ ] Build Dashboard page with stats cards (hardwired to API)
- [ ] Build Doctor page
- [ ] Dev server scripts (`npm run dev`, `uvicorn` with reload)

### Phase 2: Job Browser + Config Editor
**Estimated: 3-4 days**

- [ ] Full `/api/jobs` with filtering, pagination, sorting
- [ ] Job detail endpoint with resume/cover letter content
- [ ] File serving endpoints
- [ ] `/api/config/*` read + write endpoints
- [ ] Jobs page: table with TanStack, filters, search
- [ ] Job detail slide-out panel with tabs
- [ ] Resume diff viewer (original vs tailored)
- [ ] Cover letter preview
- [ ] Profile editor form (all 8 sections)
- [ ] Search config editor
- [ ] Resume upload
- [ ] Environment/API key editor

### Phase 3: Pipeline Control + Real-Time
**Estimated: 3-4 days**

- [ ] Background task execution system
- [ ] WebSocket event bus
- [ ] `/api/pipeline/run` with background execution
- [ ] `WS /ws/pipeline` event broadcasting
- [ ] Pipeline callback injection into existing pipeline.py (non-invasive)
- [ ] Pipeline page: control panel + stage selector
- [ ] Live pipeline monitor: progress bars, stage status, log panel
- [ ] Dashboard: real-time stat updates via WS

### Phase 4: Apply Dashboard
**Estimated: 3-4 days**

- [ ] `/api/apply/*` endpoints
- [ ] `WS /ws/apply` event broadcasting
- [ ] Apply page: control panel with all CLI flags
- [ ] Worker status cards (real-time)
- [ ] Event log panel
- [ ] Apply totals bar
- [ ] Job table actions: mark applied, mark failed, reset failed
- [ ] Generate prompt modal

### Phase 5: Analytics + Polish
**Estimated: 2-3 days**

- [ ] Analytics page with all charts
- [ ] Pipeline funnel visualization
- [ ] Score heatmap
- [ ] Timeline chart
- [ ] Performance optimization: virtual scrolling for 1000+ jobs
- [ ] Loading states, error boundaries, empty states
- [ ] Keyboard shortcuts
- [ ] Mobile responsiveness
- [ ] "First run" onboarding flow (replaces CLI wizard)

### Phase 6: Testing + Documentation
**Estimated: 2 days**

- [ ] API integration tests (pytest + httpx)
- [ ] Frontend component tests (Vitest + Testing Library)
- [ ] E2E flow tests (Playwright)
- [ ] README update with web UI instructions
- [ ] `applypilot web` CLI command to start both servers

---

## 13. File Structure

```
web/
├── api/
│   ├── __init__.py
│   ├── main.py                     # FastAPI app factory, CORS, lifespan events
│   ├── deps.py                     # Dependency injection (DB, event bus, services)
│   ├── models/
│   │   ├── __init__.py
│   │   ├── job.py                  # Job, JobFilter, JobDetail Pydantic models
│   │   ├── pipeline.py             # PipelineConfig, PipelineStatus, StageResult
│   │   ├── apply.py                # ApplyConfig, WorkerState, ApplyTotals
│   │   ├── config.py               # Profile, SearchConfig, EnvConfig, DoctorCheck
│   │   └── events.py               # WebSocket event types
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── pipeline.py             # /api/pipeline/*
│   │   ├── jobs.py                 # /api/jobs/*
│   │   ├── stats.py                # /api/stats/*
│   │   ├── config.py               # /api/config/*
│   │   ├── apply.py                # /api/apply/*
│   │   ├── doctor.py               # /api/doctor
│   │   ├── files.py                # /api/files/*
│   │   └── ws.py                   # WebSocket /ws/*
│   └── services/
│       ├── __init__.py
│       ├── event_bus.py            # Central WebSocket event bus
│       ├── pipeline_service.py     # Bridge: API → pipeline.py
│       ├── job_service.py          # Bridge: API → database.py
│       ├── config_service.py       # Bridge: API → config.py, wizard
│       ├── apply_service.py        # Bridge: API → apply/launcher.py
│       └── task_registry.py        # Background task tracking
├── ui/
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                # Dashboard
│   │   ├── globals.css
│   │   ├── jobs/
│   │   │   ├── page.tsx
│   │   │   └── [url]/page.tsx
│   │   ├── pipeline/page.tsx
│   │   ├── apply/page.tsx
│   │   ├── config/
│   │   │   ├── page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   ├── searches/page.tsx
│   │   │   ├── resume/page.tsx
│   │   │   └── env/page.tsx
│   │   ├── doctor/page.tsx
│   │   └── analytics/page.tsx
│   ├── components/
│   │   ├── layout/
│   │   ├── dashboard/
│   │   ├── jobs/
│   │   ├── pipeline/
│   │   ├── apply/
│   │   ├── config/
│   │   └── shared/
│   ├── lib/
│   │   ├── api.ts                  # Typed fetch wrapper for REST API
│   │   ├── ws.ts                   # WebSocket manager
│   │   ├── utils.ts                # Formatters, helpers
│   │   └── types.ts                # Shared TypeScript types
│   ├── stores/
│   │   ├── pipeline.ts
│   │   ├── jobs.ts
│   │   ├── apply.ts
│   │   └── config.ts
│   └── hooks/
│       ├── useWebSocket.ts
│       ├── useJobs.ts
│       ├── usePipeline.ts
│       └── useApply.ts
└── scripts/
    ├── dev.sh                      # Start both API + UI in dev mode
    └── start.sh                    # Production start
```

---

## 14. Migration Strategy

### 14.1 Zero Breaking Changes

The web UI is **purely additive**. The existing CLI continues to work exactly as before. Both can run simultaneously against the same database (SQLite WAL mode supports concurrent readers).

### 14.2 New CLI Command

```python
# Added to cli.py
@app.command()
def web(
    port: int = typer.Option(8000, help="API server port"),
    ui_port: int = typer.Option(3000, help="UI dev server port"),
    host: str = typer.Option("127.0.0.1", help="Bind address"),
) -> None:
    """Launch the web UI (API server + frontend)."""
    # Start Uvicorn + Next.js dev server
```

### 14.3 New Dependencies

```toml
# Added to pyproject.toml [project.optional-dependencies]
web = [
    "fastapi>=0.115",
    "uvicorn[standard]>=0.30",
    "websockets>=12.0",
]
```

### 14.4 Existing `view.py` Dashboard

The existing static HTML dashboard (`view.py`) is superseded by the web UI's `/jobs` and `/analytics` pages. However, `applypilot dashboard` continues to work for users who don't want the full web UI.

---

## 15. Testing Plan

### 15.1 Backend Tests

```python
# tests/api/test_jobs.py
async def test_list_jobs_with_score_filter():
    async with AsyncClient(app=app) as client:
        resp = await client.get("/api/jobs?min_score=7&limit=10")
        assert resp.status_code == 200
        data = resp.json()
        assert all(j["fit_score"] >= 7 for j in data["jobs"])

# tests/api/test_pipeline.py
async def test_pipeline_dry_run():
    async with AsyncClient(app=app) as client:
        resp = await client.post("/api/pipeline/run", json={
            "stages": ["discover"], "dry_run": True
        })
        assert resp.status_code == 202

# tests/api/test_config.py
async def test_profile_round_trip():
    # Read existing → modify → save → read back → verify
```

### 15.2 Frontend Tests

```typescript
// __tests__/components/JobTable.test.tsx
test("renders jobs with score badges", async () => {
  render(<JobTable jobs={mockJobs} />);
  expect(screen.getByText("Software Engineer")).toBeInTheDocument();
  expect(screen.getByText("9")).toHaveClass("score-badge-green");
});

// __tests__/hooks/usePipeline.test.ts
test("updates state on WebSocket event", () => {
  const { result } = renderHook(() => usePipeline());
  act(() => {
    result.current.handleWSEvent({ type: "stage_complete", stage: "discover" });
  });
  expect(result.current.stageResults.discover.status).toBe("complete");
});
```

### 15.3 E2E Tests (Playwright)

```typescript
test("full pipeline flow", async ({ page }) => {
  await page.goto("/pipeline");
  await page.click("text=Run Pipeline");
  await page.waitForSelector("text=Pipeline Complete", { timeout: 120000 });
  await page.goto("/jobs");
  expect(await page.locator(".job-row").count()).toBeGreaterThan(0);
});
```

---

## Appendix A: Key Existing Functions the API Wraps

| API Endpoint | Wraps | Module |
|---|---|---|
| `GET /api/stats` | `database.get_stats()` | `database.py:222` |
| `GET /api/jobs` | `database.get_jobs_by_stage()` | `database.py:365` |
| `GET /api/doctor` | `config.get_tier()`, `config.get_chrome_path()`, etc. | `config.py:200` |
| `POST /api/pipeline/run` | `pipeline.run_pipeline()` | `pipeline.py:444` |
| `POST /api/apply/start` | `apply.launcher.main()` | `launcher.py:653` |
| `GET /api/config/profile` | `config.load_profile()` | `config.py:94` |
| `GET /api/config/searches` | `config.load_search_config()` | `config.py:104` |
| `POST /api/apply/mark` | `apply.launcher.mark_job()` | `launcher.py:250` |
| `POST /api/apply/reset-failed` | `apply.launcher.reset_failed()` | `launcher.py:275` |

## Appendix B: WebSocket Event Catalog

| Event Type | Channel | Payload |
|---|---|---|
| `stage_start` | pipeline | `{ stage, timestamp }` |
| `stage_progress` | pipeline | `{ stage, processed, total, rate }` |
| `stage_complete` | pipeline | `{ stage, status, elapsed }` |
| `job_discovered` | pipeline | `{ count, source }` |
| `job_scored` | pipeline | `{ url, title, score }` |
| `job_tailored` | pipeline | `{ url, title, status }` |
| `pipeline_complete` | pipeline | `{ result }` |
| `pipeline_error` | pipeline | `{ stage, error }` |
| `stats_update` | pipeline | `{ stats }` |
| `workers_update` | apply | `{ workers, totals }` |
| `event` | apply | `{ timestamp, message }` |
| `job_applied` | apply | `{ url, title, duration_ms }` |
| `job_failed` | apply | `{ url, title, reason }` |
| `apply_complete` | apply | `{ totals }` |
| `log_line` | logs | `{ source, line }` |
