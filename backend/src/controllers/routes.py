# src/controllers/routes.py
from flask import request
from flask_restful import Resource
from src.views.schemas import ProductSchema, AdminSchema, ReviewSchema
from src.views.services import ProductService, AuthService, OrderService, ReviewService, DashboardService
from src.views.responses import ApiResponse
from src.controllers.utilities import token_required

class ProductListResource(Resource):
    def get(self):
        category = request.args.get("category")
        search = request.args.get("search")
        sort_by = request.args.get("sort", "newest") # Reading dynamic sorting attributes
        
        try:
            page = int(request.args.get("page", 1))
            limit = int(request.args.get("limit", 20))
        except (ValueError, TypeError):
            page = 1
            limit = 20
            
        result = ProductService.fetch_all_products(category, search, page, limit, sort_by)
        return ApiResponse.success(data=result["items"], message="Catalog fetched cleanly.", status_code=200)

    @token_required()
    def post(current_admin, self):
        json_data = request.get_json() or {}
        errors, cleaned_data = ProductSchema.validate_and_clean(json_data)
        if errors:
            return ApiResponse.error(message="Validation failed.", status_code=400, errors=errors)
        new_product = ProductService.add_new_product(cleaned_data, current_admin["email"])
        return ApiResponse.success(data=new_product, message="Product added successfully.", status_code=201)


class ProductResource(Resource):
    def get(self, product_id):
        """1. Public Route: Fetch individual product profiles instantly"""
        product = ProductService.fetch_single_product(int(product_id))
        if not product:
            return ApiResponse.error(message="Product profiling not found.", status_code=404)
        return ApiResponse.success(data=product, message="Product detailed data mapping sync success.")

    @token_required()
    def put(current_admin, self, product_id):
        json_data = request.get_json() or {}
        updated_product = ProductService.modify_product(int(product_id), json_data, current_admin["email"])
        if not updated_product:
            return ApiResponse.error(message="Product mapping not found.", status_code=404)
        return ApiResponse.success(data=updated_product, message="Product updated successfully.")

    @token_required()
    def delete(current_admin, self, product_id):
        success = ProductService.remove_product(int(product_id), current_admin["email"])
        if not success:
            return ApiResponse.error(message="Product not found.", status_code=404)
        return ApiResponse.success(message="Product soft deleted cleanly.")


class ProductRestoreResource(Resource):
    @token_required()
    def patch(current_admin, self, product_id):
        """7. Guarded Route: Instantly restore accessibility tags to soft deleted inventory records"""
        success = ProductService.restore_product(int(product_id), current_admin["email"])
        if not success:
            return ApiResponse.error(message="Product profiling not found to execute recovery operations.", status_code=404)
        return ApiResponse.success(message="Product availability metrics re-established successfully.")


class CategoryListResource(Resource):
    def get(self):
        """2. Public Route: Fetch sorted category lists directly for filters"""
        categories = ProductService.fetch_categories_list()
        return ApiResponse.success(data=categories, message="Dynamic inventory classification tags synced.")


class AdminDashboardResource(Resource):
    @token_required()
    def get(current_admin, self):
        """3. Guarded Route: Compile global activity analytics directly in 1 fast backend call"""
        metrics = DashboardService.compile_metrics()
        return ApiResponse.success(data=metrics, message="Admin dashboard analytics snapshot loaded.")


class AdminProfileResource(Resource):
    @token_required()
    def put(current_admin, self):
        """8. Guarded Route: Allow administrative profile updates securely via session auth headers"""
        json_data = request.get_json() or {}
        new_email = json_data.get("email")
        new_password = json_data.get("password")
        
        updated = AuthService.modify_admin_profile(current_admin["id"], current_admin["email"], new_email, new_password)
        if not updated:
            return ApiResponse.error(message="No data changes passed to update operations profile metrics.", status_code=400)
        return ApiResponse.success(message="Profile configuration updated successfully.")


class AdminLoginResource(Resource):
    def post(self):
        json_data = request.get_json() or {}
        errors, credentials = AdminSchema.validate_login(json_data)
        if errors:
            return ApiResponse.error(message="Invalid parameters input structure.", status_code=400, errors=errors)
        admin = AuthService.authenticate_admin(credentials["email"], credentials["password"])
        if not admin:
            return ApiResponse.error(message="Invalid credentials verified profile mismatch.", status_code=401)
        token = SecurityUtils.generate_token(admin)
        return ApiResponse.success(data={"token": token, "role": admin["role"], "email": admin["email"]}, message="Session opened.")


class OrderResource(Resource):
    def post(self):
        json_data = request.get_json() or {}
        if not json_data.get("product_name"):
            return ApiResponse.error(message="Tracking properties context mismatch.", status_code=400)
        logged = OrderService.log_whatsapp_click(json_data)
        return ApiResponse.success(data=logged, message="Checkout analytics registered.", status_code=201)

    @token_required()
    def get(current_admin, self):
        return ApiResponse.success(data=OrderService.fetch_orders(), message="Orders loaded.")


class SuperAdminManagementResource(Resource):
    @token_required(required_role="Super Admin")
    def post(current_admin, self):
        json_data = request.get_json() or {}
        email = json_data.get("email")
        password = json_data.get("password")
        role = json_data.get("role", "Admin")
        if not email or not password:
            return ApiResponse.error(message="Parameters extraction error.", status_code=400)
        new_staff = AuthService.register_first_admin(email, password, role, current_admin["email"])
        return ApiResponse.success(data={"email": email, "role": role}, message="Sub-admin entry locked down.")


class ReviewResource(Resource):
    def get(self):
        return ApiResponse.success(data=ReviewService.get_public_reviews(), message="Reviews synchronized.")

    def post(self):
        json_data = request.get_json() or {}
        errors, cleaned_data = ReviewSchema.validate_and_clean(json_data)
        if errors:
            return ApiResponse.error(message="Validation mismatch properties entry.", status_code=400, errors=errors)
        return ApiResponse.success(data=ReviewService.submit_review(cleaned_data), message="Review published.", status_code=201)

    @token_required()
    def delete(current_admin, self):
        review_id = request.args.get("id")
        if not review_id:
            return ApiResponse.error(message="Query tracking mismatch identifiers context.", status_code=400)
        ReviewService.remove_review(review_id)
        return ApiResponse.success(message="Review wiped cleanly.")

from src.controllers.utilities import SecurityUtils
