from flask import Blueprint, jsonify, request
from flask.typing import ResponseReturnValue
from flask_jwt_extended import jwt_required
from sqlalchemy.orm import selectinload

from errors import BadRequest, Conflict, NotFound
from responses import json_msg
from extensions import db, get_current_user_id, get_or_404
from models import Bag, Item, Trip, TripBag
from services.bag_service import duplicate_bag as duplicate_bag_service

bags_bp = Blueprint("bags", __name__)

ALLOWED_BAG_TYPES = {
    "carry-on",
    "luggage",
    "backpack",
    "handbag",
    "toiletry bag",
    "worn",
    "other",
}


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
    if len(data["name"]) > 255:
        raise BadRequest("name must be 255 characters or less")
    if data["type"] not in ALLOWED_BAG_TYPES:
        raise BadRequest(f"type must be one of: {', '.join(sorted(ALLOWED_BAG_TYPES))}")

    bag = Bag(user_id=user_id, name=data["name"], type=data["type"])
    db.session.add(bag)
    db.session.commit()
    return jsonify(bag.to_dict()), 201


@bags_bp.route("/bags/<int:bag_id>", methods=["GET"])
@jwt_required()
def get_bag(bag_id: int) -> ResponseReturnValue:
    user_id = get_current_user_id()
    bag = Bag.query.options(selectinload(Bag.items).selectinload(Item.sub_items)).get(
        bag_id
    )
    if not bag or bag.user_id != user_id:
        raise NotFound("Bag not found")

    result = bag.to_dict()
    result["items"] = [item.to_dict() for item in bag.items]
    return jsonify(result), 200


@bags_bp.route("/bags/<int:bag_id>", methods=["PUT"])
@jwt_required()
def update_bag(bag_id: int) -> ResponseReturnValue:
    user_id = get_current_user_id()
    data = request.get_json()
    if not data:
        raise BadRequest("No data provided")

    bag = get_or_404(Bag, bag_id, user_id)

    new_name = data.get("name")
    new_type = data.get("type")
    if new_name is not None:
        if not new_name or len(new_name) > 255:
            raise BadRequest("name must be between 1 and 255 characters")
        bag.name = new_name
    if new_type is not None:
        if new_type not in ALLOWED_BAG_TYPES:
            raise BadRequest(
                f"type must be one of: {', '.join(sorted(ALLOWED_BAG_TYPES))}"
            )
        bag.type = new_type
    db.session.commit()
    return jsonify(bag.to_dict()), 200


@bags_bp.route("/bags/<int:bag_id>/duplicate", methods=["POST"])
@jwt_required()
def duplicate_bag(bag_id: int) -> ResponseReturnValue:
    user_id = get_current_user_id()
    bag = get_or_404(Bag, bag_id, user_id)
    new_bag = duplicate_bag_service(bag, user_id)
    result = new_bag.to_dict()
    result["items"] = [i.to_dict() for i in new_bag.items]
    return jsonify(result), 201


@bags_bp.route("/bags/<int:bag_id>", methods=["DELETE"])
@jwt_required()
def delete_bag(bag_id: int) -> ResponseReturnValue:
    user_id = get_current_user_id()
    bag = get_or_404(Bag, bag_id, user_id)
    db.session.delete(bag)
    db.session.commit()
    return json_msg("Bag deleted")


@bags_bp.route("/trips/<int:trip_id>/bags", methods=["GET"])
@jwt_required()
def get_trip_bags_with_items(trip_id: int) -> ResponseReturnValue:
    user_id = get_current_user_id()
    trip = Trip.query.options(
        selectinload(Trip.trip_bags)
        .selectinload(TripBag.bag)
        .selectinload(Bag.items)
        .selectinload(Item.sub_items)
    ).get(trip_id)
    if not trip or trip.user_id != user_id:
        raise NotFound("Trip not found")

    result = []
    for tb in trip.trip_bags:
        bag = tb.bag
        d = bag.to_dict()
        d["items"] = [item.to_dict() for item in bag.items]
        result.append(d)
    return jsonify(result), 200


@bags_bp.route("/trips/<int:trip_id>/bags", methods=["POST"])
@jwt_required()
def assign_bag_to_trip(trip_id: int) -> ResponseReturnValue:
    user_id = get_current_user_id()
    data = request.get_json()
    if not data or not data.get("bag_id"):
        raise BadRequest("bag_id is required")

    _trip = get_or_404(Trip, trip_id, user_id)
    bag = get_or_404(Bag, data["bag_id"], user_id)

    if TripBag.query.filter_by(trip_id=trip_id, bag_id=bag.id).first():
        raise Conflict("Bag already assigned to this trip")

    trip_bag = TripBag(trip_id=trip_id, bag_id=bag.id)
    db.session.add(trip_bag)
    db.session.commit()
    return jsonify(trip_bag.to_dict()), 201


@bags_bp.route("/trips/<int:trip_id>/bags/<int:bag_id>", methods=["DELETE"])
@jwt_required()
def unassign_bag_from_trip(trip_id: int, bag_id: int) -> ResponseReturnValue:
    user_id = get_current_user_id()
    get_or_404(Trip, trip_id, user_id)
    get_or_404(Bag, bag_id, user_id)

    trip_bag = TripBag.query.filter_by(trip_id=trip_id, bag_id=bag_id).first()
    if not trip_bag:
        raise NotFound("Assignment not found")

    db.session.delete(trip_bag)
    db.session.commit()
    return json_msg("Bag unassigned from trip")
