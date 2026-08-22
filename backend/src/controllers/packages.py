from flask import request
from flask_restful import Resource
from src.models.database import supabase_client
from src.controllers.utilities import token_required
import logging

logger = logging.getLogger(__name__)

class PackagesResource(Resource):
    def get(self, *args, **kwargs):
        try:
            packages_query_res = supabase_client.table("packages").select("*").order("created_at", desc=True).execute()

            return {
                "success": True,
                "message": "Promotional package bundle tracks fetched cleanly from dedicated storage records.",
                "data": packages_query_res.data if packages_query_res.data else []
            }, 200
        except Exception as e:
            logger.exception("Packages repository fetch failed.")
            return {
                "success": False,
                "message": "Server failure while fetching package records."
                }, 500

    @token_required()
    def post(self, current_admin):
        try:
            request_payload = request.get_json() or {}

            package_name = request_payload.get('name', '').strip()
            package_price = request_payload.get('price', 0.0)
            package_description = request_payload.get('description', '').strip()
            products_summary = request_payload.get('products_summary', [])
            image_url = request_payload.get('image_url', '')
            is_time_limited = bool(request_payload.get('is_time_limited', False))
            available_from_date = request_payload.get('available_from_date') or None
            available_until_date = request_payload.get('available_until_date') or None
            available_until_time = request_payload.get('available_until_time') or None

            if not package_name or not package_price:
                return {"success": False, "message": "Missing core package title name or bundle pricing value metrics."}, 400

            package_database_payload = {
                "name": package_name,
                "description": package_description,
                "price": float(package_price),
                "stock_quantity": int(request_payload.get('stock_quantity', 0)),
                "products_summary": products_summary,
                "image_url": image_url,
                "is_time_limited": is_time_limited,
                "available_from_date": available_from_date,
                "available_until_date": available_until_date,
                "available_until_time": available_until_time
                }

            inserted_package_res = supabase_client.table("packages").insert(package_database_payload).execute()

            return {
                "success": True,
                "message": "Dynamic medical uniform package bundle compiled and uploaded live safely!",
                "data": inserted_package_res.data if inserted_package_res.data else None
            }, 201

        except Exception as e:
            logger.exception("Package creation failed.")
            return {
                "success": False,
                "message": "Unable to create the package at this time."
                }, 500

    @token_required()
    def put(self, current_admin, package_id):
        try:
            json_data = request.get_json() or {}
            update_payload = {}
            fields_list = [
                "name", "description", "price", "image_url", "is_time_limited",
                "available_from_date", "available_until_date", "available_until_time", "stock_quantity"
            ]
            for field in fields_list:
                if field in json_data:
                    update_payload[field] = json_data[field]

            if not update_payload:
                return {"success": False, "message": "No valid fields supplied to update."}, 400

            updated = supabase_client.table("packages").update(update_payload).eq("id", package_id).execute()

            if not updated.data:
                return {"success": False, "message": "Package not found."}, 404

            return {
                "success": True,
                "data": updated.data[0],
                "message": "Package updated."
            }, 200

        except Exception as e:
            logger.exception("Package update failed.")
            return {
                "success": False,
                "message": "Unable to update the package at this time."
                }, 500

    @token_required()
    def delete(self, current_admin, package_id):
        try:
            deleted = (
                supabase_client
                .table("packages")
                .delete()
                .eq("id", package_id)
                .execute()
            )

            if not deleted.data:
                return {
                    "success": False,
                    "message": "Package not found."
                }, 404

            return {
                "success": True,
                "message": "Package deleted successfully."
            }, 200

        except Exception as e:
            logger.exception("Package deletion failed.")
            return {
                "success": False,
                "message": "Unable to delete the package at this time."
                }, 500