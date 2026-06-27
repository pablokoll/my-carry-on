# My Carry-On — Product Overview

Web app for planning travel packing. Users organize their luggage across trips, bags, and items — tracking what's packed and what's not.

## Core concepts

- **Trip** — a travel plan with dates and one or more destinations. Only one trip can be active at a time.
- **Bag** — a reusable container (backpack, carry-on, toiletry bag, etc.) owned by the user, not tied to a specific trip. Assign bags to trips as needed.
- **Item** — something inside a bag, with a category and quantity.
- **Sub-item** — an expanded variant of an item (e.g. "3 t-shirts" → grey t-shirt, black t-shirt, logo tee). When sub-items exist, packing state lives on each sub-item.
- **Category** — label for items (clothing, hygiene, tech, etc.). System defaults are provided; users can add custom ones.

## Main flows

### 1. Pack for a trip
1. Create a trip with dates and destinations.
2. Assign existing bags (or create new ones).
3. Add items to each bag, optionally expanding into sub-items.
4. Check items off as you pack — the dashboard shows overall progress.

### 2. Reuse bags across trips
Bags belong to the user, not the trip. The same backpack can be assigned to multiple trips without duplicating its contents. Use **Duplicate Bag** to create a variation.

### 3. AI packing assistant
A floating chat panel available across the app. The assistant knows the current trip (destinations, dates, bags, items) and the real weather for each destination. It can suggest items and add them directly to bags.

## Dashboard
The dashboard shows the active trip's packing progress — overall percentage and per-bag breakdown — along with days until departure and a list of all bags with their packed state.

## Key constraints
- One active trip per user at a time (enforced server-side).
- Auth: email/password only (JWT, no OAuth).
- AI: Gemini 2.5 Flash Lite via Google AI Studio (free tier, 1000 RPD / 15 RPM).
- Deploy: Vercel (Next.js frontend + Flask as serverless functions at `/api/*`).
- Database: Neon PostgreSQL (free tier).
