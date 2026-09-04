from datetime import datetime, timezone
from src.models.database import supabase_client
from flask import has_request_context
from src.client_ip import get_client_ip
import logging

logger = logging.getLogger(__name__)
class ProductRepository:
    @staticmethod
    def get_all(category=None, search=None, page=1, limit=20, sort_by="newest"):
        query = supabase_client.table("products").select("*", count="exact").eq("is_deleted", False)

        if category:
            query = query.eq("category", category)
        if search:
            query = query.ilike("name", f"%{search}%")
        if sort_by == "price_asc":
            query = query.order("price", desc=False)
        elif sort_by == "price_desc":
            query = query.order("price", desc=True)
        elif sort_by == "oldest":
            query = query.order("id", desc=False)
        else:
            query = query.order("id", desc=True)

        start = (page - 1) * limit
        end = start + limit - 1
        response = query.range(start, end).execute()
        return response.data, response.count

    @staticmethod
    def get_by_id(product_id):
        response = supabase_client.table("products").select("*").eq("id", product_id).eq("is_deleted", False).execute()
        return response.data[0] if response.data else None

    @staticmethod
    def get_distinct_categories():
        response = supabase_client.table("products").select("category").eq("is_deleted", False).execute()
        if not response.data:
            return []
        return list(set(p["category"] for p in response.data if p.get("category")))

    @staticmethod
    def get_total_count():
        response = supabase_client.table("products").select("id", count="exact").eq("is_deleted", False).execute()
        return response.count if response.count is not None else 0

    @staticmethod
    def create(product_data):
        response = supabase_client.table("products").insert(product_data).execute()
        return response.data[0] if response.data else None

    @staticmethod
    def update(product_id, update_data):
        response = supabase_client.table("products").update(update_data).eq("id", product_id).execute()
        return response.data[0] if response.data else None

    @staticmethod
    def soft_delete(product_id):
        supabase_client.table("products").update({"is_deleted": True}).eq("id", product_id).execute()


    @staticmethod
    def get_by_id_including_deleted(product_id):
        response = supabase_client.table("products").select("*").eq("id", product_id).execute()
        return response.data[0] if response.data else None

    @staticmethod
    def get_deleted():
        response = supabase_client.table("products").select("*").eq("is_deleted", True).execute()
        return response.data if response.data else []

    @staticmethod
    def restore(product_id):
        response = supabase_client.table("products").update({"is_deleted": False}).eq("id", product_id).execute()
        return response.data[0] if response.data else None
    @staticmethod
    def hard_delete(product_id):
        response = (
        supabase_client
        .table("products")
        .delete()
        .eq("id", product_id)
        .execute()
    )
        return bool(response.data)


class AdminRepository:
    @staticmethod
    def get_by_email(email):
        response = supabase_client.table("admins").select("*").eq("email", email).execute()
        return response.data[0] if response.data else None

    @staticmethod
    def get_total_count():
        response = supabase_client.table("admins").select("id", count="exact").execute()
        return response.count if response.count is not None else 0
    @staticmethod
    def create_admin(admin_data):
        existing = (
        supabase_client
        .table("admins")
        .select("id")
        .eq("email", admin_data["email"])
        .execute()
    )
        if existing.data:
            return None

        response = (
        supabase_client
        .table("admins")
        .insert(admin_data)
        .execute()
    )
        return response.data[0] if response.data else None

class OrderRepository:
    @staticmethod
    def create_order(order_data):
        response = (
            supabase_client
            .table("whatsapp_orders")
            .insert(order_data)
            .execute()
        )
        return response.data[0] if response.data else None

    @staticmethod
    def get_all_orders():
        response = (
            supabase_client
            .table("whatsapp_orders")
            .select("*")
            .order("created_at", desc=True)
            .execute()
        )
        return response.data if response.data else []

    @staticmethod
    def get_by_id(order_id):
        response = (
            supabase_client
            .table("whatsapp_orders")
            .select("*")
            .eq("id", order_id)
            .execute()
        )
        return response.data[0] if response.data else None

    @staticmethod
    def fulfill_order_status(order_id):
        delivered_timestamp = datetime.now(timezone.utc).isoformat()

        response = (
            supabase_client
            .table("whatsapp_orders")
            .update({
                "order_status": "Delivered",
                "delivered_at": delivered_timestamp
            })
            .eq("id", order_id)
            .execute()
        )

        return response.data[0] if response.data else None

    @staticmethod
    def update_order_status(order_id, status):
        response = (
        supabase_client
        .table("whatsapp_orders")
        .update({
            "order_status": status
        })
        .eq("id", order_id)
        .execute()
    )
        return response.data[0] if response.data else None

class ReviewRepository:
    @staticmethod
    def get_approved_reviews():
        response = supabase_client.table("reviews").select("*").eq("is_approved", True).order("created_at", desc=True).execute()
        return response.data if response.data else []

    @staticmethod
    def get_all_reviews_admin():
        response = supabase_client.table("reviews").select("*").order("created_at", desc=True).execute()
        return response.data if response.data else []

    @staticmethod
    def create_review(review_data):
        response = supabase_client.table("reviews").insert(review_data).execute()
        return response.data[0] if response.data else None

    @staticmethod
    def delete_review(review_id):
        supabase_client.table("reviews").delete().eq("id", review_id).execute()
        return True

class AuditRepository:
    @staticmethod
    def write_log(email, action, details, source_ip=None):
        if source_ip is None and has_request_context():
            source_ip = get_client_ip()

        payload = {
            "admin_email": email,
            "action_type": action,
            "details": details,
            "source_ip": source_ip
        }

        try:
            supabase_client.table("audit_logs").insert(payload).execute()
        except Exception:
            logger.exception("Audit log write failed.")