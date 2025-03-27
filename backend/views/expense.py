from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Expense
from datetime import datetime


expense_bp = Blueprint("expense_bp", __name__)


@expense_bp.route("/expense", methods=["POST"])
@jwt_required()
def create_expense():
    data = request.get_json()
    if not all(k in data for k in ["amount", "category", "date"]):
        return jsonify({"error": "Fields 'amount', 'category', and 'date' are required."}), 400

    user_id = get_jwt_identity()

    try:
        parsed_date = datetime.strptime(data["date"], "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    expense = Expense(
        amount=data["amount"],
        category=data["category"],
        date=parsed_date,
        user_id=user_id
    )

    try:  # Add a try-except block for database errors
        db.session.add(expense)
        db.session.commit()

        return jsonify({
            "message": "Expense logged successfully!",
            "expense": {
                "id": expense.id,
                "amount": expense.amount,
                "category": expense.category,
                "date": expense.date.strftime("%Y-%m-%d")
            }
        }), 201
    except Exception as e:  # Handle potential database errors
        db.session.rollback()  # Rollback the transaction in case of error
        return jsonify({"error": f"Database error: {str(e)}"}), 500


@expense_bp.route("/expense", methods=["GET"])
@jwt_required()
def get_expenses():
    try:
        user_id = get_jwt_identity()
        expenses = Expense.query.filter_by(user_id=user_id).all()

        if not expenses:
            return jsonify({"success": True, "message": "No expenses found", "data": []}), 200

        expense_list = [
            {
                "id": expense.id,
                "amount": expense.amount,
                "category": expense.category,
                "date": expense.date.strftime("%Y-%m-%d")  # Format date for JSON
            }
            for expense in expenses
        ]

        return jsonify({"success": True, "data": expense_list}), 200 

    except Exception as e:
        print(f"Error fetching expenses: {e}")  # Log error for debugging
        return jsonify({"success": False, "error": "Failed to fetch expenses"}), 500


# GET expense by ID
@expense_bp.route("/expense/<int:expense_id>", methods=["GET"])
@jwt_required()
def get_expense(expense_id):
    expense = Expense.query.get_or_404(expense_id)
    user_id = get_jwt_identity()

    if expense.user_id != user_id:
        return jsonify({"error": "Unauthorized"}), 403

    return jsonify({
        "id": expense.id,
        "amount": expense.amount,
        "category": expense.category,
        "date": expense.date.strftime("%Y-%m-%d")  # Format date for JSON
    }), 200

@expense_bp.route("/expense/<int:expense_id>", methods=["PATCH"])
@jwt_required()
def update_expense(expense_id):
    data = request.get_json()

    # Check if required fields exist
    if not all(k in data for k in ["amount", "category", "date"]):
        return jsonify({"error": "Fields 'amount', 'category', and 'date' are required."}), 400

    expense = Expense.query.get(expense_id)
    if not expense:
        return jsonify({"error": "Expense not found"}), 404

    try:
        parsed_date = datetime.strptime(data["date"], "%Y-%m-%d").date()  # Convert date string to date object

        # Check if the date is valid
        datetime(parsed_date.year, parsed_date.month, parsed_date.day)
    except ValueError:
        return jsonify({"error": "Invalid date. Please check if the date exists in the given month."}), 400

    # Update fields
    expense.amount = data["amount"]
    expense.category = data["category"]
    expense.date = parsed_date  # Store as a `date` object

    try:  # Add a try-except block for database errors
        db.session.commit()

        return jsonify({
            "message": "Expense updated successfully!",
            "expense": {
                "id": expense.id,
                "amount": expense.amount,
                "category": expense.category,
                "date": expense.date.strftime("%Y-%m-%d")  # Convert back to string for JSON response
            }
        }), 200
    except Exception as e:  # Handle potential database errors
        db.session.rollback()  # Rollback the transaction in case of error
        return jsonify({"error": f"Database error: {str(e)}"}), 500


# DELETE Expense
@expense_bp.route("/expense/<int:expense_id>", methods=["DELETE"])
@jwt_required()
def delete_expense(expense_id):
    expense = Expense.query.get_or_404(expense_id)
    user_id = get_jwt_identity()

    if expense.user_id != user_id:
        return jsonify({"error": "Unauthorized"}), 403

    try:
        db.session.delete(expense)
        db.session.commit()
        return jsonify({"message": "Expense deleted successfully!"}), 200

    except Exception as e:  # Handle potential database errors
        db.session.rollback()  # Rollback the transaction in case of error
        return jsonify({"error": f"Database error: {str(e)}"}), 500
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Expense, Budget
from datetime import datetime

expense_bp = Blueprint("expense_bp", __name__)

def get_budget_info(user_id, category):
    """Get budget and calculate current spending for a category"""
    budget = Budget.query.filter_by(user_id=user_id, category=category).first()
    if not budget:
        return None, None, None
    
    total_spent = db.session.query(db.func.sum(Expense.amount)).filter_by(
        user_id=user_id,
        category=category
    ).scalar() or 0.0
    
    savings = max(0, float(budget.limit) - float(total_spent))
    return budget, total_spent, savings

@expense_bp.route("/expense", methods=["POST"])
@jwt_required()
def create_expense():
    user_id = get_jwt_identity()
    data = request.get_json()

    # Validate required fields
    required_fields = ["amount", "category", "date"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": f"Missing required fields: {', '.join(required_fields)}"}), 400

    # Validate amount
    try:
        amount = float(data["amount"])
        if amount <= 0:
            return jsonify({"error": "Amount must be positive"}), 400
    except ValueError:
        return jsonify({"error": "Invalid amount"}), 400

    # Validate date
    try:
        date = datetime.strptime(data["date"], "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    # Check budget exists
    budget, total_spent, savings = get_budget_info(user_id, data["category"])
    if not budget:
        return jsonify({"error": f"No budget found for category '{data['category']}'"}), 400

    # Check if expense exceeds budget
    if (total_spent + amount) > budget.limit:
        remaining = budget.limit - total_spent
        return jsonify({
            "error": f"This expense exceeds your budget. You can only spend {remaining:.2f} more in this category."
        }), 400

    # Create expense
    expense = Expense(
        amount=amount,
        category=data["category"],
        date=date,
        user_id=user_id
    )

    try:
        db.session.add(expense)
        db.session.commit()

        # Get updated budget info
        _, updated_total_spent, updated_savings = get_budget_info(user_id, data["category"])

        return jsonify({
            "message": "Expense created successfully",
            "expense": {
                "id": expense.id,
                "amount": float(expense.amount),
                "category": expense.category,
                "date": expense.date.strftime("%Y-%m-%d")
            },
            "budget_status": {
                "category": budget.category,
                "limit": float(budget.limit),
                "total_spent": float(updated_total_spent),
                "savings": float(updated_savings)
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@expense_bp.route("/expenses", methods=["GET"])
@jwt_required()
def get_all_expenses():
    user_id = get_jwt_identity()
    expenses = Expense.query.filter_by(user_id=user_id).all()
    
    expense_list = []
    for expense in expenses:
        expense_list.append({
            "id": expense.id,
            "amount": float(expense.amount),
            "category": expense.category,
            "date": expense.date.strftime("%Y-%m-%d")
        })
    
    return jsonify(expense_list), 200

@expense_bp.route("/expenses/<category>", methods=["GET"])
@jwt_required()
def get_expenses_by_category(category):
    user_id = get_jwt_identity()
    
    # Get budget info first
    budget, total_spent, savings = get_budget_info(user_id, category)
    if not budget:
        return jsonify({"error": f"No budget found for category '{category}'"}), 404
    
    # Get expenses
    expenses = Expense.query.filter_by(
        user_id=user_id,
        category=category
    ).all()
    
    expense_list = []
    for expense in expenses:
        expense_list.append({
            "id": expense.id,
            "amount": float(expense.amount),
            "date": expense.date.strftime("%Y-%m-%d")
        })
    
    return jsonify({
        "category": category,
        "budget_limit": float(budget.limit),
        "total_spent": float(total_spent),
        "savings": float(savings),
        "expenses": expense_list
    }), 200

@expense_bp.route("/expense/<int:expense_id>", methods=["DELETE"])
@jwt_required()
def delete_expense(expense_id):
    user_id = get_jwt_identity()
    expense = Expense.query.get(expense_id)
    
    if not expense:
        return jsonify({"error": "Expense not found"}), 404
    if expense.user_id != user_id:
        return jsonify({"error": "Unauthorized"}), 403
    
    category = expense.category
    
    try:
        db.session.delete(expense)
        db.session.commit()
        
        # Get updated budget info after deletion
        budget, total_spent, savings = get_budget_info(user_id, category)
        
        return jsonify({
            "message": "Expense deleted successfully",
            "budget_status": {
                "category": category,
                "limit": float(budget.limit),
                "total_spent": float(total_spent),
                "savings": float(savings)
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500