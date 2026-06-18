import os
from datetime import date, datetime, timezone

import requests
from google import genai
from google.genai import types

from extensions import db
from models import ChatMessage, Trip

_client = genai.Client(api_key=os.environ.get("API_KEY_AI_GOOGLE_STUDIO"))
MODEL = "gemini-2.5-flash-lite"

OWM_API_KEY = os.environ.get("API_KEY_OPEN_WEATHER_MAP")

COMPACT_THRESHOLD = 30
MESSAGES_KEPT_AFTER_COMPACT = 10


def get_weather(city: str) -> str:
    try:
        r = requests.get(
            "https://api.openweathermap.org/data/2.5/weather",
            params={"q": city, "appid": OWM_API_KEY, "units": "metric"},
            timeout=5,
        )
        if r.status_code == 401:
            return "weather API key invalid"
        if r.status_code == 404:
            return "city not found"
        if r.status_code != 200:
            return "weather unavailable"
        d = r.json()
        desc = d["weather"][0]["description"]
        temp = d["main"]["temp"]
        return f"{desc}, {temp:.0f}°C"
    except Exception:
        return "weather unavailable"


def build_system_prompt(trip: Trip) -> str:
    today = date.today().isoformat()

    destinations = []
    for dest in trip.destinations:
        weather = get_weather(dest.city)
        arr = dest.arrival_date.isoformat() if dest.arrival_date else "?"
        dep = dest.departure_date.isoformat() if dest.departure_date else "?"
        destinations.append(
            f"  - {dest.city}, {dest.country} ({arr} → {dep}) | weather: {weather}"
        )

    bags = []
    for tb in trip.trip_bags:
        bag = tb.bag
        items = []
        for item in bag.items:
            if item.sub_items:
                subs = ", ".join(f"{s.name} x{s.quantity}" for s in item.sub_items)
                items.append(f"    · {item.name} [{subs}]")
            else:
                items.append(f"    · {item.name}")
        bags.append(
            f"  Bag '{bag.name}' ({bag.type}):\n"
            + ("\n".join(items) if items else "    (empty)")
        )

    start = trip.start_date.isoformat() if trip.start_date else "unknown"
    end = trip.end_date.isoformat() if trip.end_date else "unknown"

    return f"""You are an expert travel packing assistant helping the user pack for their trip.

Today: {today}
Trip: {trip.name} ({start} → {end})

Destinations:
{chr(10).join(destinations) if destinations else "  None added yet."}

Bags and current items:
{chr(10).join(bags) if bags else "  No bags assigned yet."}

Guidelines:
- Give practical advice tailored to destinations, weather, and dates.
- When suggesting items to add, list the available bags and ask which one.
- Be concise and friendly.
- Respond in the same language the user writes in.

Formatting rules (strictly follow):
- Use markdown: **bold** for item names or key terms, bullet lists with `-` for suggestions.
- Keep responses short and scannable. Avoid long paragraphs.
- Never use `*` for bullets — always use `-`.
- Don't add unnecessary filler phrases. Get to the point."""


def get_history(trip_id: int, user_id: int) -> list[ChatMessage]:
    return (
        ChatMessage.query
        .filter_by(trip_id=trip_id, user_id=user_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )


def compact_history(trip_id: int, user_id: int, messages: list[ChatMessage]) -> None:
    non_summary = [m for m in messages if m.role != "summary"]
    to_compact = non_summary[:-MESSAGES_KEPT_AFTER_COMPACT]
    if not to_compact:
        return

    text = "\n".join(f"{m.role}: {m.content}" for m in to_compact)
    summary_text = _client.models.generate_content(
        model=MODEL,
        contents=f"Summarize this packing assistant conversation keeping key decisions, "
                 f"item suggestions, and any items the user decided to pack:\n\n{text}",
    ).text

    summary = ChatMessage(
        trip_id=trip_id,
        user_id=user_id,
        role="summary",
        content=summary_text,
        created_at=datetime.now(timezone.utc),
    )
    db.session.add(summary)
    db.session.commit()


def _content(role: str, text: str) -> dict:
    return {"role": role, "parts": [{"text": text}]}


def build_gemini_history(messages: list[ChatMessage], system_prompt: str) -> list[dict]:
    history = [
        _content("user", system_prompt),
        _content("model", "Understood! I'm ready to help pack for this trip."),
    ]

    summary = next((m for m in reversed(messages) if m.role == "summary"), None)

    if summary:
        history += [
            _content("user", f"[Conversation summary so far]: {summary.content}"),
            _content("model", "Got it, I have the context from our previous conversation."),
        ]
        cutoff = summary.created_at
        recent = [m for m in messages if m.role != "summary" and m.created_at > cutoff]
    else:
        recent = [m for m in messages if m.role != "summary"]

    for m in recent:
        role = "user" if m.role == "user" else "model"
        history.append(_content(role, m.content))

    return history


def save_messages(trip_id: int, user_id: int, user_content: str, model_content: str) -> None:
    now = datetime.now(timezone.utc)
    db.session.add(ChatMessage(trip_id=trip_id, user_id=user_id, role="user", content=user_content, created_at=now))
    db.session.add(ChatMessage(trip_id=trip_id, user_id=user_id, role="model", content=model_content, created_at=now))
    db.session.commit()
