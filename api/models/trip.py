from datetime import date
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Date, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import BaseModel

if TYPE_CHECKING:
    from models.bag import Bag
    from models.user import User


class Trip(BaseModel):
    __tablename__ = "trips"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(default=False)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="trips")
    destinations: Mapped[List["Destination"]] = relationship("Destination", back_populates="trip", lazy=True, cascade="all, delete-orphan")
    trip_bags: Mapped[List["TripBag"]] = relationship("TripBag", back_populates="trip", lazy=True, cascade="all, delete-orphan")


class Destination(BaseModel):
    __tablename__ = "destinations"

    id: Mapped[int] = mapped_column(primary_key=True)
    trip_id: Mapped[int] = mapped_column(ForeignKey("trips.id"), nullable=False)
    city: Mapped[str] = mapped_column(String(255), nullable=False)
    country: Mapped[str] = mapped_column(String(255), nullable=False)
    arrival_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    departure_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    trip: Mapped["Trip"] = relationship("Trip", back_populates="destinations")


class TripBag(BaseModel):
    __tablename__ = "trip_bags"

    id: Mapped[int] = mapped_column(primary_key=True)
    trip_id: Mapped[int] = mapped_column(ForeignKey("trips.id"), nullable=False)
    bag_id: Mapped[int] = mapped_column(ForeignKey("bags.id"), nullable=False)

    trip: Mapped["Trip"] = relationship("Trip", back_populates="trip_bags")
    bag: Mapped["Bag"] = relationship("Bag", back_populates="trip_bags")
