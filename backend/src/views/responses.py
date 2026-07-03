# src/views/responses.py
class ApiResponse:
    @staticmethod
    def success(data=None, message="Operation completed successfully", status_code=200):
        response_payload = {
            "success": True,
            "message": message,
            "data": data
        }
        return response_payload, status_code

    @staticmethod
    def error(message="An error occurred processing your request", status_code=400, errors=None):
        response_payload = {
            "success": False,
            "message": message,
            "errors": errors if errors else []
        }
        return response_payload, status_code
