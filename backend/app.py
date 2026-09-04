import os

from dotenv import load_dotenv
from flask import Flask, make_response, request
from flask_restful import Api
from flask_cors import CORS

load_dotenv()

from src.config import FRONTEND_ORIGINS
from src.extensions import limiter
from src.controllers.image_upload import AdminImageUploadResource
from src.controllers.walk_in_order import WalkInOrderResource
from src.controllers.packages import PackagesResource


app = Flask(__name__)
limiter.init_app(app)
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": FRONTEND_ORIGINS
        }
    },
    supports_credentials=True
)

api = Api(app)

@app.after_request
def apply_cors_fallback_headers(response):
    request_origin = request.headers.get("Origin")

    if request_origin in FRONTEND_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = request_origin
        response.headers["Vary"] = "Origin"

    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Headers"] = (
        "Content-Type, Authorization, Access-Control-Allow-Origin, X-Requested-With"
    )
    response.headers["Access-Control-Allow-Methods"] = (
        "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    )
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Content-Security-Policy"] = (
    "default-src 'none'; "
    "frame-ancestors 'none'; "
    "base-uri 'none'; "
    "form-action 'none'"
    )
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    return response

from src.controllers.routes import (
    ProductListResource,
    ProductResource,
    CategoryListResource,
    AdminDashboardResource,
    AdminLoginResource,
    OrderResource,
    OrderFulfillResource,
    ReviewResource,
    AdminReviewResource,
    ContactMessageResource,
    AdminProfileResource,
    TrashResource,
    OrderConfirmResource,
    OrderCancelResource

)

from src.controllers.analytics_routes import (
    EnterpriseAnalyticsResource,
    StaffManagementResource,
    StaffStatusToggleResource
)

api.add_resource(ProductListResource, '/api/products')
api.add_resource(ProductResource, '/api/products/<int:product_id>')
api.add_resource(PackagesResource, '/api/packages', '/api/packages/<int:package_id>')
api.add_resource(CategoryListResource, '/api/categories')

api.add_resource(OrderResource, '/api/orders')
api.add_resource(OrderFulfillResource, '/api/orders/<string:order_id>/fulfill')
api.add_resource(OrderConfirmResource, '/api/orders/<string:order_id>/confirm')
api.add_resource(OrderCancelResource, '/api/orders/<string:order_id>/cancel')

api.add_resource(AdminDashboardResource, '/api/admin/dashboard')
api.add_resource(AdminLoginResource, '/api/admin/login')
api.add_resource(AdminImageUploadResource, '/api/admin/upload-image')
api.add_resource(TrashResource, '/api/admin/trash', '/api/admin/trash/<int:product_id>')

api.add_resource(ReviewResource, '/api/reviews')
api.add_resource(AdminReviewResource, '/api/admin/reviews/<string:review_id>', '/api/admin/reviews')

api.add_resource(ContactMessageResource, '/api/contact/messages/<int:message_id>', '/api/contact/messages')

api.add_resource(AdminProfileResource, '/api/admin/profile')

api.add_resource(EnterpriseAnalyticsResource, '/api/admin/analytics')
api.add_resource(StaffManagementResource, '/api/admin/staff/<string:admin_id>', '/api/admin/staff')
api.add_resource(StaffStatusToggleResource, '/api/admin/staff/<string:admin_id>/toggle')
api.add_resource(WalkInOrderResource, '/api/admin/walk-in-order')

@app.route('/health', methods=['GET'])
def server_health():
    response = make_response({"status": "ok", "message": "Scrub Point Core Engine Online"}, 200)
    return response

if __name__ == "__main__":
    server_port = int(os.getenv("PORT", 5000))
    app.run(
        host="0.0.0.0",
        port=server_port,
        debug=os.getenv("FLASK_ENV") != "production"
    )