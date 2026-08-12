# 🩺 Scrub Point Full-Stack API Contract Documentation

This document serves as the absolute engineering source of truth mapping out communication contracts across our Flask API architecture endpoints.

## 🌍 Base URL
Development:
http://127.0.0.1:5000

Production:
https://backend-name.onrender.com
---

## 👥 Customer-Facing Public Endpoints (No Authentication Required)

### 1. View / Search / Filter Products Catalog
* **URL:** `/api/products`
* **Method:** `GET`
* **Query Parameters:** (Optional)
  * `search`: Filters product matches by name character string matching. (e.g. `?search=scrub`)
  * `category`: Filters items matching exact group names. (e.g. `?category=Medical Books`)
  * `page`: Numeric index for pagination window block offsets. (Defaults to `1`)
  * `limit`: Structural constraints size cap array limit. (Defaults to `20`)
* **Success Response:** `200 OK`
* **Response Body Example:**
```json
{
  "success": true,
  "message": "Products fetched successfully.",
  "data": [
    {
      "id": 1,
      "name": "Premium V-Neck Scrub",
      "description": "Breathable utility uniform fabric.",
      "price": 2500.00,
      "category": "Scrubs",
      "is_featured": true,
      "is_out_of_stock": false,
      "image_url": "https://example.com"
    }
  ]
}
```

### 2. Log a WhatsApp Click Intent
* **URL:** `/api/orders`
* **Method:** `POST`
* **Headers:** `Content-Type: application/json`
* **Body:**
```json
{
  "product_name": "Premium V-Neck Scrub",
  "variant_details": "Size: L, Color: Navy Blue",
  "total_price": 2500.00
}
```
* **Success Response:** `201 Created`

### 3. Fetch Approved Client Reviews
* **URL:** `/api/reviews`
* **Method:** `GET`
* **Success Response:** `200 OK`

### 4. Submit a Customer Review Feedback
* **URL:** `/api/reviews`
* **Method:** `POST`
* **Body:**
```json
{
  "reviewer_name": "Dr. Abubakar Farah",
  "title_or_role": "Chief Surgeon",
  "rating": 5,
  "comment": "Exceptional clothing grade durability!"
}
```
* **Success Response:** `201 Created`

---

## 🛡️ Guarded Admin Dashboard Endpoints (Secure Bearer Token Required)
*All routes below require an HTTP header configured with your login token:*
`Authorization: Bearer <your_jwt_token_string>`

### 5. Admin Portal Authentication
* **URL:** `/api/admin/login`
* **Method:** `POST`
* **Body:**
```json
{
  "email": "<ADMIN_EMAIL>",
  "password": "<ADMIN_PASSWORD>"
}
```
* **Success Response:** `200 OK`
* **Output Payload:** Returns authorization access string token needed to interact with guarded admin settings.

### 6. Create / Publish a New Product Record
* **URL:** `/api/products`
* **Method:** `POST`
* **Body:** Same JSON schema parameters format used to query product metrics catalogs.
* **Success Response:** `201 Created`

### 7. Modify Product Attributes Matrix
* **URL:** `/api/products/<int:product_id>`
* **Method:** `PUT`
* **Success Response:** `200 OK`

### 8. Drop Product Visibility (Soft Delete Routing Logic)
* **URL:** `/api/products/<int:product_id>`
* **Method:** `DELETE`
* **Success Response:** `200 OK`

### 9. Sync Live Store Checkouts Analytics Queue
* **URL:** `/api/orders`
* **Method:** `GET`
* **Success Response:** `200 OK`

### 10. Register Sub-Admin Staff Users Matrix
* **URL:** `/api/admin/staff`
* **Method:** `POST`
* **Access Scope Restrictions:** Blocked to regular employees. Strictly authorized to `Super Admin` profile users.
* **Success Response:** `201 Created`
