# src/models/database.py
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment configurations
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("CRITICAL ERROR: SUPABASE_URL and SUPABASE_KEY are unconfigured in your .env file.")

# The isolated global database connection instance
supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
