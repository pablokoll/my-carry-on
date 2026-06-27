from datetime import datetime, timezone

from extensions import db
from models import ChatMessage, ChatSession
from services.ai.base import AIProvider
from services.chat_service import get_history

COMPACT_THRESHOLD = 30
MESSAGES_KEPT_AFTER_COMPACT = 10


def compact_if_needed(
    session_id: int, user_id: int, provider: AIProvider
) -> list[ChatMessage]:
    messages = get_history(session_id, user_id)
    non_summary = [m for m in messages if m.role != "summary"]

    if len(non_summary) < COMPACT_THRESHOLD:
        return messages

    to_compact = non_summary[:-MESSAGES_KEPT_AFTER_COMPACT]
    if not to_compact:
        return messages

    text = "\n".join(f"{m.role}: {m.content}" for m in to_compact)
    summary_text = provider.summarize(text)

    db.session.add(
        ChatMessage(
            session_id=session_id,
            user_id=user_id,
            role="summary",
            content=summary_text,
            created_at=datetime.now(timezone.utc),
        )
    )
    db.session.commit()

    return get_history(session_id, user_id)


def set_title_if_needed(
    session: ChatSession,
    user_message: str,
    reply: str,
    is_first: bool,
    provider: AIProvider,
) -> str | None:
    if not is_first or session.title is not None:
        return None
    title = provider.generate_title(user_message, reply)
    session.title = title
    db.session.commit()
    return title
