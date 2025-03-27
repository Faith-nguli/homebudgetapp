import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AddBudget = () => {
  const navigate = useNavigate();
  const [budget, setBudget] = useState({
    category: "",
    limit: "",
    spent: "",
    saving: 0,
  });

  // Calculate savings whenever limit or spent changes
  useEffect(() => {
    const limitValue = parseFloat(budget.limit) || 0;
    const spentValue = parseFloat(budget.spent) || 0;
    const newSaving = Math.max(limitValue - spentValue, 0); // Prevent negative savings

    setBudget((prev) => ({
      ...prev,
      saving: newSaving, // Ensure savings is correctly updated
    }));
  }, [budget.limit, budget.spent]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBudget((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!budget.category) return alert("Please select a category");

    const limitValue = parseFloat(budget.limit) || 0;
    const spentValue = parseFloat(budget.spent) || 0;

    if (spentValue > limitValue) {
      return alert("Spent amount cannot be greater than the budget limit.");
    }

    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    // Prepare the budget data
    const budgetData = {
      category: budget.category,
      limit: limitValue,
      spent: spentValue,
      saving: budget.saving, // This is now correctly calculated
    };

    try {
      const response = await fetch("http://127.0.0.1:5000/budgets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(budgetData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to add budget");
      }

      alert("Budget added successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error submitting budget:", error);
      alert(error.message || "Failed to add budget. Please try again.");
    }
  };

  return (
    <div className="add-budget-form">
      <h2>Add Budget</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Category</label>
          <select
            name="category"
            value={budget.category}
            onChange={handleChange}
            required
          >
            <option value="">Select Category</option>
            <option value="food">Food</option>
            <option value="transport">Transport</option>
            <option value="entertainment">Entertainment</option>
            <option value="rent">Rent</option>
          </select>
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
          <label>Spent</label>
          <input
            type="number"
            name="spent"
            value={budget.spent}
            onChange={handleChange}
            min="0"
            step="0.01"
            required
          />
        </div>
        <div className="form-group">
          <label>Saving</label>
          <input
            type="number"
            name="saving"
            value={budget.saving}
            readOnly
            className="read-only"
          />
        </div>
        <button type="submit" className="submit-btn">
          Add Budget
        </button>
      </form>
    </div>
  );
};

export default AddBudget;
