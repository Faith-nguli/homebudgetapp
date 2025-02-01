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


#  CREATE Budget with Image Support
@budget_bp.route("/budgets", methods=["POST"])
@jwt_required()
def create_budget():
    data = request.get_json()

    if not all(k in data for k in ["limit", "category"]):
        return jsonify({"error": "Fields 'limit' and 'category' are required."}), 400

    user_id = get_jwt_identity()
    current_spent = data.get("current_spent", 0.0)
    image_url = data.get("image_url", None)  # Default to None if no image is provided

    budget = Budget(
        limit=data["limit"],
        category=data["category"],
        user_id=user_id,
        current_spent=current_spent,
        image_url=image_url
    )

    db.session.add(budget)
    db.session.commit()

    return jsonify({
        "message": "Budget created successfully!",
        "budget": {
            "id": budget.id,
            "limit": budget.limit,
            "category": budget.category,
            "current_spent": budget.current_spent,
            "image_url": budget.image_url
        }
    }), 201


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


# GET all budgets (Filtered by User)
@budget_bp.route("/budgets", methods=["GET"])
@jwt_required()
def get_budgets():
    user_id = get_jwt_identity()
    budgets = Budget.query.filter_by(user_id=user_id).all()

    budget_list = [
        {
            "id": budget.id,
            "limit": budget.limit,
            "category": budget.category,
            "current_spent": budget.current_spent,
            "image_url": budget.image_url
        }
        for budget in budgets
    ]

    return jsonify(budget_list), 200


# GET Budget by ID
@budget_bp.route("/budgets/<int:budget_id>", methods=["GET"])
@jwt_required()
def get_budget(budget_id):
    budget = Budget.query.get_or_404(budget_id)
    user_id = get_jwt_identity()

    if budget.user_id != user_id:
        return jsonify({"error": "Unauthorized"}), 403

    return jsonify({
        "id": budget.id,
        "limit": budget.limit,
        "category": budget.category,
        "current_spent": budget.current_spent,
        "image_url": budget.image_url
    }), 200


# UPDATE Budget
@budget_bp.route("/budgets/<int:budget_id>", methods=["PATCH"])
@jwt_required()
def update_budget(budget_id):
    budget = Budget.query.get_or_404(budget_id)
    user_id = get_jwt_identity()

    if budget.user_id != user_id:
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()
    budget.limit = data.get("limit", budget.limit)
    budget.category = data.get("category", budget.category)
    budget.current_spent = data.get("current_spent", budget.current_spent)
    budget.image_url = data.get("image_url", budget.image_url)

    db.session.commit()

    return jsonify({
        "message": "Budget updated successfully!",
        "budget": {
            "id": budget.id,
            "limit": budget.limit,
            "category": budget.category,
            "current_spent": budget.current_spent,
            "image_url": budget.image_url
        }
    }), 200


# DELETE Budget
@budget_bp.route("/budgets/<int:budget_id>", methods=["DELETE"])
@jwt_required()
def delete_budget(budget_id):
    budget = Budget.query.get_or_404(budget_id)
    user_id = get_jwt_identity()

    if budget.user_id != user_id:
        return jsonify({"error": "Unauthorized"}), 403

    db.session.delete(budget)
    db.session.commit()

    return jsonify({"message": "Budget deleted successfully!"}), 200
