import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "./Button";
import Card from "../components/ExpenseCard";
import jwt_decode from "jwt-decode";

const Dashboard = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingBudget, setEditingBudget] = useState(null);

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");

        const decodedToken = jwt_decode(token);
        const user_id = decodedToken.sub;
        if (!user_id) throw new Error("Invalid token: missing user ID");

        const response = await fetch(`https://homebudgetapp-1.onrender.com/user/${user_id}/budgets`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const responseBody = await response.json();
        if (!response.ok) {
          throw new Error(responseBody.msg || "Failed to fetch budgets");
        }

        setBudgets(responseBody);
      } catch (error) {
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

  const handleDelete = async (budget_id) => {
    if (!window.confirm("Are you sure you want to delete this budget?")) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`https://homebudgetapp-1.onrender.com/${budget_id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to delete budget");

      setBudgets((prev) => prev.filter((budget) => budget.id !== budget_id));
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget({ ...budget });
  };

  const handleSaveEdit = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User is not authenticated");

      if (!editingBudget || !editingBudget.id) {
        throw new Error("Invalid budget data");
      }

      const updatedData = {
        category: editingBudget.category || "",
        limit: parseFloat(editingBudget.limit) || 0,
        current_spent: parseFloat(editingBudget.current_spent || 0),
        savings: parseFloat(editingBudget.savings || 0),
        image_url: editingBudget.image_url || null,
      };

      console.log("Sending update:", updatedData); // Debugging log

      const response = await fetch(`https://homebudgetapp-1.onrender.com/budgets/${editingBudget.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });

      const updatedBudget = await response.json();
      if (!response.ok) {
        throw new Error(updatedBudget.error || "Failed to update budget");
      }

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

  const totalExpenses = budgets.reduce((sum, budget) => sum + budget.current_spent, 0);
  const totalLimit = budgets.reduce((sum, budget) => sum + budget.limit, 0);
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
            <Card key={budget.id} className="budget-card">
              {editingBudget && editingBudget.id === budget.id ? (
                <div>
                  <input
                    type="text"
                    value={editingBudget.category}
                    onChange={(e) => setEditingBudget({ ...editingBudget, category: e.target.value })}
                  />
                  <input
                    type="number"
                    value={editingBudget.limit}
                    onChange={(e) => setEditingBudget({ ...editingBudget, limit: Number(e.target.value) })}
                  />
                  <Button onClick={handleSaveEdit}>Save</Button>
                  <Button onClick={() => setEditingBudget(null)}>Cancel</Button>
                </div>
              ) : (
                <div className="budget-content">
                  <img
                    src={budget.image_url || "https://via.placeholder.com/100"}
                    alt={budget.category}
                    className="budget-image"
                  />
                  <h3 className="budget-category">{budget.category}</h3>
                  <p className="budget-amount">Spent: KES {budget.current_spent.toLocaleString()}</p>
                  <p className="budget-amount">Limit: KES {budget.limit.toLocaleString()}</p>
                  <p className="budget-amount">
                    Savings: KES {budget.savings ? budget.savings.toLocaleString() : "0"}
                  </p>
                  <p className={`budget-status ${budget.current_spent > budget.limit ? "over-budget" : "within-budget"}`}>
                    {budget.current_spent > budget.limit ? "Over Budget!" : "Within Budget"}
                  </p>
                  <Button onClick={() => navigate(`/budget-detail/${budget.id}`)}>View Details</Button>
                  <Button onClick={() => handleEdit(budget)}>Edit</Button>
                  <Button onClick={() => handleDelete(budget.id)}>Delete</Button>
                </div>
              )}
            </Card>
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
