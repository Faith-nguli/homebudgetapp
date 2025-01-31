import React from 'react';
import { useNavigate } from 'react-router-dom';
import foodImage from '../assets/food.png';
import rentImage from '../assets/rent.png';
import transportationImage from '../assets/transportation.png';
import entertainmentImage from '../assets/entertainment.png';

const Dashboard = () => {
    const navigate = useNavigate();

    // Budget data with amounts
    const budgets = [
        { id: 1, category: 'Food', image: foodImage, amount: 5000 },
        { id: 2, category: 'Rent', image: rentImage, amount: 20000 },
        { id: 3, category: 'Transportation', image: transportationImage, amount: 3000 },
        { id: 4, category: 'Entertainment', image: entertainmentImage, amount: 2500 },
    ];

    // Calculate total expenses
    const totalExpenses = budgets.reduce((sum, budget) => sum + budget.amount, 0);

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <button className="add-budget-button" onClick={() => navigate("/add-budget")}>Add Budget</button>
                <button className="profile-button" onClick={() => navigate("/profile")}>Profile</button>
                <button className="logout-button" onClick={() => navigate("/logout")}>Logout</button>
            </div>
            <div className="expenses-grid">
                {budgets.map((budget) => (
                    <div key={budget.id} className="expense-item">
                        <img src={budget.image} alt={budget.category} className="expense-image" />
                        <div className="expense-details">
                            <h3 className="expense-category">{budget.category}</h3>
                            <p className="expense-amount">KES {budget.amount.toLocaleString()}</p>
                            <button 
                                className="view-button" 
                                onClick={() => navigate(`/expense/${budget.id}`, { state: { expense: budget } })}
                            >
                                View
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="summary-panel">
                <h2>Your Expenses Summary</h2>
                <p><strong>Total Expenses:</strong> KES {totalExpenses.toLocaleString()}</p>
                <ul>
                    {budgets.map((budget) => (
                        <li key={budget.id}>
                            <strong>{budget.category}:</strong> KES {budget.amount.toLocaleString()} 
                            ({((budget.amount / totalExpenses) * 100).toFixed(2)}%)
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Dashboard;
