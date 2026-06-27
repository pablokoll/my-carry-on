# ADR 002 — JWT authentication with Flask-JWT-Extended

**Date:** 2026-06-08  
**Status:** Accepted

## Context

Needed stateless auth compatible with a serverless Flask deployment (no persistent server process for session state).

## Decision

Use Flask-JWT-Extended for access + refresh token auth. On logout, the access token's JTI is stored in a `TokenBlocklist` DB table and checked on every protected request. Auth events are recorded in an `AuthLog` table.

## Consequences

- Stateless by default — works fine with serverless.
- Token revocation requires a DB lookup per request (necessary trade-off for logout support).
- No OAuth/social login — email/password only for MVP simplicity.
- Rate limits on auth endpoints (register: 5/min, login: 10/min) via Flask-Limiter (in-memory storage; Redis deferred for prod).
