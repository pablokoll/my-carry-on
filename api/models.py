from datetime import datetime, timezone

import bcrypt
from flask_login import UserMixin

from extensions import db


class User(UserMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    trips = db.relationship("Trip", back_populates="user", lazy=True)
    bags = db.relationship("Bag", back_populates="user", lazy=True)
    categories = db.relationship("Category", back_populates="user", lazy=True)

    def set_password(self, password):
        self.password_hash = bcrypt.hashpw(
            password.encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")

    def check_password(self, password):
        return bcrypt.checkpw(
            password.encode("utf-8"), self.password_hash.encode("utf-8")
        )


class Trip(db.Model):
    __tablename__ = "trips"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    is_active = db.Column(db.Boolean, default=False)
    start_date = db.Column(db.Date, nullable=True)
    end_date = db.Column(db.Date, nullable=True)

    user = db.relationship("User", back_populates="trips")
    destinations = db.relationship("Destination", back_populates="trip", lazy=True)
    trip_bags = db.relationship("TripBag", back_populates="trip", lazy=True)


class Destination(db.Model):
    __tablename__ = "destinations"

    id = db.Column(db.Integer, primary_key=True)
    trip_id = db.Column(db.Integer, db.ForeignKey("trips.id"), nullable=False)
    city = db.Column(db.String(255), nullable=False)
    country = db.Column(db.String(255), nullable=False)
    arrival_date = db.Column(db.Date, nullable=True)
    departure_date = db.Column(db.Date, nullable=True)

    trip = db.relationship("Trip", back_populates="destinations")


class Bag(db.Model):
    __tablename__ = "bags"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    type = db.Column(db.String(100), nullable=True)

    user = db.relationship("User", back_populates="bags")
    items = db.relationship("Item", back_populates="bag", lazy=True)
    trip_bags = db.relationship("TripBag", back_populates="bag", lazy=True)


class TripBag(db.Model):
    __tablename__ = "trip_bags"

    id = db.Column(db.Integer, primary_key=True)
    trip_id = db.Column(db.Integer, db.ForeignKey("trips.id"), nullable=False)
    bag_id = db.Column(db.Integer, db.ForeignKey("bags.id"), nullable=False)

    trip = db.relationship("Trip", back_populates="trip_bags")
    bag = db.relationship("Bag", back_populates="trip_bags")


class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    name = db.Column(db.String(100), nullable=False)
    is_default = db.Column(db.Boolean, default=False)

    user = db.relationship("User", back_populates="categories")
    items = db.relationship("Item", back_populates="category", lazy=True)


class Item(db.Model):
    __tablename__ = "items"

    id = db.Column(db.Integer, primary_key=True)
    bag_id = db.Column(db.Integer, db.ForeignKey("bags.id"), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=True)
    name = db.Column(db.String(255), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    packed = db.Column(db.Boolean, default=False)

    bag = db.relationship("Bag", back_populates="items")
    category = db.relationship("Category", back_populates="items")
    sub_items = db.relationship("SubItem", back_populates="item", lazy=True)


class SubItem(db.Model):
    __tablename__ = "sub_items"

    id = db.Column(db.Integer, primary_key=True)
    item_id = db.Column(db.Integer, db.ForeignKey("items.id"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    packed = db.Column(db.Boolean, default=False)

    item = db.relationship("Item", back_populates="sub_items")
