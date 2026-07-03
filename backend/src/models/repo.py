# src/models/repo.py
from src.models.database import supabase_client

class ProductRepository:
    @staticmethod
    def get_all(category=None, search_query=None, page=1, limit=20, sort_by="newest"):
        query = supabase_client.table("products").select("*", count="exact").eq("is_deleted", False)
        
        if category:
            query = query.eq("category", category)
        if search_query:
            query = query.ilike("name", f"%{search_query}%")
        
        if sort_by == "price_asc":
            query = query.order("price", desc=False)
        elif sort_by == "price_desc":
            query = query.order("price", desc=True)
        elif sort_by == "featured":
            query = query.order("is_featured", desc=True).order("created_at", desc=True)
        else:
            query = query.order("created_at", desc=True)
            
        start_index = (page - 1) * limit
        end_index = start_index + limit - 1
        
        response = query.range(start_index, end_index).execute()
        return response.data, response.count

    @staticmethod
    def get_by_id(product_id):
        response = supabase_client.table("products").select("*").eq("id", product_id).eq("is_deleted", False).execute()
        return response.data if response.data else None

    @staticmethod
    def create(product_data):
        response = supabase_client.table("products").insert(product_data).execute()
        return response.data if response.data else None

    @staticmethod
    def update(product_id, update_data):
        response = supabase_client.table("products").update(update_data).eq("id", product_id).execute()
        return response.data if response.data else None

    @staticmethod
    def soft_delete(product_id):
        response = supabase_client.table("products").update({"is_deleted": True}).eq("id", product_id).execute()
        return response.data

    @staticmethod
    def restore(product_id):
        response = supabase_client.table("products").update({"is_deleted": False}).eq("id", product_id).execute()
        return response.data

    @staticmethod
    def get_distinct_categories():
        response = supabase_client.table("products").select("category").eq("is_deleted", False).execute()
        if not response.data:
            return []
        unique_names = sorted(list(set([row["category"] for row in response.data])))
        return [{"id": index + 1, "name": name} for index, name in enumerate(unique_names)]

    @staticmethod
    def get_total_count():
        response = supabase_client.table("products").select("id", count="exact").eq("is_deleted", False).execute()
        return response.count if response.count is not None else 0


class AdminRepository:
    @staticmethod
    def get_by_email(email):
        response = supabase_client.table("admins").select("*").eq("email", email).execute()
        return response.data if response.data else None

    @staticmethod
    def get_by_id(admin_id):
        response = supabase_client.table("admins").select("*").eq("id", admin_id).execute()
        return response.data if response.data else None

    @staticmethod
    def create_admin(admin_data):
        response = supabase_client.table("admins").insert(admin_data).execute()
        return response.data if response.data else None

    @staticmethod
    def update_admin(admin_id, update_data):
        response = supabase_client.table("admins").update(update_data).eq("id", admin_id).execute()
        return response.data if response.data else None

    @staticmethod
    def get_total_count():
        response = supabase_client.table("admins").select("id", count="exact").execute()
        return response.count if response.count is not None else 0


class OrderRepository:
    @staticmethod
    def get_all_orders():
        response = supabase_client.table("whatsapp_orders").select("*").order("created_at", desc=True).execute()
        return response.data

    @staticmethod
    def create_order(order_data):
        response = supabase_client.table("whatsapp_orders").insert(order_data).execute()
        return response.data if response.data else None

    @staticmethod
    def get_total_count():
        response = supabase_client.table("whatsapp_orders").select("id", count="exact").execute()
        return response.count if response.count is not None else 0


class ReviewRepository:
    @staticmethod
    def get_approved_reviews():
        response = supabase_client.table("reviews").select("*").eq("is_approved", True).order("created_at", desc=True).execute()
        return response.data

    @staticmethod
    def get_all_reviews_admin():
        response = supabase_client.table("reviews").select("*").order("created_at", desc=True).execute()
        return response.data

    @staticmethod
    def create_review(review_data):
        response = supabase_client.table("reviews").insert(review_data).execute()
        return response.data if response.data else None

    @staticmethod
    def delete_review(review_id):
        response = supabase_client.table("reviews").delete().eq("id", review_id).execute()
        return response.data

    @staticmethod
    def get_total_count():
        response = supabase_client.table("reviews").select("id", count="exact").execute()
        return response.count if response.count is not None else 0


class AuditRepository:
    @staticmethod
    def write_log(email, action, details):
        payload = {
            "admin_email": email,
            "action_type": action,
            "details": details
        }
        supabase_client.table("audit_logs").insert(payload).execute()
