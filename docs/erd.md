# Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Trip : has
    User ||--o{ Bag : owns
    User ||--o{ Category : defines
    User ||--o{ ChatSession : owns

    Trip ||--o{ Destination : has
    Trip ||--o{ TripBag : includes
    Trip ||--o{ ChatSession : has

    Bag ||--o{ TripBag : used_in
    Bag ||--o{ Item : contains

    Item ||--o{ SubItem : expands_to
    Item }o--|| Category : belongs_to

    ChatSession ||--o{ ChatMessage : contains

    User {
        int id PK
        string email
        string password_hash
        datetime created_at
    }

    Trip {
        int id PK
        int user_id FK
        string name
        bool is_active
        date start_date
        date end_date
    }

    Destination {
        int id PK
        int trip_id FK
        string city
        string country
        date arrival_date
        date departure_date
    }

    Bag {
        int id PK
        int user_id FK
        string name
        string type
    }

    TripBag {
        int id PK
        int trip_id FK
        int bag_id FK
    }

    Category {
        int id PK
        int user_id FK
        string name
        bool is_default
    }

    Item {
        int id PK
        int bag_id FK
        int category_id FK
        string name
        int quantity
        bool packed
    }

    SubItem {
        int id PK
        int item_id FK
        string name
        int quantity
        bool packed
    }

    ChatSession {
        int id PK
        int trip_id FK
        int user_id FK
        string title
        datetime created_at
    }

    ChatMessage {
        int id PK
        int session_id FK
        int user_id FK
        string role
        text content
        datetime created_at
    }

    TokenBlocklist {
        int id PK
        string jti
        datetime created_at
    }

    AuthLog {
        int id PK
        int user_id FK
        string event
        string ip
        datetime created_at
    }
```

## Notes

- `Category.user_id` — nullable. System defaults have no owner.
- `Trip.is_active` — enforces one active trip per user at a time.
- `Bag` belongs to the user, not the trip — reusable across trips.
- `TripBag` — junction table assigning bags to a specific trip.
- `Item.packed` — used when item has no sub-items.
- `SubItem.packed` — used when item is expanded. Item is considered packed when all sub-items are packed.
- `SubItem.quantity` — defaults to 1; `Item.quantity` aggregates sub-item quantities when expanded.
- `ChatSession` — one session = one chat thread per trip. Multiple sessions per trip supported.
- `ChatMessage.role` — `"user"` | `"model"` | `"summary"` (summaries are compacted history, excluded from UI).
- `TokenBlocklist` — stores JTI of revoked JWT access tokens (populated on logout).
- `AuthLog` — audit trail for `register`, `login`, `login_failed`, `logout` events.
