from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import os
import logging
import traceback
from datetime import datetime
from models import Budget, Expense, db

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

budget_bp = Blueprint("budget_bp", __name__)

UPLOAD_FOLDER = "uploads/budget_images"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def calculate_savings(limit, spent):
    """Calculate savings ensuring it's never negative"""
    return max(0, float(limit) - float(spent))

def get_expenses_total(user_id, category):
    """Helper to get total expenses for a category"""
    return db.session.query(db.func.sum(Expense.amount)).filter_by(
        user_id=user_id,
        category=category
    ).scalar() or 0.0

def format_budget(budget, expenses_amount=0):
    return {
        "id": budget.id,
        "category": budget.category,
        "saving": calculate_savings(budget.limit, expenses_amount),
        "limit": float(budget.limit) if budget.limit is not None else 0.0,
        "spent": float(expenses_amount),
        "user_id": budget.user_id,
        "image_url": budget.image_url
    }

@budget_bp.route('/budgets', methods=['POST'])
@jwt_required()
def create_budget():
    data = request.get_json()
    logger.debug(f"Received data: {data}")

    if not data or 'category' not in data or 'limit' not in data:
        return jsonify({"error": "Category and limit are required"}), 400

    user_id = get_jwt_identity()

    try:
        limit = float(data['limit'])
        if limit <= 0:
            return jsonify({"error": "Limit must be positive"}), 400
    except ValueError:
        return jsonify({"error": "Invalid limit value"}), 400

    try:
        new_budget = Budget(
            category=data['category'],
            limit=limit,
            user_id=user_id,
            image_url=data.get('image_url')
        )
        db.session.add(new_budget)
        db.session.commit()
        return jsonify({
            "message": "Budget created successfully",
            "budget": format_budget(new_budget)
        }), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating budget: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": "An error occurred while creating the budget"}), 500

@budget_bp.route("/budgets", methods=["GET"])
@jwt_required()
def get_budgets():
    try:
        user_id = get_jwt_identity()
        budgets = Budget.query.filter_by(user_id=user_id).all()
        return jsonify([format_budget(b, get_expenses_total(user_id, b.category)) for b in budgets]), 200
    except Exception as e:
        logger.error(f"Error fetching budgets: {e}")
        return jsonify({"error": "An error occurred while fetching budgets"}), 500

@budget_bp.route("/budgets/<int:budget_id>", methods=["GET"])
@jwt_required()
def get_budget(budget_id):
    try:
        user_id = get_jwt_identity()
        budget = Budget.query.get_or_404(budget_id)
        if budget.user_id != user_id:
            return jsonify({"error": "Unauthorized"}), 403
        total_expenses = get_expenses_total(user_id, budget.category)
        return jsonify(format_budget(budget, total_expenses)), 200
    except Exception as e:
        logger.error(f"Error fetching budget: {e}")
        return jsonify({"error": "An error occurred while fetching budget"}), 500

@budget_bp.route("/budgets/<int:budget_id>", methods=["PUT"])
@jwt_required()
def update_budget(budget_id):
    try:
        user_id = get_jwt_identity()
        budget = Budget.query.get_or_404(budget_id)
        if budget.user_id != user_id:
            return jsonify({"error": "Unauthorized"}), 403
        
        data = request.get_json()
        if 'category' in data:
            budget.category = data['category']
        if 'limit' in data:
            try:
                budget.limit = float(data['limit'])
                if budget.limit < 0:
                    return jsonify({"error": "Limit must be positive"}), 400
            except ValueError:
                return jsonify({"error": "Invalid limit value"}), 400
        
        db.session.commit()
        total_expenses = get_expenses_total(user_id, budget.category)
        return jsonify(format_budget(budget, total_expenses)), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating budget: {e}")
        return jsonify({"error": "An error occurred while updating budget"}), 500

@budget_bp.route("/expenses", methods=["GET"])
@jwt_required()
def get_expenses():
    try:
        user_id = get_jwt_identity()
        expenses = Expense.query.filter_by(user_id=user_id).all()
        return jsonify([{
            'id': e.id,
            'category': e.category,
            'amount': float(e.amount),
            'date': e.date.strftime('%Y-%m-%d') if e.date else None
        } for e in expenses]), 200
    except Exception as e:
        logger.error(f"Error fetching expenses: {e}")
        return jsonify({"error": "An error occurred while fetching expenses"}), 500

@budget_bp.route("/budgets/<int:budget_id>", methods=["DELETE"])
@jwt_required()
def delete_budget(budget_id):
    try:
        budget = Budget.query.get_or_404(budget_id)
        user_id = int(get_jwt_identity())
        
        if budget.user_id != user_id:
            return jsonify({"error": "Unauthorized"}), 403
        
        db.session.delete(budget)
        db.session.commit()
        return jsonify({"message": "Budget deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting budget: {e}")
        return jsonify({"error": "An error occurred while deleting budget"}), 500

@budget_bp.route("/expenses", methods=["POST"])
@jwt_required()
def create_expense():
    try:
        data = request.get_json()
        user_id = int(get_jwt_identity())

        # Validate required fields
        if not data or 'category' not in data or 'amount' not in data:
            return jsonify({"error": "Missing required fields (category, amount)"}), 400

        # Validate amount
        try:
            amount = float(data['amount'])
            if amount <= 0:
                return jsonify({"error": "Amount must be positive"}), 400
        except ValueError:
            return jsonify({"error": "Invalid amount value"}), 400

        # Create new expense
        new_expense = Expense(
            category=data['category'],
            amount=amount,
            user_id=user_id,
            date=datetime.strptime(data['date'], '%Y-%m-%d') if 'date' in data else datetime.utcnow()
        )

        db.session.add(new_expense)
        db.session.commit()

        return jsonify({
            "message": "Expense created successfully",
            "expense": {
                "id": new_expense.id,
                "category": new_expense.category,
                "amount": float(new_expense.amount),
                "date": new_expense.date.strftime('%Y-%m-%d')
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating expense: {e}")
        return jsonify({"error": "An error occurred while creating expense"}), 500