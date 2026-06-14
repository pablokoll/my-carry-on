import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask

load_dotenv(Path(__file__).parent.parent / ".env")

from errors import register_error_handlers
from extensions import db, login_manager, migrate
from models import User
from routes.auth import auth_bp
from routes.bags import bags_bp
from routes.categories import categories_bp
from routes.destinations import destinations_bp
from routes.health import health_bp
from routes.items import items_bp
from routes.trips import trips_bp


def create_app():
    app = Flask(__name__)

    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-key")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    login_manager.init_app(app)
    db.init_app(app)
    migrate.init_app(app, db)

    register_error_handlers(app)

    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(trips_bp)
    app.register_blueprint(bags_bp)
    app.register_blueprint(categories_bp)
    app.register_blueprint(destinations_bp)
    app.register_blueprint(items_bp)

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    return app
