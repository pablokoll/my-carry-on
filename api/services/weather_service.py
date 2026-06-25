import os
from datetime import datetime, timezone

import requests

OWM_API_KEY = os.environ.get("API_KEY_OPEN_WEATHER_MAP")

_cache: dict[str, tuple[str, datetime]] = {}
_TTL_SECONDS = 1800


def get_weather(city: str) -> str:
    now = datetime.now(timezone.utc)
    cached = _cache.get(city)
    if cached and (now - cached[1]).total_seconds() < _TTL_SECONDS:
        return cached[0]
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
        result = f"{d['weather'][0]['description']}, {d['main']['temp']:.0f}°C"
        _cache[city] = (result, now)
        return result
    except Exception:
        return "weather unavailable"
