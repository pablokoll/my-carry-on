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
    save_messages,
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

    chat_session = _client.chats.create(model=MODEL, history=gemini_history)
    response = chat_session.send_message(user_message)

    save_messages(trip_id, user_id, user_message, response.text)
    return jsonify({"reply": response.text, "history": [m.to_dict() for m in get_history(trip_id, user_id)]}), 200
