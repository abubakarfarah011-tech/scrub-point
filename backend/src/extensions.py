import os

from flask_limiter import Limiter
from src.client_ip import get_client_ip


REDIS_URL = os.getenv("REDIS_URL")

limiter = Limiter(
    key_func=get_client_ip,
    default_limits=[],
    storage_uri=REDIS_URL or "memory://",
)