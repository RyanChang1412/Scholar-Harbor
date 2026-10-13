from __future__ import annotations

import unittest
from datetime import datetime, timezone

from scholar_harbor_ingest.ai_enrichment import (
    AIOutputError,
    cache_key,
    enrich_papers,
    resolve_provider_runtime,
    source_fingerprint,
    validate_ai_output,
)


def paper(identifier: str = "paper-2610-00001") -> dict:
    return {
        "id": identifier,
        "title": "Efficient cache scheduling",
        "abstract": "We study cache scheduling for language model serving.",
        "publishedAt": "2026-10-10T00:00:00Z",
        "communitySignals": [{"value": 4}],
        "aiEnrichment": {"status": "unavailable"},
    }


OVERVIEW = {
    "researchProblem": "研究语言模型服务中的缓存调度问题。",
    "coreApproach": "根据摘要，论文分析缓存调度方法。",
    "researchRelevance": "与高效推理和模型服务相关。",
}


def provider_config() -> dict:
    return {
        "aiEnrichment": {
            "enabled": True,
            "provider": "bailian",
            "providers": {
                "bailian": {
                    "displayName": "Alibaba Cloud Model Studio",
                    "apiKeyEnv": "DASHSCOPE_API_KEY",
                    "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
                    "defaultModel": "qwen-plus",
                    "legacyModelEnv": "BAILIAN_MODEL",
                },
                "openai": {
                    "displayName": "OpenAI",
                    "apiKeyEnv": "OPENAI_API_KEY",
                    "baseUrl": "https://api.openai.com/v1",
                    "defaultModel": "gpt-4.1-mini",
                },
                "deepseek": {
                    "displayName": "DeepSeek",
                    "apiKeyEnv": "DEEPSEEK_API_KEY",
                    "baseUrl": "https://api.deepseek.com",
                    "defaultModel": "deepseek-chat",
                },
            },
        }
    }


class AIEnrichmentTests(unittest.TestCase):
    def test_structured_output_rejects_missing_or_extra_sections(self):
        self.assertEqual(validate_ai_output(OVERVIEW), OVERVIEW)
        with self.assertRaises(AIOutputError):
            validate_ai_output({"researchProblem": "only one"})
        with self.assertRaises(AIOutputError):
            validate_ai_output({**OVERVIEW, "claim": "unsupported"})

    def test_cache_reuse_skips_model_call(self):
        item = paper()
        item["aiEnrichment"] = {
            "status": "available",
            "overview": OVERVIEW,
            "basis": "title-abstract",
            "generatedAt": "2026-10-11T00:00:00Z",
            "promptVersion": "v1",
            "sourceFingerprint": source_fingerprint(item),
            "provider": "Alibaba Cloud Model Studio",
            "model": "qwen-plus",
            "cacheKey": cache_key(item, "bailian", "qwen-plus", "v1"),
        }
        calls = []
        count = enrich_papers(
            [item],
            provider_id="bailian",
            provider_name="Alibaba Cloud Model Studio",
            model="qwen-plus",
            prompt_version="v1",
            system_prompt="prompt",
            limit=1,
            summarize=lambda *_: calls.append(True),
            now=datetime(2026, 10, 12, tzinfo=timezone.utc),
        )
        self.assertEqual(count, 0)
        self.assertEqual(calls, [])

    def test_malformed_or_timeout_output_does_not_block_other_papers(self):
        items = [paper("paper-2610-00001"), paper("paper-2610-00002")]

        def summarize(item, _prompt):
            if item["id"].endswith("1"):
                raise TimeoutError("timeout")
            return OVERVIEW

        count = enrich_papers(
            items,
            provider_id="deepseek",
            provider_name="DeepSeek",
            model="deepseek-chat",
            prompt_version="v1",
            system_prompt="prompt",
            limit=1,
            summarize=summarize,
        )
        self.assertEqual(count, 1)
        self.assertEqual(items[0]["aiEnrichment"]["status"], "unavailable")
        self.assertEqual(items[1]["aiEnrichment"]["basis"], "title-abstract")
        self.assertEqual(items[1]["aiEnrichment"]["provider"], "DeepSeek")

    def test_provider_registry_resolves_all_supported_services(self):
        config = provider_config()
        cases = [
            ("bailian", "DASHSCOPE_API_KEY", "Alibaba Cloud Model Studio", "qwen-plus"),
            ("openai", "OPENAI_API_KEY", "OpenAI", "gpt-4.1-mini"),
            ("deepseek", "DEEPSEEK_API_KEY", "DeepSeek", "deepseek-chat"),
        ]
        for provider_id, key_name, display_name, model in cases:
            runtime = resolve_provider_runtime(
                config,
                {"AI_PROVIDER": provider_id, key_name: "test-key"},
            )
            self.assertIsNotNone(runtime)
            self.assertEqual(runtime.display_name, display_name)
            self.assertEqual(runtime.model, model)

    def test_generic_overrides_and_bailian_legacy_model_are_supported(self):
        config = provider_config()
        generic = resolve_provider_runtime(
            config,
            {
                "AI_PROVIDER": "openai",
                "OPENAI_API_KEY": "test-key",
                "AI_MODEL": "custom-model",
                "AI_BASE_URL": "https://gateway.example.com/v1",
            },
        )
        self.assertEqual(generic.model, "custom-model")
        self.assertEqual(generic.base_url, "https://gateway.example.com/v1")
        legacy = resolve_provider_runtime(
            config,
            {"DASHSCOPE_API_KEY": "test-key", "BAILIAN_MODEL": "qwen-flash"},
        )
        self.assertEqual(legacy.model, "qwen-flash")

    def test_disabled_missing_credential_and_unknown_provider_are_safe(self):
        self.assertIsNone(
            resolve_provider_runtime({"aiEnrichment": {"enabled": False}}, {})
        )
        self.assertIsNone(resolve_provider_runtime(provider_config(), {}))
        with self.assertRaises(AIOutputError):
            resolve_provider_runtime(
                provider_config(), {"AI_PROVIDER": "unknown"}
            )


if __name__ == "__main__":
    unittest.main()
