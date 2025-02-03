from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Budget

savings_blueprint = Blueprint('savings', __name__)

@savings_blueprint.route('/api/savings', methods=['GET'])
@jwt_required()
def get_savings():
    # Get the current user
    current_user = get_jwt_identity()
    
    # Fetch all budgets for the user
    budgets = Budget.query.filter_by(user_id=current_user['id']).all()

    # Calculate total expenses and total limit
    total_expenses = sum(budget.amount for budget in budgets)
    total_limit = sum(budget.limit for budget in budgets)

    # Calculate savings
    savings = total_limit - total_expenses

    return jsonify({"savings": savings}), 200
