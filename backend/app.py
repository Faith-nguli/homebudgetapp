from flask import Flask, request, jsonify, make_response
from datetime import timedelta
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from flask_mail import Mail
from flask_cors import CORS
import os

# Import models & blueprints
from models import db, TokenBlocklist, Budget  # Ensure Budget model has expense_id
from views.auth import auth_bp
from views.user import user_bp
from views.budget import budget_bp
from views.expense import expense_bp

# Initialize Flask-Mail
mail = Mail()

def create_app():
    app = Flask(__name__)

    # CORS configuration
    CORS(app,
         resources={r"/*": {
             "origins": "http://localhost:5173",
             "methods": ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
             "allow_headers": ["Content-Type", "Authorization"]
         }},
         supports_credentials=True)

    # Handle preflight OPTIONS requests
    @app.route("/<path:dummy>", methods=["OPTIONS"])
    def handle_options(dummy):
        response = make_response()
        response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        return response

    # Route to create a budget
    @app.route('/budgets', methods=['POST'])
    @jwt_required()
    def create_budget():
        print("Received request data:", request.get_json())  # Debug print
        print("Headers:", request.headers)  # Debug print

        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 422

        try:
            data = request.get_json()
            current_user_id = get_jwt_identity()

            print("Current user ID:", current_user_id)  # Debug print

            # Validate required fields
            if not data.get('category'):
                return jsonify({"error": "Category is required"}), 422
            if not data.get('limit'):
                return jsonify({"error": "Limit is required"}), 422

            expense_id = data.get('expense_id')

            # Ensure expense_id is valid (exists in expense table)
            if expense_id is not None:
                expense_exists = Expense.query.filter_by(id=expense_id).first()
                if not expense_exists:
                    return jsonify({"error": f"Expense with ID {expense_id} does not exist"}), 400

            # Create budget
            try:
                budget = Budget(
                    category=data['category'],
                    limit=float(data['limit']),
                    user_id=current_user_id,
                    image_url=data.get('image_url'),
                    expense_id=expense_id if expense_id else None,  # Set to None if missing
                )

                db.session.add(budget)
                db.session.commit()

                return jsonify({
                    'id': budget.id,
                    'category': budget.category,
                    'limit': budget.limit,
                    'current_spent': budget.current_spent,
                    'user_id': budget.user_id,
                    'image_url': budget.image_url,
                    'expense_id': budget.expense_id,
                    'savings': budget.savings
                }), 201

            except ValueError:
                return jsonify({"error": "Invalid number format for limit"}), 422
            except Exception as e:
                return jsonify({"error": f"Database error: {str(e)}"}), 500

        except Exception as e:
            return jsonify({"error": f"Request processing error: {str(e)}"}), 500

    # Route to fetch all budgets
    @app.route('/budgets', methods=['GET'])
    @jwt_required()
    def get_budgets():
        user_id = request.args.get('user_id')
        if user_id:
            budgets = Budget.query.filter_by(user_id=user_id).all()
        else:
            budgets = Budget.query.all()

        return jsonify([{
            'id': budget.id,
            'category': budget.category,
            'limit': budget.limit,
            'current_spent': budget.current_spent,
            'user_id': budget.user_id,
            'image_url': budget.image_url,
            'expense_id': budget.expense_id,
            'savings': budget.savings
        } for budget in budgets]), 200

    # Other routes (update, delete) omitted for brevity
    
    # Database configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://budget_db_a98a_user:43XTLbNNLBTlsw2gBO9G5j06dBugQBlD@dpg-cugrc4i3esus73fg8s50-a.oregon-postgres.render.com/budget_db_a98a'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # JWT configuration
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "yes12")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)

    # Flask-Mail configuration
    app.config['MAIL_SERVER'] = os.getenv("MAIL_SERVER", "smtp.example.com")
    app.config['MAIL_PORT'] = 587
    app.config['MAIL_USE_TLS'] = True
    app.config['MAIL_USE_SSL'] = False

    # Initialize extensions
    db.init_app(app)
    migrate = Migrate(app, db)
    jwt = JWTManager(app)
    mail.init_app(app)

    # Token blocklist check
    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(_jwt_header, jwt_payload: dict) -> bool:
        jti = jwt_payload.get("jti")
        return db.session.query(TokenBlocklist.id).filter_by(jti=jti).scalar() is not None

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(budget_bp)
    app.register_blueprint(expense_bp)

    return app

app = create_app()

# Ensure script runs Flask correctly
if __name__ == "__main__":
    app.run(debug=True)
