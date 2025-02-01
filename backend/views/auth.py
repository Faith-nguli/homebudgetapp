from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash, generate_password_hash
from flask_jwt_extended import create_access_token, get_jwt_identity, get_jwt, jwt_required
from flask_mail import Message
from models import db, User, TokenBlocklist

auth_bp = Blueprint("auth_bp", __name__)

@auth_bp.route("/user", methods=['POST'])
def create_user():
    from app import mail
    data = request.get_json()
    
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({"success": False, "error": "Missing required fields"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"success": False, "error": "Username already exists"}), 400
    
    if User.query.filter_by(email=email).first():
        return jsonify({"success": False, "error": "Email already exists"}), 400

    if len(password) < 8:
        return jsonify({"success": False, "error": "Password must be at least 8 characters long"}), 400

    try:
        hashed_password = generate_password_hash(password)
        new_user = User(username=username, email=email, password=hashed_password)
        db.session.add(new_user)
        db.session.commit()

        access_token = create_access_token(identity=new_user.id)
        
        try:
            msg = Message(
                subject="Welcome to Home Budget Application",
                recipients=[email],
                body=f"Hello {username},\n\nThank you for registering with us!\n\nBest regards,\nHomeBudget Customer Service"
            )
            mail.send(msg)
        except Exception as e:
            print(f"Failed to send email: {e}")

        return jsonify({
            "success": True,
            "message": "Registration successful!",
            "data": {
                "user": {
                    "id": new_user.id,
                    "username": new_user.username,
                    "email": new_user.email
                },
                "access_token": access_token
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": "Registration failed. Please try again."}), 500

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"status": "error", "message": "Invalid input"}), 400

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"status": "error", "message": "Email and password are required"}), 400

    user = User.query.filter(User.email.ilike(email)).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({"status": "error", "message": "Invalid email or password"}), 401

    access_token = create_access_token(identity=user.id)
    return jsonify({
        "status": "success",
        "message": "Login successful",
        "data": {
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            },
            "access_token": access_token
        }
    }), 200

@auth_bp.route("/user", methods=["GET"])
@jwt_required()
def current_user():
    current_user_id = get_jwt_identity()
    user = User.query.get_or_404(current_user_id)
    return jsonify({
        "status": "success",
        "message": "User retrieved",
        "data": {
            "id": user.id,
            "email": user.email,
            "username": user.username
        }
    }), 200

@auth_bp.route("/user/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    if not data:
        return jsonify({"status": "error", "message": "Invalid input"}), 400

    user = User.query.get_or_404(current_user_id)
    username = data.get("username", user.username)
    email = data.get("email", user.email)

    if username != user.username and User.query.filter_by(username=username).first():
        return jsonify({"status": "error", "message": "Username already exists"}), 400

    if email != user.email and User.query.filter(User.email.ilike(email)).first():
        return jsonify({"status": "error", "message": "Email already exists"}), 400

    user.username = username
    user.email = email
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Profile updated successfully",
        "data": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    }), 200

@auth_bp.route("/logout", methods=["DELETE"])
@jwt_required()
def logout():
    jti = get_jwt().get("jti")
    if not jti:
        return jsonify({"status": "error", "message": "Token invalid"}), 400

    now = datetime.now(timezone.utc)
    db.session.add(TokenBlocklist(jti=jti, created_at=now))
    db.session.commit()

    return jsonify({"status": "success", "message": "Logged out successfully"}), 200

@auth_bp.route("/user", methods=["DELETE"])
@jwt_required()
def delete_account():
    current_user_id = get_jwt_identity()
    user = User.query.get_or_404(current_user_id)
    db.session.delete(user)
    db.session.commit()

    return jsonify({"status": "success", "message": "User account deleted successfully"}), 200
