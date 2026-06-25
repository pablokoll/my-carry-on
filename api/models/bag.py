from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import BaseModel

if TYPE_CHECKING:
    from models.trip import TripBag
    from models.user import User


class Category(BaseModel):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped[Optional["User"]] = relationship("User", back_populates="categories")
    items: Mapped[List["Item"]] = relationship("Item", back_populates="category", lazy=True)


class Bag(BaseModel):
    __tablename__ = "bags"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="bags")
    items: Mapped[List["Item"]] = relationship("Item", back_populates="bag", lazy=True, cascade="all, delete-orphan")
    trip_bags: Mapped[List["TripBag"]] = relationship("TripBag", back_populates="bag", lazy=True, cascade="all, delete-orphan")


class Item(BaseModel):
    __tablename__ = "items"

    id: Mapped[int] = mapped_column(primary_key=True)
    bag_id: Mapped[int] = mapped_column(ForeignKey("bags.id"), nullable=False)
    category_id: Mapped[Optional[int]] = mapped_column(ForeignKey("categories.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    packed: Mapped[bool] = mapped_column(Boolean, default=False)

    bag: Mapped["Bag"] = relationship("Bag", back_populates="items")
    category: Mapped[Optional["Category"]] = relationship("Category", back_populates="items")
    sub_items: Mapped[List["SubItem"]] = relationship("SubItem", back_populates="item", lazy=True, cascade="all, delete-orphan")

    def to_dict(self, include_subs: bool = True):
        d = super().to_dict()
        if include_subs:
            subs = self.sub_items
            d["sub_items"] = [s.to_dict() for s in subs]
            if subs:
                d["quantity"] = sum(s.quantity or 1 for s in subs)
        else:
            d["sub_items"] = []
        return d


class SubItem(BaseModel):
    __tablename__ = "sub_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("items.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    packed: Mapped[bool] = mapped_column(Boolean, default=False)

    item: Mapped["Item"] = relationship("Item", back_populates="sub_items")

    def to_dict(self):
        d = super().to_dict()
        d["quantity"] = d["quantity"] or 1
        return d
