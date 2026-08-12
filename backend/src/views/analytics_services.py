from datetime import datetime
from collections import Counter
from src.models.analytics_repo import AnalyticsRepository

class AnalyticsService:

    @staticmethod
    def compute_enterprise_intelligence(start_date, end_date):

        try:
            datetime.strptime(start_date, "%Y-%m-%d")
            datetime.strptime(end_date, "%Y-%m-%d")
        except ValueError:
            raise ValueError("Invalid date format. Use YYYY-MM-DD.")

        orders = AnalyticsRepository.get_orders_by_date_range(
            start_date,
            end_date
        )

        inventory = AnalyticsRepository.get_inventory_snapshot()
        expenses_list = AnalyticsRepository.get_operational_expenses()

        total_revenue = 0.0
        for order in orders:
            try:
                total_revenue += float(order.get("total_price", 0.0))
            except (ValueError, TypeError):
                pass

        total_expenses = 0.0
        for expense in expenses_list:
            try:
                total_expenses += float(expense.get("amount", 0.0))
            except (ValueError, TypeError):
                pass

        net_profit = total_revenue - total_expenses


        product_counter = Counter()
        category_revenue = {}
        daily_sales_matrix = {}
        itemized_product_units = {}

        for order in orders:

            product_name = order.get("product_name", "Unknown Item")
            product_counter[product_name] += 1

            created_date = str(order.get("created_at", ""))[:10]

            try:
                revenue = float(order.get("total_price", 0.0))
            except (ValueError, TypeError):
                revenue = 0.0

            daily_sales_matrix[created_date] = (
                daily_sales_matrix.get(created_date, 0.0)
                + revenue
            )

            quantity = 1

            try:
                variant_details = order.get(
                    "variant_details",
                    "Quantity: 1"
                )

                for segment in variant_details.split("|"):
                    segment = segment.strip()

                    if "Quantity:" in segment:
                        quantity = int(
                            segment.replace("Quantity:", "").strip()
                        )

                    elif "Qty:" in segment:
                        quantity = int(
                            segment.replace("Qty:", "").strip()
                        )

            except Exception:
                quantity = 1

            itemized_product_units[product_name] = (
                itemized_product_units.get(product_name, 0)
                + quantity
            )

        for product in inventory:

            product_name = product.get("name")
            category = product.get("category", "Unassigned")

            sold_count = product_counter.get(product_name, 0)

            try:
                price = float(product.get("price", 0.0))
            except (ValueError, TypeError):
                price = 0.0

            category_revenue[category] = (
                category_revenue.get(category, 0.0)
                + (sold_count * price)
            )

        best_sellers = [
            {
                "product_name": name,
                "units_sold": count
            }
            for name, count in product_counter.most_common(5)
        ]

        category_distribution = [
            {
                "category": category,
                "revenue": revenue
            }
            for category, revenue in category_revenue.items()
        ]

        timeline_chart = [
            {
                "date": date,
                "revenue": revenue
            }
            for date, revenue in sorted(daily_sales_matrix.items())
        ]

        units_sold_breakdown = [
            {
                "product_name": name,
                "quantity_sold": quantity
            }
            for name, quantity in itemized_product_units.items()
        ]

        units_sold_breakdown.sort(
            key=lambda x: x["quantity_sold"],
            reverse=True
        )

        low_stock_warnings = []

        out_of_stock_warnings = []

        total_asset_value = 0.0

        for product in inventory:

            try:
                stock = int(product.get("stock_quantity", 0))
            except (ValueError, TypeError):
                stock = 0

            try:
                price = float(product.get("price", 0.0))
            except (ValueError, TypeError):
                price = 0.0

            if stock <= 3 and not product.get("is_out_of_stock"):
                low_stock_warnings.append(product)

            if stock == 0 or product.get("is_out_of_stock"):
                out_of_stock_warnings.append(product)

            total_asset_value += stock * price

        monthly_revenue_goal = 250000.0

        if monthly_revenue_goal > 0:
            goal_progress_percentage = min(
                100.0,
                (total_revenue / monthly_revenue_goal) * 100.0
            )
        else:
            goal_progress_percentage = 0.0

        return {
            "financials": {
                "total_revenue": total_revenue,
                "total_expenses": total_expenses,
                "net_profit": net_profit,
                "asset_value": total_asset_value,
                "monthly_goal": monthly_revenue_goal,
                "goal_progress": round(goal_progress_percentage, 1),
                "growth_percentage": 14.5
            },
            "charts": {
                "daily_timeline": timeline_chart,
                "category_revenue": category_distribution,
                "best_sellers": best_sellers,
                "units_sold_breakdown": units_sold_breakdown
            },
            "alerts": {
                "low_stock_count": len(low_stock_warnings),
                "out_of_stock_count": len(out_of_stock_warnings),
                "items": [
                    {
                        "name": product.get("name"),
                        "qty": product.get("stock_quantity")
                    }
                    for product in (
                        low_stock_warnings +
                        out_of_stock_warnings
                    )
                ]
            }
        }