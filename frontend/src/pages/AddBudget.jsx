import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { BudgetContext } from '../context/BudgetContext';

function AddBudget() {
  const navigate = useNavigate();
  const { handleFileUpload } = useContext(BudgetContext);

  const [budget, setBudget] = useState({
    category: '',
    amount: '',
    limit: '',
    image: '',
    savings: 0,
    current_spent: 0,
    expense_id: '',
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setBudget(prev => {
      const updatedBudget = { ...prev, [name]: value };

      // Update savings and current_spent on amount or limit change
      if ((updatedBudget.amount && updatedBudget.limit) && (name === "amount" || name === "limit")) {
        const amount = parseFloat(updatedBudget.amount);
        const limit = parseFloat(updatedBudget.limit);
        const savings = limit - amount;

        updatedBudget.savings = savings > 0 ? savings : 0;
        updatedBudget.current_spent = amount;
      }
      return updatedBudget;
    });
  }

  function handleCategoryChange(e) {
    setBudget(prev => ({ ...prev, category: e.target.value }));
  }

  function handleImageUpload(e) {
    const file = e?.target?.files?.[0];
    if (!file) {
      console.error("No file selected");
      return;
    }

    console.log("Uploading file:", file.name);
    handleFileUpload(file)
      .then((url) => {
        console.log("Image uploaded successfully:", url);
        setBudget(prev => ({ ...prev, image: url }));
      })
      .catch(err => console.error("Image upload failed", err));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!budget.category) {
      alert('Please select a category');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('User is not authenticated');
      return;
    }

    const budgetData = {
      category: budget.category,
      amount: parseFloat(budget.amount),
      limit: parseFloat(budget.limit),
      savings: parseFloat(budget.savings),
      image_url: budget.image || null,
      current_spent: budget.current_spent,
      expense_id: budget.expense_id || 0, // Default value for expense_id
    };

    fetch('http://localhost:5000/budgets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(budgetData),
      credentials: 'include',
    })
      .then(async response => {
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          if (!response.ok) throw new Error(data.error || `Server error: ${response.status}`);
          return data;
        } catch (err) {
          console.error("Invalid JSON response:", text);
          throw new Error("Invalid JSON response from server");
        }
      })
      .then(data => {
        console.log('Success:', data);
        navigate('/dashboard');
      })
      .catch(error => {
        console.error('Error submitting budget:', error);
        alert('Failed to submit budget: ' + error.message);
      });
  }

  return (
    <div className="add-budget-form">
      <h2>Add Budget</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Category</label>
          <select name="category" value={budget.category} onChange={handleCategoryChange} required>
            <option value="">Select Category</option>
            <option value="food">Food</option>
            <option value="transport">Transport</option>
            <option value="entertainment">Entertainment</option>
            <option value="rent">Rent</option>
          </select>
        </div>
        <div className="form-group">
          <label>Amount</label>
          <input
            type="number"
            name="amount"
            value={budget.amount}
            onChange={handleChange}
            min="0"
            step="0.01"
            required
          />
        </div>
        <div className="form-group">
          <label>Limit</label>
          <input
            type="number"
            name="limit"
            value={budget.limit}
            onChange={handleChange}
            min="0"
            step="0.01"
            required
          />
        </div>
        <div className="form-group">
          <label>Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
          />
        </div>
        <div className="form-group">
          <label>Savings</label>
          <input type="number" value={budget.savings} readOnly />
        </div>
        <button type="submit" className="submit-btn">
          Add Budget
        </button>
      </form>
    </div>
  );
}

export default AddBudget;