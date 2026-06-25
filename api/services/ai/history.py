from models import ChatMessage


def build_gemini_history(messages: list[ChatMessage]) -> list[dict]:
    summary = next((m for m in reversed(messages) if m.role == "summary"), None)

    history = []
    if summary:
        history += [
            {"role": "user", "parts": [{"text": f"[Conversation summary so far]: {summary.content}"}]},
            {"role": "model", "parts": [{"text": "Got it, I have the context from our previous conversation."}]},
        ]
        cutoff = summary.created_at
        recent = [m for m in messages if m.role != "summary" and m.created_at > cutoff]
    else:
        recent = [m for m in messages if m.role != "summary"]

    for m in recent:
        role = "user" if m.role == "user" else "model"
        history.append({"role": role, "parts": [{"text": m.content}]})

    return history
