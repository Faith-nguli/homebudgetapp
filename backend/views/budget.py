from flask import Blueprint, jsonify, request
from models import db, Budget
from flask_jwt_extended import jwt_required, get_jwt_identity

budget_bp = Blueprint("budget_bp", __name__)

# CREATE Budget
@budget_bp.route("/budgets", methods=["POST"])
@jwt_required()
def create_budget():
    data = request.get_json()
    
    # Validate required fields
    if not all(k in data for k in ["limit", "category"]):  
        return jsonify({"error": "Fields 'limit' and 'category' are required."}), 400

    user_id = get_jwt_identity()  # Get the logged-in user's ID
    
    # Allow current_spent to be optional (default to 0.0 if not provided)
    current_spent = data.get("current_spent", 0.0)

    # Create budget entry
    budget = Budget(
        limit=data["limit"],
        category=data["category"],
        user_id=user_id,
        current_spent=current_spent
    )

    db.session.add(budget)
    db.session.commit()

    return jsonify({
        "message": "Budget created successfully!",
        "budget": {
            "id": budget.id,
            "limit": budget.limit,
            "category": budget.category,
            "current_spent": budget.current_spent
        }
    }), 201



# GET all budgets
@budget_bp.route("/budgets", methods=["GET"])
@jwt_required()
def get_budgets():
    user_id = get_jwt_identity()
    budgets = Budget.query.filter_by(user_id=user_id).all()
    
    budget_list = [
        {
            "id": budget.id,
            "limit": budget.limit,  # Changed 'amount' to 'limit'
            "category": budget.category,
            "current_spent": budget.current_spent
        } 
        for budget in budgets
    ]

    return jsonify(budget_list), 200


# GET budget by ID
@budget_bp.route("/budgets/<int:budget_id>", methods=["GET"])
@jwt_required()
def get_budget(budget_id):
    budget = Budget.query.get_or_404(budget_id)
    user_id = get_jwt_identity()

    if budget.user_id != user_id:
        return jsonify({"error": "Unauthorized"}), 403

    return jsonify({
        "id": budget.id,
        "limit": budget.limit,  # Changed 'amount' to 'limit'
        "category": budget.category,
        "current_spent": budget.current_spent
    }), 200


@budget_bp.route("/budgets/<int:budget_id>", methods=["PATCH"])
@jwt_required()
def update_budget(budget_id):
    budget = Budget.query.get_or_404(budget_id)
    user_id = get_jwt_identity()

    if budget.user_id != user_id:
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()

    # Update fields with new values if provided
    budget.limit = data.get("limit", budget.limit)  # Update limit if provided
    budget.category = data.get("category", budget.category)  # Update category if provided
    budget.current_spent = data.get("current_spent", budget.current_spent)  # Update current_spent if provided

    db.session.commit()

    return jsonify({
        "message": "Budget updated successfully!",
        "budget": {
            "id": budget.id,
            "limit": budget.limit,
            "category": budget.category,
            "current_spent": budget.current_spent
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
