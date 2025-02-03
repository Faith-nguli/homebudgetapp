from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Budget

report_blueprint = Blueprint('report', __name__)

@report_blueprint.route('/api/reports/spending', methods=['GET'])
@jwt_required()
def get_spending_report():
    # Get the current user
    current_user = get_jwt_identity()

    # Fetch all budgets for the user
    budgets = Budget.query.filter_by(user_id=current_user['id']).all()

    # Create a list to store report data
    report_data = []
    for budget in budgets:
        report_data.append({
            "category": budget.category,
            "amount_spent": budget.amount,
            "limit": budget.limit,
            "percentage_spent": (budget.amount / budget.limit) * 100
        })

    return jsonify({"report": report_data}), 200
