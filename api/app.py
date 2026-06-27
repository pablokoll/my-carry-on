import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, Response
from flask_cors import CORS

load_dotenv(Path(__file__).parent.parent / ".env")

from errors import register_error_handlers
from extensions import db, jwt, limiter, migrate, register_jwt_callbacks
from routes.auth import auth_bp
from routes.chat import chat_bp
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
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {"pool_pre_ping": True}
    app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 900  # 15 min
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = 604800  # 7 days

    allowed_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(
        ","
    )
    CORS(
        app,
        resources={r"/api/*": {"origins": allowed_origins}},
        supports_credentials=True,
    )

    app.config["MAX_CONTENT_LENGTH"] = 1 * 1024 * 1024  # 1 MB

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    limiter.init_app(app)  # type: ignore[arg-type]
    register_jwt_callbacks(jwt)

    register_error_handlers(app)

    app.register_blueprint(health_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(trips_bp)
    app.register_blueprint(bags_bp)
    app.register_blueprint(categories_bp)
    app.register_blueprint(destinations_bp)
    app.register_blueprint(items_bp)

    is_prod = os.environ.get("FLASK_ENV") == "production"

    @app.after_request
    def set_security_headers(response: Response) -> Response:
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = (
            "default-src 'none'; frame-ancestors 'none'"
        )
        if is_prod:
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )
        return response

    @app.cli.command("seed")
    def seed():
        from seed import seed_categories

        seed_categories()

    return app
