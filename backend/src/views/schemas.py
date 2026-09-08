import math
import re
from urllib.parse import urlparse

def _is_strict_number(value):
    return (
        not isinstance(value, bool)
        and isinstance(value, (int, float))
        and math.isfinite(value)
    )


def _is_strict_int(value):
    return not isinstance(value, bool) and isinstance(value, int)


def _is_http_url(value):
    if not isinstance(value, str):
        return False

    try:
        parsed = urlparse(value.strip())
        return parsed.scheme in {"http", "https"} and bool(parsed.netloc)
    except (TypeError, ValueError):
        return False


class ProductSchema:
    @staticmethod
    def validate_and_clean(json_data):
        if not isinstance(json_data, dict):
            return ["Request body must be a JSON object."], {}

        errors = []

        name = json_data.get("name")
        description = json_data.get("description", "")
        price = json_data.get("price")
        category = json_data.get("category")
        image_url = json_data.get("image_url", "")
        stock_quantity = json_data.get("stock_quantity", 10)
        sizes_available = json_data.get("sizes_available", "")
        colors_available = json_data.get("colors_available", "")

        if not isinstance(name, str) or not name.strip():
            errors.append("Product name is required and must be text.")
        elif not 2 <= len(name.strip()) <= 150:
            errors.append("Product name must be between 2 and 150 characters.")

        if not _is_strict_number(price):
            errors.append("Product price must be a valid number.")
        elif price < 0 or price > 10_000_000:
            errors.append("Product price must be between 0 and 10,000,000.")

        if not isinstance(category, str) or not category.strip():
            errors.append("Product category is required and must be text.")
        elif not 2 <= len(category.strip()) <= 100:
            errors.append("Category must be between 2 and 100 characters.")

        if not isinstance(description, str):
            errors.append("Description must be text.")
        elif len(description.strip()) > 5000:
            errors.append("Description cannot exceed 5000 characters.")

        if image_url not in ("", None):
            if not _is_http_url(image_url):
                errors.append("Image URL must be a valid HTTP or HTTPS URL.")
            elif len(image_url.strip()) > 2000:
                errors.append("Image URL is too long.")

        if not _is_strict_int(stock_quantity):
            errors.append("Stock quantity must be a whole number.")
        elif stock_quantity < 0 or stock_quantity > 1_000_000:
            errors.append("Stock quantity is outside the allowed range.")

        for field_name, value, label in (
            ("sizes_available", sizes_available, "Sizes"),
            ("colors_available", colors_available, "Colors"),
        ):
            if value not in ("", None):
                if not isinstance(value, str):
                    errors.append(f"{label} must be text.")
                elif len(value.strip()) > 1000:
                    errors.append(f"{label} cannot exceed 1000 characters.")

        boolean_fields = (
            "is_featured",
            "is_out_of_stock",
            "is_on_offer",
            "is_student_package",
        )

        for field in boolean_fields:
            if field in json_data and not isinstance(json_data[field], bool):
                errors.append(f"{field} must be true or false.")

        discount_price = json_data.get("discount_price")
        if discount_price is not None:
            if not _is_strict_number(discount_price):
                errors.append("Discount price must be a valid number.")
            elif discount_price < 0 or discount_price > 10_000_000:
                errors.append("Discount price is outside the allowed range.")
            elif _is_strict_number(price) and discount_price > price:
                errors.append("Discount price cannot exceed the normal price.")

        date_time_fields = (
            "package_start_date",
            "package_end_date",
            "package_start_time",
            "package_end_time",
        )

        for field in date_time_fields:
            value = json_data.get(field)
            if value is not None and not isinstance(value, str):
                errors.append(f"{field} must be text or null.")
            elif isinstance(value, str) and len(value) > 50:
                errors.append(f"{field} is too long.")

        if errors:
            return errors, {}

        cleaned_data = {
            "name": name.strip(),
            "description": description.strip(),
            "price": float(price),
            "category": category.strip(),
            "image_url": image_url.strip() if isinstance(image_url, str) else "",
            "stock_quantity": stock_quantity,
            "sizes_available": sizes_available.strip() if isinstance(sizes_available, str) else "",
            "colors_available": colors_available.strip() if isinstance(colors_available, str) else "",
            "is_featured": json_data.get("is_featured", False),
            "is_out_of_stock": json_data.get("is_out_of_stock", False),
            "is_on_offer": json_data.get("is_on_offer", False),
            "discount_price": float(discount_price) if discount_price is not None else None,
            "is_student_package": json_data.get("is_student_package", False),
            "package_start_date": json_data.get("package_start_date"),
            "package_end_date": json_data.get("package_end_date"),
            "package_start_time": json_data.get("package_start_time"),
            "package_end_time": json_data.get("package_end_time"),
        }

        return [], cleaned_data

    @staticmethod
    def validate_update(json_data):
        if not isinstance(json_data, dict):
            return ["Request body must be a JSON object."], {}

        allowed_fields = {
            "name",
            "price",
            "description",
            "category",
            "image_url",
            "stock_quantity",
            "sizes_available",
            "colors_available",
            "is_out_of_stock",
            "is_featured",
            "is_on_offer",
            "discount_price",
            "is_student_package",
            "package_start_date",
            "package_end_date",
            "package_start_time",
            "package_end_time",
        }

        supplied = {
            key: value
            for key, value in json_data.items()
            if key in allowed_fields
        }

        if not supplied:
            return ["No valid product fields supplied."], {}

        errors = []
        cleaned = {}

        text_fields = {
            "name": (2, 150),
            "category": (2, 100),
            "description": (0, 5000),
            "sizes_available": (0, 1000),
            "colors_available": (0, 1000),
        }

        for field, (minimum, maximum) in text_fields.items():
            if field not in supplied:
                continue

            value = supplied[field]

            if not isinstance(value, str):
                errors.append(f"{field} must be text.")
                continue

            value = value.strip()

            if len(value) < minimum or len(value) > maximum:
                errors.append(
                    f"{field} must be between {minimum} and {maximum} characters."
                )
                continue

            cleaned[field] = value

        for field in ("price", "discount_price"):
            if field not in supplied:
                continue

            value = supplied[field]

            if field == "discount_price" and value is None:
                cleaned[field] = None
                continue

            if not _is_strict_number(value):
                errors.append(f"{field} must be a valid number.")
                continue

            if value < 0 or value > 10_000_000:
                errors.append(f"{field} is outside the allowed range.")
                continue

            cleaned[field] = float(value)

        if "stock_quantity" in supplied:
            value = supplied["stock_quantity"]

            if not _is_strict_int(value):
                errors.append("stock_quantity must be a whole number.")
            elif value < 0 or value > 1_000_000:
                errors.append("stock_quantity is outside the allowed range.")
            else:
                cleaned["stock_quantity"] = value

        for field in (
            "is_out_of_stock",
            "is_featured",
            "is_on_offer",
            "is_student_package",
        ):
            if field not in supplied:
                continue

            value = supplied[field]

            if not isinstance(value, bool):
                errors.append(f"{field} must be true or false.")
            else:
                cleaned[field] = value

        if "image_url" in supplied:
            value = supplied["image_url"]

            if value in ("", None):
                cleaned["image_url"] = ""
            elif not _is_http_url(value):
                errors.append("image_url must be a valid HTTP or HTTPS URL.")
            elif len(value.strip()) > 2000:
                errors.append("image_url is too long.")
            else:
                cleaned["image_url"] = value.strip()

        for field in (
            "package_start_date",
            "package_end_date",
            "package_start_time",
            "package_end_time",
        ):
            if field not in supplied:
                continue

            value = supplied[field]

            if value is None:
                cleaned[field] = None
            elif not isinstance(value, str):
                errors.append(f"{field} must be text or null.")
            elif len(value) > 50:
                errors.append(f"{field} is too long.")
            else:
                cleaned[field] = value

        if errors:
            return errors, {}

        return [], cleaned

class AdminSchema:
    @staticmethod
    def validate_login(json_data):
        if not isinstance(json_data, dict):
            return ["Request body must be a JSON object."], {
                "email": "",
                "password": "",
            }

        errors = []

        raw_email = json_data.get("email", "")
        raw_password = json_data.get("password", "")

        if not isinstance(raw_email, str):
            errors.append("Email must be text.")
            email = ""
        else:
            email = raw_email.strip()

        if not isinstance(raw_password, str):
            errors.append("Password must be text.")
            password = ""
        else:
            password = raw_password

        if len(email) < 8 or len(email) > 254:
            errors.append("Email must be between 8 and 254 characters.")

        email_regex = (
            r"^(?=.*[A-Za-z])(?=.*\d)"
            r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"
        )

        if email and not re.fullmatch(email_regex, email):
            errors.append("Invalid email format.")

        if len(password) < 6 or len(password) > 128:
            errors.append("Password must be between 6 and 128 characters.")

        if password and not any(char.isalpha() for char in password):
            errors.append("Password must contain at least one letter.")

        if password and not any(char.isdigit() for char in password):
            errors.append("Password must contain at least one number.")

        special_chars = "!@#$%^&*()_+-=[]{}|;':\",./<>?"
        if password and not any(char in special_chars for char in password):
            errors.append("Password must contain at least one special character.")

        return errors, {"email": email, "password": password}


class ReviewSchema:
    @staticmethod
    def validate_and_clean(json_data):
        if not isinstance(json_data, dict):
            return ["Request body must be a JSON object."], {}

        errors = []

        name = json_data.get("reviewer_name")
        contact = json_data.get("reviewer_contact")
        rating = json_data.get("rating")
        comment = json_data.get("comment")
        title_or_role = json_data.get(
            "title_or_role",
            "Healthcare Professional",
        )

        if not isinstance(name, str) or not name.strip():
            errors.append("Reviewer name is required and must be text.")
        elif not 2 <= len(name.strip()) <= 100:
            errors.append("Reviewer name must be between 2 and 100 characters.")

        if not isinstance(comment, str) or not comment.strip():
            errors.append("Review comment is required and must be text.")
        elif len(comment.strip()) > 1000:
            errors.append("Review comment cannot exceed 1000 characters.")

        if contact not in (None, ""):
            if not isinstance(contact, str):
                errors.append("Reviewer contact must be text.")
            elif len(contact.strip()) > 100:
                errors.append("Reviewer contact cannot exceed 100 characters.")

        if not _is_strict_int(rating):
            errors.append("Rating must be a whole number between 1 and 5.")
        elif rating < 1 or rating > 5:
            errors.append("Rating must be between 1 and 5.")

        if not isinstance(title_or_role, str):
            errors.append("Title or role must be text.")
        elif not title_or_role.strip() or len(title_or_role.strip()) > 100:
            errors.append("Title or role must be between 1 and 100 characters.")

        if errors:
            return errors, {}

        cleaned_payload = {
            "reviewer_name": name.strip(),
            "reviewer_contact": (
                contact.strip()
                if isinstance(contact, str) and contact.strip()
                else "Not provided"
            ),
            "title_or_role": title_or_role.strip(),
            "rating": rating,
            "comment": comment.strip(),
            "is_approved": True,
        }

        return [], cleaned_payload
class OrderSchema:
    @staticmethod
    def validate_and_clean(json_data):
        if not isinstance(json_data, dict):
            return ["Request body must be a JSON object."], {}

        errors = []

        product_name = json_data.get("product_name")
        product_id = json_data.get("product_id")
        package_id = json_data.get("package_id")
        quantity = json_data.get("quantity", 1)
        variant_details = json_data.get(
            "variant_details",
            "No variants selected",
        )
        total_price = json_data.get("total_price")

        if not isinstance(product_name, str) or not product_name.strip():
            errors.append("Product name is required and must be text.")
        elif len(product_name.strip()) > 200:
            errors.append("Product name cannot exceed 200 characters.")

        def clean_positive_id(value, label):
            if value is None:
                return None

            if isinstance(value, bool):
                errors.append(f"{label} must be a positive integer.")
                return None

            if isinstance(value, int):
                parsed = value
            elif isinstance(value, str) and value.strip().isdigit():
                parsed = int(value.strip())
            else:
                errors.append(f"{label} must be a positive integer.")
                return None

            if parsed < 1:
                errors.append(f"{label} must be a positive integer.")
                return None

            return parsed

        clean_product_id = clean_positive_id(product_id, "Product ID")
        clean_package_id = clean_positive_id(package_id, "Package ID")

        if clean_product_id is None and clean_package_id is None:
            errors.append("Either product_id or package_id is required.")

        if clean_product_id is not None and clean_package_id is not None:
            errors.append("An order cannot contain both product_id and package_id.")

        if not _is_strict_int(quantity):
            errors.append("Quantity must be a whole number.")
        elif quantity < 1 or quantity > 100:
            errors.append("Quantity must be between 1 and 100.")

        if not isinstance(variant_details, str):
            errors.append("Variant details must be text.")
        elif len(variant_details.strip()) > 1000:
            errors.append("Variant details cannot exceed 1000 characters.")

        if not _is_strict_number(total_price):
            errors.append("Total price must be a valid number.")
        elif total_price < 0 or total_price > 100_000_000:
            errors.append("Total price is outside the allowed range.")

        if errors:
            return errors, {}

        cleaned_payload = {
            "product_name": product_name.strip(),
            "product_id": clean_product_id,
            "package_id": clean_package_id,
            "quantity": quantity,
            "variant_details": (
                variant_details.strip()
                or "No variants selected"
            ),
            "total_price": float(total_price),
        }

        return [], cleaned_payload

class PackageSchema:
    ALLOWED_FIELDS = {
        "name",
        "description",
        "price",
        "stock_quantity",
        "products_summary",
        "image_url",
        "is_time_limited",
        "available_from_date",
        "available_until_date",
        "available_until_time",
    }

    @staticmethod
    def validate_and_clean(json_data, partial=False):
        if not isinstance(json_data, dict):
            return ["Request body must be a JSON object."], {}

        errors = []
        cleaned = {}

        supplied = {
            key: value
            for key, value in json_data.items()
            if key in PackageSchema.ALLOWED_FIELDS
        }

        if partial and not supplied:
            return ["No valid package fields supplied."], {}

        if not partial:
            for required in ("name", "price", "products_summary"):
                if required not in json_data:
                    errors.append(f"{required} is required.")

        if "name" in supplied:
            value = supplied["name"]
            if not isinstance(value, str):
                errors.append("Package name must be text.")
            elif not 2 <= len(value.strip()) <= 150:
                errors.append(
                    "Package name must be between 2 and 150 characters."
                )
            else:
                cleaned["name"] = value.strip()

        if "description" in supplied:
            value = supplied["description"]
            if not isinstance(value, str):
                errors.append("Package description must be text.")
            elif len(value.strip()) > 5000:
                errors.append(
                    "Package description cannot exceed 5000 characters."
                )
            else:
                cleaned["description"] = value.strip()
        elif not partial:
            cleaned["description"] = ""

        if "price" in supplied:
            value = supplied["price"]
            if not _is_strict_number(value):
                errors.append("Package price must be a valid number.")
            elif value <= 0 or value > 10_000_000:
                errors.append(
                    "Package price must be greater than 0 and no more than 10,000,000."
                )
            else:
                cleaned["price"] = float(value)

        if "stock_quantity" in supplied:
            value = supplied["stock_quantity"]
            if not _is_strict_int(value):
                errors.append("Package stock quantity must be a whole number.")
            elif value < 0 or value > 1_000_000:
                errors.append(
                    "Package stock quantity is outside the allowed range."
                )
            else:
                cleaned["stock_quantity"] = value
        elif not partial:
            cleaned["stock_quantity"] = 0

        if "products_summary" in supplied:
            value = supplied["products_summary"]

            if not isinstance(value, list):
                errors.append("products_summary must be a list.")
            elif not value:
                errors.append(
                    "A package must contain at least one product."
                )
            elif len(value) > 100:
                errors.append(
                    "A package cannot contain more than 100 product entries."
                )
            else:
                cleaned_components = []
                seen_product_ids = set()

                for index, component in enumerate(value):
                    if not isinstance(component, dict):
                        errors.append(
                            f"Package item {index + 1} must be an object."
                        )
                        continue

                    product_id = component.get("product_id")
                    quantity = component.get("quantity")

                    if (
                        not _is_strict_int(product_id)
                        or product_id < 1
                    ):
                        errors.append(
                            f"Package item {index + 1} has an invalid product_id."
                        )

                    if (
                        not _is_strict_int(quantity)
                        or quantity < 1
                        or quantity > 100
                    ):
                        errors.append(
                            f"Package item {index + 1} quantity must be between 1 and 100."
                        )

                    if (
                        _is_strict_int(product_id)
                        and product_id > 0
                    ):
                        if product_id in seen_product_ids:
                            errors.append(
                                f"Duplicate product_id {product_id} in package."
                            )
                        else:
                            seen_product_ids.add(product_id)

                    if (
                        _is_strict_int(product_id)
                        and product_id > 0
                        and _is_strict_int(quantity)
                        and 1 <= quantity <= 100
                    ):
                        cleaned_components.append({
                            "product_id": product_id,
                            "quantity": quantity,
                        })

                if not errors:
                    cleaned["products_summary"] = cleaned_components

        if "image_url" in supplied:
            value = supplied["image_url"]

            if value in ("", None):
                cleaned["image_url"] = ""
            elif not _is_http_url(value):
                errors.append(
                    "Package image URL must be a valid HTTP or HTTPS URL."
                )
            elif len(value.strip()) > 2000:
                errors.append("Package image URL is too long.")
            else:
                cleaned["image_url"] = value.strip()
        elif not partial:
            cleaned["image_url"] = ""

        if "is_time_limited" in supplied:
            value = supplied["is_time_limited"]
            if not isinstance(value, bool):
                errors.append("is_time_limited must be true or false.")
            else:
                cleaned["is_time_limited"] = value
        elif not partial:
            cleaned["is_time_limited"] = False

        for field in (
            "available_from_date",
            "available_until_date",
            "available_until_time",
        ):
            if field not in supplied:
                if not partial:
                    cleaned[field] = None
                continue

            value = supplied[field]

            if value in ("", None):
                cleaned[field] = None
            elif not isinstance(value, str):
                errors.append(f"{field} must be text or null.")
            elif len(value.strip()) > 50:
                errors.append(f"{field} is too long.")
            else:
                cleaned[field] = value.strip()

        if errors:
            return errors, {}

        return [], cleaned

class ContactMessageSchema:
    @staticmethod
    def validate_and_clean(json_data):
        if not isinstance(json_data, dict):
            return ["Request body must be a JSON object."], {}

        errors = []

        name = json_data.get("name")
        message = json_data.get("message")

        if not isinstance(name, str):
            errors.append("Name must be text.")
        elif not 2 <= len(name.strip()) <= 100:
            errors.append("Name must be between 2 and 100 characters.")

        if not isinstance(message, str):
            errors.append("Message must be text.")
        elif not 1 <= len(message.strip()) <= 3000:
            errors.append(
                "Message must be between 1 and 3000 characters."
            )

        if errors:
            return errors, {}

        return [], {
            "name": name.strip(),
            "message": message.strip(),
        }


class PasswordSchema:
    @staticmethod
    def validate(json_data):
        if not isinstance(json_data, dict):
            return ["Request body must be a JSON object."], None

        password = json_data.get("password")
        errors = []

        if not isinstance(password, str):
            errors.append("Password must be text.")
            return errors, None

        if len(password) < 8 or len(password) > 128:
            errors.append(
                "Password must be between 8 and 128 characters."
            )

        if password and not any(c.isalpha() for c in password):
            errors.append("Password must contain at least one letter.")

        if password and not any(c.isdigit() for c in password):
            errors.append("Password must contain at least one number.")

        special_chars = "!@#$%^&*()_+-=[]{}|;':\",./<>?"

        if password and not any(c in special_chars for c in password):
            errors.append(
                "Password must contain at least one special character."
            )

        if errors:
            return errors, None

        return [], password


class WalkInOrderSchema:
    PHONE_PATTERN = re.compile(r"^\+?[0-9][0-9 ()-]{5,29}$")

    @staticmethod
    def validate_and_clean(json_data):
        if not isinstance(json_data, dict):
            return ["Request body must be a JSON object."], {}

        errors = []

        customer_name = json_data.get("customer_name")
        customer_phone = json_data.get("customer_phone")
        items = json_data.get("items")

        if not isinstance(customer_name, str):
            errors.append("Customer name must be text.")
        elif not 1 <= len(customer_name.strip()) <= 100:
            errors.append(
                "Customer name must be between 1 and 100 characters."
            )

        if not isinstance(customer_phone, str):
            errors.append("Customer phone must be text.")
        elif not WalkInOrderSchema.PHONE_PATTERN.fullmatch(
            customer_phone.strip()
        ):
            errors.append("Customer phone format is invalid.")

        cleaned_items = []

        if not isinstance(items, list):
            errors.append("Items must be provided as a list.")
        elif not items:
            errors.append("Walk-in order must contain at least one item.")
        elif len(items) > 100:
            errors.append(
                "Walk-in order cannot contain more than 100 item entries."
            )
        else:
            seen_product_ids = set()

            for index, item in enumerate(items):
                if not isinstance(item, dict):
                    errors.append(
                        f"Item {index + 1} must be an object."
                    )
                    continue

                product_id = item.get("product_id")
                quantity = item.get("quantity", 1)
                size = item.get("size")
                color = item.get("color")

                if (
                    not _is_strict_int(product_id)
                    or product_id < 1
                ):
                    errors.append(
                        f"Item {index + 1} has an invalid product_id."
                    )

                if (
                    not _is_strict_int(quantity)
                    or quantity < 1
                    or quantity > 100
                ):
                    errors.append(
                        f"Item {index + 1} quantity must be a whole number between 1 and 100."
                    )

                for field_name, value in (
                    ("size", size),
                    ("color", color),
                ):
                    if value is not None and not isinstance(value, str):
                        errors.append(
                            f"Item {index + 1} {field_name} must be text or null."
                        )
                    elif (
                        isinstance(value, str)
                        and len(value.strip()) > 100
                    ):
                        errors.append(
                            f"Item {index + 1} {field_name} cannot exceed 100 characters."
                        )

                if (
                    _is_strict_int(product_id)
                    and product_id > 0
                ):
                    if product_id in seen_product_ids:
                        errors.append(
                            f"Duplicate product_id {product_id} in walk-in order."
                        )
                    else:
                        seen_product_ids.add(product_id)

                if (
                    _is_strict_int(product_id)
                    and product_id > 0
                    and _is_strict_int(quantity)
                    and 1 <= quantity <= 100
                ):
                    cleaned_items.append({
                        "product_id": product_id,
                        "quantity": quantity,
                        "size": (
                            size.strip()
                            if isinstance(size, str) and size.strip()
                            else None
                        ),
                        "color": (
                            color.strip()
                            if isinstance(color, str) and color.strip()
                            else None
                        ),
                    })

        if errors:
            return errors, {}

        return [], {
            "customer_name": customer_name.strip(),
            "customer_phone": customer_phone.strip(),
            "items": cleaned_items,
        }