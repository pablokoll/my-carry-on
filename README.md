# My Carry-On

Web app for planning travel packing. Create trips, organize bags and items, track what's packed, and get AI-powered suggestions for each destination.

**Stack:** Next.js · Flask · PostgreSQL (Neon) · Vercel  
**AI:** Gemini 2.5 Flash Lite + OpenWeatherMap for destination-aware suggestions

## Docs

- [Overview](docs/overview.md) — what the app does, core concepts, main flows
- [Architecture](docs/architecture.md) — request flow, stack, data layer, AI chat, security
- [Setup](docs/setup.md) — how to run locally
- [API Reference](docs/api.md) — all endpoints
- [ERD](docs/erd.md) — data model
- [ADRs](docs/adr/) — architecture decisions

## Quick start

```bash
pnpm install
# see docs/setup.md for env vars and database setup
pnpm dev
```
