import time
from flask import request, make_response
from flask_restful import Resource
from src.models.database import supabase_client
from src.controllers.utilities import token_required

class WalkInOrderResource(Resource):
    def options(self, *args, **kwargs):
        return make_response("", 200)

    @token_required()
    def post(self, current_admin, *args, **kwargs):
        try:
            request_payload = request.get_json() or {}
            customer_name = request_payload.get('customer_name', '').strip()
            customer_phone = request_payload.get('customer_phone', '').strip()
            cart_items = request_payload.get('items', [])

            if not cart_items:
                return {"success": False, "message": "Your walk-in invoice trolley list is completely empty."}, 400

            enriched_sale_items = []
            computed_total_price = 0.0

            for item in cart_items:
                p_id = item.get('product_id')
                requested_qty = int(item.get('quantity', 1))

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

            for item in cart_items:
                p_id = item.get('product_id')
                requested_qty = int(item.get('quantity', 1))

                supabase_client.rpc(
                    "decrement_stock",
                    {"row_id": p_id, "qty_to_subtract": requested_qty}
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
            print(f"[POS CRASH LOG] Runtime Exception: {str(e)}")
            return {"success": False, "message": f"POS Pipeline Stockout Failure: {str(e)}"}, 500

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
            print(f"[POS HISTORY FETCH CRASH LOG] Runtime Exception: {str(e)}")
            return {"success": False, "message": f"Failed to fetch walk-in sales history: {str(e)}"}, 500