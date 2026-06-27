# Architecture

## Request flow

```mermaid
graph TD
    Browser -->|"/ (HTML/JS)"| Next["Next.js (Vercel)"]
    Browser -->|"/api/*"| Flask["Flask (Vercel serverless)"]

    Next --> Auth["app/(auth)/\nlogin, register"]
    Next --> App["app/(app)/\ndashboard, trips, bags, profile"]
    App -->|"fetch via lib/api.ts"| Flask

    Flask --> RouteAuth["routes/auth.py"]
    Flask --> RouteTrips["routes/trips.py"]
    Flask --> RouteDest["routes/destinations.py"]
    Flask --> RouteBags["routes/bags.py"]
    Flask --> RouteItems["routes/items.py"]
    Flask --> RouteChat["routes/chat.py"]

    RouteChat --> ChatSvc["services/chat_service.py"]
    RouteChat --> SessionSvc["services/session_service.py"]
    ChatSvc --> Gemini["services/ai/gemini.py\n(Gemini 2.5 Flash Lite)"]
    ChatSvc --> Weather["services/weather_service.py\n(OpenWeatherMap, 30min cache)"]

    Flask --> DB[("PostgreSQL\n(Neon)")]
```

## Vercel routing

```mermaid
graph LR
    Request --> Vercel{Vercel router}
    Vercel -->|"/"| Next["Next.js :3000"]
    Vercel -->|"/api/*"| Flask["Flask :5328\n(no /api prefix internally)"]
```

`NEXT_PUBLIC_API_URL` is empty in prod — requests go to the same origin at `/api`.

## Frontend data layer

```mermaid
graph TD
    Page["app/ pages"] --> TQ["TanStack Query\n(lib/queries.ts)"]
    TQ -->|"useQuery"| API["lib/api.ts\n(attaches Bearer token)"]
    TQ -->|"useMutation → invalidate keys"| API
    API -->|"fetch"| Flask["Flask /api/*"]

    TQ --> Cache["Shared query cache\n(across all pages)"]
```

Auth tokens stored in `localStorage`. Protected pages redirect to `/login` client-side if no token present.

## Backend structure

```mermaid
graph TD
    AppFactory["app.py\n(app factory)"] --> Extensions["extensions.py\ndb, jwt, limiter\nget_or_404, get_owned_or_404"]
    AppFactory --> Routes["routes/\none blueprint per resource"]
    AppFactory --> Models

    Models --> BaseModel["base.py — BaseModel + to_dict()"]
    Models --> UserModel["user.py"]
    Models --> TripModel["trip.py — Trip, Destination, TripBag"]
    Models --> BagModel["bag.py — Bag, Item, SubItem, Category"]
    Models --> ChatModel["chat.py — ChatSession, ChatMessage"]
    Models --> AuthModel["auth.py — TokenBlocklist, AuthLog"]

    Routes --> Services["services/\nbusiness logic"]
    Services --> TripSvc["trip_service.py"]
    Services --> BagSvc["bag_service.py"]
    Services --> ChatSvc["chat_service.py"]
    Services --> SessionSvc["session_service.py"]
    Services --> AI["ai/ — AIProvider ABC\n+ GeminiProvider"]
```

Ownership enforced via `get_or_404` / `get_owned_or_404` with dot-notation FK traversal (e.g. `"item.bag.user_id"` for sub-items).

## AI chat flow

```mermaid
sequenceDiagram
    participant UI as ChatWindow
    participant API as Flask /chat
    participant DB as PostgreSQL
    participant Gemini as Gemini 2.5 Flash Lite
    participant OW as OpenWeatherMap

    UI->>API: POST /chat/sessions {trip_id}
    API->>DB: INSERT ChatSession
    API-->>UI: session_id

    UI->>API: POST /chat {session_id, messages}
    API->>DB: load history
    API->>API: compact_if_needed() (summarize at 30 msgs)
    API->>DB: load trip + bags + items
    API->>OW: fetch weather per destination (cached 30min)
    API->>API: build_system_prompt()
    API->>Gemini: send_message(history, system_prompt, user_msg)
    Gemini-->>API: reply + suggestions
    API->>DB: save user + model messages
    API->>API: set_title_if_needed() (auto-title first exchange)
    API-->>UI: {reply, suggestions, history, session_title?}
```

## Security

```mermaid
graph TD
    Request --> RateLimit["Flask-Limiter\nauth: 5-10/min\nchat: 30/min"]
    Request --> SizeLimit["MAX_CONTENT_LENGTH 1MB"]
    Request --> JWT["JWT validation\n+ TokenBlocklist check"]
    JWT --> Ownership["get_or_404 / get_owned_or_404\nownership check per resource"]
    Response --> Headers["Security headers\nCSP, HSTS (prod), X-Frame-Options\nX-Content-Type-Options"]
    JWT --> AuditLog["AuthLog\nregister, login, login_failed, logout + IP"]
```
