from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity 
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User
from flask_mail import Message

user_bp = Blueprint("user_bp", __name__)

@user_bp.route("/user", methods=["POST"])
def add_user():
    data = request.get_json()
    print("Received Data:", request.get_json())
    
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    # Validate required fields
    if not username or not email or not password:
        return jsonify({"message": "Missing fields"}), 400

    # Check if the email already exists
    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email already exists"}), 400

    # Hash the password before storing it
    hashed_password = generate_password_hash(password)
    new_user = User(username=username, email=email, password=hashed_password)
    
    db.session.add(new_user)
    db.session.commit()

    return jsonify({
        "message": "User added successfully!",
        "user": {
            "username": new_user.username,
            "email": new_user.email
        }
    }), 201

# Get all users (GET /users) - Admin only
@user_bp.route("/user", methods=["GET"])
@jwt_required()
def get_users():
    users = User.query.all()
    user_list = [{"id": user.id, "username": user.username, "email": user.email} for user in users]
    return jsonify(user_list), 200

# Get current user (GET /current_user)
@user_bp.route("/user", methods=["GET"])
@jwt_required()
def current_user():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    return jsonify({"id": user.id, "username": user.username, "email": user.email}), 200

# Update user profile (PATCH /user)
@user_bp.route("/user/<int:user_id>", methods=["PATCH"])
@jwt_required()
def update_user(user_id):
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    data = request.get_json()

    user.username = data.get("username", user.username)
    user.email = data.get("email", user.email)
    if "password" in data:
        user.password = generate_password_hash(data["password"])
    db.session.commit()
    return jsonify({"message": "Profile updated successfully!"}), 200

# Update user password (PATCH /user/updatepassword)
@user_bp.route("/user/updatepassword", methods=["PATCH"])
@jwt_required()
def update_password():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    if not check_password_hash(user.password, data["current_password"]):
        return jsonify({"error": "Incorrect current password"}), 400
    user.password = generate_password_hash(data["new_password"])
    db.session.commit()
    return jsonify({"message": "Password updated successfully!"}), 200

# Fetch user by ID (GET /user/<int:user_id>) - Admin only
@user_bp.route("/user/<int:user_id>", methods=["GET"])
@jwt_required()
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify({"id": user.id, "username": user.username, "email": user.email}), 200

# Delete user by ID (DELETE /user/<int:user_id>) - Admin only
@user_bp.route("/user/<int:user_id>", methods=["DELETE"])
@jwt_required()
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted"}), 200