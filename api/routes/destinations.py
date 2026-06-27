from flask import Blueprint, jsonify, request
from flask.typing import ResponseReturnValue
from flask_jwt_extended import jwt_required
from errors import BadRequest
from responses import json_msg
from extensions import db, get_current_user_id, get_or_404, get_owned_or_404
from models import Destination, Trip

destinations_bp = Blueprint("destinations", __name__)


@destinations_bp.route("/trips/<int:trip_id>/destinations", methods=["GET"])
@jwt_required()
def get_destinations(trip_id: int) -> ResponseReturnValue:
    user_id = get_current_user_id()
    trip = get_or_404(Trip, trip_id, user_id)
    return jsonify([d.to_dict() for d in trip.destinations]), 200


@destinations_bp.route("/trips/<int:trip_id>/destinations", methods=["POST"])
@jwt_required()
def create_destination(trip_id: int) -> ResponseReturnValue:
    user_id = get_current_user_id()
    get_or_404(Trip, trip_id, user_id)

    data = request.get_json()
    if not data or not data.get("city"):
        raise BadRequest("city is required")
    if not data.get("country"):
        raise BadRequest("country is required")
    if len(data["city"]) > 255:
        raise BadRequest("city must be 255 characters or less")
    if len(data["country"]) > 255:
        raise BadRequest("country must be 255 characters or less")

    destination = Destination(
        trip_id=trip_id,
        city=data["city"],
        country=data["country"],
        arrival_date=data.get("arrival_date"),
        departure_date=data.get("departure_date"),
    )
    db.session.add(destination)
    db.session.commit()
    return jsonify(destination.to_dict()), 201


@destinations_bp.route("/destinations/<int:destination_id>", methods=["PUT"])
@jwt_required()
def update_destination(destination_id: int) -> ResponseReturnValue:
    user_id = get_current_user_id()
    data = request.get_json()
    if not data:
        raise BadRequest("No data provided")

    destination = get_owned_or_404(Destination, destination_id, user_id, "trip.user_id")
    destination.city = data.get("city") or destination.city
    destination.country = data.get("country") or destination.country
    destination.arrival_date = (
        data.get("arrival_date") if "arrival_date" in data else destination.arrival_date
    )
    destination.departure_date = (
        data.get("departure_date")
        if "departure_date" in data
        else destination.departure_date
    )
    db.session.commit()
    return jsonify(destination.to_dict()), 200


@destinations_bp.route("/destinations/<int:destination_id>", methods=["DELETE"])
@jwt_required()
def delete_destination(destination_id: int) -> ResponseReturnValue:
    user_id = get_current_user_id()
    destination = get_owned_or_404(Destination, destination_id, user_id, "trip.user_id")
    db.session.delete(destination)
    db.session.commit()
    return json_msg("Destination deleted")
