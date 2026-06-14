from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from errors import BadRequest, Conflict, NotFound
from extensions import db, get_current_user_id
from models import Bag, TripBag

bags_bp = Blueprint("bags", __name__)


@bags_bp.route("/bags", methods=["GET"])
@jwt_required()
def get_bags():
    user_id = get_current_user_id()
    bags = Bag.query.filter_by(user_id=user_id).all()
    return jsonify([bag.to_dict() for bag in bags]), 200


@bags_bp.route("/bags", methods=["POST"])
@jwt_required()
def create_bag():
    user_id = get_current_user_id()
    data = request.get_json()
    if not data or not data.get("name"):
        raise BadRequest("name is required")
    if not data.get("type"):
        raise BadRequest("type is required")

    bag = Bag(user_id=user_id, name=data["name"], type=data["type"])
    db.session.add(bag)
    db.session.commit()
    return jsonify(bag.to_dict()), 201


@bags_bp.route("/bags/<int:bag_id>", methods=["GET"])
@jwt_required()
def get_bag(bag_id):
    user_id = get_current_user_id()
    bag = Bag.query.get(bag_id)
    if not bag or bag.user_id != user_id:
        raise NotFound("Bag not found")

    result = bag.to_dict()
    result["items"] = [item.to_dict() for item in bag.items]
    return jsonify(result), 200


@bags_bp.route("/bags/<int:bag_id>", methods=["PUT"])
@jwt_required()
def update_bag(bag_id):
    user_id = get_current_user_id()
    data = request.get_json()
    if not data:
        raise BadRequest("No data provided")

    bag = Bag.query.get(bag_id)
    if not bag or bag.user_id != user_id:
        raise NotFound("Bag not found")

    bag.name = data.get("name") or bag.name
    bag.type = data.get("type") if "type" in data else bag.type
    db.session.commit()
    return jsonify(bag.to_dict()), 200


@bags_bp.route("/bags/<int:bag_id>", methods=["DELETE"])
@jwt_required()
def delete_bag(bag_id):
    user_id = get_current_user_id()
    bag = Bag.query.get(bag_id)
    if not bag or bag.user_id != user_id:
        raise NotFound("Bag not found")

    db.session.delete(bag)
    db.session.commit()
    return jsonify({"message": "Bag deleted"}), 200


@bags_bp.route("/trips/<int:trip_id>/bags", methods=["POST"])
@jwt_required()
def assign_bag_to_trip(trip_id):
    user_id = get_current_user_id()
    data = request.get_json()
    if not data or not data.get("bag_id"):
        raise BadRequest("bag_id is required")

    bag = Bag.query.get(data["bag_id"])
    if not bag or bag.user_id != user_id:
        raise NotFound("Bag not found")

    if TripBag.query.filter_by(trip_id=trip_id, bag_id=bag.id).first():
        raise Conflict("Bag already assigned to this trip")

    trip_bag = TripBag(trip_id=trip_id, bag_id=bag.id)
    db.session.add(trip_bag)
    db.session.commit()
    return jsonify(trip_bag.to_dict()), 201


@bags_bp.route("/trips/<int:trip_id>/bags/<int:bag_id>", methods=["DELETE"])
@jwt_required()
def unassign_bag_from_trip(trip_id, bag_id):
    user_id = get_current_user_id()
    trip_bag = TripBag.query.filter_by(trip_id=trip_id, bag_id=bag_id).first()
    if not trip_bag:
        raise NotFound("Assignment not found")

    bag = Bag.query.get(bag_id)
    if not bag or bag.user_id != user_id:
        raise NotFound("Bag not found")

    db.session.delete(trip_bag)
    db.session.commit()
    return jsonify({"message": "Bag unassigned from trip"}), 200
