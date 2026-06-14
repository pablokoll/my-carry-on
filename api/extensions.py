from flask_jwt_extended import JWTManager, get_jwt_identity
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()


def get_current_user_id() -> int:
    return int(get_jwt_identity())
