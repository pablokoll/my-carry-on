from datetime import datetime, timezone
from typing import TYPE_CHECKING, List

import bcrypt
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import BaseModel

if TYPE_CHECKING:
    from models.bag import Bag, Category
    from models.trip import Trip


class User(BaseModel):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc)
    )

    trips: Mapped[List["Trip"]] = relationship("Trip", back_populates="user", lazy=True)
    bags: Mapped[List["Bag"]] = relationship("Bag", back_populates="user", lazy=True)
    categories: Mapped[List["Category"]] = relationship(
        "Category", back_populates="user", lazy=True
    )

    def set_password(self, password: str) -> None:
        self.password_hash = bcrypt.hashpw(
            password.encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")

    def check_password(self, password: str) -> bool:
        return bcrypt.checkpw(
            password.encode("utf-8"), self.password_hash.encode("utf-8")
        )
