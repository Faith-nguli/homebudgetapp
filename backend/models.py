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
    

class Expense(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

    def __repr__(self):
        return f"<Expense {self.id}: {self.category} - {self.amount}>"

    

class Budget(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(100), nullable=False)
    limit = db.Column(db.Float, nullable=False)
    saving = db.Column(db.Float, default=0.0, nullable=False)  
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    image_url = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "category": self.category,
            "limit": self.limit,
            "saving": self.saving, 
            "spent": self.spent,
            "image_url": self.image_url,
            "user_id": self.user_id,
        }

    @property
    def spent(self):
        expenses_for_budget = Expense.query.filter_by(
            user_id=self.user_id,
            category=self.category
        ).all()
        return sum(expense.amount for expense in expenses_for_budget) if expenses_for_budget else 0.0

    @property
    def savings(self):  # ✅ Automatically computes savings
        return self.limit - self.spent


class TokenBlocklist(db.Model):
    __tablename__ = "token_blocklist"
    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(36), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)