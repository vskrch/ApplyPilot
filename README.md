<!-- logo here -->

> **⚠️ ApplyPilot** is the original open-source project, created by [Pickle-Pixel](https://github.com/Pickle-Pixel) and first published on GitHub on **February 17, 2026**. We are **not affiliated** with applypilot.app, useapplypilot.com, or any other product using the "ApplyPilot" name. These sites are **not associated with this project** and may misrepresent what they offer. If you're looking for the autonomous, open-source job application agent — you're in the right place.

# ApplyPilot

**Applied to 1,000 jobs in 2 days. Fully autonomous. Open source.**

[![PyPI version](https://img.shields.io/pypi/v/applypilot?color=blue)](https://pypi.org/project/applypilot/)
[![Python 3.11+](https://img.shields.io/badge/python-3.11%2B-blue.svg)](https://www.python.org/downloads/)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-green.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/Pickle-Pixel/ApplyPilot?style=social)](https://github.com/Pickle-Pixel/ApplyPilot)
[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/S6S01UL5IO)

---

## Table of Contents

1. [What It Does](#what-it-does)
2. [Quick Start](#quick-start)
3. [The Pipeline](#the-pipeline)
4. [Web UI](#web-ui)
5. [Architecture](#architecture)
6. [CLI Reference](#cli-reference)
7. [Configuration](#configuration)
8. [Tier System](#tier-system)
9. [ApplyPilot vs The Alternatives](#applypilot-vs-the-alternatives)
10. [Requirements](#requirements)
11. [Contributing](#contributing)
12. [License](#license)

---

## What It Does

ApplyPilot is a 6-stage autonomous job application pipeline. It discovers jobs across 5+ boards, scores them against your resume with AI, tailors your resume per job, writes cover letters, and **submits applications for you**. It navigates forms, uploads documents, answers screening questions — all hands-free.

Three commands. That's it.

```bash
pip install applypilot
pip install --no-deps python-jobspy && pip install pydantic tls-client requests markdownify regex
applypilot init          # one-time setup: resume, profile, preferences, API keys
applypilot doctor        # verify your setup — shows what's installed and what's missing
applypilot run           # discover > enrich > score > tailor > cover letters
applypilot run -w 4      # same but parallel (4 threads for discovery/enrichment)
applypilot apply         # autonomous browser-driven submission
applypilot apply -w 3    # parallel apply (3 Chrome instances)
applypilot apply --dry-run  # fill forms without submitting
```

> **Why two install commands?** `python-jobspy` pins an exact numpy version in its metadata that conflicts with pip's resolver, but works fine at runtime with any modern numpy. The `--no-deps` flag bypasses the resolver; the second command installs jobspy's actual runtime dependencies. Everything except `python-jobspy` installs normally.

---

## Quick Start

### Prerequisites

| Component | Required For | How to Get |
|-----------|-------------|------------|
| Python 3.11+ | Everything | [python.org](https://python.org) |
| Node.js 18+ | Auto-apply, Web UI | [nodejs.org](https://nodejs.org) |
| Gemini API key | Scoring, tailoring, cover letters | [aistudio.google.com](https://aistudio.google.com) (free tier) |
| Chrome/Chromium | Auto-apply | Auto-detected; install if missing |
| Claude Code CLI | Auto-apply | [claude.ai/code](https://claude.ai/code) |

### Installation

```bash
# Install ApplyPilot
pip install applypilot

# Install job board scraper (separate due to numpy metadata conflict)
pip install --no-deps python-jobspy
pip install pydantic tls-client requests markdownify regex

# Optional: install web UI dependencies
pip install applypilot[web]
```

### First Run

```bash
# Interactive setup wizard — creates profile, resume, search config, API keys
applypilot init

# Verify everything is configured correctly
applypilot doctor

# Run the full pipeline (discover → enrich → score → tailor → cover → pdf)
applypilot run

# Launch auto-apply
applypilot apply
```

### Web UI (New)

```bash
# Install web dependencies
pip install applypilot[web]
cd web/ui && npm install

# Launch the web UI
applypilot web

# Or start servers manually
cd web/scripts && bash dev.sh
```

Open [http://localhost:3000](http://localhost:3000) for the UI, [http://localhost:8000/docs](http://localhost:8000/docs) for the API docs.

---

## The Pipeline

```
discover → enrich → score → tailor → cover → pdf → apply
   ↓          ↓        ↓        ↓        ↓       ↓      ↓
 JobSpy    3-tier   LLM 1-10  LLM JSON  LLM    HTML→  Claude
 Workday   cascade  scoring   + judge   gen    PDF    Code
 Smart     extract           + retry          (PW)   + MCP
 Extract   (JSON-LD                                  + Chrome
            CSS,LLM)
```

| Stage | What Happens | Module |
|-------|-------------|--------|
| **1. Discover** | Scrapes 5 job boards (Indeed, LinkedIn, Glassdoor, ZipRecruiter, Google Jobs) + 48 Workday employer portals + 30 direct career sites | `discovery/jobspy.py`, `discovery/workday.py`, `discovery/smartextract.py` |
| **2. Enrich** | Fetches full job descriptions via 3-tier cascade: JSON-LD structured data → CSS selector patterns → AI-powered extraction for unknown layouts | `enrichment/detail.py` |
| **3. Score** | AI rates every job 1-10 against your profile. 9-10 = strong match, 7-8 = good, 5-6 = moderate, 1-4 = skip. Only high-fit jobs proceed | `scoring/scorer.py` |
| **4. Tailor** | AI rewrites your resume per job: reorders experience, emphasizes relevant skills, incorporates keywords. Your `resume_facts` (companies, projects, metrics) are preserved exactly. The AI reorganizes but never fabricates | `scoring/tailor.py` |
| **5. Cover Letter** | AI generates a targeted cover letter per job referencing the specific company, role, and how your experience maps to their requirements | `scoring/cover_letter.py` |
| **6. PDF** | Converts tailored resumes and cover letters to PDF via Playwright Chromium | `scoring/pdf.py` |
| **7. Auto-Apply** | Claude Code launches Chrome, navigates to each application page, detects form type, fills personal information and work history, uploads tailored resume and cover letter, answers screening questions with AI, and submits | `apply/launcher.py`, `apply/prompt.py`, `apply/chrome.py` |

Each stage is independent. Run them all or pick what you need:

```bash
applypilot run discover enrich     # discovery only
applypilot run score tailor cover  # AI stages only
applypilot run --stream            # concurrent stages (streaming mode)
applypilot run --min-score 8       # higher score threshold
applypilot run --dry-run           # preview without executing
```

### Validation Modes

The tailor and cover letter stages support three validation strictness levels:

| Mode | Banned Words | LLM Judge | API Calls | Best For |
|------|-------------|-----------|-----------|----------|
| `strict` | Errors (retry) | Must pass | Most | Production use with paid API keys |
| `normal` | Warnings only | Runs | Moderate | **Default** — recommended for Gemini free tier |
| `lenient` | Ignored | Skipped | Fewest | Fastest, fewest API calls |

```bash
applypilot run --validation lenient   # fastest, fewest API calls
applypilot run --validation strict    # strictest validation
```

---

## Web UI

ApplyPilot ships with a full-stack web UI that provides a visual command center for the entire pipeline. The CLI remains the canonical execution engine; the web UI is a control plane and dashboard.

### Pages

| Page | Route | Description |
|------|-------|-------------|
| **Dashboard** | `/` | Pipeline stats, score distribution, source breakdown, recent activity, quick actions |
| **Jobs** | `/jobs` | Filterable, sortable job table with slide-out detail panel (description, tailored resume diff, cover letter, apply history) |
| **Pipeline** | `/pipeline` | Stage selector, live progress monitor with WebSocket streaming, log viewer |
| **Apply** | `/apply` | Worker control panel, real-time worker status cards, event log, cost tracking |
| **Analytics** | `/analytics` | Score distribution chart, source performance, discovery timeline, pipeline funnel, apply results pie chart |
| **Config** | `/config` | Profile editor (8 sections), search config builder, resume upload, API key management |
| **Doctor** | `/doctor` | Health check card grid with status indicators and tier summary |

### Technology Stack

#### Backend

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Framework | FastAPI | Async, WebSocket support, auto-generated OpenAPI, Pydantic models |
| Server | Uvicorn | ASGI, production-grade, hot-reload in dev |
| Database | Existing SQLite (shared) | No migration needed — same `applypilot.db` the CLI uses |
| Task Queue | `asyncio.to_thread` + background tasks | Pipeline stages are CPU/IO bound; FastAPI background tasks sufficient for single-user |
| WebSocket | FastAPI WebSocket | Real-time pipeline status, apply dashboard, log streaming |
| Validation | Pydantic v2 | Type-safe request/response models, profile schema validation |

#### Frontend

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Framework | Next.js 15 (App Router) | SSR for initial load, client components for interactivity, file-based routing |
| Language | TypeScript | Type safety, better DX |
| Styling | Tailwind CSS v4 | Rapid prototyping, dark mode, responsive, design tokens |
| State | Zustand | Lightweight, no boilerplate, WebSocket-friendly |
| Charts | Recharts | React-native charts, lightweight, composable |
| Icons | Lucide React | Clean, consistent, tree-shakeable |
| Toast/Notifications | sonner | Minimal, accessible |

### Real-Time Communication

Three WebSocket channels stream live events from the backend to the UI:

| Channel | Events | Used By |
|---------|--------|---------|
| `/ws/pipeline` | `stage_start`, `stage_progress`, `stage_complete`, `job_scored`, `job_tailored`, `pipeline_complete`, `pipeline_error`, `stats_update` | Pipeline page, Dashboard |
| `/ws/apply` | `workers_update`, `event`, `job_applied`, `job_failed`, `apply_complete` | Apply page |
| `/ws/logs` | `log_line` | Log viewer |

### API Endpoints

The FastAPI backend exposes 40+ REST endpoints across 8 route groups:

| Group | Prefix | Key Endpoints |
|-------|--------|---------------|
| Stats | `/api/stats` | `GET /`, `GET /score-distribution`, `GET /by-site`, `GET /timeline` |
| Jobs | `/api/jobs` | `GET /` (filtered, paginated), `GET /:url`, `GET /:url/resume`, `GET /:url/cover-letter`, `PUT /:url/score`, `DELETE /:url` |
| Pipeline | `/api/pipeline` | `POST /run`, `GET /status`, `POST /cancel` |
| Apply | `/api/apply` | `POST /start`, `POST /stop`, `GET /status`, `POST /mark`, `POST /reset-failed`, `POST /gen-prompt` |
| Config | `/api/config` | `GET/PUT /profile`, `GET/PUT /searches`, `GET/PUT /env`, `GET/PUT /resume`, `GET /employers`, `GET /sites` |
| Doctor | `/api/doctor` | `GET /` |
| Files | `/api/files` | `GET /resume/:filename`, `GET /cover-letter/:filename`, `GET /log/:filename` |
| Health | `/api/health` | `GET /` |

Full OpenAPI documentation available at [http://localhost:8000/docs](http://localhost:8000/docs) when the API server is running.

---

## Architecture

### System Overview

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
│  │  PipelineService  JobService  ConfigService  ApplyService  │  │
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

### Key Architectural Decisions

1. **Service Layer as Bridge** — Each service class wraps calls to existing `applypilot` modules, adding async wrappers, event emission, and error handling. **Zero changes** to the existing Python package.

2. **Shared Database** — The API reads/writes the same SQLite database the CLI uses. WAL mode already supports concurrent readers. For write contention, the service layer serializes pipeline runs.

3. **Background Task Execution** — Pipeline stages run as `asyncio.to_thread()` background tasks. A task registry tracks active runs, allows cancellation, and emits progress events via WebSocket.

4. **WebSocket Event Bus** — A central event bus collects events from pipeline stages (via callback injection) and broadcasts to connected WebSocket clients. Events are typed (`stage_progress`, `job_scored`, `apply_status`, etc.).

### Data Architecture

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

### Project Structure

```
ApplyPilot/
├── src/applypilot/              # Core Python package (CLI + pipeline)
│   ├── cli.py                   # Typer CLI: init, run, apply, status, dashboard, doctor, web
│   ├── config.py                # Paths, tier detection, profile/search/sites loaders, Chrome detection
│   ├── database.py              # SQLite schema (30 columns), migrations, stats, job CRUD
│   ├── llm.py                   # Multi-provider (Gemini/OpenAI/Local), rate-limit retry
│   ├── pipeline.py              # Stage orchestration: sequential & streaming (concurrent) mode
│   ├── view.py                  # Static HTML dashboard generator
│   ├── discovery/               # Job discovery scrapers
│   │   ├── jobspy.py            # Indeed/LinkedIn/Glassdoor/ZipRecruiter via python-jobspy
│   │   ├── workday.py           # Workday CXS API for 48+ employer portals
│   │   └── smartextract.py      # AI-powered extraction from 30+ direct career sites
│   ├── enrichment/
│   │   └── detail.py            # 3-tier description extraction: JSON-LD → CSS → LLM
│   ├── scoring/
│   │   ├── scorer.py            # LLM fit scoring (1-10) with structured output parsing
│   │   ├── tailor.py            # LLM resume tailoring with JSON output, judge layer, retries
│   │   ├── cover_letter.py      # LLM cover letter generation with validation
│   │   ├── validator.py         # Banned words, fabrication detection, structural checks
│   │   └── pdf.py               # Text→HTML→PDF via Playwright Chromium
│   ├── apply/
│   │   ├── launcher.py          # Job acquisition, Claude Code sessions, parallel workers
│   │   ├── prompt.py            # Profile-driven prompt builder for autonomous form filling
│   │   ├── chrome.py            # Chrome lifecycle: profile cloning, CDP launch, cleanup
│   │   └── dashboard.py         # Rich terminal live dashboard for apply progress
│   └── wizard/
│       └── init.py              # Interactive first-time setup wizard
├── web/                         # Web UI (NEW)
│   ├── api/                     # FastAPI backend
│   │   ├── main.py              # App factory, CORS, lifespan
│   │   ├── deps.py              # Dependency injection
│   │   ├── models/              # Pydantic schemas (job, pipeline, apply, config, events)
│   │   ├── routers/             # Route modules (stats, jobs, pipeline, apply, config, doctor, files, ws)
│   │   └── services/            # Bridge to applypilot modules (event_bus, task_registry, pipeline_service, job_service, config_service, apply_service)
│   ├── ui/                      # Next.js frontend
│   │   ├── app/                 # App Router pages (14 routes)
│   │   ├── components/          # UI components (layout, dashboard, jobs, pipeline, apply, config, shared)
│   │   ├── lib/                 # Utilities, API client, WebSocket, types
│   │   ├── stores/              # Zustand stores (jobs, pipeline, apply, config)
│   │   └── hooks/               # Custom React hooks
│   └── scripts/                 # Dev server scripts
├── adr/                         # Architecture Decision Records
│   └── ui-plan.md               # ADR-001: Web UI Architecture & Implementation Plan
├── pyproject.toml
└── README.md
```

---

## CLI Reference

```
applypilot init                         # First-time setup wizard
applypilot doctor                       # Verify setup, diagnose missing requirements
applypilot run [stages...]              # Run pipeline stages (or 'all')
applypilot run --workers 4              # Parallel discovery/enrichment
applypilot run --stream                 # Concurrent stages (streaming mode)
applypilot run --min-score 8            # Override score threshold
applypilot run --dry-run                # Preview without executing
applypilot run --validation lenient     # Relax validation (recommended for Gemini free tier)
applypilot run --validation strict      # Strictest validation (retries on any banned word)
applypilot apply                        # Launch auto-apply
applypilot apply --workers 3            # Parallel browser workers
applypilot apply --dry-run              # Fill forms without submitting
applypilot apply --continuous           # Run forever, polling for new jobs
applypilot apply --headless             # Headless browser mode
applypilot apply --url URL              # Apply to a specific job
applypilot apply --mark-applied URL     # Manually mark a job as applied
applypilot apply --mark-failed URL      # Manually mark a job as failed
applypilot apply --reset-failed         # Reset all failed jobs for retry
applypilot apply --gen --url URL        # Generate prompt file for manual debugging
applypilot status                       # Pipeline statistics
applypilot dashboard                    # Open HTML results dashboard
applypilot web                          # Launch web UI (API + frontend)
applypilot web --port 8000 --ui-port 3000  # Custom ports
```

---

## Configuration

All generated by `applypilot init`:

### `profile.json`

Your personal data in one structured file with 8 sections:

| Section | Fields |
|---------|--------|
| **personal** | full_name, preferred_name, email, password, phone, address, URLs |
| **work_authorization** | legally_authorized, require_sponsorship, work_permit_type |
| **availability** | earliest_start_date, full_time, contract |
| **compensation** | salary_expectation, currency, range min/max, conversion_note |
| **experience** | years_total, education_level, current_title, current_company, target_role |
| **skills_boundary** | languages, frameworks, devops, databases, tools (dynamic key-value) |
| **resume_facts** | preserved_companies, preserved_projects, preserved_school, real_metrics |
| **eeo_voluntary** | gender, race, veteran, disability |

### `searches.yaml`

```yaml
searches:
  - query: "Senior Software Engineer"
    location: "Remote"
    boards: ["indeed", "linkedin", "glassdoor", "ziprecruiter"]
    max_results: 100
  - query: "Staff Engineer"
    location: "San Francisco, CA"
    boards: ["indeed", "linkedin"]
    max_results: 50

location:
  accept: ["Remote", "United States"]
  reject: []
```

### `.env`

```env
GEMINI_API_KEY=your_key_here
LLM_MODEL=gemini-2.0-flash
CAPSOLVER_API_KEY=optional_key_here
```

### Package configs (shipped with ApplyPilot)

- `config/employers.yaml` — Workday employer registry (48 preconfigured)
- `config/sites.yaml` — Direct career sites (30+), blocked sites, base URLs, manual ATS domains
- `config/searches.example.yaml` — Example search configuration

---

## Tier System

ApplyPilot uses a 3-tier system to gate features based on available dependencies:

| Tier | Label | Requirements | Unlocks |
|------|-------|-------------|---------|
| 1 | Discovery | Python 3.11+ | `init`, `run discover/enrich`, `status`, `dashboard`, `doctor` |
| 2 | AI Scoring & Tailoring | + LLM API key (Gemini/OpenAI/Local) | `run score/tailor/cover/pdf`, `run` (all) |
| 3 | Full Auto-Apply | + Claude Code CLI + Chrome + Node.js | `apply`, `applypilot web` (apply page) |

The web UI respects tier gating: AI stages are disabled at Tier 1, the Apply page is locked at Tier 2, and the sidebar shows your current tier.

---

## ApplyPilot vs The Alternatives

| Feature | ApplyPilot | AIHawk | Manual |
|---------|-----------|--------|--------|
| Job discovery | 5 boards + Workday + direct sites | LinkedIn only | One board at a time |
| AI scoring | 1-10 fit score per job | Basic filtering | Your gut feeling |
| Resume tailoring | Per-job AI rewrite | Template-based | Hours per application |
| Auto-apply | Full form navigation + submission | LinkedIn Easy Apply only | Click, type, repeat |
| Supported sites | Indeed, LinkedIn, Glassdoor, ZipRecruiter, Google Jobs, 48 Workday portals, 30+ direct sites | LinkedIn | Whatever you open |
| Web UI | Full visual command center with real-time monitoring | None | N/A |
| License | AGPL-3.0 | MIT | N/A |

---

## Requirements

| Component | Required For | Details |
|-----------|-------------|---------|
| Python 3.11+ | Everything | Core runtime |
| Node.js 18+ | Auto-apply, Web UI | Needed for `npx` to run Playwright MCP server |
| Gemini API key | Scoring, tailoring, cover letters | Free tier (15 RPM / 1M tokens/day) is enough |
| Chrome/Chromium | Auto-apply | Auto-detected on most systems |
| Claude Code CLI | Auto-apply | Install from [claude.ai/code](https://claude.ai/code) |

**Gemini API key is free.** Get one at [aistudio.google.com](https://aistudio.google.com). OpenAI and local models (Ollama/llama.cpp) are also supported.

### Optional

| Component | What It Does |
|-----------|-------------|
| CapSolver API key | Solves CAPTCHAs during auto-apply (hCaptcha, reCAPTCHA, Turnstile, FunCaptcha). Without it, CAPTCHA-blocked applications just fail gracefully |

> **Note:** python-jobspy is installed separately with `--no-deps` because it pins an exact numpy version in its metadata that conflicts with pip's resolver. It works fine with modern numpy at runtime.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, coding standards, and PR guidelines.

### Development Setup

```bash
git clone https://github.com/Pickle-Pixel/ApplyPilot.git
cd ApplyPilot
pip install -e ".[dev,web]"
cd web/ui && npm install
```

### Running Tests

```bash
pytest
ruff check src/ web/api/
cd web/ui && npx next build
```

---

## License

ApplyPilot is licensed under the [GNU Affero General Public License v3.0](LICENSE).

You are free to use, modify, and distribute this software. If you deploy a modified version as a service, you must release your source code under the same license.
