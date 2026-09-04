import ipaddress
import os

from flask import request


def get_client_ip():
    candidate_ip = None

    if os.getenv("RENDER") == "true":
        forwarded_for = request.headers.get("X-Forwarded-For", "")

        if forwarded_for:
            candidate_ip = forwarded_for.split(",", 1)[0].strip()

    if not candidate_ip:
        candidate_ip = request.remote_addr

    if not candidate_ip:
        return "127.0.0.1"

    try:
        return str(ipaddress.ip_address(candidate_ip))
    except ValueError:
        return "127.0.0.1"