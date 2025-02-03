import React, { useEffect, useState, useContext } from "react";
import { BudgetContext } from "../context/BudgetContext";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";

const BudgetDetail = () => {
  const { budget_id } = useParams(); // Get budgetId from the URL
  const { fetchBudgetById } = useContext(BudgetContext);
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!budget_id) {
      setError("Invalid budget ID.");
      setLoading(false);
      return;
    }

    const loadBudget = async () => {
      try {
        console.log("Fetching budget with ID:", budget_id);
        const data = await fetchBudgetById(budget_id);
        if (data) {
          setBudget(data);
        } else {
          setError("Budget not found.");
        }
      } catch (error) {
        setError("Error fetching budget.");
        toast.error("Error fetching budget.");
      } finally {
        setLoading(false);
      }
    };

    loadBudget();
  }, [budget_id, fetchBudgetById]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!budget) return <p>No budget found.</p>;

  return (
    <div className="budget-detail">
      <h2>{budget.category}</h2>
      {budget.image_url && <img src={budget.image_url} alt={budget.category} className="budget-image" />}
      <p>Limit: KES {budget.limit}</p>
      <p>Current Spent: KES {budget.current_spent}</p>
      <p className={`status ${budget.current_spent > budget.limit ? "over-budget" : "within-budget"}`}>
        {budget.current_spent > budget.limit ? "Over Budget!" : "Within Budget"}
      </p>
    </div>
  );
};

export default BudgetDetail;

// Update fetchBudgetById function inside BudgetContext
export const fetchBudgetById = async (budget_id) => {
  try {
    if (!budget_id) throw new Error("Invalid budget ID.");

    const token = localStorage.getItem("token");
    if (!token) throw new Error("No authentication token found.");

    const response = await fetch(`http://127.0.0.1:5000/budgets/${budget_id}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch budget.");
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch single budget error:", error);
    toast.error("Error fetching budget.");
    return null;
  }
};
