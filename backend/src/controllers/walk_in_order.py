import time
from flask import request, make_response
from flask_restful import Resource
from src.models.database import supabase_client
from src.controllers.utilities import token_required
import logging

logger = logging.getLogger(__name__)

class WalkInOrderResource(Resource):
    def options(self, *args, **kwargs):
        return make_response("", 200)

    @token_required()
    def post(self, current_admin, *args, **kwargs):
        try:
            request_payload = request.get_json() or {}
            customer_name = request_payload.get("customer_name", "")
            customer_phone = request_payload.get("customer_phone", "")
            cart_items = request_payload.get("items", [])

            if not isinstance(customer_name, str):
                 return {
                      "success": False,
                      "message": "Customer name must be text."
                      }, 400
            if not isinstance(customer_phone, str):
                 return {
                      "success": False,
                      "message": "Customer phone must be text."
                      }, 400

            customer_name = customer_name.strip()
            customer_phone = customer_phone.strip()

            if not customer_name or len(customer_name) > 100:
                return {
                    "success": False,
                    "message": "Customer name must be between 1 and 100 characters."
                    }, 400
            if not customer_phone or len(customer_phone) > 30:
                return {
                    "success": False,
                    "message": "Customer phone must be between 1 and 30 characters."
                    }, 400
            if not isinstance(cart_items, list):
                 return {
                      "success": False,
                      "message": "Items must be provided as a list."
                      }, 400

            if not cart_items:
                return {"success": False, "message": "Your walk-in invoice trolley list is completely empty."}, 400

            enriched_sale_items = []
            computed_total_price = 0.0

            for item in cart_items:
                if not isinstance(item, dict):
                    return {
                        "success": False,
                        "message": "Each item must be a valid object."
                        }, 400
                p_id = item.get("product_id")

                if isinstance(p_id, bool) or not isinstance(p_id, int) or p_id < 1:
                    return {
                        "success": False,
                        "message": "Product ID must be a valid positive integer."
                        }, 400

                raw_quantity = item.get("quantity", 1)
                if isinstance(raw_quantity, bool):
                       return {
                              "success": False,
                              "message": "Item quantity must be a valid whole number."
                              }, 400
                try:
                       requested_qty = int(raw_quantity)
                except (TypeError, ValueError):
                    return {
                        "success": False,
                        "message": "Item quantity must be a valid whole number."
                        }, 400

                if requested_qty < 1 or requested_qty > 100:
                    return {
                        "success": False,
                        "message": "Item quantity must be between 1 and 100."
                        }, 400

                product_res = supabase_client.table("products").select("*").eq("id", p_id).execute()
                if not product_res.data:
                    return {"success": False, "message": f"Product ID #{p_id} does not exist in store registries."}, 404

                raw_list_data = product_res.data
                if isinstance(raw_list_data, list) and len(raw_list_data) > 0:
                    product_data = raw_list_data[0]
                else:
                    return {"success": False, "message": f"Product ID #{p_id} returned an invalid or empty data array row."}, 404

                current_stock = int(product_data.get('stock_quantity', 0))

                if current_stock < requested_qty:
                    return {"success": False, "message": f"Insufficient stock for '{product_data.get('name')}'. Available: {current_stock}, Requested: {requested_qty}"}, 400

                unit_price = float(product_data.get('offer_price') if product_data.get('is_on_offer') else product_data.get('price', 0))
                line_total = unit_price * requested_qty
                computed_total_price += line_total

                enriched_sale_items.append({
                    "product_id": p_id,
                    "name": product_data.get('name'),
                    "price": unit_price,
                    "quantity": requested_qty,
                    "size": item.get('size'),
                    "color": item.get('color')
                })

            for item in enriched_sale_items:
                supabase_client.rpc(
                    "decrement_stock",
                    {
                        "row_id": item["product_id"],
                        "qty_to_subtract": item["quantity"]
                        }
                        ).execute()

            sale_record = supabase_client.table("walk_in_orders").insert({
                "customer_name": customer_name,
                "customer_phone": customer_phone,
                "items_summary": enriched_sale_items,
                "total_price": computed_total_price
            }).execute()

            return {
                "success": True,
                "message": "Walk-in order processed successfully! Stock decremented cleanly from database balances.",
                "data": sale_record.data[0] if sale_record.data else None
            }, 201

        except Exception as e:
            logger.exception("Walk-in order processing failed.")
            return {
                "success": False,
                "message": "Unable to process the walk-in order at this time."
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
            return {"success": True, "data": response.data if response.data else []}, 200
        except Exception as e:
            logger.exception("Walk-in sales history fetch failed.")
            return {
                "success": False,
                "message": "Unable to fetch walk-in sales history at this time."
                }, 500