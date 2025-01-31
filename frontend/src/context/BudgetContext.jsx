import React, { createContext, useState, useEffect } from "react";
import { toast } from "react-toastify";

export const BudgetContext = createContext();

export const BudgetProvider = ({ children }) => {
  const [budgets, setBudgets] = useState([]);

  // 🔹 FETCH BUDGETS (Runs on load)
  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/budgets");

      if (!response.ok) {
        throw new Error("Failed to fetch budgets.");
      }

      const data = await response.json();
      setBudgets(data);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Error fetching budgets.");
    }
  };

  // 🔹 ADD NEW BUDGET
  const addBudget = async (budgetData) => {
    toast.loading("Adding budget...");

    try {
      const response = await fetch("http://127.0.0.1:5000/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(budgetData),
      });

      if (!response.ok) {
        throw new Error("Failed to add budget.");
      }

      const newBudget = await response.json();
      setBudgets((prevBudgets) => [...prevBudgets, newBudget]); // 

      toast.dismiss();
      toast.success("Budget added successfully!");
    } catch (error) {
      toast.dismiss();
      console.error("Add budget error:", error);
      toast.error("Error adding budget.");
    }
  };

  // 🔹 UPDATE BUDGET
  const updateBudget = async (budgetId, updatedData) => {
    toast.loading("Updating budget...");

    try {
      const response = await fetch(`http://127.0.0.1:5000/budgets/${budgetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        throw new Error("Failed to update budget.");
      }

      const updatedBudget = await response.json();
      setBudgets((prevBudgets) =>
        prevBudgets.map((budget) =>
          budget.id === budgetId ? updatedBudget : budget
        )
      );

      toast.dismiss();
      toast.success("Budget updated successfully!");
    } catch (error) {
      toast.dismiss();
      console.error("Update error:", error);
      toast.error("Error updating budget.");
    }
  };

  // 🔹 DELETE BUDGET
  const deleteBudget = async (budgetId) => {
    toast.loading("Deleting budget...");

    try {
      const response = await fetch(`http://127.0.0.1:5000/budgets/${budgetId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete budget.");
      }

      setBudgets((prevBudgets) => prevBudgets.filter((budget) => budget.id !== budgetId));

      toast.dismiss();
      toast.success("Budget deleted successfully!");
    } catch (error) {
      toast.dismiss();
      console.error("Delete error:", error);
      toast.error("Error deleting budget.");
    }
  };

  return (
    <BudgetContext.Provider value={{
      budgets,
      fetchBudgets,
      addBudget,
      updateBudget,
      deleteBudget,
    }}>
      {children}
    </BudgetContext.Provider>
  );
};
