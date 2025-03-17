import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import jwtDecode from "jwt-decode";
import Button from "../components/Button";
import ExpenseCard from "../components/ExpenseCard";
import { toast } from "react-toastify";


const Dashboard = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingBudget, setEditingBudget] = useState(null);

  // Fetch budgets from the server
  const fetchBudgets = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token is missing. Please log in again.");
      }
  
      console.log("Using token:", token); // Debugging
  
      const response = await fetch("https://homebudgetapp-1.onrender.com/budgets", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
  
      if (response.status === 401) {
        console.error("Unauthorized. Clearing token and redirecting to login.");
        localStorage.removeItem("token");
        window.location.href = "/login"; // Redirect to login page
        return;
      }
  
      if (!response.ok) {
        throw new Error("Failed to fetch budgets");
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Fetch budgets error:", error);
      alert(error.message);
      return null;
    }
  };
  

  // Fetch budgets on component mount
  useEffect(() => {
    fetchBudgets();
  }, []);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);


  const fetchBudgetById = async (budgetId) => {
    try {
      const navigate = useNavigate();
      const token = localStorage.getItem("token");
  
      if (!token) {
        throw new Error("No token found. Please log in.");
      }
  
      console.log("Token being sent:", token); // Debugging
  
      const response = await fetch(
        `https://homebudgetapp-1.onrender.com/budgets/${budgetId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
  
      if (response.status === 401) {
        console.error("Unauthorized access. Redirecting to login.");
        localStorage.removeItem("token");
        navigate("/login");
        return null;
      }
  
      if (response.status === 403) {
        throw new Error("You are not authorized to access this budget.");
      }
  
      if (response.status === 404) {
        throw new Error("Budget not found.");
      }
  
      if (!response.ok) {
        throw new Error("Failed to fetch budget.");
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Fetch single budget error:", error);
      toast.error(error.message);
      return null;
    }
  };

  // Handle budget deletion
  const handleDelete = async (budgetId) => {
    if (!window.confirm("Are you sure you want to delete this budget?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`https://homebudgetapp-1.onrender.com/budgets/${budgetId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to delete budget");

      setBudgets((prev) => prev.filter((budget) => budget.id !== budgetId));
      alert("Budget deleted successfully!");
    } catch (error) {
      console.error("Delete error:", error);
      alert(`Error deleting budget: ${error.message}`);
    }
  };

  // Handle budget edit
  const handleEdit = (budget) => {
    setEditingBudget({ ...budget });
  };

  // Save edited budget
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

      const updateResponse = await fetch(
        `https://homebudgetapp-1.onrender.com/budgets/${editingBudget.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedData),
        }
      );

      if (!updateResponse.ok) {
        throw new Error("Failed to update budget");
      }

      fetchBudgets(); // Refresh the list after updating
      setEditingBudget(null);
      alert("Budget updated successfully!");
    } catch (error) {
      console.error("Update error:", error);
      alert(`Error updating budget: ${error.message}`);
    }
  };

  // Calculate totals
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
            <ExpenseCard
              key={budget.id}
              category={budget.category}
              spent={budget.current_spent}
              limit={budget.limit}
              onEdit={() => handleEdit(budget)}
              onDelete={() => handleDelete(budget.id)}
            />
          ))}
        </div>
      )}

      <div className="summary">
        <h2>Your Financial Summary</h2>
        <p>Total Expenses: KES {totalExpenses.toLocaleString()}</p>
        <p>Total Limit: KES {totalLimit.toLocaleString()}</p>
        <p>Total Savings: KES {totalSavings.toLocaleString()}</p>
      </div>

      {editingBudget && (
        <div className="edit-modal">
          <h2>Edit Budget</h2>
          <label>Category:</label>
          <input
            type="text"
            value={editingBudget.category}
            onChange={(e) => setEditingBudget({ ...editingBudget, category: e.target.value })}
          />
          <label>Limit (KES):</label>
          <input
            type="number"
            value={editingBudget.limit}
            onChange={(e) => setEditingBudget({ ...editingBudget, limit: e.target.value })}
          />
          <label>Current Spent (KES):</label>
          <input
            type="number"
            value={editingBudget.current_spent}
            onChange={(e) => setEditingBudget({ ...editingBudget, current_spent: e.target.value })}
          />
          <label>Savings (KES):</label>
          <input
            type="number"
            value={editingBudget.savings}
            onChange={(e) => setEditingBudget({ ...editingBudget, savings: e.target.value })}
          />
          <Button onClick={handleSaveEdit}>Save</Button>
          <Button onClick={() => setEditingBudget(null)}>Cancel</Button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;