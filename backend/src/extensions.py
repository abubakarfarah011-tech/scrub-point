import os

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address


REDIS_URL = os.getenv("REDIS_URL")

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[],
    storage_uri=REDIS_URL or "memory://",
)