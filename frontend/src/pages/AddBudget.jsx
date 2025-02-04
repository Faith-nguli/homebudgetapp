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
    image: ''
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!budget.category) {
        alert("Please select a category");
        return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
        alert("User is not authenticated");
        return;
    }

   

    const budgetData = {
        category: budget.category,
        limit: parseFloat(budget.limit),
        amount: budget.amount ? parseFloat(budget.amount) : 0, // Default to 0 if missing
        image_url: budget.image || null
        
    };

    try {
        const response = await fetch("https://homebudgetapp.onrender.com/budgets", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(budgetData),
            credentials: "include",
        });

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch {
            throw new Error("Invalid JSON response from server");
        }

        if (!response.ok) {
            throw new Error(data.error || `Server error: ${response.status}`);
        }

        console.log("Budget created successfully:", data);
        navigate("/dashboard"); // Redirect after successful submission
    } catch (error) {
        console.error("Error submitting budget:", error);
        alert("Failed to submit budget: " + error.message);
    }
};


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