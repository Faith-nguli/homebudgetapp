from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import MetaData
from datetime import datetime


metadata = MetaData()
db = SQLAlchemy(metadata=metadata)

# Models

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(512), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    

    # Relationships
    expenses = db.relationship("Expense", backref="user", lazy=True)
    budgets = db.relationship("Budget", backref="owner", lazy=True)

class Expense(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    

class Budget(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(100), nullable=False)
    limit = db.Column(db.Float, nullable=False)
    current_spent = db.Column(db.Float, default=0.0, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    image_url = db.Column(db.String(255), nullable=True)
    

    @property
    def current_spent(self):
        expenses_for_budget = Expense.query.filter_by(user_id=self.user_id, category=self.category).all()
        total_spent = sum(expense.amount for expense in expenses_for_budget) if expenses_for_budget else 0.0
        return total_spent
    
    @property
    def savings(self):
        return self.limit - self.current_spent




class TokenBlocklist(db.Model):
    __tablename__ = "token_blocklist"
    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(36), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)