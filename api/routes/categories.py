from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from extensions import get_current_user_id
from models import Category

categories_bp = Blueprint("categories", __name__)


@categories_bp.route("/categories", methods=["GET"])
@jwt_required()
def get_categories():
    user_id = get_current_user_id()
    categories = Category.query.filter(
        (Category.user_id == user_id) | Category.is_default  # noqa: E711
    ).all()
    return jsonify([c.to_dict() for c in categories]), 200
