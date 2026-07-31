"""LLM layer: parse a free-text role description into structured job criteria.

Extracts explicit and implicit criteria (role type, skills, seniority,
industry, etc.) that the scraper uses to build search queries and filter
results.
"""

from __future__ import annotations

import json
import logging

from applypilot.llm import get_client

log = logging.getLogger(__name__)

PARSE_PROMPT = """You parse a job seeker's free-text "ideal role" description into structured search criteria.

Extract explicit AND implicit signals. Infer seniority, role family, and likely skills when the description implies them. Output ONLY a JSON object with these keys (omit a key if truly unknowable):
{{
  "queries": ["2-4 short search-term strings suitable for job-board query boxes, ordered by importance"],
  "role_type": "primary role family, e.g. software engineer, product manager, data scientist",
  "skills": ["required/likely skills"],
  "seniority": "intern|junior|mid|senior|staff|manager|director|any",
  "industry": "preferred industry if stated, else null",
  "exclude_titles": ["title fragments to reject, e.g. intern, senior director"],
  "remote_only": true|false
}}

No prose, no markdown fences.

ROLE DESCRIPTION:
{role}"""


def _strip_fences(text: str) -> str:
    if "```json" in text:
        text = text.split("```json", 1)[1].split("```", 1)[0]
    elif "```" in text:
        text = text.split("```", 1)[1].split("```", 1)[0]
    return text.strip()


def parse_role(role: str, location: str = "") -> dict:
    """Parse a role description into search criteria via the LLM.

    Falls back to a heuristic parse if the LLM is unavailable so the pipeline
    still runs end-to-end without an API key (Tier 1).
    """
    role = role.strip()
    if not role:
        return _heuristic(role, location)

    prompt = PARSE_PROMPT.format(role=role)
    try:
        client = get_client()
        raw = client.ask(prompt, temperature=0.0, max_tokens=1024)
        criteria = json.loads(_strip_fences(raw))
        if location:
            criteria["location"] = location
        # ponytail: ensure queries always non-empty; LLM occasionally returns []
        if not criteria.get("queries"):
            criteria["queries"] = [role]
        return criteria
    except Exception as e:
        log.warning("LLM parse failed (%s); using heuristic", e)
        return _heuristic(role, location)


def _heuristic(role: str, location: str) -> dict:
    """Last-resort parse: treat the whole string as one query."""
    return {
        "queries": [role] if role else ["software engineer"],
        "role_type": role or "software engineer",
        "skills": [],
        "seniority": "any",
        "industry": None,
        "exclude_titles": [],
        "remote_only": False,
        "location": location,
    }