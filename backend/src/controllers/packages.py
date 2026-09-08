from flask import request
from flask_restful import Resource
from src.models.database import supabase_client
from src.controllers.utilities import token_required
from src.views.schemas import PackageSchema
import logging


logger = logging.getLogger(__name__)

def validate_package_products(package_payload):
    components = package_payload.get("products_summary")

    if components is None:
        return None

    product_ids = [
        component["product_id"]
        for component in components
    ]

    if not product_ids:
        return "A package must contain at least one product."

    response = (
        supabase_client
        .table("products")
        .select("id")
        .in_("id", product_ids)
        .execute()
    )

    existing_ids = {
        int(row["id"])
        for row in (response.data or [])
        if row.get("id") is not None
    }

    missing_ids = [
        product_id
        for product_id in product_ids
        if product_id not in existing_ids
    ]

    if missing_ids:
        return (
            "Package contains product IDs that do not exist: "
            + ", ".join(str(product_id) for product_id in missing_ids)
        )

    return None

class PackagesResource(Resource):
    def get(self, *args, **kwargs):
        try:
            packages_query_res = (
                supabase_client
                .table("packages")
                .select("*")
                .order("created_at", desc=True)
                .execute()
            )

            return {
                "success": True,
                "message": "Promotional package bundle tracks fetched cleanly from dedicated storage records.",
                "data": (
                    packages_query_res.data
                    if packages_query_res.data
                    else []
                ),
            }, 200

        except Exception:
            logger.exception("Packages repository fetch failed.")
            return {
                "success": False,
                "message": "Server failure while fetching package records.",
            }, 500

    @token_required()
    def post(self, current_admin):
        try:
            request_payload = request.get_json(silent=True)

            errors, package_database_payload = (
                PackageSchema.validate_and_clean(request_payload)
            )

            if errors:
                return {
                    "success": False,
                    "message": "Package validation failed.",
                    "errors": errors,
                }, 400
            component_error = validate_package_products(
                package_database_payload
            )

            if component_error:
                return {
                    "success": False,
                    "message": component_error,
                    }, 400

            inserted_package_res = (
                supabase_client
                .table("packages")
                .insert(package_database_payload)
                .execute()
            )

            return {
                "success": True,
                "message": "Dynamic medical uniform package bundle compiled and uploaded live safely!",
                "data": (
                    inserted_package_res.data
                    if inserted_package_res.data
                    else None
                ),
            }, 201

        except Exception:
            logger.exception("Package creation failed.")
            return {
                "success": False,
                "message": "Unable to create the package at this time.",
            }, 500

    @token_required()
    def put(self, current_admin, package_id):
        try:
            json_data = request.get_json(silent=True)

            errors, update_payload = (
                PackageSchema.validate_and_clean(
                    json_data,
                    partial=True,
                )
            )

            if errors:
                return {
                    "success": False,
                    "message": "Package validation failed.",
                    "errors": errors,
                }, 400

            component_error = validate_package_products(
                update_payload
            )

            if component_error:
                return {
                    "success": False,
                    "message": component_error,
            }, 400

            updated = (
                supabase_client
                .table("packages")
                .update(update_payload)
                .eq("id", package_id)
                .execute()
            )

            if not updated.data:
                return {
                    "success": False,
                    "message": "Package not found.",
                }, 404

            return {
                "success": True,
                "data": updated.data[0],
                "message": "Package updated.",
            }, 200

        except Exception:
            logger.exception("Package update failed.")
            return {
                "success": False,
                "message": "Unable to update the package at this time.",
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
                    "message": "Package not found.",
                }, 404

            return {
                "success": True,
                "message": "Package deleted successfully.",
            }, 200

        except Exception:
            logger.exception("Package deletion failed.")
            return {
                "success": False,
                "message": "Unable to delete the package at this time.",
            }, 500