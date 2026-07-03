# src/views/services.py
import math
import bcrypt
from src.models.repo import ProductRepository, AdminRepository, OrderRepository, ReviewRepository, AuditRepository

class ProductService:
    @staticmethod
    def fetch_all_products(category=None, search=None, page=1, limit=20, sort_by="newest"):
        products, total_products = ProductRepository.get_all(category, search, page, limit, sort_by)
        total_pages = math.ceil(total_products / limit) if total_products > 0 else 1
        
        # 6. Structuring metadata directly into unified payloads for React pagination
        return {
            "items": products if products else [],
            "pagination": {
                "page": page,
                "limit": limit,
                "total_products": total_products,
                "total_pages": total_pages
            }
        }

    @staticmethod
    def fetch_single_product(product_id):
        return ProductRepository.get_by_id(product_id)

    @staticmethod
    def fetch_categories_list():
        return ProductRepository.get_distinct_categories()

    @staticmethod
    def add_new_product(cleaned_data, admin_email):
        product = ProductRepository.create(cleaned_data)
        if product:
            p_data = product if isinstance(product, list) else product
            AuditRepository.write_log(admin_email, "ADD_PRODUCT", f"Added product '{p_data.get('name')}'")
        return product

    @staticmethod
    def modify_product(product_id, update_data, admin_email):
        existing = ProductRepository.get_by_id(product_id)
        if not existing:
            return None
        updated = ProductRepository.update(product_id, update_data)
        if updated:
            AuditRepository.write_log(admin_email, "EDIT_PRODUCT", f"Modified product ID: {product_id}")
        return updated

    @staticmethod
    def remove_product(product_id, admin_email):
        existing = ProductRepository.get_by_id(product_id)
        if not existing:
            return False
        ProductRepository.soft_delete(product_id)
        AuditRepository.write_log(admin_email, "SOFT_DELETE_PRODUCT", f"Soft deleted item ID: {product_id}")
        return True

    @staticmethod
    def restore_product(product_id, admin_email):
        restored = ProductRepository.restore(product_id)
        if restored:
            AuditRepository.write_log(admin_email, "RESTORE_PRODUCT", f"Restored active availability for item ID: {product_id}")
            return True
        return False


class AuthService:
    @staticmethod
    def authenticate_admin(email, password):
        admin_records = AdminRepository.get_by_email(email)
        if not admin_records:
            return None
        
        admin = admin_records if not isinstance(admin_records, list) else admin_records
        stored_hash = admin.get("password_hash")
        
        if stored_hash and bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8')):
            AuditRepository.write_log(admin.get("email"), "ADMIN_LOGIN", "Admin session initialized securely.")
            return {"id": admin.get("id"), "email": admin.get("email"), "role": admin.get("role")}
        return None

    @staticmethod
    def register_first_admin(email, password, role="Admin", super_admin_email="SYSTEM"):
        salt = bcrypt.gensalt(12)
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
        result = AdminRepository.create_admin({"email": email, "password_hash": hashed_password, "role": role})
        if result:
            AuditRepository.write_log(super_admin_email, "CREATE_SUB_ADMIN", f"Registered account portal for: '{email}'")
        return result

    @staticmethod
    def modify_admin_profile(admin_id, current_email, new_email, new_password):
        update_data = {}
        if new_email:
            update_data["email"] = new_email
        if new_password:
            salt = bcrypt.gensalt(12)
            update_data["password_hash"] = bcrypt.hashpw(new_password.encode('utf-8'), salt).decode('utf-8')
            
        if not update_data:
            return None
            
        result = AdminRepository.update_admin(admin_id, update_data)
        if result:
            AuditRepository.write_log(current_email, "UPDATE_PROFILE", f"Modified account authentication credentials securely.")
        return result


class DashboardService:
    @staticmethod
    def compile_metrics():
        # 3. Aggregating multi-table metrics into one unified response for high-speed layout rendering
        return {
            "products": ProductRepository.get_total_count(),
            "orders": OrderRepository.get_total_count(),
            "reviews": ReviewRepository.get_total_count(),
            "categories": len(ProductRepository.get_distinct_categories()),
            "admins": AdminRepository.get_total_count()
        }


class OrderService:
    @staticmethod
    def log_whatsapp_click(json_data):
        return OrderRepository.create_order({
            "product_name": json_data.get("product_name"),
            "variant_details": json_data.get("variant_details", "No variants selected"),
            "total_price": float(json_data.get("total_price", 0.0))
        })

    @staticmethod
    def fetch_orders():
        return OrderRepository.get_all_orders()


class ReviewService:
    @staticmethod
    def get_public_reviews():
        return ReviewRepository.get_approved_reviews()

    @staticmethod
    def submit_review(cleaned_data):
        return ReviewRepository.create_review(cleaned_data)

    @staticmethod
    def remove_review(review_id):
        return ReviewRepository.delete_review(review_id)
