from datetime import datetime, timedelta, timezone

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from errors import BadRequest
from responses import json_msg
from extensions import db, get_current_user_id, get_or_404, limiter
from models import ChatMessage, ChatSession, Trip
from services.ai import get_provider
from services.ai.gemini import ProviderRateLimitError
from services.ai.history import build_gemini_history
from services.chat_service import (
    build_system_prompt,
    get_history,
    save_context_message,
    save_messages,
)
from services.session_service import compact_if_needed, set_title_if_needed

chat_bp = Blueprint("chat", __name__)


# --- Session endpoints ---

@chat_bp.route("/chat/sessions", methods=["GET"])
@jwt_required()
def list_sessions():
    user_id = get_current_user_id()
    trip_id = request.args.get("trip_id", type=int)
    if not trip_id:
        raise BadRequest("trip_id is required")

    get_or_404(Trip, trip_id, user_id)

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

    get_or_404(Trip, trip_id, user_id)

    session = ChatSession(trip_id=trip_id, user_id=user_id)
    db.session.add(session)
    db.session.commit()
    return jsonify(session.to_dict()), 201


@chat_bp.route("/chat/sessions/<int:session_id>", methods=["DELETE"])
@jwt_required()
def delete_session(session_id):
    user_id = get_current_user_id()
    session = get_or_404(ChatSession, session_id, user_id)
    db.session.delete(session)
    db.session.commit()
    return json_msg("Session deleted")


@chat_bp.route("/chat/sessions/<int:session_id>/messages", methods=["DELETE"])
@jwt_required()
def clear_session_messages(session_id):
    user_id = get_current_user_id()
    session = get_or_404(ChatSession, session_id, user_id)
    ChatMessage.query.filter_by(session_id=session_id).delete()
    session.title = None
    db.session.commit()
    return json_msg("Messages cleared")


@chat_bp.route("/chat/sessions/<int:session_id>/messages", methods=["GET"])
@jwt_required()
def get_session_messages(session_id):
    user_id = get_current_user_id()
    get_or_404(ChatSession, session_id, user_id)
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

    session = get_or_404(ChatSession, session_id, user_id)
    provider = get_provider()

    remaining = provider.check_rate_limit()
    if remaining is None:
        now = datetime.now(timezone.utc)
        midnight = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        return jsonify({
            "error": "rate_limit_daily",
            "message": "Daily request limit reached. Resets at midnight UTC.",
            "wait_seconds": int((midnight - now).total_seconds()),
        }), 429

    db_history = compact_if_needed(session_id, user_id, provider)
    non_summary = [m for m in db_history if m.role != "summary"]
    is_first = len(non_summary) == 0

    system_prompt = build_system_prompt(session.trip)
    history = build_gemini_history(db_history)
    user_message = messages[-1]["content"]

    try:
        ai_response = provider.send_message(history, system_prompt, user_message)
    except ProviderRateLimitError as e:
        return jsonify({
            "error": "rate_limit",
            "message": "Request limit reached. Please wait before continuing.",
            "wait_seconds": e.wait_seconds,
        }), 429

    save_messages(session_id, user_id, user_message, ai_response.reply)
    session_title = set_title_if_needed(session, user_message, ai_response.reply, is_first, provider)

    updated_history = get_history(session_id, user_id)
    response_data = {
        "reply": ai_response.reply,
        "suggestions": ai_response.suggestions,
        "history": [m.to_dict() for m in updated_history if m.role != "summary"],
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

    get_or_404(ChatSession, session_id, user_id)
    save_context_message(session_id, user_id, content)
    return json_msg("Context logged")


# --- Status endpoint ---

@chat_bp.route("/chat/status", methods=["GET"])
@jwt_required()
def chat_status():
    status = get_provider().get_rate_limit_status()
    return jsonify({"used": status.used, "limit": status.limit, "remaining": status.remaining}), 200
