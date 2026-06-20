from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from errors import BadRequest, NotFound
from extensions import db, get_current_user_id
from models import Bag, Item, SubItem

items_bp = Blueprint("items", __name__)


@items_bp.route("/bags/<int:bag_id>/items", methods=["GET"])
@jwt_required()
def get_items(bag_id):
    user_id = get_current_user_id()
    bag = Bag.query.get(bag_id)
    if not bag or bag.user_id != user_id:
        raise NotFound("Bag not found")

    return jsonify([item.to_dict() for item in bag.items]), 200


@items_bp.route("/bags/<int:bag_id>/items", methods=["POST"])
@jwt_required()
def create_item(bag_id):
    user_id = get_current_user_id()
    bag = Bag.query.get(bag_id)
    if not bag or bag.user_id != user_id:
        raise NotFound("Bag not found")

    data = request.get_json()
    if not data or not data.get("name"):
        raise BadRequest("name is required")
    if len(data["name"]) > 255:
        raise BadRequest("name must be 255 characters or less")
    quantity = data.get("quantity", 1)
    if not isinstance(quantity, int) or quantity < 1:
        raise BadRequest("quantity must be a positive integer")

    item = Item(
        bag_id=bag_id,
        name=data["name"],
        category_id=data.get("category_id"),
        quantity=quantity,
    )
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

    item = Item.query.get(item_id)
    if not item or item.bag.user_id != user_id:
        raise NotFound("Item not found")

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
    item = Item.query.get(item_id)
    if not item or item.bag.user_id != user_id:
        raise NotFound("Item not found")

    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Item deleted"}), 200


@items_bp.route("/items/<int:item_id>/sub-items", methods=["GET"])
@jwt_required()
def get_sub_items(item_id):
    user_id = get_current_user_id()
    item = Item.query.get(item_id)
    if not item or item.bag.user_id != user_id:
        raise NotFound("Item not found")

    return jsonify([s.to_dict() for s in item.sub_items]), 200


@items_bp.route("/items/<int:item_id>/sub-items", methods=["POST"])
@jwt_required()
def create_sub_item(item_id):
    user_id = get_current_user_id()
    item = Item.query.get(item_id)
    if not item or item.bag.user_id != user_id:
        raise NotFound("Item not found")

    data = request.get_json()
    if not data or not data.get("name"):
        raise BadRequest("name is required")
    if len(data["name"]) > 255:
        raise BadRequest("name must be 255 characters or less")
    quantity = data.get("quantity", 1)
    if not isinstance(quantity, int) or quantity < 1:
        raise BadRequest("quantity must be a positive integer")

    sub_item = SubItem(item_id=item_id, name=data["name"], quantity=quantity)
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

    sub_item = SubItem.query.get(sub_item_id)
    if not sub_item or sub_item.item.bag.user_id != user_id:
        raise NotFound("SubItem not found")

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
    sub_item = SubItem.query.get(sub_item_id)
    if not sub_item or sub_item.item.bag.user_id != user_id:
        raise NotFound("SubItem not found")

    db.session.delete(sub_item)
    db.session.commit()
    return jsonify({"message": "SubItem deleted"}), 200
