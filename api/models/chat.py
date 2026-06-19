from datetime import datetime, timezone

from extensions import db
from models.base import BaseModel


class ChatSession(BaseModel):
    __tablename__ = "chat_sessions"

    id = db.Column(db.Integer, primary_key=True)
    trip_id = db.Column(db.Integer, db.ForeignKey("trips.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    messages = db.relationship("ChatMessage", back_populates="session", lazy=True, cascade="all, delete-orphan")
    trip = db.relationship("Trip", backref=db.backref("chat_sessions", lazy=True))
    user = db.relationship("User", backref=db.backref("chat_sessions", lazy=True))


class ChatMessage(BaseModel):
    __tablename__ = "chat_messages"

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("chat_sessions.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    role = db.Column(db.String(10), nullable=False)  # "user" | "model" | "summary"
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    session = db.relationship("ChatSession", back_populates="messages")
    user = db.relationship("User", backref=db.backref("chat_messages", lazy=True))
