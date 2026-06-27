from abc import ABC, abstractmethod
from dataclasses import dataclass, field

from google.genai import types as genai_types


@dataclass
class AIResponse:
    reply: str
    suggestions: list[dict[str, object]] = field(default_factory=list)


@dataclass
class RateLimitStatus:
    used: int
    limit: int
    remaining: int


class AIProvider(ABC):
    @abstractmethod
    def send_message(
        self,
        history: list[genai_types.ContentOrDict],
        system_prompt: str,
        user_message: str,
    ) -> AIResponse:
        """Send a message and return the AI response."""
        ...

    @abstractmethod
    def check_rate_limit(self) -> int | None:
        """Increment and check daily rate limit.
        Returns remaining requests, or None if exhausted."""
        ...

    @abstractmethod
    def get_rate_limit_status(self) -> RateLimitStatus:
        """Return current rate limit status without incrementing."""
        ...

    @abstractmethod
    def summarize(self, text: str) -> str:
        """Summarize a block of conversation text."""
        ...

    @abstractmethod
    def generate_title(self, first_user_msg: str, first_model_reply: str) -> str:
        """Generate a short session title from the first exchange."""
        ...
