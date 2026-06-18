from extensions import db
from models.base import BaseModel


class Trip(BaseModel):
    __tablename__ = "trips"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    is_active = db.Column(db.Boolean, default=False)
    start_date = db.Column(db.Date, nullable=True)
    end_date = db.Column(db.Date, nullable=True)

    user = db.relationship("User", back_populates="trips")
    destinations = db.relationship("Destination", back_populates="trip", lazy=True, cascade="all, delete-orphan")
    trip_bags = db.relationship("TripBag", back_populates="trip", lazy=True, cascade="all, delete-orphan")


class Destination(BaseModel):
    __tablename__ = "destinations"

    id = db.Column(db.Integer, primary_key=True)
    trip_id = db.Column(db.Integer, db.ForeignKey("trips.id"), nullable=False)
    city = db.Column(db.String(255), nullable=False)
    country = db.Column(db.String(255), nullable=False)
    arrival_date = db.Column(db.Date, nullable=True)
    departure_date = db.Column(db.Date, nullable=True)

    trip = db.relationship("Trip", back_populates="destinations")


class TripBag(BaseModel):
    __tablename__ = "trip_bags"

    id = db.Column(db.Integer, primary_key=True)
    trip_id = db.Column(db.Integer, db.ForeignKey("trips.id"), nullable=False)
    bag_id = db.Column(db.Integer, db.ForeignKey("bags.id"), nullable=False)

    trip = db.relationship("Trip", back_populates="trip_bags")
    bag = db.relationship("Bag", back_populates="trip_bags")
