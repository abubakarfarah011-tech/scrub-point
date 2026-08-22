import os
import jwt
import datetime
from functools import wraps
from flask import request, make_response
from src.views.responses import ApiResponse
from src.models.database import supabase_client

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not JWT_SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET_KEY is not set in your environment. "
        "Generate one with `openssl rand -hex 32` and add it to your .env file — "
        "the server will not start without it."
    )

class SecurityUtils:
    @staticmethod
    def generate_token(admin_payload):
        payload = {
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24),
            "iat": datetime.datetime.utcnow(),
            "sub": str(admin_payload.get("id")),
            "email": str(admin_payload.get("email")),
            "role": str(admin_payload.get("role"))
        }
        return jwt.encode(payload, JWT_SECRET_KEY, algorithm="HS256")

def token_required(required_role=None):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            clean_token_str = None

            if "Authorization" in request.headers:
                auth_header = str(request.headers["Authorization"])
                if auth_header.startswith("Bearer "):
                    raw_extracted = auth_header.replace("Bearer ", "").strip()
                    for char in ['[', ']', '"', "'", " "]:
                        raw_extracted = raw_extracted.replace(char, "")
                    clean_token_str = raw_extracted

            if not clean_token_str:
                return ApiResponse.error(message="Authentication token missing identifier context.", status_code=401)

            try:
                decoded_data = jwt.decode(str(clean_token_str).strip(), JWT_SECRET_KEY, algorithms=["HS256"])

                current_admin = {
                    "id": decoded_data.get("sub"),
                    "email": decoded_data.get("email"),
                    "role": decoded_data.get("role")
                }

                live_check = supabase_client.table("admins").select("id", "is_active").eq("id", current_admin.get("id")).execute()

                if not live_check.data or len(live_check.data) == 0:
                    return ApiResponse.error(message="Account deleted or non-existent. Access revoked.", status_code=401)

                if not live_check.data[0].get("is_active", True):
                    return ApiResponse.error(message="This administrative account profile has been inactivated by the Super Admin.", status_code=401)

                if required_role and current_admin.get("role") != required_role:
                    return ApiResponse.error(message="Unauthorized resource privilege mismatch.", status_code=403)

            except jwt.ExpiredSignatureError:
                return ApiResponse.error(message="Admin token signature has expired.", status_code=401)

            except Exception:
                return ApiResponse.error(
                    message="Invalid authorization token tracking structures.",
                    status_code=401
                    )
            new_args = list(args)
            if len(new_args) > 1:
                new_args.insert(1, current_admin)
            else:
                new_args.append(current_admin)

            return f(*tuple(new_args), **kwargs)
        return decorated
    return decorator