import math
import json
import bcrypt

from src.models.database import supabase_client
from src.models.repo import (
    ProductRepository,
    AdminRepository,
    OrderRepository,
    ReviewRepository,
    AuditRepository
)

class ProductService:
    @staticmethod
    def fetch_all_products(category=None, search=None, page=1, limit=20, sort_by="newest"):
        products, total_products = ProductRepository.get_all(
            category,
            search,
            page,
            limit,
            sort_by
        )

        total_pages = math.ceil(total_products / limit) if total_products > 0 else 1

        return {
            "items": products if products else [],
            "pagination": {
                "page": page,
                "limit": limit,
                "total_products": total_products,
                "total_pages": total_pages
            }
        }

    @staticmethod
    def fetch_single_product(product_id):
        return ProductRepository.get_by_id(product_id)

    @staticmethod
    def fetch_categories_list():
        return ProductRepository.get_distinct_categories()

    @staticmethod
    def add_new_product(cleaned_data, admin_email):
        product = ProductRepository.create(cleaned_data)

        if product:
            AuditRepository.write_log(
                admin_email,
                "ADD_PRODUCT",
                f"Added catalog entry '{product.get('name')}'"
            )

        return product

    @staticmethod
    def modify_product(product_id, update_data, admin_email):
        existing = ProductRepository.get_by_id(product_id)

        if not existing:
            return None

        updated = ProductRepository.update(product_id, update_data)

        if updated:
            AuditRepository.write_log(
                admin_email,
                "EDIT_PRODUCT",
                f"Modified catalog row ID: {product_id}"
            )

        return updated

    @staticmethod
    def remove_product(product_id, admin_email):
        existing = ProductRepository.get_by_id(product_id)

        if not existing:
            return False

        ProductRepository.soft_delete(product_id)

        AuditRepository.write_log(
            admin_email,
            "SOFT_DELETE_PRODUCT",
            f"Soft deleted item ID: {product_id}"
        )

        return True

    @staticmethod
    def fetch_deleted_products():
        return ProductRepository.get_deleted()

    @staticmethod
    def restore_product(product_id, admin_email):
        existing = ProductRepository.get_by_id_including_deleted(product_id)
        if not existing:
            return None

        restored = ProductRepository.restore(product_id)

        if restored:
            AuditRepository.write_log(
                admin_email,
                "RESTORE_PRODUCT",
                f"Restored product ID: {product_id} from trash"
            )

        return restored

    @staticmethod
    def permanently_delete_product(product_id, admin_email):
        existing = ProductRepository.get_by_id_including_deleted(product_id)
        if not existing:
            return False

        ProductRepository.hard_delete(product_id)

        AuditRepository.write_log(
            admin_email,
            "PERMANENT_DELETE_PRODUCT",
            f"Permanently deleted product ID: {product_id} ('{existing.get('name')}')"
        )

        return True


class AuthService:
    @staticmethod
    def authenticate_admin(email, password):
        admin = AdminRepository.get_by_email(email)

        if not admin:
            return None

        if not admin.get("is_active", True):
            return None

        stored_hash = admin.get("password_hash") if isinstance(admin, dict) else None

        if not stored_hash:
            return None

        if bcrypt.checkpw(
            password.encode("utf-8"),
            stored_hash.encode("utf-8")
        ):
            AuditRepository.write_log(
                admin.get("email"),
                "ADMIN_LOGIN",
                "Admin session initialized securely."
            )

            return {
                "id": admin.get("id"),
                "email": admin.get("email"),
                "role": admin.get("role")
            }

        return None

    @staticmethod
    def register_first_admin(email, password, role="Admin"):
        salt = bcrypt.gensalt(12)

        hashed_password = bcrypt.hashpw(
            password.encode("utf-8"),
            salt
        ).decode("utf-8")

        return AdminRepository.create_admin({
            "email": email,
            "password_hash": hashed_password,
            "role": role
        })


class DashboardService:
    @staticmethod
    def compile_metrics():
        active_pending_orders = (
            supabase_client
            .table("whatsapp_orders")
            .select("id", count="exact")
            .eq("order_status", "Pending")
            .execute()
        )

        total_reviews = (
            supabase_client
            .table("reviews")
            .select("id", count="exact")
            .execute()
        )

        total_messages = (
            supabase_client
            .table("contact_messages")
            .select("id", count="exact")
            .execute()
        )

        return {
            "products": ProductRepository.get_total_count(),
            "orders": active_pending_orders.count if active_pending_orders.count is not None else 0,
            "reviews": total_reviews.count if total_reviews.count is not None else 0,
            "messages": total_messages.count if total_messages.count is not None else 0,
            "categories": len(ProductRepository.get_distinct_categories()),
            "admins": AdminRepository.get_total_count()
        }

class OrderService:
    @staticmethod
    def log_whatsapp_click(orderPayload):
        return OrderRepository.create_order({
            "product_name": orderPayload.get("product_name"),
            "product_id": orderPayload.get("product_id"),
            "package_id": orderPayload.get("package_id"),
            "variant_details": orderPayload.get(
                "variant_details",
                "No variants selected"
            ),
            "total_price": float(orderPayload.get("total_price", 0.0)),
            "order_status": "Pending"
        })

    @staticmethod
    def fetch_orders():
        return OrderRepository.get_all_orders()

    @staticmethod
    def process_delivery_fulfillment(order_id, admin_email):
        order_records = OrderRepository.get_by_id(order_id)

        if not order_records:
            return None

        order = order_records if isinstance(order_records, dict) else order_records[0]

        if order.get("order_status") == "Delivered":
            return None

        target_product_id = order.get("product_id")
        target_package_id = order.get("package_id")
        target_product_name = order.get("product_name")

        if target_package_id:
            pkg_record = (
                supabase_client
                .table("packages")
                .select("*")
                .eq("id", target_package_id)
                .execute()
            )

            if not pkg_record.data or len(pkg_record.data) == 0:
                raise Exception("Package record not found for fulfillment.")

            parent_package = pkg_record.data[0]
            components_list = parent_package.get("products_summary") or []

            if isinstance(components_list, str):
                try:
                    components_list = json.loads(components_list)
                except Exception:
                    components_list = []

            for comp in components_list:
                comp_id = comp.get("product_id")
                qty_needed = int(comp.get("quantity", 1))

                c_record = (
                    supabase_client
                    .table("products")
                    .select("stock_quantity")
                    .eq("id", comp_id)
                    .execute()
                )

                if not c_record.data:
                    raise Exception(f"Package component product {comp_id} not found.")

                available = int(c_record.data[0].get("stock_quantity", 0))

                if available < qty_needed:
                    raise Exception(
                        f"INSUFFICIENT_STOCK|Requested:{qty_needed}|Available:{available}|Shortage:{qty_needed - available}"
                    )

            for comp in components_list:
                comp_id = comp.get("product_id")
                qty_needed = int(comp.get("quantity", 1))

                c_record = (
                    supabase_client
                    .table("products")
                    .select("stock_quantity")
                    .eq("id", comp_id)
                    .execute()
                )

                current_stock = int(c_record.data[0].get("stock_quantity", 0))
                new_stock = current_stock - qty_needed

                supabase_client.table("products").update({
                    "stock_quantity": new_stock,
                    "is_out_of_stock": new_stock == 0
                }).eq("id", comp_id).execute()

            target_product_name = target_product_name or parent_package.get("name")

        elif target_product_id:
            prod_record = (
                supabase_client
                .table("products")
                .select("*")
                .eq("id", target_product_id)
                .execute()
            )

            if prod_record.data and len(prod_record.data) > 0:
                parent_product = prod_record.data[0]


                if (
                    parent_product.get("is_student_package")
                    and parent_product.get("description")
                ):
                    desc_text = parent_product.get("description", "")

                    if "[Bundle JSON:" in desc_text:
                        try:
                            start_idx = (
                                desc_text.find("[Bundle JSON:")
                                + len("[Bundle JSON:")
                            )
                            end_idx = desc_text.find("]", start_idx)

                            json_str = desc_text[start_idx:end_idx].strip()
                            components_list = json.loads(json_str)


                            for comp in components_list:
                                comp_id = comp.get("id")
                                qty_needed = int(comp.get("quantity", 1))

                                c_record = (
                                    supabase_client
                                    .table("products")
                                    .select("stock_quantity")
                                    .eq("id", comp_id)
                                    .execute()
                                )

                                if not c_record.data:
                                    raise Exception(
                                        f"Bundle component {comp_id} not found."
                                    )

                                available = int(
                                    c_record.data[0].get("stock_quantity", 0)
                                )

                                if available < qty_needed:
                                    raise Exception(
                                        f"INSUFFICIENT_STOCK|Requested:{qty_needed}|Available:{available}|Shortage:{qty_needed-available}"
                                    )


                            for comp in components_list:
                                comp_id = comp.get("id")
                                qty_needed = int(comp.get("quantity", 1))

                                c_record = (
                                    supabase_client
                                    .table("products")
                                    .select("stock_quantity")
                                    .eq("id", comp_id)
                                    .execute()
                                )

                                current_stock = int(
                                    c_record.data[0].get("stock_quantity", 0)
                                )

                                new_stock = current_stock - qty_needed

                                supabase_client.table("products").update({
                                    "stock_quantity": new_stock,
                                    "is_out_of_stock": new_stock == 0
                                }).eq("id", comp_id).execute()

                        except Exception:
                            raise


                else:
                    qty_ordered = 1

                    try:
                        qty_str = order.get("variant_details", "Quantity: 1")

                        for segment in qty_str.split("|"):
                            if "Quantity:" in segment:
                                qty_ordered = int(
                                    segment.replace("Quantity:", "").strip()
                                )
                    except Exception:
                        qty_ordered = 1

                    current_stock = int(
                        parent_product.get("stock_quantity", 0)
                    )

                    if current_stock < qty_ordered:
                        shortage = qty_ordered - current_stock

                        raise Exception(
                            f"INSUFFICIENT_STOCK|Requested:{qty_ordered}|Available:{current_stock}|Shortage:{shortage}"
                        )

                    new_stock = current_stock - qty_ordered

                    supabase_client.table("products").update({
                        "stock_quantity": new_stock,
                        "is_out_of_stock": new_stock == 0
                    }).eq("id", target_product_id).execute()


        updated_order = OrderRepository.fulfill_order_status(order_id)

        AuditRepository.write_log(
            email=admin_email,
            action="FULFILL_ORDER",
            details=f"Delivered order ID: {order_id}. Financial revenue registered under total sales profiles for '{target_product_name}'"
        )

        return updated_order


class ReviewService:
    @staticmethod
    def get_public_reviews():
        return ReviewRepository.get_approved_reviews()

    @staticmethod
    def get_all_reviews_admin():
        return ReviewRepository.get_all_reviews_admin()

    @staticmethod
    def submit_review(cleaned_data):
        return ReviewRepository.create_review(cleaned_data)

    @staticmethod
    def approve_review_status(review_id):
        response = (
            supabase_client
            .table("reviews")
            .update({"is_approved": True})
            .eq("id", review_id)
            .execute()
        )
        return response.data

    @staticmethod
    def remove_review(review_id):
        return ReviewRepository.delete_review(review_id)


class ContactMessageService:
    @staticmethod
    def log_incoming_message(json_data):
        payload = {
            "name": json_data.get("name"),
            "message": json_data.get("message")
        }

        response = (
            supabase_client
            .table("contact_messages")
            .insert(payload)
            .execute()
        )

        return response.data

    @staticmethod
    def fetch_all_messages():
        response = (
            supabase_client
            .table("contact_messages")
            .select("*")
            .order("created_at", desc=True)
            .execute()
        )

        return response.data if response.data else []