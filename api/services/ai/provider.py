import os

from services.ai.base import AIProvider

_instance: AIProvider | None = None


def get_provider() -> AIProvider:
    global _instance
    if _instance is not None:
        return _instance

    provider_name = os.environ.get("AI_PROVIDER", "gemini").lower()

    if provider_name == "gemini":
        from services.ai.al import GeminiProvider
        _instance = GeminiProvider()
    else:
        raise ValueError(f"Unknown AI provider: '{provider_name}'. Set AI_PROVIDER env var.")

    return _instance
