# src/views/schemas.py
import re

class ProductSchema:
    @staticmethod
    def validate_and_clean(json_data):
        errors = []
        name = json_data.get("name")
        price = json_data.get("price")
        category = json_data.get("category")

        if not name or not str(name).strip():
            errors.append("Product name is required.")
        if price is None:
            errors.append("Product price is required.")
        else:
            try:
                if float(price) < 0:
                    errors.append("Price cannot be a negative value.")
            except (ValueError, TypeError):
                errors.append("Price must be a valid numerical value.")

        if not category or not str(category).strip():
            errors.append("Product category field is required.")

        cleaned_data = {
            "name": str(name).strip() if name else None,
            "description": str(json_data.get("description", "")).strip(),
            "price": float(price) if price else 0.0,
            "category": str(category).strip() if category else None,
            "is_featured": bool(json_data.get("is_featured", False)),
            "is_out_of_stock": bool(json_data.get("is_out_of_stock", False)),
            "image_url": json_data.get("image_url")
        }

        return errors, cleaned_data


class AdminSchema:
    @staticmethod
    def validate_login(json_data):
        errors = []
        email = str(json_data.get("email", "")).strip()
        password = str(json_data.get("password", ""))

        if len(email) < 5:
            errors.append("Email must be at least 5 characters long.")
        
        email_regex = r"^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"
        if not re.match(email_regex, email):
            errors.append("Invalid email format. Email must contain letters, numbers, '@', and a valid domain extension like '.com'.")

        if len(password) <= 5:
            errors.append("Password must be more than 5 characters long.")
        if not any(char.isalpha() for char in password):
            errors.append("Password must contain at least one letter.")
        if not any(char.isdigit() for char in password):
            errors.append("Password must contain at least one number.")
        if not any(char in "!@#$%^&*()_+-=[]{}|;':\",./<>?" for char in password):
            errors.append("Password must contain at least one special character (e.g. !, @, #, $, %).")

        return errors, {"email": email, "password": password}


class ReviewSchema:
    @staticmethod
    def validate_and_clean(json_data):
        errors = []
        name = json_data.get("reviewer_name")
        rating = json_data.get("rating")
        comment = json_data.get("comment")

        if not name or not str(name).strip():
            errors.append("Reviewer name field is required.")
        if not comment or not str(comment).strip():
            errors.append("Review comment text is required.")
            
        try:
            rating_int = int(rating)
            if rating_int < 1 or rating_int > 5:
                errors.append("Rating score must be an integer index between 1 and 5.")
        except (ValueError, TypeError):
            errors.append("Rating parameter must be a valid numeric integer value.")

        cleaned_payload = {
            "reviewer_name": str(name).strip() if name else None,
            "title_or_role": str(json_data.get("title_or_role", "Healthcare Professional")).strip(),
            "rating": int(rating) if rating else 5,
            "comment": str(comment).strip() if comment else None,
            "is_approved": True
        }
        return errors, cleaned_payload
