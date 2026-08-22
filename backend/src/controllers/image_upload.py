import os
import time
import werkzeug
from flask import request
from flask_restful import Resource
from PIL import Image, UnidentifiedImageError
from src.models.database import supabase_client
from src.controllers.utilities import token_required
import logging

logger = logging.getLogger(__name__)

class AdminImageUploadResource(Resource):

    @token_required()
    def post(self, *args, **kwargs):

        try:

            allowed_folders = {
                "products",
                "packages"
            }

            requested_folder = request.form.get("folder", "products")

            if not isinstance(requested_folder, str):
                requested_folder = "products"

            target_bucket_folder = requested_folder.strip().lower()

            if target_bucket_folder not in allowed_folders:
                return {
                    "success": False,
                    "message": "Invalid image storage folder."
                }, 400


            if "image" not in request.files:
                return {
                    "success": False,
                    "message": "Missing mandatory 'image' file payload."
                }, 400

            uploaded_file = request.files["image"]


            raw_filename = uploaded_file.filename

            if not raw_filename:
                return {
                    "success": False,
                    "message": "Empty file name reference uploaded."
                }, 400

            if isinstance(raw_filename, tuple):
                raw_filename = (
                    str(raw_filename[0])
                    if raw_filename
                    else "uploaded_image"
                )

            clean_raw_filename = str(raw_filename).strip()

            if not clean_raw_filename:
                return {
                    "success": False,
                    "message": "Invalid image filename."
                }, 400


            allowed_extensions = {
                ".jpg",
                ".jpeg",
                ".png",
                ".webp"
            }

            file_extension = os.path.splitext(
                clean_raw_filename
            )[1].lower()

            if file_extension not in allowed_extensions:
                return {
                    "success": False,
                    "message": (
                        "Prohibited file extension. "
                        "Upload only JPG, JPEG, PNG, or WEBP images."
                    )
                }, 400


            max_file_size = 5 * 1024 * 1024

            uploaded_file.seek(0, os.SEEK_END)
            file_size_bytes = uploaded_file.tell()
            uploaded_file.seek(0)

            if file_size_bytes <= 0:
                return {
                    "success": False,
                    "message": "Uploaded image file is empty."
                }, 400

            if file_size_bytes > max_file_size:
                return {
                    "success": False,
                    "message": (
                        "File size exceeds the 5 MB safety limit."
                    )
                }, 400


            raw_binary_stream = uploaded_file.read()

            if not raw_binary_stream:
                return {
                    "success": False,
                    "message": "Unable to read uploaded image."
                }, 400


            allowed_mime_types = {
                ".jpg": "image/jpeg",
                ".jpeg": "image/jpeg",
                ".png": "image/png",
                ".webp": "image/webp"
            }

            expected_mime_type = allowed_mime_types[file_extension]

            received_mime_type = (
                uploaded_file.content_type or ""
            ).lower().strip()

            if received_mime_type != expected_mime_type:
                return {
                    "success": False,
                    "message": (
                        f"Invalid MIME type. Expected "
                        f"{expected_mime_type}."
                    )
                }, 400

            try:
                image = Image.open(
                    __import__("io").BytesIO(raw_binary_stream)
                )

                detected_format = (
                    image.format or ""
                ).upper()

                allowed_image_formats = {
                    "JPEG",
                    "PNG",
                    "WEBP"
                }

                if detected_format not in allowed_image_formats:
                    return {
                        "success": False,
                        "message": (
                            "Unsupported or invalid image format."
                        )
                    }, 400


                image.verify()

            except (UnidentifiedImageError, OSError, ValueError):
                return {
                    "success": False,
                    "message": (
                        "The uploaded file is not a valid or readable "
                        "image."
                    )
                }, 400

            finally:
                try:
                    image.close()
                except Exception:
                    pass


            extension_to_format = {
                ".jpg": "JPEG",
                ".jpeg": "JPEG",
                ".png": "PNG",
                ".webp": "WEBP"
            }

            expected_format = extension_to_format[file_extension]

            if detected_format != expected_format:
                return {
                    "success": False,
                    "message": (
                        "Image extension does not match the actual "
                        "image format."
                    )
                }, 400


            safe_original_filename = werkzeug.utils.secure_filename(
                clean_raw_filename
            )

            if not safe_original_filename:
                safe_original_filename = (
                    f"uploaded_image{file_extension}"
                )

            timestamp = int(time.time() * 1000)

            secure_clean_filename = (
                f"{timestamp}_{safe_original_filename}"
            )


            upload_result = (
                supabase_client
                .storage
                .from_(target_bucket_folder)
                .upload(
                    path=secure_clean_filename,
                    file=raw_binary_stream,
                    file_options={
                        "content-type": expected_mime_type,
                        "cache-control": "3600"
                    }
                )
            )


            if upload_result is None:
                raise RuntimeError(
                    "Supabase Storage did not return an upload result."
                )

            supabase_response_object = (
                supabase_client
                .storage
                .from_(target_bucket_folder)
                .get_public_url(secure_clean_filename)
            )

            if isinstance(supabase_response_object, str):

                clean_permanent_image_url = (
                    supabase_response_object
                )

            elif isinstance(supabase_response_object, dict):

                clean_permanent_image_url = (
                    supabase_response_object.get("publicUrl")
                    or
                    supabase_response_object.get("public_url")
                    or
                    supabase_response_object.get("publicURL")
                )

            elif hasattr(
                supabase_response_object,
                "public_url"
            ):

                clean_permanent_image_url = (
                    supabase_response_object.public_url
                )

            elif hasattr(
                supabase_response_object,
                "publicUrl"
            ):

                clean_permanent_image_url = (
                    supabase_response_object.publicUrl
                )

            else:

                clean_permanent_image_url = (
                    str(supabase_response_object)
                )

            if not clean_permanent_image_url:
                raise RuntimeError(
                    "Supabase Storage returned an empty public image URL."
                )

            public_asset_url = str(
                clean_permanent_image_url
            ).strip()

            if not public_asset_url:
                raise RuntimeError(
                    "Generated image URL is empty."
                )

            return {
                "success": True,
                "message": (
                    f"Image successfully stored inside the "
                    f"'{target_bucket_folder}' repository."
                ),
                "image_url": public_asset_url
            }, 201

        except Exception as e:

            logger.exception("Image upload failed.")

            return {
                "success": False,
                "message": (
                    "Server media upload failed. "
                    "Please try again."
                )
            }, 500