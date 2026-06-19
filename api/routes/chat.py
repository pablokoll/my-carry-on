from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from errors import BadRequest, NotFound
from extensions import get_current_user_id
from models import Trip
from services.chat_service import (
    MODEL,
    COMPACT_THRESHOLD,
    _client,
    build_gemini_history,
    build_system_prompt,
    compact_history,
    get_history,
    parse_reply,
    save_messages,
    save_context_message,
)

chat_bp = Blueprint("chat", __name__)



@chat_bp.route("/chat/<int:trip_id>", methods=["GET"])
@jwt_required()
def get_chat_history(trip_id):
    user_id = get_current_user_id()
    trip = Trip.query.get(trip_id)
    if not trip or trip.user_id != user_id:
        raise NotFound("Trip not found")
    history = get_history(trip_id, user_id)
    return jsonify([m.to_dict() for m in history]), 200


@chat_bp.route("/chat", methods=["POST"])
@jwt_required()
def chat():
    user_id = get_current_user_id()
    data = request.get_json()
    if not data:
        raise BadRequest("No data provided")

    trip_id = data.get("trip_id")
    messages = data.get("messages")
    if not trip_id:
        raise BadRequest("trip_id is required")
    if not messages or not isinstance(messages, list):
        raise BadRequest("messages is required")

    trip = Trip.query.get(trip_id)
    if not trip or trip.user_id != user_id:
        raise NotFound("Trip not found")

    system_prompt = build_system_prompt(trip)
    db_history = get_history(trip_id, user_id)

    non_summary = [m for m in db_history if m.role != "summary"]
    if len(non_summary) >= COMPACT_THRESHOLD:
        compact_history(trip_id, user_id, db_history)
        db_history = get_history(trip_id, user_id)

    gemini_history = build_gemini_history(db_history, system_prompt)
    user_message = messages[-1]["content"]

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

    save_messages(trip_id, user_id, user_message, reply)
    return jsonify({
        "reply": reply,
        "suggestions": suggestions,
        "history": [m.to_dict() for m in get_history(trip_id, user_id)],
    }), 200


@chat_bp.route("/chat/log", methods=["POST"])
@jwt_required()
def log_context():
    user_id = get_current_user_id()
    data = request.get_json()
    trip_id = data.get("trip_id")
    content = data.get("content")
    if not trip_id or not content:
        raise BadRequest("trip_id and content are required")
    trip = Trip.query.get(trip_id)
    if not trip or trip.user_id != user_id:
        raise NotFound("Trip not found")
    save_context_message(trip_id, user_id, content)
    return jsonify({"ok": True}), 200
