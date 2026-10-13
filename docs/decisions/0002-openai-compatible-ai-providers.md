# ADR 0002: OpenAI-compatible AI provider registry

- Status: accepted
- Date: 2026-10-13

## Context

Scholar Harbor needs optional Chinese abstract overviews without binding the data
pipeline to one vendor. Alibaba Cloud Model Studio, OpenAI, and DeepSeek expose a
compatible chat-completions shape for the narrow V1 use case. Provider SDKs would
add three dependency and retry surfaces to a pipeline that needs only one bounded
JSON request contract.

## Decision

Use one small standard-library HTTP client behind a checked-in provider registry.
The registry owns display name, HTTPS base URL, key environment variable, and
default model. GitHub variables select a provider and model; GitHub Secrets supply
credentials. The shared layer owns the versioned prompt, structured-output
validation, timeout, per-paper failure isolation, bounded selection, and cache
identity.

Cache identity includes provider ID and model alongside paper fingerprint and
prompt version. Public records retain the provider display name and model so an
overview is attributable. Unknown or uncredentialed providers degrade to the
non-AI source pipeline.

## Consequences

A provider switch needs configuration rather than frontend or domain changes. The
pipeline avoids vendor SDKs and never bundles keys into the browser. The common
contract deliberately supports only capabilities shared by all three providers;
provider-specific features require a separate reviewed adapter extension. Model
availability still needs checking before enabling or changing production
configuration.
