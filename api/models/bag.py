from extensions import db
from models.base import BaseModel


class Category(BaseModel):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    name = db.Column(db.String(100), nullable=False)
    is_default = db.Column(db.Boolean, default=False)

    user = db.relationship("User", back_populates="categories")
    items = db.relationship("Item", back_populates="category", lazy=True)


class Bag(BaseModel):
    __tablename__ = "bags"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    type = db.Column(db.String(100), nullable=True)

    user = db.relationship("User", back_populates="bags")
    items = db.relationship("Item", back_populates="bag", lazy=True, cascade="all, delete-orphan")
    trip_bags = db.relationship("TripBag", back_populates="bag", lazy=True, cascade="all, delete-orphan")


class Item(BaseModel):
    __tablename__ = "items"

    id = db.Column(db.Integer, primary_key=True)
    bag_id = db.Column(db.Integer, db.ForeignKey("bags.id"), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=True)
    name = db.Column(db.String(255), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    packed = db.Column(db.Boolean, default=False)

    bag = db.relationship("Bag", back_populates="items")
    category = db.relationship("Category", back_populates="items")
    sub_items = db.relationship("SubItem", back_populates="item", lazy=True, cascade="all, delete-orphan")

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

    id = db.Column(db.Integer, primary_key=True)
    item_id = db.Column(db.Integer, db.ForeignKey("items.id"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    packed = db.Column(db.Boolean, default=False)

    item = db.relationship("Item", back_populates="sub_items")

    def to_dict(self):
        d = super().to_dict()
        d["quantity"] = d["quantity"] or 1
        return d
