import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { toast } from "react-toastify";
import { UserContext } from "../context/userContext";
import { ExpenseContext } from "../context/ExpenseContext";

const Dashboard = () => {
  const navigate = useNavigate();
  const { current_user, logout, loading: userLoading } = useContext(UserContext);
  const { expenses } = useContext(ExpenseContext);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [budgets, setBudgets] = useState([]);
  const [budgetLoading, setBudgetLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingBudget, setEditingBudget] = useState(null);
  const [totalSavings, setTotalSavings] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);

  // Function to calculate savings (limit - spent)
  const calculateSavings = (budget) => budget.limit - (budget.spent || 0);

  const TotalExpenses = () => {
    return expenses.reduce((total, expense) => total + parseFloat(expense.amount || 0), 0);
  };

  // Function to fetch budgets
  const fetchBudgets = async (userId) => {
    setBudgetLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token || !userId) {
        toast.error("Authentication data is missing. Please log in again.");
        navigate("/login");
        return;
      }

      const response = await fetch("http://127.0.0.1:5000/budgets", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        toast.error("Session expired. Please log in again.");
        logout();
        navigate("/login");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch budgets");
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid data format received from API.");
      }

      // Calculate savings for each budget
      const updatedBudgets = data.map((budget) => ({
        ...budget,
        saving: calculateSavings(budget),
      }));

      // Calculate total savings
      setTotalSavings(updatedBudgets.reduce((total, budget) => total + budget.saving, 0));
      setBudgets(updatedBudgets);
    } catch (error) {
      console.error("Fetch Budgets Error:", error);
      toast.error(error.message || "Failed to fetch budgets. Please try again.");
      setError(error.message);
    } finally {
      setBudgetLoading(false);
    }
  };

  const saveBudget = async () => {
    if (!editingBudget) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://127.0.0.1:5000/budgets/${editingBudget.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: editingBudget.category,
          limit: editingBudget.limit,
          spent: editingBudget.spent || 0,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update budget.");
      }

      toast.success("Budget updated successfully!");
      setEditingBudget(null);
      fetchBudgets(current_user.data.id);
    } catch (error) {
      console.error("Save Budget Error:", error);
      toast.error(error.message || "Failed to update budget. Please try again.");
    }
  };

  const deleteBudget = async (budgetId) => {
    if (!window.confirm("Are you sure you want to delete this budget?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://127.0.0.1:5000/budgets/${budgetId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete budget.");
      }

      toast.success("Budget deleted successfully!");
      setBudgets((prev) => prev.filter((budget) => budget.id !== budgetId));
      setTotalSavings((prev) => prev - (budgets.find((b) => b.id === budgetId)?.saving || 0));
    } catch (error) {
      console.error("Delete Budget Error:", error);
      toast.error(error.message || "Failed to delete budget. Please try again.");
    }
  };

  const getTotalExpenses = () => {
    return expenses.reduce((total, expense) => total + parseFloat(expense.amount), 0);
  };

  useEffect(() => {
    if (!userLoading && !current_user) {
      navigate("/login");
    }
  }, [current_user, userLoading, navigate]);

  useEffect(() => {
    if (current_user && current_user.data) {
      fetchBudgets(current_user.data.id);
    }
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, [current_user]);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Current Time: {currentTime.toLocaleTimeString()}</p>
        <div className="financial-summary">
          <h3>Total Savings: KES {totalSavings.toFixed(2)}</h3>
          <h3>Total Expenses: KES {getTotalExpenses().toFixed(2)}</h3>
        </div>
        <div>
          <Button onClick={() => navigate("/add-budget")}>Add Budget</Button>
          <Button onClick={() => navigate("/add-expense")}>Add Expense</Button>
          <Button onClick={() => navigate("/profile")}>Profile</Button>
          <Button onClick={logout}>Logout</Button>
        </div>
      </div>

      {userLoading ? (
        <p>Loading user data...</p>
      ) : budgetLoading ? (
        <p>Loading budgets...</p>
      ) : error ? (
        <p>Error: {error}</p>
      ) : budgets.length === 0 ? (
        <p>No budgets added yet.</p>
      ) : (
        <div className="budget-list">
          {budgets.map((budget) => (
            <div key={budget.id} className="budget-item">
              <h3>{budget.category}</h3>
              <p>Limit: KES {budget.limit ? budget.limit.toLocaleString() : "0"}</p>
              <p className={`saving ${budget.saving < 0 ? "negative" : ""}`}>
                Savings: KES {budget.saving.toFixed(2)}
              </p>
              <div>
                <Button onClick={() => setEditingBudget(budget)}>Edit</Button>
                <Button onClick={() => deleteBudget(budget.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingBudget && (
        <div className="edit-modal">
          <h2>Edit Budget</h2>
          <label>Category:</label>
          <input
            type="text"
            value={editingBudget.category}
            onChange={(e) =>
              setEditingBudget({ ...editingBudget, category: e.target.value })
            }
          />
          <label>Limit (KES):</label>
          <input
            type="number"
            value={editingBudget.limit}
            onChange={(e) =>
              setEditingBudget({
                ...editingBudget,
                limit: Number(e.target.value),
                saving: calculateSavings({ ...editingBudget, limit: Number(e.target.value) }),
              })
            }
          />
          <p>Current Savings: KES {editingBudget.saving.toLocaleString()}</p>
          <Button onClick={saveBudget}>Save</Button>
          <Button onClick={() => setEditingBudget(null)}>Cancel</Button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;