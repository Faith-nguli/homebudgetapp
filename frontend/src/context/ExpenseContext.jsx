import React, { createContext, useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";

export const ExpenseContext = createContext();

export const ExpenseProvider = ({ children }) => {
  const [expenses, setExpenses] = useState([]);

  // 🔹 FETCH EXPENSES (Runs on load)
  const fetchExpenses = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found. Please log in.");
      }

      const response = await fetch("https://homebudgetapp-1.onrender.com/expenses", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch expenses.");
      }

      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error(error.message || "Error fetching expenses.");
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // 🔹 ADD NEW EXPENSE
  const addExpense = async (expenseData) => {
    const toastId = toast.loading("Adding expense...");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found. Please log in.");
      }

      const response = await fetch("https://homebudgetapp-1.onrender.com/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(expenseData),
      });

      if (!response.ok) {
        throw new Error("Failed to add expense.");
      }

      const newExpense = await response.json();
      setExpenses((prevExpenses) => [...prevExpenses, newExpense]);

      toast.update(toastId, {
        render: "Expense added successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      toast.update(toastId, {
        render: error.message || "Error adding expense.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  // 🔹 UPDATE EXPENSE
  const updateExpense = async (expenseId, updatedData) => {
    const toastId = toast.loading("Updating expense...");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found. Please log in.");
      }

      const response = await fetch(`https://homebudgetapp-1.onrender.com/expenses/${expenseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        throw new Error("Failed to update expense.");
      }

      const updatedExpense = await response.json();
      setExpenses((prevExpenses) =>
        prevExpenses.map((expense) =>
          expense.id === expenseId ? updatedExpense : expense
        )
      );

      toast.update(toastId, {
        render: "Expense updated successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      toast.update(toastId, {
        render: error.message || "Error updating expense.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  // 🔹 DELETE EXPENSE
  const deleteExpense = async (expenseId) => {
    const toastId = toast.loading("Deleting expense...");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found. Please log in.");
      }

      const response = await fetch(`https://homebudgetapp-1.onrender.com/expenses/${expenseId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete expense.");
      }

      setExpenses((prevExpenses) => prevExpenses.filter((expense) => expense.id !== expenseId));

      toast.update(toastId, {
        render: "Expense deleted successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      toast.update(toastId, {
        render: error.message || "Error deleting expense.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  return (
    <ExpenseContext.Provider value={{
      expenses,
      fetchExpenses,
      addExpense,
      updateExpense,
      deleteExpense,
    }}>
      {children}
    </ExpenseContext.Provider>
  );
};
