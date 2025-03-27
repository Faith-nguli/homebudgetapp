import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";

import { toast } from "react-toastify";

const AddExpense = () => {
  const navigate = useNavigate();
  const { budgets } = useContext(BudgetContext);
  const [expense, setExpense] = useState({
    category: "",
    amount: "",
    date: new Date().toISOString().split('T')[0], // Default to today
    description: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setExpense(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!expense.category || !expense.amount) {
      toast.error("Category and amount are required");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://127.0.0.1:5000/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: expense.category,
          amount: parseFloat(expense.amount),
          date: expense.date,
          description: expense.description
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add expense");
      }

      toast.success("Expense added successfully!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.message || "Failed to add expense");
      console.error("Error adding expense:", error);
    }
  };

  return (
    <div className="add-expense-form">
      <h2>Add Expense</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Category</label>
          <select
            name="category"
            value={expense.category}
            onChange={handleChange}
            required
          >
            <option value="">Select Category</option>
            {budgets.map(budget => (
              <option key={budget.id} value={budget.category}>
                {budget.category}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>Amount (KES)</label>
          <input
            type="number"
            name="amount"
            value={expense.amount}
            onChange={handleChange}
            min="0"
            step="0.01"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Date</label>
          <input
            type="date"
            name="date"
            value={expense.date}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Description (Optional)</label>
          <input
            type="text"
            name="description"
            value={expense.description}
            onChange={handleChange}
          />
        </div>
        
        <button type="submit" className="submit-btn">
          Add Expense
        </button>
      </form>
    </div>
  );
};

export default AddExpense;