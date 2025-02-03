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


# GET all expenses
@expense_bp.route("/expense", methods=["GET"])
@jwt_required()
def get_expenses():
    user_id = get_jwt_identity()
    expenses = Expense.query.filter_by(user_id=user_id).all()
    expense_list = [
        {
            "id": expense.id,
            "amount": expense.amount,
            "category": expense.category,
            "date": expense.date.strftime("%Y-%m-%d")  # Format date for JSON
        }
        for expense in expenses
    ]
    return jsonify(expense_list), 200

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