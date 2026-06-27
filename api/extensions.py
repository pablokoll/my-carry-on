from typing import TypeVar

from flask_jwt_extended import JWTManager, get_jwt_identity
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase

T = TypeVar("T")


class Base(DeclarativeBase):
    pass


db = SQLAlchemy(model_class=Base)
migrate = Migrate()
jwt = JWTManager()
limiter = Limiter(key_func=get_remote_address, default_limits=[])


def get_current_user_id() -> int:
    return int(get_jwt_identity())


def get_or_404(model: type[T], resource_id: int, user_id: int) -> T:
    """Fetch a resource by id, raise NotFound if missing or not owned by user_id."""
    from errors import NotFound

    resource = db.session.get(model, resource_id)
    if not resource or resource.user_id != user_id:
        raise NotFound(f"{model.__name__} not found")
    return resource


def get_owned_or_404(
    model: type[T], resource_id: int, user_id: int, owner_attr: str = "user_id"
) -> T:
    """Like get_or_404 but traverses a relationship chain to check ownership.
    owner_attr supports dot notation, e.g. 'bag.user_id' or 'item.bag.user_id'."""
    from errors import NotFound

    resource = db.session.get(model, resource_id)
    if not resource:
        raise NotFound(f"{model.__name__} not found")
    obj: object = resource
    for attr in owner_attr.split("."):
        obj = getattr(obj, attr)
    if obj != user_id:
        raise NotFound(f"{model.__name__} not found")
    return resource


def register_jwt_callbacks(jwt_instance: JWTManager) -> None:
    from models.auth import TokenBlocklist

    @jwt_instance.token_in_blocklist_loader
    def check_if_token_revoked(
        _jwt_header: dict[str, str], jwt_payload: dict[str, str]
    ) -> bool:
        jti = jwt_payload["jti"]
        return (
            db.session.query(TokenBlocklist.id).filter_by(jti=jti).scalar() is not None
        )
