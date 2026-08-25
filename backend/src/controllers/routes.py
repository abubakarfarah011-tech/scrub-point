import bcrypt
import re
import logging
from flask import request, make_response
from flask_restful import Resource
from src.views.schemas import AdminSchema, ReviewSchema
from src.views.services import ProductService, AuthService, OrderService, ReviewService, DashboardService, ContactMessageService
from src.views.responses import ApiResponse
from src.controllers.utilities import token_required, SecurityUtils
from src.models.database import supabase_client
from src.extensions import limiter

logger = logging.getLogger(__name__)

class ProductListResource(Resource):
    def options(self):
        return make_response("", 200)

    def get(self):
        category = request.args.get("category")
        search = request.args.get("search")
        sort_by = request.args.get("sort", "newest")
        try:
            page = int(request.args.get("page", 1))
            limit = int(request.args.get("limit", 20))
        except (ValueError, TypeError):
            page = 1
            limit = 20
        result = ProductService.fetch_all_products(category, search, page, limit, sort_by)
        return ApiResponse.success(data=result["items"], message="Catalog fetched cleanly.")

    @token_required()
    def post(self, current_admin):
        json_data = request.get_json() or {}

        payload = {
            "name": str(json_data.get("name", "")).strip(),
            "price": float(json_data.get("price", 0.0)),
            "description": str(json_data.get("description", "")).strip(),
            "category": str(json_data.get("category", "Scrubs")).strip(),
            "image_url": str(json_data.get("image_url", "")).strip(),
            "stock_quantity": int(json_data.get("stock_quantity", 10)),
            "sizes_available": str(json_data.get("sizes_available", "")).strip(),
            "colors_available": str(json_data.get("colors_available", "")).strip(),
            "is_featured": bool(json_data.get("is_featured", False)),
            "is_on_offer": bool(json_data.get("is_on_offer", False)),
            "discount_price": float(json_data["discount_price"]) if json_data.get("discount_price") else None,
            "is_student_package": bool(json_data.get("is_student_package", False)),
            "package_start_date": json_data.get("package_start_date"),
            "package_end_date": json_data.get("package_end_date"),
            "package_start_time": json_data.get("package_start_time"),
            "package_end_time": json_data.get("package_end_time")
        }

        new_product = ProductService.add_new_product(payload, current_admin["email"])
        return ApiResponse.success(data=new_product, message="Listing published successfully into backend cluster.", status_code=201)


class ProductResource(Resource):
    def options(self, product_id=None):
        return make_response("", 200)

    def get(self, product_id):
        product = ProductService.fetch_single_product(int(product_id))
        if not product:
            return ApiResponse.error(message="Product not found.", status_code=404)
        return ApiResponse.success(data=product, message="Product sync success.")

    @token_required()
    def put(self, current_admin, product_id):
        json_data = request.get_json() or {}

        update_payload = {}
        fields_list = [
            "name", "price", "description", "category", "image_url",
            "stock_quantity", "sizes_available", "colors_available",
            "is_out_of_stock", "is_featured", "is_on_offer",
            "discount_price", "is_student_package", "package_start_date",
            "package_end_date", "package_start_time", "package_end_time"
        ]

        for field in fields_list:
            if field in json_data:
                if field == "price" or field == "discount_price":
                    update_payload[field] = float(json_data[field]) if json_data[field] else None
                elif field == "stock_quantity":
                    update_payload[field] = int(json_data[field])
                else:
                    update_payload[field] = json_data[field]

        updated_product = ProductService.modify_product(int(product_id), update_payload, current_admin["email"])
        if not updated_product:
            return ApiResponse.error(message="Target portfolio metrics not found.", status_code=404)

        return ApiResponse.success(data=updated_product, message="Specifications updated error-free.")

    @token_required()
    def delete(self, current_admin, product_id):
        success = ProductService.remove_product(int(product_id), current_admin["email"])
        if not success:
            return ApiResponse.error(message="Product not found.", status_code=404)
        return ApiResponse.success(message="Product soft deleted cleanly.")

class TrashResource(Resource):
    def options(self, product_id=None):
        return make_response("", 200)

    @token_required()
    def get(self, current_admin):
        deleted_items = ProductService.fetch_deleted_products()
        return ApiResponse.success(data=deleted_items, message="Trash bin contents fetched.")

    @token_required()
    def patch(self, current_admin, product_id):
        restored = ProductService.restore_product(int(product_id), current_admin["email"])
        if not restored:
            return ApiResponse.error(message="Item not found in trash.", status_code=404)
        return ApiResponse.success(data=restored, message="Product restored to the live catalog.")

    @token_required()
    def delete(self, current_admin, product_id):
        success = ProductService.permanently_delete_product(int(product_id), current_admin["email"])
        if not success:
            return ApiResponse.error(message="Item not found in trash.", status_code=404)
        return ApiResponse.success(message="Product permanently deleted.")

class CategoryListResource(Resource):
    def options(self):
        return make_response("", 200)

    def get(self):
        categories = ProductService.fetch_categories_list()
        return ApiResponse.success(data=categories, message="Categories tags synced.")


class AdminDashboardResource(Resource):
    def options(self):
        return make_response("", 200)

    @token_required()
    def get(self, current_admin):
        metrics = DashboardService.compile_metrics()
        logs_query = supabase_client.table("audit_logs").select("*").order("created_at", desc=True).limit(50).execute()

        payload = {
            "products": metrics.get("products", 0),
            "orders": metrics.get("orders", 0),
            "reviews": metrics.get("reviews", 0),
            "messages": metrics.get("messages", 0),
            "categories": metrics.get("categories", 0),
            "admins": metrics.get("admins", 0),
            "audit_logs": logs_query.data if logs_query.data else []
        }
        return ApiResponse.success(data=payload, message="Admin dashboard dataset compiled successfully.")

class AdminLoginResource(Resource):
    def options(self):
        return make_response("", 200)

    @limiter.limit("5 per minute")
    def post(self):
        json_data = request.get_json() or {}
        admin = AuthService.authenticate_admin(
            json_data.get("email"),
            json_data.get("password")
        )

        if not admin:
            return ApiResponse.error(
                message="Invalid credentials.",
                status_code=401
            )

        token = SecurityUtils.generate_token(admin)

        return ApiResponse.success(
            data={
                "id": admin["id"],
                "token": token,
                "role": admin["role"],
                "email": admin["email"]
            },
            message="Session opened."
        )

class OrderResource(Resource):
    def options(self):
        return make_response("", 200)

    def post(self):
        json_data = request.get_json() or {}
        if not json_data.get("product_name"):
            return ApiResponse.error(message="Tracking context mismatch.", status_code=400)
        logged = OrderService.log_whatsapp_click(json_data)
        return ApiResponse.success(data=logged, message="Checkout registered.", status_code=201)

    @token_required()
    def get(self, current_admin):
        return ApiResponse.success(data=OrderService.fetch_orders(), message="Orders loaded.")

class OrderFulfillResource(Resource):
    def options(self, order_id=None):
        return make_response("", 200)

    @token_required()
    def patch(self, current_admin, order_id):
        try:
            fulfilled = OrderService.process_delivery_fulfillment(
                order_id,
                current_admin["email"]
            )

            if not fulfilled:
                return ApiResponse.error(
                    message="Order not found or already fulfilled.",
                    status_code=400
                )

            return ApiResponse.success(
                data=fulfilled,
                message="Order marked Delivered successfully."
            )

        except Exception as e:
            error = str(e)

            stock_match = re.search(
                r"INSUFFICIENT_STOCK\|Requested:(\d+)\|Available:(\d+)\|Shortage:(\d+)",
                error
            )

            if stock_match:
                requested, available, shortage = map(int, stock_match.groups())

                return ApiResponse.error(
                    message="Insufficient stock available to fulfill this order.",
                    status_code=400,
                    errors={
                        "requested": requested,
                        "available": available,
                        "shortage": shortage
                    }
                )
            logger.exception(
                "Order fulfillment failed for order %s",
                order_id
            )

            return ApiResponse.error(
                message="Unable to fulfill the order at this time.",
                status_code=500
            )

class OrderConfirmResource(Resource):
    def options(self, order_id=None):
        return make_response("", 200)

    @token_required()
    def patch(self, current_admin, order_id):
        try:
            confirmed = OrderService.confirm_order(order_id)

            if not confirmed:
                return ApiResponse.error(
                    message="Order not found or is not awaiting WhatsApp confirmation.",
                    status_code=400
                )

            return ApiResponse.success(
                data=confirmed,
                message="WhatsApp order confirmed successfully."
            )

        except Exception:
            return ApiResponse.error(
                message="Unable to confirm the order at this time.",
                status_code=500
                )


class OrderCancelResource(Resource):
    def options(self, order_id=None):
        return make_response("", 200)

    @token_required()
    def patch(self, current_admin, order_id):
        try:
            cancelled = OrderService.cancel_order(order_id)

            if not cancelled:
                return ApiResponse.error(
                    message="Order not found or is not awaiting WhatsApp confirmation.",
                    status_code=400
                )

            return ApiResponse.success(
                data=cancelled,
                message="Order cancelled successfully."
            )

        except Exception:
            return ApiResponse.error(
                message="Unable to cancel the order at this time.",
                status_code=500
                )

class ReviewResource(Resource):
    def options(self):
        return make_response("", 200)

    def get(self):
        return ApiResponse.success(data=ReviewService.get_public_reviews(), message="Reviews synced.")

    def post(self):
        json_data = request.get_json() or {}
        errors, cleaned_data = ReviewSchema.validate_and_clean(json_data)
        if errors:
            return ApiResponse.error(message="Validation mismatch.", status_code=400, errors=errors)
        return ApiResponse.success(data=ReviewService.submit_review(cleaned_data), message="Review published.", status_code=201)


class AdminReviewResource(Resource):
    def options(self, review_id=None):
        return make_response("", 200)

    @token_required()
    def get(self, current_admin):
        return ApiResponse.success(data=ReviewService.get_all_reviews_admin(), message="Admin complete review logs fetched.")

    @token_required()
    def patch(self, current_admin, review_id):
        approved = ReviewService.approve_review_status(review_id)
        return ApiResponse.success(data=approved, message="Review verified cleanly.")

    @token_required()
    def delete(self, current_admin, review_id=None):
        target_id = review_id if review_id else request.args.get("id")
        if not target_id:
            return ApiResponse.error(message="Review identifier mapping required.", status_code=400)
        ReviewService.remove_review(target_id)
        return ApiResponse.success(message="Review row purged cleanly.")


class ContactMessageResource(Resource):
    def options(self, message_id=None):
        return make_response("", 200)

    def post(self):
        json_data = request.get_json() or {}
        if not json_data.get("name") or not json_data.get("message"):
            return ApiResponse.error(message="Missing fields.", status_code=400)
        logged = ContactMessageService.log_incoming_message(json_data)
        return ApiResponse.success(data=logged, message="Message saved.", status_code=201)

    @token_required()
    def get(self, current_admin):
        return ApiResponse.success(data=ContactMessageService.fetch_all_messages(), message="Messages loaded.")

    @token_required()
    def delete(self, current_admin, message_id=None):
        target_id = message_id if message_id else request.args.get("id")
        if not target_id:
            return ApiResponse.error(message="Message identifier required.", status_code=400)
        supabase_client.table("contact_messages").delete().eq("id", int(target_id)).execute()
        return ApiResponse.success(message="Inquiry message wiped cleanly.")


class AdminProfileResource(Resource):
    def options(self):
        return make_response("", 200)

    @token_required()
    def put(self, current_admin):
        json_data = request.get_json() or {}
        new_password = json_data.get("password")
        if not new_password or len(str(new_password)) < 6:
            return ApiResponse.error(message="Password must be at least 6 characters long.", status_code=400)
        salt = bcrypt.gensalt(12)
        hashed_password = bcrypt.hashpw(str(new_password).encode('utf-8'), salt).decode('utf-8')
        supabase_client.table("admins").update({"password_hash": hashed_password}).eq("id", current_admin.get("id")).execute()
        return ApiResponse.success(message="Security credentials rotated successfully.")
