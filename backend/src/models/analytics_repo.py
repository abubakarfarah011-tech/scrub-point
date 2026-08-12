from src.models.database import supabase_client

class AnalyticsRepository:
    @staticmethod
    def get_orders_by_date_range(start_date, end_date):
        response = supabase_client.table("whatsapp_orders") \
            .select("*") \
            .gte("created_at", start_date) \
            .lte("created_at", end_date) \
            .order("created_at", desc=False) \
            .execute()
        return response.data if response.data else []

    @staticmethod
    def get_inventory_snapshot():
        response = supabase_client.table("products") \
            .select("*") \
            .eq("is_deleted", False) \
            .execute()
        return response.data if response.data else []

    @staticmethod
    def get_operational_expenses():
        try:
            response = supabase_client.table("business_expenses").select("*").execute()
            return response.data if response.data else []
        except Exception:
            return []

    @staticmethod
    def delete_sub_admin_account(admin_id):
        response = supabase_client.table("admins").delete().eq("id", admin_id).execute()
        return response.data
