import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "https://homebudgetapp-1.onrender.com";

const AddBudget = () => {
  const navigate = useNavigate();
  const [budget, setBudget] = useState({
    category: "",
    amount: "",
    limit: "",
    image: "",
    savings: 0,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBudget((prev) => {
      const updatedBudget = { ...prev, [name]: value };
      if (name === "amount" || name === "limit") {
        updatedBudget.savings = Math.max(
          parseFloat(updatedBudget.limit || 0) - parseFloat(updatedBudget.amount || 0),
          0
        );
      }
      return updatedBudget;
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(`${API_BASE_URL}/budgets/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setBudget((prev) => ({ ...prev, image: data.image_url }));
      } else {
        alert("Image upload failed: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!budget.category) return alert("Please select a category");

    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    const budgetData = {
      category: budget.category,
      limit: parseFloat(budget.limit) || 0,
      amount: parseFloat(budget.amount) || 0,
      image_url: budget.image || null,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/budgets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(budgetData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to add budget");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error submitting budget:", error);
      alert(error.message);
    }
  };

  return (
    <div className="add-budget-form">
      <h2>Add Budget</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Category</label>
          <select name="category" value={budget.category} onChange={handleChange} required>
            <option value="">Select Category</option>
            <option value="food">Food</option>
            <option value="transport">Transport</option>
            <option value="entertainment">Entertainment</option>
            <option value="rent">Rent</option>
          </select>
        </div>
        <div className="form-group">
          <label>Amount</label>
          <input type="number" name="amount" value={budget.amount} onChange={handleChange} min="0" step="0.01" required />
        </div>
        <div className="form-group">
          <label>Limit</label>
          <input type="number" name="limit" value={budget.limit} onChange={handleChange} min="0" step="0.01" required />
        </div>
        <div className="form-group">
          <label>Image</label>
          <input type="file" accept="image/*" onChange={handleFileUpload} />
        </div>
        <div className="form-group">
          <label>Savings</label>
          <input type="number" value={budget.savings} readOnly />
        </div>
        <button type="submit" className="submit-btn">Add Budget</button>
      </form>
    </div>
  );
};

export default AddBudget;
