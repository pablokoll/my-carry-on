# ADR 006 — Redis for rate limiter deferred to production

**Date:** 2026-06-22  
**Status:** Accepted

## Context

Flask-Limiter requires a persistent store to enforce rate limits across serverless function instances. In-memory storage doesn't work correctly in a multi-instance serverless environment.

## Decision

Use in-memory storage for Flask-Limiter during development. Wire up Redis (Upstash or similar) before going to production.

## Consequences

- Rate limits work correctly in local dev (single process).
- In prod with in-memory storage, limits would reset per cold start — ineffective against abuse.
- Redis must be configured before deploy via `RATELIMIT_STORAGE_URL` env var in `api/.env`.
- `TODO (prod):` add `RATELIMIT_STORAGE_URL=redis://...` to Vercel environment variables.
