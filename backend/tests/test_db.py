# test_db.py
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# 1. Boot up the environment reader
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

print("--- Scrub Point Environment Connection Test ---")
print(f"Loaded URL: {SUPABASE_URL}")

if not SUPABASE_URL or "your-copied-letters" in SUPABASE_URL:
    print("❌ STOP: You must paste your real keys inside your backend/.env file first!")
    exit(1)

try:
    print("🔄 Connecting to Supabase Client using environment keys...")
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    print("🔄 Querying 'products' table...")
    response = supabase.table("products").select("*").limit(1).execute()
    
    print("✅ CONNECTION SUCCESSFUL!")
    print(f"Database successfully returned: {response.data}")
    print("Flask and Supabase are officially talking to each other cleanly!")

except Exception as e:
    print("❌ CONNECTION FAILED!")
    print(f"Error Details: {str(e)}")
