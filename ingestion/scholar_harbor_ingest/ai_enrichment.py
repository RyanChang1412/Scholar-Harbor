from __future__ import annotations

import hashlib
import json
import logging
import os
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Mapping

LOGGER = logging.getLogger(__name__)


class AIOutputError(ValueError):
    pass


@dataclass(frozen=True)
class ProviderRuntime:
    provider_id: str
    display_name: str
    api_key: str
    model: str
    base_url: str


def source_fingerprint(paper: dict[str, Any]) -> str:
    payload = {
        "id": paper["id"],
        "title": paper["title"],
        "abstract": paper["abstract"],
    }
    return hashlib.sha256(
        json.dumps(payload, sort_keys=True, ensure_ascii=False).encode()
    ).hexdigest()


def cache_key(
    paper: dict[str, Any], provider_id: str, model: str, prompt_version: str
) -> str:
    value = (
        f"{paper['id']}\0{source_fingerprint(paper)}\0{provider_id}"
        f"\0{model}\0{prompt_version}"
    )
    return hashlib.sha256(value.encode()).hexdigest()


def validate_ai_output(value: Any) -> dict[str, str]:
    required = {"researchProblem", "coreApproach", "researchRelevance"}
    if not isinstance(value, dict) or set(value) != required:
        raise AIOutputError("AI output must contain exactly the required sections")
    for key in required:
        if (
            not isinstance(value[key], str)
            or not value[key].strip()
            or len(value[key]) > 1200
        ):
            raise AIOutputError(f"AI output section is invalid: {key}")
    return {key: value[key].strip() for key in sorted(required)}


class CompatibleChatClient:
    """Small OpenAI-compatible adapter shared by configured providers."""

    def __init__(
        self,
        *,
        api_key: str,
        model: str,
        base_url: str,
        timeout_seconds: int,
    ):
        self.api_key = api_key
        self.model = model
        self.base_url = base_url.rstrip("/")
        self.timeout_seconds = timeout_seconds

    def summarize(
        self, paper: dict[str, Any], system_prompt: str
    ) -> dict[str, str]:
        body = {
            "model": self.model,
            "temperature": 0.1,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": (
                        f"Title: {paper['title']}\n\nAbstract: {paper['abstract']}"
                    ),
                },
            ],
        }
        request = urllib.request.Request(
            f"{self.base_url}/chat/completions",
            data=json.dumps(body).encode(),
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(
                request, timeout=self.timeout_seconds
            ) as response:
                payload = json.loads(response.read())
            content = payload["choices"][0]["message"]["content"]
            return validate_ai_output(json.loads(content))
        except (
            urllib.error.URLError,
            TimeoutError,
            KeyError,
            IndexError,
            json.JSONDecodeError,
        ) as error:
            raise AIOutputError(
                f"AI response unavailable or malformed: {type(error).__name__}"
            ) from error


def resolve_provider_runtime(
    config: dict[str, Any], environ: Mapping[str, str] | None = None
) -> ProviderRuntime | None:
    values = environ if environ is not None else os.environ
    ai = config.get("aiEnrichment", {})
    if not ai.get("enabled", False):
        return None
    provider_id = values.get("AI_PROVIDER") or ai.get("provider", "bailian")
    providers = ai.get("providers", {})
    provider = providers.get(provider_id)
    if not isinstance(provider, dict):
        raise AIOutputError(f"Unknown AI provider configuration: {provider_id}")
    api_key_env = provider.get("apiKeyEnv")
    if not isinstance(api_key_env, str) or not api_key_env:
        raise AIOutputError("AI provider apiKeyEnv is missing")
    api_key = values.get(api_key_env)
    if not api_key:
        return None
    legacy_model_env = provider.get("legacyModelEnv")
    legacy_base_url_env = provider.get("legacyBaseUrlEnv")
    model = (
        values.get("AI_MODEL")
        or (values.get(legacy_model_env) if isinstance(legacy_model_env, str) else None)
        or provider.get("defaultModel")
    )
    base_url = (
        values.get("AI_BASE_URL")
        or (
            values.get(legacy_base_url_env)
            if isinstance(legacy_base_url_env, str)
            else None
        )
        or provider.get("baseUrl")
    )
    display_name = provider.get("displayName")
    if not all(
        isinstance(value, str) and value.strip()
        for value in (model, base_url, display_name)
    ):
        raise AIOutputError("AI provider model, endpoint, or display name is invalid")
    if not base_url.startswith("https://"):
        raise AIOutputError("AI provider endpoint must use HTTPS")
    return ProviderRuntime(
        provider_id=provider_id,
        display_name=display_name,
        api_key=api_key,
        model=model,
        base_url=base_url,
    )


def enrich_papers(
    papers: list[dict[str, Any]],
    *,
    provider_id: str,
    provider_name: str,
    model: str,
    prompt_version: str,
    system_prompt: str,
    limit: int,
    summarize: Callable[[dict[str, Any], str], dict[str, str]],
    now: datetime | None = None,
) -> int:
    generated_at = (now or datetime.now(timezone.utc)).isoformat().replace(
        "+00:00", "Z"
    )
    prioritized = sorted(
        papers,
        key=lambda paper: (
            -sum(
                signal["value"] for signal in paper.get("communitySignals", [])
            ),
            -datetime.fromisoformat(
                paper["publishedAt"].replace("Z", "+00:00")
            ).timestamp(),
            paper["id"],
        ),
    )
    enriched = 0
    for paper in prioritized:
        if enriched >= limit:
            break
        expected_key = cache_key(
            paper, provider_id, model, prompt_version
        )
        existing = paper.get("aiEnrichment", {})
        if (
            existing.get("status") == "available"
            and existing.get("cacheKey") == expected_key
        ):
            LOGGER.info("ai_cache_hit", extra={"paper_id": paper["id"]})
            continue
        try:
            overview = validate_ai_output(summarize(paper, system_prompt))
        except Exception as error:
            LOGGER.warning(
                "ai_enrichment_skipped",
                extra={
                    "paper_id": paper["id"],
                    "error_type": type(error).__name__,
                },
            )
            continue
        paper["aiEnrichment"] = {
            "status": "available",
            "overview": overview,
            "basis": "title-abstract",
            "generatedAt": generated_at,
            "promptVersion": prompt_version,
            "sourceFingerprint": source_fingerprint(paper),
            "provider": provider_name,
            "model": model,
            "cacheKey": expected_key,
        }
        enriched += 1
    return enriched


def enrich_with_ai_if_configured(
    papers: list[dict[str, Any]], config: dict[str, Any], root: Path
) -> int:
    ai = config.get("aiEnrichment", {})
    if not ai.get("enabled", False):
        LOGGER.info("ai_enrichment_disabled")
        return 0
    try:
        runtime = resolve_provider_runtime(config)
    except AIOutputError as error:
        LOGGER.warning(
            "ai_enrichment_skipped_invalid_config",
            extra={"error_type": type(error).__name__},
        )
        return 0
    if runtime is None:
        LOGGER.info("ai_enrichment_skipped_missing_credential")
        return 0
    prompt_path = root / ai["systemPromptPath"]
    client = CompatibleChatClient(
        api_key=runtime.api_key,
        model=runtime.model,
        base_url=runtime.base_url,
        timeout_seconds=ai["timeoutSeconds"],
    )
    return enrich_papers(
        papers,
        provider_id=runtime.provider_id,
        provider_name=runtime.display_name,
        model=runtime.model,
        prompt_version=ai["promptVersion"],
        system_prompt=prompt_path.read_text(),
        limit=ai["maxPapersPerRun"],
        summarize=client.summarize,
    )
