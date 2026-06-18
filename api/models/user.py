from datetime import datetime, timezone

import bcrypt

from extensions import db
from models.base import BaseModel


class User(BaseModel):
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
