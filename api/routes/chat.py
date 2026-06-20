from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from errors import BadRequest, NotFound
from extensions import db, get_current_user_id, limiter
from models import ChatMessage, ChatSession, Trip
from services.chat_service import (
    MODEL,
    COMPACT_THRESHOLD,
    _client,
    build_gemini_history,
    build_system_prompt,
    compact_history,
    generate_session_title,
    get_history,
    get_rpd_status,
    parse_reply,
    save_messages,
    save_context_message,
    _check_rpd,
)

chat_bp = Blueprint("chat", __name__)


# --- Session endpoints ---

@chat_bp.route("/chat/sessions", methods=["GET"])
@jwt_required()
def list_sessions():
    user_id = get_current_user_id()
    trip_id = request.args.get("trip_id", type=int)
    if not trip_id:
        raise BadRequest("trip_id is required")

    trip = Trip.query.get(trip_id)
    if not trip or trip.user_id != user_id:
        raise NotFound("Trip not found")

    sessions = (
        ChatSession.query
        .filter_by(trip_id=trip_id, user_id=user_id)
        .order_by(ChatSession.created_at.desc())
        .all()
    )

    result = []
    for s in sessions:
        msg_count = ChatMessage.query.filter_by(session_id=s.id).filter(
            ChatMessage.role != "summary"
        ).count()
        result.append({
            "id": s.id,
            "title": s.title,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "message_count": msg_count,
        })

    return jsonify(result), 200


@chat_bp.route("/chat/sessions", methods=["POST"])
@jwt_required()
def create_session():
    user_id = get_current_user_id()
    data = request.get_json()
    if not data:
        raise BadRequest("No data provided")

    trip_id = data.get("trip_id")
    if not trip_id:
        raise BadRequest("trip_id is required")

    trip = Trip.query.get(trip_id)
    if not trip or trip.user_id != user_id:
        raise NotFound("Trip not found")

    session = ChatSession(trip_id=trip_id, user_id=user_id)
    db.session.add(session)
    db.session.commit()

    return jsonify(session.to_dict()), 201


@chat_bp.route("/chat/sessions/<int:session_id>", methods=["DELETE"])
@jwt_required()
def delete_session(session_id):
    user_id = get_current_user_id()
    session = ChatSession.query.get(session_id)
    if not session or session.user_id != user_id:
        raise NotFound("Session not found")

    db.session.delete(session)
    db.session.commit()
    return jsonify({"ok": True}), 200


@chat_bp.route("/chat/sessions/<int:session_id>/messages", methods=["DELETE"])
@jwt_required()
def clear_session_messages(session_id):
    user_id = get_current_user_id()
    session = ChatSession.query.get(session_id)
    if not session or session.user_id != user_id:
        raise NotFound("Session not found")

    ChatMessage.query.filter_by(session_id=session_id).delete()
    session.title = None
    db.session.commit()
    return jsonify({"ok": True}), 200


@chat_bp.route("/chat/sessions/<int:session_id>/messages", methods=["GET"])
@jwt_required()
def get_session_messages(session_id):
    user_id = get_current_user_id()
    session = ChatSession.query.get(session_id)
    if not session or session.user_id != user_id:
        raise NotFound("Session not found")

    messages = (
        ChatMessage.query
        .filter_by(session_id=session_id, user_id=user_id)
        .filter(ChatMessage.role != "summary")
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return jsonify([m.to_dict() for m in messages]), 200


# --- Chat endpoint ---

@chat_bp.route("/chat", methods=["POST"])
@jwt_required()
@limiter.limit("30 per minute")
def chat():
    user_id = get_current_user_id()
    data = request.get_json()
    if not data:
        raise BadRequest("No data provided")

    session_id = data.get("session_id")
    messages = data.get("messages")
    if not session_id:
        raise BadRequest("session_id is required")
    if not messages or not isinstance(messages, list):
        raise BadRequest("messages is required")

    session = ChatSession.query.get(session_id)
    if not session or session.user_id != user_id:
        raise NotFound("Session not found")

    trip = session.trip
    system_prompt = build_system_prompt(trip)
    db_history = get_history(session_id, user_id)

    non_summary = [m for m in db_history if m.role != "summary"]
    if len(non_summary) >= COMPACT_THRESHOLD:
        compact_history(session_id, user_id, db_history)
        db_history = get_history(session_id, user_id)

    gemini_history = build_gemini_history(db_history, system_prompt)
    user_message = messages[-1]["content"]

    remaining = _check_rpd()
    if remaining is None:
        # Reset happens at midnight UTC — tell frontend to wait until then
        from datetime import datetime, timezone, timedelta
        now = datetime.now(timezone.utc)
        midnight = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        wait_seconds = int((midnight - now).total_seconds())
        return jsonify({
            "error": "rate_limit_daily",
            "message": "Límite diario de consultas alcanzado. Se restablece a medianoche UTC.",
            "wait_seconds": wait_seconds,
        }), 429

    from google.genai.errors import ClientError
    try:
        chat_session = _client.chats.create(model=MODEL, history=gemini_history)
        response = chat_session.send_message(user_message)
    except ClientError as e:
        if e.code == 429:
            retry_after = None
            if hasattr(e, "response") and e.response is not None:
                retry_after = e.response.headers.get("Retry-After")
            wait_seconds = int(retry_after) if retry_after else 60
            return jsonify({
                "error": "rate_limit",
                "message": "Límite de consultas alcanzado. Esperá antes de continuar.",
                "wait_seconds": wait_seconds,
            }), 429
        raise

    raw = response.text or response.candidates[0].content.parts[0].text
    reply, suggestions = parse_reply(raw)

    is_first_exchange = len(non_summary) == 0
    save_messages(session_id, user_id, user_message, reply)

    session_title = None
    if is_first_exchange and session.title is None:
        session_title = generate_session_title(user_message, reply)
        session.title = session_title
        db.session.commit()

    updated_history = get_history(session_id, user_id)
    filtered_history = [m.to_dict() for m in updated_history if m.role != "summary"]

    response_data = {
        "reply": reply,
        "suggestions": suggestions,
        "history": filtered_history,
    }
    if session_title is not None:
        response_data["session_title"] = session_title

    return jsonify(response_data), 200


# --- Log endpoint ---

@chat_bp.route("/chat/log", methods=["POST"])
@jwt_required()
def log_context():
    user_id = get_current_user_id()
    data = request.get_json()
    session_id = data.get("session_id")
    content = data.get("content")
    if not session_id or not content:
        raise BadRequest("session_id and content are required")

    session = ChatSession.query.get(session_id)
    if not session or session.user_id != user_id:
        raise NotFound("Session not found")

    save_context_message(session_id, user_id, content)
    return jsonify({"ok": True}), 200


# --- RPD status endpoint ---

@chat_bp.route("/chat/status", methods=["GET"])
@jwt_required()
def chat_status():
    return jsonify(get_rpd_status()), 200
