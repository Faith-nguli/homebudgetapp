import os
from flask import Blueprint, jsonify, request, current_app, send_from_directory
from werkzeug.utils import secure_filename
from models import db, Budget
from flask_jwt_extended import jwt_required, get_jwt_identity

budget_bp = Blueprint("budget_bp", __name__)

# Allowed Image Types
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}

# Ensure Upload Folder Exists
UPLOAD_FOLDER = "uploads/budget_images"
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)


def allowed_file(filename):
    """Check if the file has a valid extension."""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS





#  UPLOAD Budget Image
@budget_bp.route("/budgets/upload", methods=["POST"])
@jwt_required()
def upload_budget_image():
    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files["image"]

    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)

        # Generate Full Image URL
        server_url = request.host_url.rstrip("/")  # Ensure no trailing slash
        image_url = f"{server_url}/uploads/budget_images/{filename}"

        return jsonify({"message": "Image uploaded successfully!", "image_url": image_url}), 201

    return jsonify({"error": "Invalid file type. Allowed: png, jpg, jpeg"}), 400


#  SERVE Budget Image
@budget_bp.route("/uploads/budget_images/<filename>")
def serve_budget_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


@budget_bp.route('/budgets/<int:user_id>', methods=['GET'])
def get_budgets(user_id):
    budgets = Budget.query.filter_by(user_id=user_id).all()
    return jsonify([budget.to_dict() for budget in budgets])


