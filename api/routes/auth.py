from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required,
)
from sqlalchemy.exc import IntegrityError

from errors import BadRequest, Conflict, Unauthorized
from extensions import db, limiter
from models import User

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/auth/register", methods=["POST"])
@limiter.limit("5 per minute; 20 per hour")
def register():
    data = request.get_json()
    if not data or not data.get("email") or not data.get("password"):
        raise BadRequest("Email and password are required")
    if len(data["password"]) < 8:
        raise BadRequest("Password must be at least 8 characters")
    if len(data["email"]) > 255:
        raise BadRequest("Email must be 255 characters or less")

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
@limiter.limit("10 per minute; 50 per hour")
def login():
    data = request.get_json()
    if not data or not data.get("email") or not data.get("password"):
        raise BadRequest("Email and password are required")

    user = User.query.filter_by(email=data["email"]).first()
    if not user or not user.check_password(data["password"]):
        raise Unauthorized("Invalid credentials")

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    return jsonify({"access_token": access_token, "refresh_token": refresh_token}), 200


@auth_bp.route("/auth/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    access_token = create_access_token(identity=identity)
    return jsonify({"access_token": access_token}), 200


@auth_bp.route("/auth/me", methods=["GET"])
@jwt_required()
def me():
    from extensions import get_current_user_id
    from models import Bag, Trip

    user_id = get_current_user_id()
    user = User.query.get(user_id)

    trips = Trip.query.filter_by(user_id=user_id).all()
    trip_count = len(trips)
    destination_count = sum(len(t.destinations) for t in trips)
    bag_count = Bag.query.filter_by(user_id=user_id).count()

    return jsonify(
        {
            "email": user.email,
            "created_at": user.created_at.isoformat(),
            "trip_count": trip_count,
            "destination_count": destination_count,
            "bag_count": bag_count,
        }
    ), 200


@auth_bp.route("/auth/logout", methods=["POST"])
@jwt_required()
def logout():
    return jsonify({"message": "Logout successful"}), 200
