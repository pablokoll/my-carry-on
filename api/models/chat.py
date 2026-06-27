from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from extensions import db
from models.base import BaseModel

if TYPE_CHECKING:
    from models.trip import Trip
    from models.user import User


class ChatSession(BaseModel):
    __tablename__ = "chat_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    trip_id: Mapped[int] = mapped_column(ForeignKey("trips.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    title: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    messages: Mapped[List["ChatMessage"]] = relationship(
        "ChatMessage", back_populates="session", lazy=True, cascade="all, delete-orphan"
    )
    trip: Mapped["Trip"] = relationship(
        "Trip", backref=db.backref("chat_sessions", lazy=True)
    )
    user: Mapped["User"] = relationship(
        "User", backref=db.backref("chat_sessions", lazy=True)
    )


class ChatMessage(BaseModel):
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(
        ForeignKey("chat_sessions.id"), nullable=False
    )
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    role: Mapped[str] = mapped_column(String(10), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    session: Mapped["ChatSession"] = relationship(
        "ChatSession", back_populates="messages"
    )
    user: Mapped["User"] = relationship(
        "User", backref=db.backref("chat_messages", lazy=True)
    )
