# Task Implementation Plan: Production SaaS UI & API Wiring Upgrade

## Phase 1: Staff Audit & Architectural Plan
- [x] Audit backend routes, services, database bridge, and WebSockets
- [x] Audit frontend App Router pages, components, stores, design system, and API client
- [x] Present audit findings and detailed implementation plan to user for approval

## Phase 2: Backend API & Service Layer Refactoring
- [x] Fix route collisions in `web/api/routers/jobs.py` (refactor single-job endpoints to use query params `?url=...`)
- [x] Add missing single-job endpoints (`POST /api/jobs/mark`, `PUT /api/jobs/score`, `DELETE /api/jobs/detail`)
- [x] Enhance error handling and task cancellation in `pipeline_service.py` and `apply_service.py`
- [x] Update `web/api/main.py` and `deps.py` for clean service lifecycle management

## Phase 3: Frontend API Client & State Management Refactoring
- [x] Update `web/ui/lib/api.ts` to match query-param based job endpoints
- [x] Enhance `web/ui/stores/jobs.ts` with complete CRUD, single-job detail fetching, mark applied/failed, delete, re-tailor, re-score
- [x] Upgrade `web/ui/stores/pipeline.ts` and `stores/apply.ts` for robust WebSocket handling and state tracking
- [x] Fix Next.js App Router metadata conflict in `web/ui/app/layout.tsx` (split into Server Layout and Client Shell)

## Phase 4: Production SaaS Design System & Global Layout
- [x] Upgrade `web/ui/app/globals.css` with a SaaS dark-mode theme system (curated HSL palettes, glassmorphism backdrop blur, glowing borders, smooth micro-transitions, custom scrollbars)
- [x] Redesign `Sidebar.tsx` with active pill indicators, tier status badge, collapse toggle, and live WebSocket connection indicator
- [x] Create `Header.tsx` / `PageHeader.tsx` with breadcrumbs, quick actions, search, and system status
- [x] Add Toast Notifications via `sonner` across all user interactions

## Phase 5: Production SaaS Page & Component Redesign
- [x] **Jobs View (`/jobs`)**:
  - Re-architect `JobTable.tsx` with sleek row styling, hover states, status pills, and fully functional dropdown actions (View, Mark Applied, Mark Failed, Delete)
  - Redesign `JobFilters.tsx` with glassmorphic panel, stage pills, score range sliders, site dropdown, search input
  - Redesign `JobDetail.tsx` (slide-out drawer) with tabbed views (Overview, Description, Resume Diff, Cover Letter, Apply Logs)
- [x] **Pipeline Control (`/pipeline`)**:
  - Redesign stage control panel, live streaming logs with auto-scroll, real-time stage progress cards with duration and job throughput
- [x] **Apply Control (`/apply`)**:
  - Redesign worker state cards with live status indicators, active job title, current step, cost tracker, logs
- [x] **Config & Health Check (`/config` & `/doctor`)**:
  - Interactive profile editor with tabbed sections, search YAML builder, environment API keys (masked inputs), drag-and-drop resume upload
  - System health check diagnostic grid with status indicators

## Phase 6: End-to-End Verification & Testing
- [x] Test FastAPI API endpoints directly via Python initialization test
- [x] Build and verify Next.js frontend (`npm run build` completed with 0 errors)
- [x] Verify zero console errors, zero route collisions, fluid UI transitions, complete API wiring

---

## Review & Verification Results

- **FastAPI Backend**: Verified route parameter decoupling. All single-job endpoints (`/api/jobs/detail`, `/api/jobs/resume`, `/api/jobs/cover-letter`, `/api/jobs/score`, `/api/jobs/mark`, `/api/jobs/detail`) work via explicit query parameters without FastAPI path collisions.
- **Next.js Frontend Build**: Executed `npm run build` in `web/ui`. Compiled 14 static & dynamic pages successfully in Next.js 16 (Turbopack) with 0 errors.
- **SaaS Aesthetics**: Glassmorphism cards (`.glass-card`), glowing status pills, dark slate/indigo theme (`#0a0c10`), interactive action menus, side-by-side tailored resume & cover letter previews, and toast notifications (`sonner`).
