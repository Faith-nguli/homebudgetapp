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

            # Create budget
            try:
                budget = Budget(
                    category=data['category'],
                    limit=float(data['limit']),  # Convert to float
                    user_id=current_user_id,
                    image_url=data.get('image_url'),
                    expense_id=data.get('expense_id')  # Ensure Budget model has expense_id
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
                    'expense_id': budget.expense_id  # Added expense_id
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
            'expense_id': budget.expense_id  # Added expense_id
        } for budget in budgets]), 200

    # Route to fetch a specific budget by ID
    @app.route('/budget/<int:id>', methods=['GET'])
    @jwt_required()
    def get_budget(id):
        try:
            budget = Budget.query.get_or_404(id)
            return jsonify({
                'id': budget.id,
                'category': budget.category,
                'limit': budget.limit,
                'current_spent': budget.current_spent,
                'user_id': budget.user_id,
                'image_url': budget.image_url,
                'expense_id': budget.expense_id  # Added expense_id
            }), 200
        except Exception as e:
            return jsonify({"error": f"Error retrieving budget: {str(e)}"}), 500

    # Route to delete a budget
    @app.route('/budgets/<int:budget_id>', methods=['DELETE'])
    @jwt_required()
    def delete_budget(budget_id):
        current_user = get_jwt_identity()  # Get the user identity (e.g., user ID) from the token
        budget = Budget.query.filter_by(id=budget_id, user_id=current_user).first()  # Ensure the user owns the budget
        
        if not budget:
            return {"msg": "Budget not found or not authorized"}, 404

        db.session.delete(budget)
        db.session.commit()
        
        return {"msg": "Budget deleted successfully"}, 200

    # Database configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///budget.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # File upload configuration
    app.config["UPLOAD_FOLDER"] = "uploads/budget_images"
    app.config["MAX_CONTENT_LENGTH"] = 2 * 1024 * 1024  # Limit file size to 2MB
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    # JWT configuration
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "yes12")  # Use env variable
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)

    # Flask-Mail configuration
    app.config['MAIL_SERVER'] = os.getenv("MAIL_SERVER", "smtp.example.com")
    app.config['MAIL_PORT'] = 587
    app.config['MAIL_USE_TLS'] = True
    app.config['MAIL_USE_SSL'] = False
    app.config['MAIL_USERNAME'] = os.getenv("MAIL_USERNAME", "your-email@example.com")
    app.config['MAIL_PASSWORD'] = os.getenv("MAIL_PASSWORD", "your-email-password")
    app.config['MAIL_DEFAULT_SENDER'] = os.getenv("MAIL_DEFAULT_SENDER", "your-email@example.com")

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

# Ensure script runs Flask correctly
if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
