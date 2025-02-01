import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from "../components/Button"; 
import Card from "../components/ExpenseCard"; 

const Dashboard = () => {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [budgets, setBudgets] = useState([]);  // Store user budgets
    const [loading, setLoading] = useState(true);

    // Fetch budgets from backend
    useEffect(() => {
        const fetchBudgets = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/budgets'); // Adjust URL as needed
                if (!response.ok) throw new Error('Failed to fetch budgets');
                const data = await response.json();
                setBudgets(data);
            } catch (error) {
                console.error('Error fetching budgets:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBudgets();
    }, []);

    // Update time every second
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const totalExpenses = budgets.reduce((sum, budget) => sum + budget.amount, 0);
    const totalLimit = budgets.reduce((sum, budget) => sum + budget.limit, 0);

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
                <div className="text-lg text-gray-600 font-medium">
                    Current Time: {currentTime.toLocaleTimeString()}
                </div>
                <div className="space-x-4">
                    <Button className="dashboard-button add-budget" onClick={() => navigate('/add-budget')}>Add Budget</Button>
                    <Button className="dashboard-button profile" onClick={() => navigate('/profile')}>Profile</Button>
                    <Button className="dashboard-button logout" onClick={() => navigate('/logout')}>Logout</Button>
                </div>
            </div>

            {loading ? (
                <p className="text-center text-gray-600">Loading budgets...</p>
            ) : budgets.length === 0 ? (
                <p className="text-center text-gray-600">No budgets added yet. Click "Add Budget" to create one.</p>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {budgets.map((budget) => (
                        <Card key={budget.id} className="shadow-lg bg-white rounded-xl p-4">
                            <div className="flex flex-col items-center text-center">
                                <img src={budget.image} alt={budget.category} className="h-24 w-24 mb-3" />
                                <h3 className="text-xl font-semibold text-gray-700">{budget.category}</h3>
                                <p className="text-lg text-gray-500">Spent: KES {budget.amount.toLocaleString()}</p>
                                <p className="text-lg text-gray-500">Limit: KES {budget.limit.toLocaleString()}</p>
                                <p className={`text-lg font-medium ${budget.amount > budget.limit ? 'text-red-500' : 'text-green-500'}`}>
                                    {budget.amount > budget.limit ? 'Over Budget!' : 'Within Budget'}
                                </p>
                                <Button 
                                  className="dashboard-button-view-details" 
                                  onClick={() => navigate(`/expense/${budget.id}`, { state: { expense: budget } })}
                                >
                                  View Details
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <div className="mt-8 p-6 bg-white shadow-lg rounded-xl">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Expenses Summary</h2>
                <p className="text-lg font-medium text-gray-600">
                    Total Expenses: <span className="text-blue-500">KES {totalExpenses.toLocaleString()}</span>
                </p>
                <p className="text-lg font-medium text-gray-600">
                    Total Limit: <span className="text-red-500">KES {totalLimit.toLocaleString()}</span>
                </p>
                <p className={`text-lg font-medium ${totalExpenses > totalLimit ? 'text-red-500' : 'text-green-500'}`}>
                    {totalExpenses > totalLimit ? 'Over Budget!' : 'Within Budget'}
                </p>
                <ul className="mt-3 space-y-2">
                    {budgets.map((budget) => (
                        <li key={budget.id} className="flex justify-between text-gray-700">
                            <span>{budget.category}:</span>
                            <span>
                                KES {budget.amount.toLocaleString()} ({((budget.amount / totalExpenses) * 100).toFixed(2)}%) 
                                / Limit: KES {budget.limit.toLocaleString()}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Dashboard;
