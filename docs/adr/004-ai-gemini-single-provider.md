# ADR 004 — Single AI provider (Gemini) via adapter pattern

**Date:** 2026-06-18  
**Status:** Accepted

## Context

Explored allowing users to configure their own AI provider (Gemini, OpenAI, Claude, DeepSeek, Grok) with their own API keys via a profile setting.

## Decision

Ship with a single provider: Gemini 2.5 Flash Lite (Google AI Studio free tier — 1000 RPD). The backend uses an adapter pattern (`services/ai/base.py` ABC + `services/ai/gemini.py` implementation) selected via `AI_PROVIDER` env var. No user-configurable providers.

## Consequences

- Multi-provider UX adds complexity (key storage, encryption, per-provider history normalization) that's not justified for a packing app.
- The adapter pattern (`get_provider()` factory + `AIProvider` ABC) keeps switching providers to a one-line env var change.
- A Groq adapter was prototyped in `feat/groq-provider` branch as a proof of concept.
- Daily limit handling: backend checks RPD before forwarding requests; returns `{ "error": "rate_limit_daily", "wait_seconds": N }` on exhaustion.
