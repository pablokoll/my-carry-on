from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required

from errors import BadRequest, NotFound
from extensions import db
from models import Destination, Trip

destinations_bp = Blueprint("destinations", __name__)


@destinations_bp.route("/trips/<int:trip_id>/destinations", methods=["GET"])
@login_required
def get_destinations(trip_id):
    trip = Trip.query.get(trip_id)
    if not trip or trip.user_id != current_user.id:
        raise NotFound("Trip not found")

    return jsonify([d.to_dict() for d in trip.destinations]), 200


@destinations_bp.route("/trips/<int:trip_id>/destinations", methods=["POST"])
@login_required
def create_destination(trip_id):
    trip = Trip.query.get(trip_id)
    if not trip or trip.user_id != current_user.id:
        raise NotFound("Trip not found")

    data = request.get_json()
    if not data or not data.get("city"):
        raise BadRequest("city is required")
    if not data.get("country"):
        raise BadRequest("country is required")

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
@login_required
def update_destination(destination_id):
    data = request.get_json()
    if not data:
        raise BadRequest("No data provided")

    destination = Destination.query.get(destination_id)
    if not destination or destination.trip.user_id != current_user.id:
        raise NotFound("Destination not found")

    destination.city = data.get("city") or destination.city
    destination.country = data.get("country") or destination.country
    destination.arrival_date = data.get("arrival_date") if "arrival_date" in data else destination.arrival_date
    destination.departure_date = data.get("departure_date") if "departure_date" in data else destination.departure_date
    db.session.commit()
    return jsonify(destination.to_dict()), 200


@destinations_bp.route("/destinations/<int:destination_id>", methods=["DELETE"])
@login_required
def delete_destination(destination_id):
    destination = Destination.query.get(destination_id)
    if not destination or destination.trip.user_id != current_user.id:
        raise NotFound("Destination not found")

    db.session.delete(destination)
    db.session.commit()
    return jsonify({"message": "Destination deleted"}), 200
