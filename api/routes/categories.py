from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from errors import BadRequest, NotFound
from extensions import db, get_current_user_id, get_or_404
from models import Category

categories_bp = Blueprint("categories", __name__)


@categories_bp.route("/categories", methods=["GET"])
@jwt_required()
def get_categories():
    user_id = get_current_user_id()
    categories = Category.query.filter(
        (Category.user_id == user_id) | (Category.is_default == True)
    ).all()
    return jsonify([c.to_dict() for c in categories]), 200


@categories_bp.route("/categories", methods=["POST"])
@jwt_required()
def create_category():
    user_id = get_current_user_id()
    data = request.get_json()
    if not data or not data.get("name"):
        raise BadRequest("name is required")

    category = Category(user_id=user_id, name=data["name"])
    db.session.add(category)
    db.session.commit()
    return jsonify(category.to_dict()), 201


@categories_bp.route("/categories/<int:category_id>", methods=["PUT"])
@jwt_required()
def update_category(category_id):
    user_id = get_current_user_id()
    data = request.get_json()
    if not data:
        raise BadRequest("No data provided")

    category = get_or_404(Category, category_id, user_id)
    category.name = data.get("name") or category.name
    db.session.commit()
    return jsonify(category.to_dict()), 200


@categories_bp.route("/categories/<int:category_id>", methods=["DELETE"])
@jwt_required()
def delete_category(category_id):
    user_id = get_current_user_id()
    category = get_or_404(Category, category_id, user_id)
    db.session.delete(category)
    db.session.commit()
    return jsonify({"message": "Category deleted"}), 200
