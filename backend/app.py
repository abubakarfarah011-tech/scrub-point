# app.py
import os
from flask import Flask
from flask_restful import Api
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)
api = Api(app)

# =====================================================================
# SYSTEM RESOURCE GATEWAY MAPPINGS
# =====================================================================
from src.controllers.routes import (
    ProductListResource, 
    ProductResource, 
    ProductRestoreResource,
    CategoryListResource,
    AdminDashboardResource,
    AdminProfileResource,
    AdminLoginResource, 
    OrderResource,
    SuperAdminManagementResource,
    ReviewResource
)

# Core Product Catalog Mappings
api.add_resource(ProductListResource, '/api/products')
api.add_resource(ProductResource, '/api/products/<int:product_id>')
api.add_resource(ProductRestoreResource, '/api/products/<int:product_id>/restore')
api.add_resource(CategoryListResource, '/api/categories')

# Administrative Infrastructure Dashboard Mappings
api.add_resource(AdminDashboardResource, '/api/admin/dashboard')
api.add_resource(AdminProfileResource, '/api/admin/profile')
api.add_resource(AdminLoginResource, '/api/admin/login')
api.add_resource(SuperAdminManagementResource, '/api/admin/staff')

# Public Customer Checkout Tracking & Review Portals
api.add_resource(OrderResource, '/api/orders')
api.add_resource(ReviewResource, '/api/reviews')

# 4. Production Health Check Endpoint
@app.route('/health', methods=['GET'])
def server_health():
    return {"status": "ok", "message": "Scrub Point Core Engine Online"}, 200

if __name__ == '__main__':
    server_port = int(os.getenv("PORT", 5000))
    app.run(debug=True, port=server_port)
