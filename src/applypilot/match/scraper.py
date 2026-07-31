"""Batch scraper: query job platforms and filter to matched jobs.

Architecture (no hardcoded selectors — works for any job board):

  1. crawl4ai renders each target URL (handles JS-rendered boards, anti-bot
     via stealth/simulate_user, lazy-load via scan_full_page). Produces
     cleaned HTML + markdown.
  2. Extraction, in priority order:
       a. JSON-LD JobPosting entries from the rendered HTML (schema.org —
          most modern boards emit this once JS runs).
       b. LLM extraction: feed crawl4ai's markdown to the existing
          applypilot.llm client with a job schema. Generic — reads any
          board layout. Only runs when an LLM key is configured.
       c. Structured markdown fallback: parse job-like links + surrounding
          text from the markdown. Last resort, no hardcoding.
  3. Location + criteria filter (keyword tokens, no per-site logic).

jobspy is not installed; crawl4ai + LLM extraction covers LinkedIn-style
and remote startup boards generically. Swap in jobspy later for raw volume.
"""

from __future__ import annotations

import asyncio
import json
import logging
import re
from urllib.parse import urljoin

import yaml
from bs4 import BeautifulSoup

from applypilot.config import CONFIG_DIR

log = logging.getLogger(__name__)

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
_PAGE_TIMEOUT = 40_000


def _load_sites() -> list[dict]:
    path = CONFIG_DIR / "sites.yaml"
    if not path.exists():
        return []
    data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    return data.get("sites", [])


def _location_tokens(location: str) -> list[str]:
    if not location:
        return []
    cleaned = re.sub(r"[()]", " ", location.lower())
    tokens = []
    for tok in re.split(r"[,;/]|\s+and\s+|\s+or\s+|\s+", cleaned):
        tok = tok.strip()
        if tok and tok not in tokens:
            tokens.append(tok)
    return tokens


def _location_ok(job_loc: str | None, tokens: list[str]) -> bool:
    # Unknown location: keep — remote boards often omit it. ponytail: tighter
    # geofilter would drop unknowns, add when precision matters.
    if not job_loc or not job_loc.strip():
        return True
    if not tokens:
        return True
    loc = job_loc.lower()
    if any(w in loc for w in ("remote", "anywhere", "work from home", "wfh", "distributed", "worldwide")):
        return True
    return any(t in loc for t in tokens)


def _criteria_ok(job: dict, criteria: dict) -> bool:
    blob = f"{job.get('title','')} {job.get('description','')}".lower()
    if not blob.strip():
        return False
    excludes = [e.lower() for e in (criteria.get("exclude_titles") or [])]
    title = (job.get("title") or "").lower()
    if any(e and e in title for e in excludes):
        return False
    needles = set()
    for q in (criteria.get("queries") or []):
        needles.update(q.lower().split())
    for s in (criteria.get("skills") or []):
        needles.update(s.lower().split())
    role = (criteria.get("role_type") or "").lower()
    if role:
        needles.update(role.split())
    return any(n and n in blob for n in needles) if needles else True


# -- JSON-LD extraction (no hardcoding — schema.org standard) ----------------

def _stringify_location(loc) -> str | None:
    if loc is None:
        return None
    if isinstance(loc, str):
        return loc
    if isinstance(loc, dict):
        addr = loc.get("address", loc)
        if isinstance(addr, dict):
            return ", ".join(filter(None, [
                addr.get("addressLocality"), addr.get("addressRegion"), addr.get("addressCountry"),
            ])) or None
        return str(addr) if addr else None
    if isinstance(loc, list):
        parts = [_stringify_location(x) for x in loc]
        return ", ".join(p for p in parts if p) or None
    return None


def _company(e: dict) -> str | None:
    c = e.get("hiringOrganization") or e.get("employerOverview")
    if isinstance(c, dict):
        return c.get("name")
    return c if isinstance(c, str) else None


def _from_json_ld(e: dict, base_url: str) -> dict:
    def g(k, *path):
        v = e.get(k)
        if v is None and path:
            v = e
            for p in path:
                v = v.get(p) if isinstance(v, dict) else None
        return v

    url = g("url") or base_url
    if url and not url.startswith("http"):
        url = urljoin(base_url, url)
    return {
        "title": _clean_text(g("title")),
        "company": _company(e),
        "location": _stringify_location(g("jobLocation")),
        "description": _clean_text((g("description") or "")[:4000]),
        "url": url,
        "posting_date": g("datePosted"),
    }


def _clean_text(text) -> str | None:
    """Strip markdown noise (images, bold, alt-text) that bleeds into JSON-LD."""
    if not text or not isinstance(text, str):
        return text
    t = text
    # Remove markdown images: ![alt](url)
    t = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", t)
    # Remove markdown links, keep text: [text](url) -> text
    t = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", t)
    # Strip bold/italic markers
    t = t.replace("**", "").replace("__", "").replace("*", "").replace("`", "")
    # Collapse whitespace and non-breaking spaces
    t = t.replace("\xa0", " ")
    t = re.sub(r"\s+", " ", t).strip()
    return t or None


def _extract_json_ld(soup: BeautifulSoup, base_url: str) -> list[dict]:
    jobs: list[dict] = []
    for el in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(el.string or "")
        except Exception:
            continue
        entries = data if isinstance(data, list) else [data]
        for e in entries:
            if not isinstance(e, dict):
                continue
            t = e.get("@type")
            if t == "JobPosting":
                jobs.append(_from_json_ld(e, base_url))
            elif t == "JobPostings" and isinstance(e.get("jobPostings"), list):
                jobs.extend(_from_json_ld(j, base_url) for j in e["jobPostings"] if isinstance(j, dict))
            elif isinstance(e.get("@graph"), list):
                entries.extend(e["@graph"])
    return [j for j in jobs if _valid_job(j)]


def _valid_job(j: dict) -> bool:
    """Reject entries that are clearly not real job postings (broken JSON-LD
    or category/listing/search pages masquerading as jobs)."""
    url = (j.get("url") or "").strip()
    if not url or _IMAGE_EXT_RE.search(url):
        return False
    if _CATEGORY_SUFFIX_RE.search(url):
        return False
    # Search/listing pages have query params on a jobs path — not individual postings.
    if re.search(r"/jobs?/?(\?|$)", url, re.I) and any(q in url for q in ("?q=", "?keywords=", "?search", "?k=", "?query=")):
        return False
    title = (j.get("title") or "").strip()
    if not title:
        return False
    low = title.lower()
    if any(low.startswith(s) or s in low for s in _NAV_SKIP):
        return False
    # Titles polluted with markdown image syntax mean the board's JSON-LD is
    # malformed (e.g. RemoteOK stuffs logo markup into title). Drop them.
    if title.startswith("![") or "![\"" in title:
        return False
    return True


# -- LLM extraction (generic — no per-site selectors) ------------------------

_LLM_JOB_PROMPT = """You are extracting job postings from a web page's markdown.

Return ONLY a JSON object: {"jobs": [{"title": "...", "company": "...", "location": "...", "url": "full URL to the job posting or application page", "description": "1-2 sentence summary", "posting_date": "date if visible else null"}]}

Rules:
- Extract EVERY distinct job posting visible on the page.
- "url" must be the full absolute URL to that specific job (the application/detail link), not the listing page.
- Omit a field only if truly not present; never invent values.
- Skip navigation, marketing, "post a job", and non-job entries.
- No prose, no markdown fences, only the JSON object.

PAGE MARKDOWN:
{markdown}"""


def _llm_extract(markdown: str) -> list[dict]:
    """Generic LLM extraction via the existing applypilot.llm client.

    Returns [] if no LLM is configured or the call fails (caller falls back
    to structured parsing).
    """
    try:
        from applypilot.llm import get_client
        client = get_client()
    except Exception:
        return []
    # Cap markdown to keep prompts bounded; boards have long nav/footer noise.
    md = markdown[:20_000]
    try:
        raw = client.ask(_LLM_JOB_PROMPT.format(markdown=md), temperature=0.0, max_tokens=6000)
    except Exception as e:
        log.debug("LLM extract failed: %s", e)
        return []
    return _parse_llm_jobs(raw)


def _parse_llm_jobs(raw: str) -> list[dict]:
    text = raw.strip()
    if "```json" in text:
        text = text.split("```json", 1)[1].split("```", 1)[0]
    elif "```" in text:
        text = text.split("```", 1)[1].split("```", 1)[0]
    text = text.strip()
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        # Try to locate the first {...jobs...} object
        m = re.search(r"\{[\s\S]*\"jobs\"[\s\S]*\}", text)
        if not m:
            return []
        try:
            data = json.loads(m.group(0))
        except json.JSONDecodeError:
            return []
    jobs = data.get("jobs", []) if isinstance(data, dict) else (data if isinstance(data, list) else [])
    out = []
    for j in jobs:
        if not isinstance(j, dict):
            continue
        url = j.get("url")
        if not url:
            continue
        out.append({
            "title": j.get("title"),
            "company": j.get("company"),
            "location": j.get("location"),
            "description": (j.get("description") or "")[:4000],
            "url": url,
            "posting_date": j.get("posting_date"),
        })
    return out


# -- Structured markdown fallback (no hardcoding) ----------------------------

_TITLE_SIGNALS = ("engineer", "developer", "manager", "designer", "scientist",
                  "analyst", "remote", "specialist", "lead", "architect",
                  "consultant", "programmer", "director", "writer", "marketer",
                  "head of", "owner", "advocate", "recruiter", "operator")
_NAV_SKIP = ("hire ", "explore", "salary", "pricing", "sign ", "log in", "login",
             "how it works", "about", "post a job", "newsletter", "subscribe",
             "privacy", "terms", "cookie", "contact", "twitter", "linkedin", "github",
             "engineering & design", "digital & product", "all jobs", "view all",
             "browse", "search jobs", "job categories", "job category")
_JOB_PATH_RE = re.compile(r"(/job|/jobs/|/jobsearch|/role|/position|/careers/|/listing|/vacanc|/opportunit|/apply|/remote-jobs?/|/remote-work/)", re.I)
_IMAGE_EXT_RE = re.compile(r"\.(png|jpe?g|gif|webp|svg|ico|bmp|avif)(\?|$)", re.I)
# Category/listing pages end with these — they are not individual postings.
_CATEGORY_SUFFIX_RE = re.compile(r"/(s-|search|browse|category|categories|explore|all-jobs|job-seeker)[^/]*/?$", re.I)


def _extract_from_markdown(markdown: str, base_url: str) -> list[dict]:
    """Fallback: parse job-like markdown links + their surrounding text.

    Generic — relies on markdown link syntax `[text](url)` and job-like path
    segments, no per-site selectors.
    """
    jobs: list[dict] = []
    seen = set()
    # Match markdown links: [text](url)  (capture optional preceding title line)
    for m in re.finditer(r"\[([^\]]+)\]\(([^)]+)\)", markdown):
        text = m.group(1).strip()
        href = m.group(2).strip()
        if not href or href.startswith(("#", "mailto:", "javascript:")):
            continue
        if not (8 <= len(text) <= 160):
            continue
        low = text.lower()
        if any(low.startswith(s) or s in low for s in _NAV_SKIP):
            continue
        if not any(sig in low for sig in _TITLE_SIGNALS):
            continue
        if not _JOB_PATH_RE.search(href):
            continue
        url = urljoin(base_url, href)
        if url in seen:
            continue
        seen.add(url)
        # Grab a few words after the link as a description snippet
        tail = markdown[m.end():m.end() + 200].lstrip(" \n-|")
        desc = _clean_text(tail.split("\n", 1)[0].strip()[:200])
        job = {"title": _clean_text(text), "company": None, "location": None,
               "description": desc, "url": url, "posting_date": None}
        if _valid_job(job):
            jobs.append(job)
    return jobs


# -- crawl4ai rendering -------------------------------------------------------

def _build_browser_config():
    from crawl4ai import BrowserConfig
    return BrowserConfig(
        headless=True,
        user_agent=UA,
        viewport_width=1280,
        viewport_height=900,
        text_mode=True,        # skip images for speed
        ignore_https_errors=True,
    )


def _build_run_config():
    from crawl4ai import CrawlerRunConfig, CacheMode
    return CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        page_timeout=_PAGE_TIMEOUT,
        wait_until="domcontentloaded",
        scan_full_page=True,        # scroll to load lazy/infinite content
        max_scroll_steps=5,
        scroll_delay=0.4,
        remove_overlay_elements=True,
        remove_consent_popups=True,
        simulate_user=True,         # anti-bot: mimic mouse movement
        magic=True,                 # anti-bot: stealth popups/consent
        verbose=False,
        word_count_threshold=10,
    )


async def _crawl_one(url: str) -> tuple[str, str]:
    """Render one URL with crawl4ai. Returns (cleaned_html, markdown).

    Resilient: retries internally via crawl4ai; on failure returns ("", "").
    """
    from crawl4ai import AsyncWebCrawler
    try:
        async with AsyncWebCrawler(config=_build_browser_config()) as crawler:
            r = await crawler.arun(url=url, config=_build_run_config())
            if r.success:
                return (r.cleaned_html or ""), (r.markdown or "")
            log.warning("crawl4ai failed for %s: %s", url, (r.error_message or "")[:120])
    except Exception as e:
        log.warning("crawl4ai error for %s: %s", url, e)
    return "", ""


def _extract_jobs(html: str, markdown: str, base_url: str) -> list[dict]:
    """Run all extraction strategies on rendered content. No hardcoding."""
    jobs: list[dict] = []
    if html:
        soup = BeautifulSoup(html, "html.parser")
        jobs = _extract_json_ld(soup, base_url)
    if not jobs and markdown:
        jobs = _llm_extract(markdown)
    if not jobs and markdown:
        jobs = _extract_from_markdown(markdown, base_url)
    return jobs


def _fetch_one(site: dict, query: str, location_encoded: str) -> list[dict]:
    """Fetch + extract one target synchronously (runs the async crawler)."""
    from urllib.parse import quote_plus
    name = site.get("name", "?")
    url = site.get("url", "")
    url = (url
          .replace("{query_encoded}", quote_plus(query))
          .replace("{location_encoded}", location_encoded or quote_plus("remote")))
    if not url.startswith("http"):
        return []

    html, markdown = asyncio.run(_crawl_one(url))
    if not html and not markdown:
        return []
    jobs = _extract_jobs(html, markdown, url)
    if jobs:
        log.info("[%s] %d jobs (query=%s)", name, len(jobs), query)
    return jobs


# -- Batch --------------------------------------------------------------------

def batch_scrape(criteria: dict, location: str, max_workers: int = 3) -> list[dict]:
    """Scrape major platforms (LinkedIn, Indeed, Glassdoor, Google Jobs) via JobSpy + direct sites."""
    from urllib.parse import quote_plus
    queries = criteria.get("queries") or ["software engineer"]
    loc_tokens = _location_tokens(location)
    target_loc = location.strip() or "Remote"

    all_jobs: list[dict] = []
    seen: set[str] = set()

    # 1. Scrape via JobSpy (LinkedIn, Indeed, Glassdoor, Google Jobs)
    try:
        from jobspy import scrape_jobs
        for q in queries[:3]:
            try:
                log.info("JobSpy scraping query='%s', location='%s'", q, target_loc)
                df = scrape_jobs(
                    site_name=["indeed", "linkedin", "glassdoor", "google"],
                    search_term=q,
                    location=target_loc,
                    results_wanted=20,
                    hours_old=168,
                )
                if df is not None and not df.empty:
                    for _, row in df.iterrows():
                        u = str(row.get("job_url", "")).strip()
                        if not u or u == "nan" or u in seen:
                            continue
                        t = str(row.get("title", "")) if str(row.get("title", "")) != "nan" else None
                        comp = str(row.get("company", "")) if str(row.get("company", "")) != "nan" else None
                        loc = str(row.get("location", "")) if str(row.get("location", "")) != "nan" else target_loc
                        desc = str(row.get("description", "")) if str(row.get("description", "")) != "nan" else None
                        st = str(row.get("site", "jobspy"))
                        dt = str(row.get("date_posted", "")) if str(row.get("date_posted", "")) != "nan" else ""

                        job_dict = {
                            "url": u,
                            "title": t or "Untitled Role",
                            "company": comp,
                            "location": loc,
                            "description": desc,
                            "posting_date": dt,
                            "site": st,
                            "platform": st,
                        }

                        if _keep(job_dict, seen, loc_tokens, criteria):
                            all_jobs.append(job_dict)
            except Exception as ex:
                log.warning("JobSpy scrape error for query '%s': %s", q, ex)
    except Exception as e:
        log.warning("JobSpy unavailable or failed: %s", e)

    # 2. Fallback to direct sites config only if JobSpy returned few results
    if len(all_jobs) < 5:
        sites = _load_sites()
        if sites:
            loc_enc = quote_plus(target_loc.split(",")[0].strip() or "remote")
            for s in sites[:3]:
                try:
                    for j in _fetch_one(s, queries[0], loc_enc):
                        if _keep(j, seen, loc_tokens, criteria):
                            all_jobs.append(j)
                except Exception as e:
                    log.warning("direct site scrape error: %s", e)

    # 3. Store matches in ApplyPilot SQLite database
    if all_jobs:
        try:
            from applypilot.database import get_connection, store_jobs
            conn = get_connection()
            db_jobs = []
            for j in all_jobs:
                db_jobs.append({
                    "url": j["url"],
                    "title": j["title"],
                    "company": j.get("company"),
                    "location": j.get("location"),
                    "site": j.get("site", "jobspy"),
                    "description": j.get("description"),
                })
            store_jobs(conn, db_jobs, "multi-board", "jobspy")
        except Exception as e:
            log.warning("Failed to store matched jobs in SQLite DB: %s", e)

    log.info("Matched %d jobs across LinkedIn/Indeed/Glassdoor/Google + direct sites", len(all_jobs))
    return all_jobs


def _keep(j: dict, seen: set[str], loc_tokens: list[str], criteria: dict) -> bool:
    url = j.get("url")
    if not url or url in seen:
        return False
    if not _location_ok(j.get("location"), loc_tokens):
        return False
    if not _criteria_ok(j, criteria):
        return False
    seen.add(url)
    return True


def _demo() -> None:
    """Self-check: crawl4ai render + extraction shape on one board."""
    jobs = _fetch_one({"name": "RemoteOK", "url": "https://remoteok.com/remote-dev-jobs", "type": "static"}, "", "remote")
    assert isinstance(jobs, list)
    print(f"ok: {len(jobs)} jobs; sample keys={sorted(jobs[0].keys()) if jobs else 'none'}")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    _demo()