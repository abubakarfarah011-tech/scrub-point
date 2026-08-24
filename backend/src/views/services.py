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
        try:
            order_quantity = int(orderPayload.get("quantity", 1))
        except (TypeError, ValueError):
            order_quantity = 1

        order_quantity = max(order_quantity, 1)

        return OrderRepository.create_order({
            "product_name": orderPayload.get("product_name"),
            "product_id": orderPayload.get("product_id"),
            "package_id": orderPayload.get("package_id"),
            "quantity": order_quantity,
            "variant_details": orderPayload.get(
                "variant_details",
                "No variants selected"
        ),
        "total_price": float(orderPayload.get("total_price", 0.0)),
        "order_status": "Awaiting WhatsApp"
    })

    @staticmethod
    def fetch_orders():
        return OrderRepository.get_all_orders()

    @staticmethod
    def confirm_order(order_id):
        order = OrderRepository.get_by_id(order_id)

        if not order:
            return None

        if order.get("order_status") != "Awaiting WhatsApp":
            return None

        return OrderRepository.update_order_status(
        order_id,
        "Pending"
    )


    @staticmethod
    def cancel_order(order_id):
        order = OrderRepository.get_by_id(order_id)

        if not order:
            return None

        if order.get("order_status") != "Awaiting WhatsApp":
            return None

        return OrderRepository.update_order_status(
        order_id,
        "Cancelled"
    )

    @staticmethod
    def process_delivery_fulfillment(order_id, admin_email):
        order_records = OrderRepository.get_by_id(order_id)

        if not order_records:
            return None

        order = (
            order_records
            if isinstance(order_records, dict)
            else order_records[0]
        )

        if order.get("order_status") == "Delivered":
            return None

        target_product_id = order.get("product_id")
        target_package_id = order.get("package_id")
        target_product_name = order.get("product_name")

        try:
            qty_ordered = int(order.get("quantity") or 1)
        except (TypeError, ValueError):
            qty_ordered = 1

        if qty_ordered <= 0:
            qty_ordered = 1

        if not order.get("quantity"):
            try:
                qty_str = order.get("variant_details", "Quantity: 1")

                for segment in qty_str.split("|"):
                    if "Quantity:" in segment:
                        qty_ordered = int(
                            segment.replace("Quantity:", "").strip()
                        )
                        break
            except (TypeError, ValueError):
                qty_ordered = 1

        if target_package_id:

            supabase_client.rpc(
            "fulfill_package_order_atomic",
            {
                "p_order_id": int(order_id)
            }
        ).execute()

        pkg_record = (
            supabase_client
            .table("packages")
            .select("name")
            .eq("id", target_package_id)
            .execute()
        )

        if pkg_record.data:
            target_product_name = (
                target_product_name
                or pkg_record.data[0].get("name")
            )
            updated_order = OrderRepository.get_by_id(order_id)

        elif target_product_id:
            prod_record = (
                supabase_client
                .table("products")
                .select("*")
                .eq("id", target_product_id)
                .execute()
            )

            if not prod_record.data:
                raise Exception(
                    f"Product {target_product_id} not found for fulfillment."
                )

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

                        json_str = desc_text[
                            start_idx:end_idx
                        ].strip()

                        components_list = json.loads(json_str)

                    except Exception:
                        raise Exception(
                            "Unable to read the student bundle component list."
                        )

                    for comp in components_list:
                        comp_id = comp.get("id")

                        per_bundle_qty = int(
                            comp.get("quantity", 1)
                        )

                        qty_needed = (
                            per_bundle_qty * qty_ordered
                        )

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
                            c_record.data[0].get(
                                "stock_quantity",
                               0
                            )
                        )

                        if available < qty_needed:
                            raise Exception(
                                "INSUFFICIENT_STOCK"
                                f"|Requested:{qty_needed}"
                                f"|Available:{available}"
                                f"|Shortage:{qty_needed - available}"
                            )

                    for comp in components_list:
                        comp_id = comp.get("id")

                        per_bundle_qty = int(
                            comp.get("quantity", 1)
                        )

                        qty_needed = (
                            per_bundle_qty * qty_ordered
                        )

                        c_record = (
                            supabase_client
                            .table("products")
                            .select("stock_quantity")
                            .eq("id", comp_id)
                            .execute()
                        )

                        current_stock = int(
                            c_record.data[0].get(
                                "stock_quantity",
                                0
                            )
                        )

                        new_stock = (
                            current_stock - qty_needed
                        )

                        supabase_client.table(
                            "products"
                        ).update({
                            "stock_quantity": new_stock,
                            "is_out_of_stock": (
                                new_stock <= 0
                            )
                        }).eq(
                            "id",
                            comp_id
                        ).execute()

                else:
                    current_stock = int(
                        parent_product.get(
                            "stock_quantity",
                            0
                        )
                    )

                    if current_stock < qty_ordered:
                        shortage = (
                            qty_ordered - current_stock
                        )

                        raise Exception(
                            "INSUFFICIENT_STOCK"
                            f"|Requested:{qty_ordered}"
                            f"|Available:{current_stock}"
                            f"|Shortage:{shortage}"
                        )

                    new_stock = (
                        current_stock - qty_ordered
                    )

                    supabase_client.table(
                        "products"
                    ).update({
                        "stock_quantity": new_stock,
                        "is_out_of_stock": (
                            new_stock <= 0
                        )
                    }).eq(
                        "id",
                        target_product_id
                    ).execute()

            else:
                current_stock = int(
                    parent_product.get(
                        "stock_quantity",
                        0
                    )
                )

                if current_stock < qty_ordered:
                    shortage = (
                        qty_ordered - current_stock
                    )

                    raise Exception(
                        "INSUFFICIENT_STOCK"
                        f"|Requested:{qty_ordered}"
                        f"|Available:{current_stock}"
                        f"|Shortage:{shortage}"
                )

                new_stock = (
                    current_stock - qty_ordered
                )

                supabase_client.table(
                    "products"
                ).update({
                    "stock_quantity": new_stock,
                    "is_out_of_stock": (
                        new_stock <= 0
                    )
                }).eq(
                    "id",
                    target_product_id
                ).execute()

            updated_order = (
                OrderRepository.fulfill_order_status(
                    order_id
                )
            )

        else:
            raise Exception(
                "Order does not contain a valid product or package reference."
            )

        AuditRepository.write_log(
            email=admin_email,
            action="FULFILL_ORDER",
            details=(
                f"Delivered order ID: {order_id}. "
                "Financial revenue registered under total "
                f"sales profiles for '{target_product_name}'"
            )
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