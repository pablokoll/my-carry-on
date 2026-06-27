import os
from datetime import date
from typing import override

from google import genai
from google.genai import types as genai_types

from services.ai.base import AIProvider, AIResponse, RateLimitStatus
from services.chat_service import parse_reply

MODEL = "gemini-2.5-flash-lite"

RPD_LIMIT = int(os.environ.get("GEMINI_RPD_LIMIT", "20"))


class GeminiProvider(AIProvider):
    _client: genai.Client

    def __init__(self) -> None:
        self._client = genai.Client(api_key=os.environ.get("API_KEY_AI_GOOGLE_STUDIO"))
        self._rpd_count: int = 0
        self._rpd_date: date | None = None

    @override
    def send_message(
        self,
        history: list[genai_types.ContentOrDict],
        system_prompt: str,
        user_message: str,
    ) -> AIResponse:
        from google.genai.errors import ClientError

        full_history: list[genai_types.ContentOrDict] = [
            {"role": "user", "parts": [{"text": system_prompt}]},
            {
                "role": "model",
                "parts": [
                    {"text": "Understood! I'm ready to help pack for this trip."}
                ],
            },
            *history,
        ]

        try:
            chat = self._client.chats.create(model=MODEL, history=full_history)
            response = chat.send_message(user_message)
        except ClientError as e:
            if e.code == 429:
                retry_after = None
                if hasattr(e, "response") and e.response is not None:
                    retry_after = e.response.headers.get("Retry-After")
                wait_seconds = int(retry_after) if retry_after else 60
                raise ProviderRateLimitError(wait_seconds=wait_seconds)
            raise

        first = response.candidates[0] if response.candidates else None
        content = first.content if first else None
        part = content.parts[0] if content and content.parts else None
        raw = response.text or (part.text if part else None) or ""
        reply, suggestions = parse_reply(raw)
        return AIResponse(reply=reply, suggestions=suggestions)

    @override
    def check_rate_limit(self) -> int | None:
        today = date.today()
        if self._rpd_date != today:
            self._rpd_count = 0
            self._rpd_date = today
        if self._rpd_count >= RPD_LIMIT:
            return None
        self._rpd_count += 1
        return RPD_LIMIT - self._rpd_count

    @override
    def get_rate_limit_status(self) -> RateLimitStatus:
        today = date.today()
        count = self._rpd_count if self._rpd_date == today else 0
        return RateLimitStatus(
            used=count, limit=RPD_LIMIT, remaining=max(0, RPD_LIMIT - count)
        )

    @override
    def summarize(self, text: str) -> str:
        result = self._client.models.generate_content(
            model=MODEL,
            contents=(
                "Summarize this packing assistant conversation keeping key decisions, "
                f"item suggestions, and any items the user decided to pack:\n\n{text}"
            ),
        )
        return result.text or ""

    @override
    def generate_title(self, first_user_msg: str, first_model_reply: str) -> str:
        try:
            result = self._client.models.generate_content(
                model=MODEL,
                contents=(
                    f"Generate a short title (3-5 words) for a packing assistant conversation "
                    f"that started with: '{first_user_msg}'. "
                    f"Reply with only the title, no quotes."
                ),
            )
            return (result.text or "").strip()
        except Exception:
            return "Packing Session"


class ProviderRateLimitError(Exception):
    wait_seconds: int

    def __init__(self, wait_seconds: int):
        super().__init__(f"Rate limit hit, retry in {wait_seconds}s")
        self.wait_seconds = wait_seconds
