# API Reference

Base URL: `/api` (Vercel adds this prefix via `routePrefix` in `vercel.json`).

All endpoints except `/auth/register` and `/auth/login` require a JWT in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

---

## Auth

### `POST /auth/register`
Register a new user.

**Body:** `{ "email": string, "password": string (min 8 chars) }`  
**Returns:** `201 { "message": "User registered successfully" }`  
**Rate limit:** 5/min, 20/hour

### `POST /auth/login`
Login and get tokens.

**Body:** `{ "email": string, "password": string }`  
**Returns:** `200 { "access_token": string, "refresh_token": string }`  
**Rate limit:** 10/min, 50/hour

### `POST /auth/refresh`
Rotate access token using refresh token.

**Auth:** Bearer `<refresh_token>`  
**Returns:** `200 { "access_token": string }`

### `GET /auth/me`
Current user profile and stats.

**Returns:** `200 { "email", "created_at", "trip_count", "destination_count", "bag_count" }`

### `POST /auth/logout`
Revoke current access token (adds JTI to blocklist).

**Returns:** `200 { "message": "Logout successful" }`

---

## Trips

### `GET /trips`
List all trips with packing stats.

**Query params:** `limit` (int, optional)  
**Returns:** `200 Trip[]`

### `POST /trips`
Create a trip.

**Body:** `{ "name": string, "start_date?": date, "end_date?": date }`  
**Returns:** `201 Trip`

### `GET /trips/:id`
Get a single trip.

**Returns:** `200 Trip`

### `PUT /trips/:id`
Update a trip.

**Body:** `{ "name?": string, "start_date?": date, "end_date?": date }`  
**Returns:** `200 Trip`

### `DELETE /trips/:id`
Delete a trip and all its destinations and bag assignments.

**Returns:** `200 { "message": "Trip deleted" }`

### `POST /trips/:id/activate`
Set this trip as the active one (deactivates any other).

**Returns:** `200 Trip`

### `POST /trips/:id/deactivate`
Deactivate this trip.

**Returns:** `200 Trip`

---

## Destinations

### `GET /trips/:trip_id/destinations`
List destinations for a trip.

**Returns:** `200 Destination[]`

### `POST /trips/:trip_id/destinations`
Add a destination.

**Body:** `{ "city": string, "country": string, "arrival_date?": date, "departure_date?": date }`  
**Returns:** `201 Destination`

### `PUT /destinations/:id`
Update a destination.

**Body:** any subset of `{ "city", "country", "arrival_date", "departure_date" }`  
**Returns:** `200 Destination`

### `DELETE /destinations/:id`
Delete a destination.

**Returns:** `200 { "message": "Destination deleted" }`

---

## Bags

### `GET /bags`
List all user bags (no items).

**Returns:** `200 Bag[]`

### `POST /bags`
Create a bag.

**Body:** `{ "name": string, "type": BagType }`  
**BagType:** `"carry-on"` | `"luggage"` | `"backpack"` | `"handbag"` | `"toiletry bag"` | `"worn"` | `"other"`  
**Returns:** `201 Bag`

### `GET /bags/:id`
Get a bag with its items and sub-items.

**Returns:** `200 Bag & { items: Item[] }`

### `PUT /bags/:id`
Update a bag.

**Body:** `{ "name?": string, "type?": BagType }`  
**Returns:** `200 Bag`

### `POST /bags/:id/duplicate`
Clone a bag with all its items and sub-items (packed state reset).

**Returns:** `201 Bag & { items: Item[] }`

### `DELETE /bags/:id`
Delete a bag and its items.

**Returns:** `200 { "message": "Bag deleted" }`

### `GET /trips/:trip_id/bags`
Get all bags assigned to a trip, with items and sub-items.

**Returns:** `200 Bag[]`

### `POST /trips/:trip_id/bags`
Assign an existing bag to a trip.

**Body:** `{ "bag_id": int }`  
**Returns:** `201 TripBag`

### `DELETE /trips/:trip_id/bags/:bag_id`
Unassign a bag from a trip.

**Returns:** `200 { "message": "Bag unassigned from trip" }`

---

## Items

### `GET /bags/:bag_id/items`
List items in a bag.

**Returns:** `200 Item[]` (each item includes `sub_items`)

### `POST /bags/:bag_id/items`
Create an item.

**Body:** `{ "name": string, "quantity?": int (default 1), "category_id?": int }`  
**Returns:** `201 Item`

### `PUT /items/:id`
Update an item.

**Body:** any subset of `{ "name", "quantity", "category_id", "packed" }`  
**Returns:** `200 Item`

### `DELETE /items/:id`
Delete an item and its sub-items.

**Returns:** `200 { "message": "Item deleted" }`

---

## Sub-items

### `GET /items/:item_id/sub-items`
List sub-items for an item.

**Returns:** `200 SubItem[]`

### `POST /items/:item_id/sub-items`
Create a sub-item.

**Body:** `{ "name": string, "quantity?": int (default 1) }`  
**Returns:** `201 SubItem`

### `PUT /sub-items/:id`
Update a sub-item.

**Body:** any subset of `{ "name", "quantity", "packed" }`  
**Returns:** `200 SubItem`

### `DELETE /sub-items/:id`
Delete a sub-item.

**Returns:** `200 { "message": "SubItem deleted" }`

---

## Categories

### `GET /categories`
List all categories (system defaults + user's custom ones).

**Returns:** `200 Category[]`

---

## Chat

### `GET /chat/sessions?trip_id=:id`
List chat sessions for a trip.

**Returns:** `200 { "id", "title", "created_at", "message_count" }[]`

### `POST /chat/sessions`
Create a new chat session for a trip.

**Body:** `{ "trip_id": int }`  
**Returns:** `201 ChatSession`

### `DELETE /chat/sessions/:id`
Delete a session and its messages.

**Returns:** `200 { "message": "Session deleted" }`

### `GET /chat/sessions/:id/messages`
Get all messages in a session (summaries excluded).

**Returns:** `200 ChatMessage[]`

### `DELETE /chat/sessions/:id/messages`
Clear all messages in a session (resets title too).

**Returns:** `200 { "message": "Messages cleared" }`

### `POST /chat`
Send a message and get an AI reply.

**Body:** `{ "session_id": int, "messages": [{ "role": "user", "content": string }] }`  
**Returns:** `200 { "reply": string, "suggestions": Suggestion[], "history": ChatMessage[], "session_title?": string }`  
**Rate limit:** 30/min. Returns 429 with `{ "error": "rate_limit" | "rate_limit_daily", "wait_seconds": int }` on limit.

### `POST /chat/log`
Log a system context message in a session (used by frontend to sync bag state).

**Body:** `{ "session_id": int, "content": string }`  
**Returns:** `200 { "message": "Context logged" }`

### `GET /chat/status`
Get AI provider rate limit status.

**Returns:** `200 { "used": int, "limit": int, "remaining": int }`

---

## Error format

All errors follow:

```json
{ "error": "string description" }
```

Common status codes: `400` Bad Request · `401` Unauthorized · `404` Not Found · `409` Conflict · `429` Rate Limited · `500` Internal Server Error
