from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required

from errors import BadRequest, NotFound
from extensions import db
from models import Category

categories_bp = Blueprint("categories", __name__)


@categories_bp.route("/categories", methods=["GET"])
@login_required
def get_categories():
    categories = Category.query.filter(
        (Category.user_id == current_user.id) | (Category.is_default == True)
    ).all()
    return jsonify([c.to_dict() for c in categories]), 200


@categories_bp.route("/categories", methods=["POST"])
@login_required
def create_category():
    data = request.get_json()
    if not data or not data.get("name"):
        raise BadRequest("name is required")

    category = Category(user_id=current_user.id, name=data["name"])
    db.session.add(category)
    db.session.commit()
    return jsonify(category.to_dict()), 201


@categories_bp.route("/categories/<int:category_id>", methods=["PUT"])
@login_required
def update_category(category_id):
    data = request.get_json()
    if not data:
        raise BadRequest("No data provided")

    category = Category.query.get(category_id)
    if not category or category.user_id != current_user.id:
        raise NotFound("Category not found")

    category.name = data.get("name") or category.name
    db.session.commit()
    return jsonify(category.to_dict()), 200


@categories_bp.route("/categories/<int:category_id>", methods=["DELETE"])
@login_required
def delete_category(category_id):
    category = Category.query.get(category_id)
    if not category or category.user_id != current_user.id:
        raise NotFound("Category not found")

    db.session.delete(category)
    db.session.commit()
    return jsonify({"message": "Category deleted"}), 200
