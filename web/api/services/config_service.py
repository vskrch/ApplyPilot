"""Config service — bridge between API and applypilot config module."""

from __future__ import annotations

import json
import os
import shutil

import yaml

from applypilot.config import (
    CONFIG_DIR,
    ENV_PATH,
    PROFILE_PATH,
    RESUME_PDF_PATH,
    RESUME_PATH,
    SEARCH_CONFIG_PATH,
    get_chrome_path,
    get_tier,
    TIER_LABELS,
    load_profile,
    load_search_config,
    load_sites_config,
    load_env,
)


def get_profile() -> dict:
    """Load the user profile."""
    if not PROFILE_PATH.exists():
        return {}
    return load_profile()


def save_profile(data: dict) -> None:
    """Save the user profile."""
    PROFILE_PATH.parent.mkdir(parents=True, exist_ok=True)
    PROFILE_PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


def get_searches() -> dict:
    """Load search configuration."""
    return load_search_config()


def save_searches(data: dict) -> None:
    """Save search configuration."""
    SEARCH_CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
    SEARCH_CONFIG_PATH.write_text(
        yaml.dump(data, default_flow_style=False, sort_keys=False),
        encoding="utf-8",
    )


def get_env_config() -> dict:
    """Get env config status without exposing raw keys."""
    load_env()
    return {
        "gemini_key_set": bool(os.environ.get("GEMINI_API_KEY")),
        "openai_key_set": bool(os.environ.get("OPENAI_API_KEY")),
        "llm_url": os.environ.get("LLM_URL"),
        "llm_model": os.environ.get("LLM_MODEL"),
        "capsolver_key_set": bool(os.environ.get("CAPSOLVER_API_KEY")),
    }


def save_env_config(data: dict) -> dict:
    """Update .env file with new values. Returns updated status + tier."""
    existing: dict[str, str] = {}
    if ENV_PATH.exists():
        for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.startswith("#"):
                key = line.split("=", 1)[0].strip()
                existing[key] = line

    for key, value in data.items():
        env_key = key.upper()
        if value is not None and value != "":
            existing[env_key] = f"{env_key}={value}"
        else:
            # Empty/None value removes the key from the env file
            existing.pop(env_key, None)

    env_content = "\n".join(existing.values()) + "\n"
    ENV_PATH.parent.mkdir(parents=True, exist_ok=True)
    ENV_PATH.write_text(env_content, encoding="utf-8")

    # Reload env
    load_env()
    tier = get_tier()

    return {"saved": True, "tier": tier}


def get_doctor_results() -> dict:
    """Run all doctor checks and return results."""
    results: list[dict] = []

    # Tier 1 checks
    if PROFILE_PATH.exists():
        results.append({"name": "profile.json", "status": "ok", "note": str(PROFILE_PATH)})
    else:
        results.append({"name": "profile.json", "status": "missing", "note": "Run 'applypilot init' to create"})

    if RESUME_PATH.exists():
        results.append({"name": "resume.txt", "status": "ok", "note": str(RESUME_PATH)})
    elif RESUME_PDF_PATH.exists():
        results.append({"name": "resume.txt", "status": "warn", "note": "Only PDF found — plain-text needed for AI stages"})
    else:
        results.append({"name": "resume.txt", "status": "missing", "note": "Run 'applypilot init' to add your resume"})

    if SEARCH_CONFIG_PATH.exists():
        results.append({"name": "searches.yaml", "status": "ok", "note": str(SEARCH_CONFIG_PATH)})
    else:
        results.append({"name": "searches.yaml", "status": "warn", "note": "Will use example config"})

    try:
        import jobspy  # noqa: F401
        results.append({"name": "python-jobspy", "status": "ok", "note": "Job board scraping available"})
    except ImportError:
        results.append({"name": "python-jobspy", "status": "warn", "note": "pip install python-jobspy"})

    # Tier 2 checks
    load_env()
    has_gemini = bool(os.environ.get("GEMINI_API_KEY"))
    has_openai = bool(os.environ.get("OPENAI_API_KEY"))
    has_local = bool(os.environ.get("LLM_URL"))
    if has_gemini:
        results.append({"name": "LLM API key", "status": "ok", "note": "Gemini configured"})
    elif has_openai:
        results.append({"name": "LLM API key", "status": "ok", "note": "OpenAI configured"})
    elif has_local:
        results.append({"name": "LLM API key", "status": "ok", "note": f"Local: {os.environ.get('LLM_URL')}"})
    else:
        results.append({"name": "LLM API key", "status": "missing", "note": "Set GEMINI_API_KEY or OPENAI_API_KEY"})

    # Tier 3 checks
    claude_bin = shutil.which("claude")
    results.append({
        "name": "Claude Code CLI",
        "status": "ok" if claude_bin else "missing",
        "note": claude_bin or "Install from https://claude.ai/code",
    })

    try:
        chrome_path = get_chrome_path()
        results.append({"name": "Chrome/Chromium", "status": "ok", "note": chrome_path})
    except FileNotFoundError:
        results.append({"name": "Chrome/Chromium", "status": "missing", "note": "Install Chrome or set CHROME_PATH"})

    npx_bin = shutil.which("npx")
    results.append({
        "name": "Node.js (npx)",
        "status": "ok" if npx_bin else "missing",
        "note": npx_bin or "Install Node.js 18+",
    })

    capsolver = os.environ.get("CAPSOLVER_API_KEY")
    results.append({
        "name": "CapSolver API key",
        "status": "ok" if capsolver else "optional",
        "note": "CAPTCHA solving" if capsolver else "Optional — for CAPTCHA solving",
    })

    tier = get_tier()
    return {
        "tier": tier,
        "tier_label": TIER_LABELS.get(tier, "Unknown"),
        "checks": results,
    }


def get_resume_content() -> dict:
    """Get resume text content and PDF status."""
    text = ""
    if RESUME_PATH.exists():
        text = RESUME_PATH.read_text(encoding="utf-8")
    return {
        "text": text,
        "has_pdf": RESUME_PDF_PATH.exists(),
    }


def save_resume(txt_content: str | None = None) -> dict:
    """Save resume content."""
    if txt_content is not None:
        RESUME_PATH.parent.mkdir(parents=True, exist_ok=True)
        RESUME_PATH.write_text(txt_content, encoding="utf-8")
    return {"saved": True}


def get_employers_config() -> dict:
    """Load employers.yaml."""
    path = CONFIG_DIR / "employers.yaml"
    if path.exists():
        return yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    return {}


def get_sites_config() -> dict:
    """Load sites.yaml."""
    return load_sites_config()
