import os

_raw_frontend_origins = os.getenv(
    "FRONTEND_ORIGIN",
    "http://localhost:5173,http://localhost:4173"
)

FRONTEND_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in _raw_frontend_origins.split(",")
    if origin.strip()
]