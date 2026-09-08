import bcrypt
import re
import logging
from flask import request, make_response
from flask_restful import Resource
from src.views.schemas import (AdminSchema,OrderSchema,ProductSchema,ContactMessageSchema,PasswordSchema,ReviewSchema,)
from src.views.services import ProductService, AuthService, OrderService, ReviewService, DashboardService, ContactMessageService
from src.views.responses import ApiResponse
from src.controllers.utilities import token_required, SecurityUtils
from src.models.database import supabase_client
from src.models.repo import AuditRepository
from src.extensions import limiter

logger = logging.getLogger(__name__)

class ProductListResource(Resource):
    def options(self):
        return make_response("", 200)

    def get(self):
        category = request.args.get("category")
        search = request.args.get("search")
        sort_by = request.args.get("sort", "newest")
        raw_page = request.args.get("page", "1")
        raw_limit = request.args.get("limit", "20")

        if category is not None:
            category = category.strip()

            if len(category) > 100:
                return ApiResponse.error(
                    message="Category filter is too long.",
                    status_code=400,
                )

        if search is not None:
            search = search.strip()

            if len(search) > 200:
                return ApiResponse.error(
                     message="Search query is too long.",
                     status_code=400,
                )

        allowed_sorts = {
            "newest",
            "oldest",
            "price_asc",
            "price_desc",
        }

        if sort_by not in allowed_sorts:
            return ApiResponse.error(
                message="Invalid product sort option.",
                status_code=400,
            )

        try:
            page = int(raw_page)
            limit = int(raw_limit)
        except (TypeError, ValueError):
            return ApiResponse.error(
                message="Page and limit must be whole numbers.",
                status_code=400,
            )

        if page < 1:
            return ApiResponse.error(
                message="Page must be at least 1.",
                status_code=400,
            )

        if limit < 1 or limit > 100:
            return ApiResponse.error(
                message="Limit must be between 1 and 100.",
                status_code=400,
            )

        result = ProductService.fetch_all_products(
            category,
            search,
            page,
            limit,
            sort_by,
        )

        return ApiResponse.success(
            data=result["items"],
            message="Catalog fetched cleanly.",
            )

    @token_required()
    def post(self, current_admin):
        json_data = request.get_json(silent=True)

        errors, cleaned_data = ProductSchema.validate_and_clean(json_data)
        if errors:
            return ApiResponse.error(
                message="Product validation failed.",
                status_code=400,
                errors=errors,
            )

        new_product = ProductService.add_new_product(
            cleaned_data,
            current_admin["email"],
        )

        return ApiResponse.success(
            data=new_product,
            message="Listing published successfully into backend cluster.",
            status_code=201,
        )

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
        json_data = request.get_json(silent=True)

        errors, update_payload = ProductSchema.validate_update(json_data)
        if errors:
            return ApiResponse.error(
                message="Product validation failed.",
                status_code=400,
                errors=errors,
            )

        updated_product = ProductService.modify_product(
            int(product_id),
            update_payload,
            current_admin["email"],
        )

        if not updated_product:
            return ApiResponse.error(
                message="Target portfolio metrics not found.",
                status_code=404,
            )

        return ApiResponse.success(
            data=updated_product,
            message="Specifications updated error-free.",
        )

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

        if not isinstance(json_data, dict):
            return ApiResponse.error(
                message="Invalid login request.",
                status_code=400
            )

        errors, cleaned_data = AdminSchema.validate_login(json_data)

        if errors:
            AuditRepository.write_log(
                cleaned_data.get("email") or "unknown",
                "ADMIN_LOGIN_FAILED",
                "Login rejected during credential validation."
            )

            return ApiResponse.error(
                message="Invalid credentials.",
                status_code=401
            )

        admin = AuthService.authenticate_admin(
            cleaned_data["email"],
            cleaned_data["password"]
        )

        if not admin:
            AuditRepository.write_log(
                cleaned_data["email"],
                "ADMIN_LOGIN_FAILED",
                "Invalid admin credentials."
            )

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
        json_data = request.get_json(silent=True)

        errors, cleaned_data = OrderSchema.validate_and_clean(json_data)
        if errors:
            return ApiResponse.error(
                message="Order validation failed.",
                status_code=400,
                errors=errors,
            )

        try:
            logged = OrderService.log_whatsapp_click(cleaned_data)
        except ValueError as exc:
            return ApiResponse.error(
                message=str(exc),
                status_code=400,
            )

        return ApiResponse.success(
            data=logged,
            message="Checkout registered.",
            status_code=201,
            )

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
        json_data = request.get_json(silent=True)

        errors, cleaned_data = ReviewSchema.validate_and_clean(json_data)

        if errors:
            return ApiResponse.error(
                message="Validation mismatch.",
                status_code=400,
                errors=errors,
            )

        return ApiResponse.success(
            data=ReviewService.submit_review(cleaned_data),
            message="Review published.",
            status_code=201,
            )

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
        json_data = request.get_json(silent=True)

        errors, cleaned_data = ContactMessageSchema.validate_and_clean(
            json_data
        )

        if errors:
            return ApiResponse.error(message="Contact message validation failed.",
                                     status_code=400,
            errors=errors,
           )

        logged = ContactMessageService.log_incoming_message(cleaned_data)

        return ApiResponse.success(
            data=logged,
            message="Message saved.",
            status_code=201,
        )
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
        json_data = request.get_json(silent=True)

        errors, new_password = PasswordSchema.validate(json_data)

        if errors:
            return ApiResponse.error(
                message="Password validation failed.",
                status_code=400,
                errors=errors,
            )

        salt = bcrypt.gensalt(12)

        hashed_password = bcrypt.hashpw(
            new_password.encode("utf-8"),
            salt,
            ).decode("utf-8")

        supabase_client.table("admins").update({
        "password_hash": hashed_password
        }).eq(
            "id",
            current_admin.get("id"),
            ).execute()

        return ApiResponse.success(
            message="Security credentials rotated successfully."
        )