from flask import request, make_response
from flask_restful import Resource
from src.views.analytics_services import AnalyticsService
from src.views.services import AuthService
from src.views.schemas import AdminSchema
from src.models.database import supabase_client
from src.views.responses import ApiResponse
from src.controllers.utilities import token_required


class EnterpriseAnalyticsResource(Resource):
    def options(self):
        return make_response("", 200)

    @token_required()
    def get(self, current_admin):
        start_date = request.args.get("start_date", "2026-01-01")
        end_date = request.args.get("end_date", "2026-12-31")

        try:
            intelligence_data = AnalyticsService.compute_enterprise_intelligence(start_date, end_date)
        except ValueError:
            return ApiResponse.error(
                message="Invalid analytics date range or filter parameters.",
                status_code=400
                )


        return ApiResponse.success(data=intelligence_data, message="Enterprise financial intelligence analytics metrics compiled successfully.")

class StaffManagementResource(Resource):
    def options(self, admin_id=None):
        return make_response("", 200)

    @token_required()
    def get(self, current_admin):
        if current_admin.get("role") != "Super Admin":
            return ApiResponse.error(message="Access denied. Super Admin privileges required.", status_code=403)

        response = supabase_client.table("admins").select("id", "email", "role", "is_active", "created_at").execute()
        return ApiResponse.success(data=response.data if response.data else [], message="Staff directory fetched cleanly.")

    @token_required()
    def post(self, current_admin):
        if current_admin.get("role") != "Super Admin":
            return ApiResponse.error(message="Access denied. Super Admin privileges required.", status_code=403)

        json_data = request.get_json() or {}
        errors, cleaned_data = AdminSchema.validate_login(json_data)
        if errors:
            return ApiResponse.error(message="Validation failed.", status_code=400, errors=errors)

        role = json_data.get("role", "Admin")
        new_staff = AuthService.register_first_admin(cleaned_data["email"], cleaned_data["password"], role)
        return ApiResponse.success(data=new_staff, message="New administrative credentials record generated securely.", status_code=201)

    @token_required()
    def delete(self, current_admin, admin_id=None):
        if current_admin.get("role") != "Super Admin":
            return ApiResponse.error(message="Access denied. Super Admin privileges required.", status_code=403)

        if not admin_id:
            return ApiResponse.error(message="Admin user key ID parameter is required.", status_code=400)

        if str(admin_id) == str(current_admin.get("id")):
            return ApiResponse.error(message="Self-deletion operation restriction safeguard activated.", status_code=400)

        existing = (
            supabase_client.table("admins")
            .select("id")
            .eq("id", admin_id)
            .execute()
        )

        if not existing.data:
            return ApiResponse.error(message="Admin account not found.", status_code=404)

        supabase_client.table("admins").delete().eq("id", admin_id).execute()
        return ApiResponse.success(message="Target administrative staff record permanently deleted.")

class StaffStatusToggleResource(Resource):
    def options(self, admin_id):
        return make_response("", 200)

    @token_required()
    def patch(self, current_admin, admin_id):
        if current_admin.get("role") != "Super Admin":
            return ApiResponse.error(message="Access denied. Super Admin privileges required.", status_code=403)

        json_data = request.get_json() or {}

        if "is_active" not in json_data:
            return ApiResponse.error(message="Missing is_active field.", status_code=400)

        next_status = bool(json_data["is_active"])

        if str(admin_id) == str(current_admin.get("id")):
            return ApiResponse.error(message="You cannot inactivate your own Super Admin root account profile.", status_code=400)

        supabase_client.table("admins").update({"is_active": next_status}).eq("id", admin_id).execute()
        return ApiResponse.success(message="Administrative staff active privileges flag toggled instantly.")