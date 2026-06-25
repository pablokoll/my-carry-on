from flask import jsonify


def json_msg(message: str, status: int = 200):
    return jsonify({"message": message}), status
