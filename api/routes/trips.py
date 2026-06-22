from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from errors import BadRequest, NotFound
from extensions import db, get_current_user_id, get_or_404
from models import Trip
from services.trip_service import get_trips_with_stats

trips_bp = Blueprint("trips", __name__)


@trips_bp.route("/trips", methods=["GET"])
@jwt_required()
def get_trips():
    user_id = get_current_user_id()
    limit = request.args.get("limit", type=int)
    return jsonify(get_trips_with_stats(user_id, limit)), 200


@trips_bp.route("/trips", methods=["POST"])
@jwt_required()
def create_trip():
    user_id = get_current_user_id()
    data = request.get_json()
    if not data or not data.get("name"):
        raise BadRequest("name is required")
    if len(data["name"]) > 255:
        raise BadRequest("name must be 255 characters or less")

    trip = Trip(user_id=user_id, name=data["name"], start_date=data.get("start_date"), end_date=data.get("end_date"))
    db.session.add(trip)
    db.session.commit()
    return jsonify(trip.to_dict()), 201


@trips_bp.route("/trips/<int:trip_id>", methods=["GET"])
@jwt_required()
def get_trip(trip_id):
    user_id = get_current_user_id()
    trip = get_or_404(Trip, trip_id, user_id)
    return jsonify(trip.to_dict()), 200


@trips_bp.route("/trips/<int:trip_id>", methods=["PUT"])
@jwt_required()
def update_trip(trip_id):
    user_id = get_current_user_id()
    data = request.get_json()
    if not data:
        raise BadRequest("No data provided")

    trip = get_or_404(Trip, trip_id, user_id)
    trip.name = data.get("name") or trip.name
    trip.start_date = data.get("start_date") or trip.start_date
    trip.end_date = data.get("end_date") or trip.end_date
    db.session.commit()
    return jsonify(trip.to_dict()), 200


@trips_bp.route("/trips/<int:trip_id>", methods=["DELETE"])
@jwt_required()
def delete_trip(trip_id):
    user_id = get_current_user_id()
    trip = get_or_404(Trip, trip_id, user_id)
    db.session.delete(trip)
    db.session.commit()
    return jsonify({"message": "Trip deleted"}), 200


@trips_bp.route("/trips/<int:trip_id>/activate", methods=["POST"])
@jwt_required()
def activate_trip(trip_id):
    user_id = get_current_user_id()
    trip = get_or_404(Trip, trip_id, user_id)

    Trip.query.filter_by(user_id=user_id, is_active=True).update({"is_active": False})
    trip.is_active = True
    db.session.commit()
    return jsonify(trip.to_dict()), 200


@trips_bp.route("/trips/<int:trip_id>/deactivate", methods=["POST"])
@jwt_required()
def deactivate_trip(trip_id):
    user_id = get_current_user_id()
    trip = get_or_404(Trip, trip_id, user_id)
    trip.is_active = False
    db.session.commit()
    return jsonify(trip.to_dict()), 200
