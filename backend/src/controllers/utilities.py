# src/controllers/utilities.py
import os
import datetime
import jwt
from flask import request
from functools import wraps
from src.views.responses import ApiResponse

JWT_SECRET = os.getenv("JWT_SECRET", "scrubpoint_super_secret_session_token_key_2026!")

class SecurityUtils:
    @staticmethod
    def generate_token(admin_payload):
        """Generates a secure JWT token that expires in 12 hours"""
        try:
            payload = {
                "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=12),
                "iat": datetime.datetime.utcnow(),
                "sub": str(admin_payload["id"]),
                "email": str(admin_payload["email"]),
                "role": str(admin_payload["role"])
            }
            token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
            if isinstance(token, bytes):
                return token.decode('utf-8')
            return token
        except Exception as e:
            return str(e)

def token_required(required_role=None):
    """Decorator matrix to guard admin paths."""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = None
            
            if "Authorization" in request.headers:
                auth_header = request.headers["Authorization"]
                if auth_header.startswith("Bearer "):
                    parts = auth_header.split(" ")
                    if len(parts) == 2:
                        token = parts[1]

            if not token:
                return ApiResponse.error(message="Access denied. Authentication token missing.", status_code=401)

            try:
                data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
                current_admin = {
                    "id": data["sub"],
                    "email": data["email"],
                    "role": data["role"]
                }
                
                if required_role and current_admin["role"] != required_role:
                    if required_role == "Super Admin" and current_admin["role"] == "Admin":
                        return ApiResponse.error(message="Forbidden. Super Admin access required.", status_code=403)

            except jwt.ExpiredSignatureError:
                return ApiResponse.error(message="Session expired. Please log in again.", status_code=401)
            except jwt.InvalidTokenError:
                return ApiResponse.error(message="Invalid token mapping.", status_code=401)

            return f(current_admin, *args, **kwargs)
        return decorated
    return decorator
