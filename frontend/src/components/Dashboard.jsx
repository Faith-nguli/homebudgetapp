import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import jwtDecode from "jwt-decode";
import Button from "../components/Button";
import ExpenseCard from "../components/ExpenseCard"; // Ensure this is correctly exported in ExpenseCard.jsx

const Dashboard = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingBudget, setEditingBudget] = useState(null);

  useEffect(() => {
    const fetchBudgets = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token is missing.");

        const user = jwtDecode(token);
        if (!user?.sub) throw new Error("Invalid user data.");

        const response = await fetch(
          `https://homebudgetapp-1.onrender.com/budget/budgets`, // Corrected API URL
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch budgets: ${response.statusText}`);
        }

        const data = await response.json();
        setBudgets(data);
      } catch (error) {
        console.error("Fetch budgets error:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBudgets();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (budgetId) => {
    if (!window.confirm("Are you sure you want to delete this budget?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `https://homebudgetapp-1.onrender.com/budget/budgets/${budgetId}`, // Corrected API URL
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to delete budget");

      setBudgets((prev) => prev.filter((budget) => budget.id !== budgetId));
      alert("Budget deleted successfully!");
    } catch (error) {
      console.error("Delete error:", error);
      alert(`Error deleting budget: ${error.message}`);
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget({ ...budget });
  };

  const handleSaveEdit = async () => {
    if (!editingBudget || !editingBudget.id) {
      alert("Invalid budget data");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User is not authenticated");

      const updatedData = {
        category: editingBudget.category,
        limit: parseFloat(editingBudget.limit),
        current_spent: parseFloat(editingBudget.current_spent || 0),
        savings: parseFloat(editingBudget.savings || 0),
        image_url: editingBudget.image_url || null,
      };

      const response = await fetch(
        `https://homebudgetapp-1.onrender.com/budget/budgets/${editingBudget.id}`, // Corrected API URL
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update budget");
      }

      const updatedBudget = await response.json();
      setBudgets((prev) =>
        prev.map((budget) => (budget.id === editingBudget.id ? updatedBudget : budget))
      );

      setEditingBudget(null);
      alert("Budget updated successfully!");
    } catch (error) {
      console.error("Update error:", error);
      alert(`Error updating budget: ${error.message}`);
    }
  };

  const totalExpenses = budgets.reduce((sum, budget) => sum + (budget.current_spent || 0), 0);
  const totalLimit = budgets.reduce((sum, budget) => sum + (budget.limit || 0), 0);
  const totalSavings = budgets.reduce((sum, budget) => sum + (budget.savings || 0), 0);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <div className="current-time">Current Time: {currentTime.toLocaleTimeString()}</div>
        <div className="button-group">
          <Button onClick={() => navigate("/add-budget")}>Add Budget</Button>
          <Button onClick={() => navigate("/profile")}>Profile</Button>
          <Button onClick={() => navigate("/logout")}>Logout</Button>
        </div>
      </div>

      {loading ? (
        <p className="loading-message">Loading budgets...</p>
      ) : error ? (
        <p className="error-message">Error: {error}</p>
      ) : budgets.length === 0 ? (
        <p className="empty-message">No budgets added yet.</p>
      ) : (
        <div className="budget-grid">
          {budgets.map((budget) => (
            <ExpenseCard key={budget.id} className="budget-card">
              <h3>{budget.category}</h3>
              <p>Spent: KES {budget.current_spent?.toLocaleString()}</p>
              <p>Limit: KES {budget.limit?.toLocaleString()}</p>
              <Button onClick={() => handleEdit(budget)}>Edit</Button>
              <Button onClick={() => handleDelete(budget.id)}>Delete</Button>
            </ExpenseCard>
          ))}
        </div>
      )}

      <div className="summary">
        <h2>Your Financial Summary</h2>
        <p>Total Expenses: KES {totalExpenses.toLocaleString()}</p>
        <p>Total Limit: KES {totalLimit.toLocaleString()}</p>
        <p>Total Savings: KES {totalSavings.toLocaleString()}</p>
      </div>
    </div>
  );
};

export default Dashboard;
