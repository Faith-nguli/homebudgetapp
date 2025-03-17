import os
import traceback
from flask import Blueprint, jsonify, request, send_from_directory
from werkzeug.utils import secure_filename
from models import db, Budget
from flask_jwt_extended import jwt_required, get_jwt_identity

# Initialize Blueprint
budget_bp = Blueprint("budget_bp", __name__)

# Allowed Image Types
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}
UPLOAD_FOLDER = "uploads/budget_images"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)  # Ensure upload directory exists


def allowed_file(filename):
    """Check if the file has a valid extension."""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def format_budget(budget):
    """Helper function to format budget response."""
    return {
        "id": budget.id,
        "category": budget.category,
        "limit": budget.limit,
        "user_id": budget.user_id,
        "image_url": budget.image_url
    }


# ✅ **Create Budget**
@budget_bp.route('/budgets', methods=['POST'])
@jwt_required()
def create_budget():
    try:
        data = request.get_json()
        current_user_id = get_jwt_identity()

        if not data.get('category') or not data.get('limit'):
            return jsonify({"error": "Category and limit are required"}), 422

        budget = Budget(
            category=data['category'],
            limit=float(data['limit']),
            user_id=current_user_id,
            image_url=data.get('image_url')
        )

        db.session.add(budget)
        db.session.commit()
        return jsonify({"message": "Budget created successfully!"}), 201

    except ValueError:
        return jsonify({"error": "Invalid number format for limit"}), 422
    except Exception as e:
        traceback.print_exc()  # Print full error in console
        return jsonify({"error": f"Database error: {str(e)}"}), 500

# ✅ **Fetch Budgets for Logged-in User**
@budget_bp.route("/budgets", methods=["GET"])
@jwt_required()
def get_budgets():
    try:
        user_id = get_jwt_identity()
        budgets = Budget.query.filter_by(user_id=user_id).all()
        return jsonify([budget.to_dict() for budget in budgets]), 200
    except Exception as e:
        print(f"Error fetching budgets: {str(e)}")  # Debugging output
        return jsonify({"error": "Internal Server Error"}), 500



# ✅ **Fetch a Single Budget by ID**

@budget_bp.route("/budgets/<int:budget_id>", methods=["GET"])
@jwt_required()
def get_budget(budget_id):
    # Get the budget
    budget = Budget.query.get_or_404(budget_id)

    # Get the JWT identity (should be user ID)
    user_id = get_jwt_identity()
    print(f"JWT Identity: {user_id}, Budget User ID: {budget.user_id}")  # Debugging

    # Ensure the user is authorized
    if budget.user_id != int(user_id):  # Convert user_id to int if necessary
        return jsonify({"error": "Unauthorized"}), 403

    return jsonify(format_budget(budget)), 200

    def format_budget(budget):
        return {
        "id": budget.id,
        "category": budget.category,
        "limit": budget.limit,
        "current_spent": budget.current_spent,
        "user_id": budget.user_id,
        "image_url": budget.image_url,
    }



# ✅ **Update Budget**
@budget_bp.route('/budgets/<int:budget_id>', methods=['PUT'])
@jwt_required()
def update_budget(budget_id):
    budget = Budget.query.get_or_404(budget_id)
    if budget.user_id != get_jwt_identity():
        return jsonify({"error": "Unauthorized"}), 403

    try:
        data = request.get_json()
        budget.category = data.get('category', budget.category)
        budget.limit = float(data.get('limit', budget.limit))
        budget.image_url = data.get('image_url', budget.image_url)

        db.session.commit()
        return jsonify(format_budget(budget)), 200

    except ValueError:
        return jsonify({"error": "Invalid number format for limit"}), 422
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500


# ✅ **Delete Budget**
@budget_bp.route('/budgets/<int:budget_id>', methods=['DELETE'])
@jwt_required()
def delete_budget(budget_id):
    budget = Budget.query.get_or_404(budget_id)
    if budget.user_id != get_jwt_identity():
        return jsonify({"error": "Unauthorized"}), 403

    db.session.delete(budget)
    db.session.commit()
    return jsonify({"message": "Budget deleted successfully"}), 200


# ✅ **Upload Budget Image**
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
        server_url = request.host_url.rstrip("/")
        image_url = f"{server_url}/uploads/budget_images/{filename}"

        return jsonify({"message": "Image uploaded successfully!", "image_url": image_url}), 201

    return jsonify({"error": "Invalid file type. Allowed: png, jpg, jpeg"}), 400


# ✅ **Serve Budget Image**
@budget_bp.route("/uploads/budget_images/<filename>")
def serve_budget_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


# ✅ **Fetch Budgets by User ID (Admin/Optional Public Route)**
@budget_bp.route('/user/<int:user_id>/budgets', methods=['GET'])
@jwt_required()
def get_user_budgets_by_id(user_id):
    """Admin can fetch budgets by user ID, ensuring access control."""
    current_user_id = get_jwt_identity()
    
    # OPTIONAL: Ensure only admin users can fetch others' budgets
    if current_user_id != user_id:  
        return jsonify({'msg': 'Unauthorized'}), 403

    budgets = Budget.query.filter_by(user_id=user_id).all()
    return jsonify([format_budget(budget) for budget in budgets]), 200
