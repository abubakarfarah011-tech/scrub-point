import os
import atexit
import httpx
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

if not supabase_url or not supabase_key:
    raise RuntimeError("Missing Supabase URL or Secret Key string credentials in environment variables configuration.")

custom_http_client = httpx.Client(
    http1=True,
    http2=False,
    timeout=60.0
)

supabase_client: Client = create_client(
    supabase_url,
    supabase_key
)

supabase_client.postgrest.session = custom_http_client

@atexit.register
def close_http_client():
    custom_http_client.close()