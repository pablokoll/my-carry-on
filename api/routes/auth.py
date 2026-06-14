from flask import Blueprint, jsonify, request
from flask_login import login_required, login_user, logout_user
from sqlalchemy.exc import IntegrityError

from errors import BadRequest, Conflict, Unauthorized
from extensions import db
from models import User

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/auth/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data or not data.get("email") or not data.get("password"):
        raise BadRequest("Email and password are required")

    try:
        user = User(email=data["email"])
        user.set_password(data["password"])
        db.session.add(user)
        db.session.commit()
        return jsonify({"message": "User registered successfully"}), 201
    except IntegrityError:
        db.session.rollback()
        raise Conflict("Email already exists")


@auth_bp.route("/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data or not data.get("email") or not data.get("password"):
        raise BadRequest("Email and password are required")

    user = User.query.filter_by(email=data["email"]).first()
    if not user or not user.check_password(data["password"]):
        raise Unauthorized("Invalid credentials")

    login_user(user)
    return jsonify({"message": "Login successful"}), 200


@auth_bp.route("/auth/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logout successful"}), 200
