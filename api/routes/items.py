from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from errors import BadRequest, NotFound, json_msg
from extensions import db, get_current_user_id, get_or_404, get_owned_or_404
from models import Bag, Item, SubItem

items_bp = Blueprint("items", __name__)


@items_bp.route("/bags/<int:bag_id>/items", methods=["GET"])
@jwt_required()
def get_items(bag_id):
    user_id = get_current_user_id()
    bag = get_or_404(Bag, bag_id, user_id)
    return jsonify([item.to_dict() for item in bag.items]), 200


@items_bp.route("/bags/<int:bag_id>/items", methods=["POST"])
@jwt_required()
def create_item(bag_id):
    user_id = get_current_user_id()
    bag = get_or_404(Bag, bag_id, user_id)

    data = request.get_json()
    if not data or not data.get("name"):
        raise BadRequest("name is required")
    if len(data["name"]) > 255:
        raise BadRequest("name must be 255 characters or less")
    quantity = data.get("quantity", 1)
    if not isinstance(quantity, int) or quantity < 1:
        raise BadRequest("quantity must be a positive integer")

    item = Item(bag_id=bag.id, name=data["name"], category_id=data.get("category_id"), quantity=quantity)
    db.session.add(item)
    db.session.commit()
    return jsonify(item.to_dict()), 201


@items_bp.route("/items/<int:item_id>", methods=["PUT"])
@jwt_required()
def update_item(item_id):
    user_id = get_current_user_id()
    data = request.get_json()
    if not data:
        raise BadRequest("No data provided")

    item = get_owned_or_404(Item, item_id, user_id, "bag.user_id")

    new_name = data.get("name")
    if new_name is not None:
        if not new_name or len(new_name) > 255:
            raise BadRequest("name must be between 1 and 255 characters")
        item.name = new_name
    if "category_id" in data:
        item.category_id = data["category_id"]
    if "quantity" in data:
        qty = data["quantity"]
        if not isinstance(qty, int) or qty < 1:
            raise BadRequest("quantity must be a positive integer")
        item.quantity = qty
    if "packed" in data:
        item.packed = data["packed"]
    db.session.commit()
    return jsonify(item.to_dict()), 200


@items_bp.route("/items/<int:item_id>", methods=["DELETE"])
@jwt_required()
def delete_item(item_id):
    user_id = get_current_user_id()
    item = get_owned_or_404(Item, item_id, user_id, "bag.user_id")
    db.session.delete(item)
    db.session.commit()
    return json_msg("Item deleted")


@items_bp.route("/items/<int:item_id>/sub-items", methods=["GET"])
@jwt_required()
def get_sub_items(item_id):
    user_id = get_current_user_id()
    item = get_owned_or_404(Item, item_id, user_id, "bag.user_id")
    return jsonify([s.to_dict() for s in item.sub_items]), 200


@items_bp.route("/items/<int:item_id>/sub-items", methods=["POST"])
@jwt_required()
def create_sub_item(item_id):
    user_id = get_current_user_id()
    item = get_owned_or_404(Item, item_id, user_id, "bag.user_id")

    data = request.get_json()
    if not data or not data.get("name"):
        raise BadRequest("name is required")
    if len(data["name"]) > 255:
        raise BadRequest("name must be 255 characters or less")
    quantity = data.get("quantity", 1)
    if not isinstance(quantity, int) or quantity < 1:
        raise BadRequest("quantity must be a positive integer")

    sub_item = SubItem(item_id=item.id, name=data["name"], quantity=quantity)
    db.session.add(sub_item)
    db.session.commit()
    return jsonify(sub_item.to_dict()), 201


@items_bp.route("/sub-items/<int:sub_item_id>", methods=["PUT"])
@jwt_required()
def update_sub_item(sub_item_id):
    user_id = get_current_user_id()
    data = request.get_json()
    if not data:
        raise BadRequest("No data provided")

    sub_item = get_owned_or_404(SubItem, sub_item_id, user_id, "item.bag.user_id")

    new_name = data.get("name")
    if new_name is not None:
        if not new_name or len(new_name) > 255:
            raise BadRequest("name must be between 1 and 255 characters")
        sub_item.name = new_name
    if "quantity" in data:
        qty = data["quantity"]
        if not isinstance(qty, int) or qty < 1:
            raise BadRequest("quantity must be a positive integer")
        sub_item.quantity = qty
    if "packed" in data:
        sub_item.packed = data["packed"]
    db.session.commit()
    return jsonify(sub_item.to_dict()), 200


@items_bp.route("/sub-items/<int:sub_item_id>", methods=["DELETE"])
@jwt_required()
def delete_sub_item(sub_item_id):
    user_id = get_current_user_id()
    sub_item = get_owned_or_404(SubItem, sub_item_id, user_id, "item.bag.user_id")
    db.session.delete(sub_item)
    db.session.commit()
    return json_msg("SubItem deleted")
