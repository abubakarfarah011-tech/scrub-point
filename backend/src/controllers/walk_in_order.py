from flask import request, make_response
from flask_restful import Resource
from src.models.database import supabase_client
from src.controllers.utilities import token_required
from src.views.schemas import WalkInOrderSchema
import logging


logger = logging.getLogger(__name__)


class WalkInOrderResource(Resource):
    def options(self, *args, **kwargs):
        return make_response("", 200)

    @token_required()
    def post(self, current_admin, *args, **kwargs):
        try:
            request_payload = request.get_json(silent=True)

            errors, cleaned_data = WalkInOrderSchema.validate_and_clean(
                request_payload
            )

            if errors:
                return {
                    "success": False,
                    "message": "Walk-in order validation failed.",
                    "errors": errors,
                }, 400

            customer_name = cleaned_data["customer_name"]
            customer_phone = cleaned_data["customer_phone"]
            cart_items = cleaned_data["items"]

            enriched_sale_items = []
            computed_total_price = 0.0

            for item in cart_items:
                p_id = item["product_id"]
                requested_qty = item["quantity"]

                product_res = (
                    supabase_client
                    .table("products")
                    .select("*")
                    .eq("id", p_id)
                    .execute()
                )

                if not product_res.data:
                    return {
                        "success": False,
                        "message": (
                            f"Product ID #{p_id} does not exist "
                            "in store registries."
                        ),
                    }, 404

                raw_list_data = product_res.data

                if (
                    not isinstance(raw_list_data, list)
                    or len(raw_list_data) == 0
                ):
                    return {
                        "success": False,
                        "message": (
                            f"Product ID #{p_id} returned an invalid "
                            "or empty data array row."
                        ),
                    }, 404

                product_data = raw_list_data[0]

                current_stock = int(
                    product_data.get("stock_quantity", 0) or 0
                )

                if current_stock < requested_qty:
                    return {
                        "success": False,
                        "message": (
                            f"Insufficient stock for "
                            f"'{product_data.get('name')}'. "
                            f"Available: {current_stock}, "
                            f"Requested: {requested_qty}"
                        ),
                    }, 400

                normal_price = float(
                    product_data.get("price") or 0
                )

                discount_price = float(
                    product_data.get("discount_price") or 0
                )

                is_on_offer = (
                    product_data.get("is_on_offer") is True
                    or str(
                        product_data.get("is_on_offer")
                    ).lower() == "true"
                )

                unit_price = (
                    discount_price
                    if is_on_offer and discount_price > 0
                    else normal_price
                )

                line_total = unit_price * requested_qty
                computed_total_price += line_total

                enriched_sale_items.append({
                    "product_id": p_id,
                    "name": product_data.get("name"),
                    "price": unit_price,
                    "quantity": requested_qty,
                    "size": item["size"],
                    "color": item["color"],
                })

            for item in enriched_sale_items:
                supabase_client.rpc(
                    "decrement_stock",
                    {
                        "row_id": item["product_id"],
                        "qty_to_subtract": item["quantity"],
                    },
                ).execute()

            sale_record = (
                supabase_client
                .table("walk_in_orders")
                .insert({
                    "customer_name": customer_name,
                    "customer_phone": customer_phone,
                    "items_summary": enriched_sale_items,
                    "total_price": computed_total_price,
                })
                .execute()
            )

            return {
                "success": True,
                "message": (
                    "Walk-in order processed successfully! "
                    "Stock decremented cleanly from database balances."
                ),
                "data": (
                    sale_record.data[0]
                    if sale_record.data
                    else None
                ),
            }, 201

        except Exception:
            logger.exception("Walk-in order processing failed.")

            return {
                "success": False,
                "message": (
                    "Unable to process the walk-in order at this time."
                ),
            }, 500

    @token_required()
    def get(self, current_admin, *args, **kwargs):
        try:
            response = (
                supabase_client
                .table("walk_in_orders")
                .select("*")
                .order("created_at", desc=True)
                .execute()
            )

            return {
                "success": True,
                "data": response.data if response.data else [],
            }, 200

        except Exception:
            logger.exception("Walk-in sales history fetch failed.")

            return {
                "success": False,
                "message": (
                    "Unable to fetch walk-in sales history at this time."
                ),
            }, 500