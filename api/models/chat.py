from datetime import datetime, timezone

from extensions import db
from models.base import BaseModel


class ChatMessage(BaseModel):
    __tablename__ = "chat_messages"

    id = db.Column(db.Integer, primary_key=True)
    trip_id = db.Column(db.Integer, db.ForeignKey("trips.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    role = db.Column(db.String(10), nullable=False)  # "user" | "model" | "summary"
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    trip = db.relationship("Trip", backref=db.backref("chat_messages", lazy=True))
    user = db.relationship("User", backref=db.backref("chat_messages", lazy=True))
