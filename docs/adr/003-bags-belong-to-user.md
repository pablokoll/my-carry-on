# ADR 003 — Bags belong to the user, not the trip

**Date:** 2026-06-08  
**Status:** Accepted

## Context

Initially considered modeling bags as owned by a trip (one bag = one trip's container). But users pack the same physical bags for different trips.

## Decision

`Bag` has a `user_id` FK — it belongs to the user. A `TripBag` junction table assigns bags to trips. Bags can be reused across trips or duplicated when a variation is needed.

## Consequences

- A bag can appear in multiple trips without duplicating data.
- Items live on the bag, not the trip — so packing state is also per-bag, not per-trip. This is the intended model (you pack the same backpack the same way each time, then adjust).
- `Duplicate Bag` operation clones a bag with all items and sub-items (packed state reset) for when a user wants a modified version.
