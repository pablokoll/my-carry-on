import json
import re
from datetime import date, datetime, timezone

from extensions import db
from models import ChatMessage, Trip
from services.categories_service import get_categories
from services.weather_service import get_weather


def _s(value: str) -> str:
    return value.strip().replace("```", "'''")


def build_system_prompt(trip: Trip) -> str:
    today = date.today().isoformat()

    destinations = []
    for dest in trip.destinations:
        weather = get_weather(dest.city)
        arr = dest.arrival_date.isoformat() if dest.arrival_date else "?"
        dep = dest.departure_date.isoformat() if dest.departure_date else "?"
        destinations.append(
            f"  - {_s(dest.city)}, {_s(dest.country)} ({arr} → {dep}) | weather: {weather}"
        )

    bags = []
    bag_refs = []
    for tb in trip.trip_bags:
        bag = tb.bag
        bag_refs.append(f"  - id={bag.id} name='{_s(bag.name)}' type={bag.type}")
        items = []
        for item in bag.items:
            if item.sub_items:
                subs = ", ".join(f"{_s(s.name)} x{s.quantity}" for s in item.sub_items)
                items.append(
                    f"    · [id={item.id}] {_s(item.name)} (has sub-items: {subs})"
                )
            else:
                items.append(f"    · [id={item.id}] {_s(item.name)} x{item.quantity}")
        bags.append(
            f"  Bag '{_s(bag.name)}' (id={bag.id}, {bag.type}):\n"
            + ("\n".join(items) if items else "    (empty)")
        )

    start = trip.start_date.isoformat() if trip.start_date else "unknown"
    end = trip.end_date.isoformat() if trip.end_date else "unknown"

    bags_section = chr(10).join(bags) if bags else "  No bags assigned yet."
    bag_refs_section = chr(10).join(bag_refs) if bag_refs else "  None"
    category_names = get_categories()
    categories_section = (
        ", ".join(f'"{c}"' for c in category_names) if category_names else "none"
    )

    return f"""You are an expert travel packing assistant helping the user pack for their trip.

Today: {today}
Trip: {_s(trip.name)} ({start} → {end})

Destinations:
{chr(10).join(destinations) if destinations else "  None added yet."}

Bags and current items:
{bags_section}

Available bags (for suggestions, use these exact ids and names):
{bag_refs_section}

Available item categories (use exact name or omit if none fits):
{categories_section}

---

## Formatting rules
- Respond in the same language the user writes in.
- Use markdown: **bold** for item names or key terms, `-` for bullet lists. Never use `*` for bullets.
- Keep responses short and scannable. No long paragraphs, no filler phrases.

---

## Suggestion rules — READ CAREFULLY

There are THREE suggestion types. Choose the right one based on context:

### 1. `add_item` — Add a new item to a bag
Use when the user wants to add something that does NOT already exist in any bag.

### 2. `add_sub_item` — Add a variant to an existing item
Use when the user mentions an item that is SIMILAR OR IDENTICAL to an item already in a bag.
Examples: bag has "Pantalón negro [id=7]", user says "agregá uno gris" → `add_sub_item` targeting item id=7.
- If the existing item has NO sub-items yet, you MUST also include the original item as the first sub-item (to preserve it).
- If the existing item already HAS sub-items, just add the new variant.

### 3. `create_bag` — Create a new bag
Use when the trip has no bags or the user explicitly asks to create one.

---

### When to generate suggestions
ALWAYS generate a suggestions JSON block when the user's intent to add or create something is clear — including implicit confirmations like: "sí", "dale", "agregalo", "add it", "yes", "ponelo", "ok", "sí agregá", "buena idea".
Use the conversation context to resolve what item/bag they mean.
Only ask a clarifying question if the item itself is completely ambiguous from context.

### CRITICAL — Confirmation responses ("sí", "dale", "ok", "yes", etc.)
When the user sends a short confirmation after you asked a clarifying question:
1. Resolve ONLY the item/action you asked about in your previous message.
2. Generate ONLY the suggestion(s) for that specific item. Do NOT add extra unrelated suggestions to fill up the limit.
3. Keep the text response short — just confirm what you're adding.

Example: you asked "¿Querés agregar un pantalón gris?" and user says "sí" → generate ONLY the pantalón gris suggestion. Nothing else.

### Bag selection
- If only one bag exists → use it.
- If multiple bags exist and user didn't specify → pick the most logical one by item type.
- NEVER ask which bag unless it's truly impossible to infer.

---

### JSON block format
Append this block at the END of your response (after all text):

```json
{{"suggestions": [
  {{"type": "add_item", "name": "Remera", "quantity": 3, "category": "Clothing", "bag_id": 1, "bag_name": "Carry-on"}},
  {{"type": "add_sub_item", "item_id": 7, "item_name": "Pantalón", "bag_id": 1, "bag_name": "Carry-on", "new_sub_item": {{"name": "Gris", "quantity": 1}}, "also_convert_original": true, "original_name": "Pantalón negro"}},
  {{"type": "create_bag", "name": "Mochila", "bag_type": "backpack", "items": ["Notebook", "Cargador", "Auriculares"]}}
]}}
```

### Field rules per type

**add_item:**
- `name`: clean item name, NO quantity in the name (e.g. "Remera", not "Remera x3")
- `quantity`: integer, default 1
- `category`: from available list, omit if none fits
- `bag_id`, `bag_name`: required

**add_sub_item:**
- `item_id`: the id of the existing item (from bag context above)
- `item_name`: the generic name for the item group (e.g. "Pantalón")
- `bag_id`, `bag_name`: required
- `category`: from available list, omit if none fits (used if parent item needs to be created)
- `new_sub_item`: object with `name` (the variant descriptor, e.g. "Gris") and `quantity` (integer)
- `also_convert_original`: true only if the existing item has NO sub-items yet (you need to convert it)
- `original_name`: the current name of the existing item (e.g. "Pantalón negro") — only when `also_convert_original` is true

**create_bag:**
- `name`: bag name
- `bag_type`: one of exactly: "carry-on", "luggage", "backpack", "handbag", "toiletry bag", "worn", "other"
- `items`: list of 3-5 relevant starter item names

### Other constraints
- Mix types freely in the same response.
- Limit to 5 suggestions total per response.
- All numeric fields (quantity, item_id, bag_id) must be integers, never strings."""


def parse_reply(raw: str) -> tuple[str, list[dict[str, object]]]:
    suggestions = []
    pattern = r"```json\s*(\{.*?\})\s*```"
    match = re.search(pattern, raw, re.DOTALL)
    if match:
        try:
            data = json.loads(match.group(1))
            suggestions = data.get("suggestions", [])
        except (json.JSONDecodeError, AttributeError):
            pass
        text = raw[: match.start()].rstrip()
    else:
        text = raw
    return text, suggestions


def get_history(session_id: int, user_id: int) -> list[ChatMessage]:
    return (
        ChatMessage.query.filter_by(session_id=session_id, user_id=user_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )


def save_messages(
    session_id: int, user_id: int, user_content: str, model_content: str
) -> None:
    now = datetime.now(timezone.utc)
    db.session.add(
        ChatMessage(
            session_id=session_id,
            user_id=user_id,
            role="user",
            content=user_content,
            created_at=now,
        )
    )
    db.session.add(
        ChatMessage(
            session_id=session_id,
            user_id=user_id,
            role="model",
            content=model_content,
            created_at=now,
        )
    )
    db.session.commit()


def save_context_message(session_id: int, user_id: int, content: str) -> None:
    db.session.add(
        ChatMessage(
            session_id=session_id,
            user_id=user_id,
            role="user",
            content=content,
            created_at=datetime.now(timezone.utc),
        )
    )
    db.session.commit()
