from flask import jsonify


class AppError(Exception):
    status_code = 500

    def __init__(self, message):
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


def register_error_handlers(app):
    @app.errorhandler(AppError)
    def handle_app_error(e):
        return jsonify({"error": e.message}), e.status_code

    @app.errorhandler(404)
    def handle_404(e):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(405)
    def handle_405(e):
        return jsonify({"error": "Method not allowed"}), 405

    @app.errorhandler(500)
    def handle_500(e):
        message = str(e) if app.debug else "Internal server error"
        return jsonify({"error": message}), 500
