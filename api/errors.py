from flask import Flask, jsonify
from flask.typing import ResponseReturnValue
from werkzeug.exceptions import HTTPException


class AppError(Exception):
    status_code: int = 500
    message: str

    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)


class BadRequest(AppError):
    status_code = 400


class Unauthorized(AppError):
    status_code = 401


class NotFound(AppError):
    status_code = 404


class Conflict(AppError):
    status_code = 409


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(AppError)
    def handle_app_error(e: AppError) -> ResponseReturnValue:
        return jsonify({"error": e.message}), e.status_code

    @app.errorhandler(404)
    def handle_404(_e: HTTPException) -> ResponseReturnValue:
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(405)
    def handle_405(_e: HTTPException) -> ResponseReturnValue:
        return jsonify({"error": "Method not allowed"}), 405

    @app.errorhandler(500)
    def handle_500(e: Exception) -> ResponseReturnValue:
        message = str(e) if app.debug else "Internal server error"
        return jsonify({"error": message}), 500
