# ADR 001 — Next.js + Flask monorepo on Vercel

**Date:** 2026-06-08  
**Status:** Accepted

## Context

Needed a stack that could run a Python backend (for AI integrations) alongside a modern React frontend, deployable cheaply as a solo project.

## Decision

Use Next.js as the frontend and Flask as the API backend, co-deployed on Vercel via the `experimentalServices` config in `vercel.json`. Flask runs as serverless functions mounted at `/api/*`.

## Consequences

- Single deploy target (Vercel) handles both services.
- Flask routes are prefixed with `/api` by Vercel's routing layer — Flask itself has no prefix.
- `NEXT_PUBLIC_BACKEND_URL` is injected automatically by Vercel per environment, keeping preview/prod URLs in sync without hardcoding.
- Serverless Flask has cold start latency — acceptable for a low-traffic personal project.
