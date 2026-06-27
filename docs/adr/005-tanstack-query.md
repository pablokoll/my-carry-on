# ADR 005 — TanStack Query as the frontend data layer

**Date:** 2026-06-20  
**Status:** Accepted

## Context

Frontend had per-page `useEffect` + `useState` fetch logic. Pages didn't share cached data, causing redundant requests and stale UI after mutations (e.g. chat suggestions adding items, table not updating).

## Decision

Migrate all data fetching to TanStack Query (`@tanstack/react-query`). All queries live in `lib/queries.ts`. The chat window (`components/chat-window/`) also uses React Query for sessions, messages, and all mutations.

## Consequences

- Shared cache across pages — navigating back to a page doesn't re-fetch unless data is stale.
- Mutations invalidate the relevant query keys, keeping UI consistent automatically.
- Eliminates the category of bugs where accepting a chat suggestion didn't visually update the bag table.
- `bag-items-table` uses `initialData` from the query cache instead of fetching independently.
