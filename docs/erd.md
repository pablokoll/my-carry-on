# Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Trip : has
    User ||--o{ Bag : owns
    User ||--o{ Category : defines

    Trip ||--o{ Destination : has
    Trip ||--o{ TripBag : includes

    Bag ||--o{ TripBag : used_in
    Bag ||--o{ Item : contains

    Item ||--o{ SubItem : expands_to
    Item }o--|| Category : belongs_to

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
        bool packed
    }
```

## Notes

- `Category.user_id` — nullable. System defaults have no owner.
- `Trip.is_active` — enforces one active trip per user at a time.
- `Bag` belongs to the user, not the trip — reusable across trips.
- `TripBag` — junction table assigning bags to a specific trip.
- `Item.packed` — used when item has no subitems.
- `SubItem.packed` — used when item is expanded. Item is considered packed when all subitems are packed.
