from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required

from extensions import db
from models import Trip

trips_bp = Blueprint("trips", __name__)


@trips_bp.route("/trips", methods=["GET"])
@login_required
def get_trips():
    try:
        trips = Trip.query.filter_by(user_id=current_user.id).all()
        return jsonify([trip.to_dict() for trip in trips]), 200
    except Exception as e:
        return jsonify({"error": "Failed to fetch trips: " + str(e)}), 500


@trips_bp.route("/trips", methods=["POST"])
@login_required
def create_trip():
    data = request.get_json()
    if not data or not data.get("name"):
        return jsonify({"error": "name is required"}), 400

    try:
        trip = Trip(
            user_id=current_user.id,
            name=data.get("name"),
            start_date=data.get("start_date"),
            end_date=data.get("end_date"),
        )
        db.session.add(trip)
        db.session.commit()
        return jsonify(trip.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to create trip: " + str(e)}), 500


@trips_bp.route("/trips/<int:trip_id>", methods=["PUT"])
@login_required
def update_trip(trip_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "None data provided"}), 400

    try:
        trip = Trip.query.get(trip_id)
        if not trip or trip.user_id != current_user.id:
            return jsonify({"error": "Trip not found"}), 404

        trip.name = data.get("name") or trip.name
        trip.start_date = data.get("start_date") or trip.start_date
        trip.end_date = data.get("end_date") or trip.end_date
        db.session.commit()
        return jsonify(trip.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to update trip: " + str(e)}), 500


@trips_bp.route("/trips/<int:trip_id>", methods=["DELETE"])
@login_required
def delete_trip(trip_id):
    try:
        trip = Trip.query.get(trip_id)
        if not trip or trip.user_id != current_user.id:
            return jsonify({"error": "Trip not found"}), 404

        db.session.delete(trip)
        db.session.commit()
        return jsonify({"message": "Trip deleted"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to delete trip: " + str(e)}), 500


@trips_bp.route("/trips/<int:trip_id>/activate", methods=["POST"])
@login_required
def activate_trip(trip_id):
    try:
        trip = Trip.query.get(trip_id)
        if not trip or trip.user_id != current_user.id:
            return jsonify({"error": "Trip not found"}), 404

        current_active_trips = Trip.query.filter_by(
            user_id=current_user.id, is_active=True
        )
        if current_active_trips:
            for current_trip in current_active_trips:
                current_trip.is_active = False

        trip.is_active = True
        db.session.commit()
        return jsonify(trip.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to activate trip: " + str(e)}), 500
