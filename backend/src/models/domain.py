class ProductDomain:
    def __init__(self, id=None, name=None, description=None, price=0.0, category=None, is_featured=False, is_out_of_stock=False, image_url=None, created_at=None):
        self.id = id
        self.name = name
        self.description = description
        self.price = float(price) if price else 0.0
        self.category = category
        self.is_featured = bool(is_featured)
        self.is_out_of_stock = bool(is_out_of_stock)
        self.image_url = image_url
        self.created_at = created_at

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "price": self.price,
            "category": self.category,
            "is_featured": self.is_featured,
            "is_out_of_stock": self.is_out_of_stock,
            "image_url": self.image_url,
            "created_at": self.created_at
        }
class VariantDomain:
    def __init__(self, id=None, product_id=None, size=None, color=None, stock_quantity=0):
        self.id = id
        self.product_id = product_id
        self.size = size
        self.color = color
        self.stock_quantity = int(stock_quantity) if stock_quantity else 0

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "size": self.size,
            "color": self.color,
            "stock_quantity": self.stock_quantity
        }
class OrderDomain:
    def __init__(self, id=None, product_name=None, variant_details=None, total_price=0.0, created_at=None):
        self.id = id
        self.product_name = product_name
        self.variant_details = variant_details
        self.total_price = float(total_price) if total_price else 0.0
        self.created_at = created_at

    def to_dict(self):
        return {
            "id": self.id,
            "product_name": self.product_name,
            "variant_details": self.variant_details,
            "total_price": self.total_price,
            "created_at": self.created_at
        }

class AdminDomain:
    def __init__(self, id=None, email=None, password_hash=None, role=None, created_at=None):
        self.id = id
        self.email = email
        self.password_hash = password_hash
        self.role = role
        self.created_at = created_at

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at
        }

class ReviewDomain:
    def __init__(self, id=None, reviewer_name=None, title_or_role=None, rating=5, comment=None, is_approved=True, created_at=None):
        self.id = id
        self.reviewer_name = reviewer_name
        self.title_or_role = title_or_role
        self.rating = int(rating)
        self.comment = comment
        self.is_approved = bool(is_approved)
        self.created_at = created_at

    def to_dict(self):
        return {
            "id": self.id,
            "reviewer_name": self.reviewer_name,
            "title_or_role": self.title_or_role,
            "rating": self.rating,
            "comment": self.comment,
            "is_approved": self.is_approved,
            "created_at": self.created_at
        }
