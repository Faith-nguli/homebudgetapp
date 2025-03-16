import React, { createContext, useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";

export const ExpenseContext = createContext();

export const ExpenseProvider = ({ children }) => {
  const [expenses, setExpenses] = useState([]);
  const token = sessionStorage.getItem("token");

  // 🔹 FETCH EXPENSES
  const fetchExpenses = useCallback(async () => {
    if (!token) {
      console.warn("No token found. User must log in.");
      return;
    }

    try {
      const response = await fetch("https://homebudgetapp-1.onrender.com/expenses", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
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
  }, [token]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // 🔹 ADD NEW EXPENSE
  const addExpense = async (expenseData) => {
    if (!token) {
      toast.error("No token found. Please log in.");
      return;
    }

    const toastId = toast.loading("Adding expense...");

    try {
      const response = await fetch("https://homebudgetapp-1.onrender.com/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(expenseData),
      });

      if (!response.ok) {
        throw new Error("Failed to add expense.");
      }

      const newExpense = await response.json();
      setExpenses((prev) => [...prev, newExpense]);

      toast.update(toastId, { render: "Expense added!", type: "success", isLoading: false, autoClose: 3000 });
    } catch (error) {
      toast.update(toastId, { render: error.message, type: "error", isLoading: false, autoClose: 3000 });
    }
  };

  return (
    <ExpenseContext.Provider value={{ expenses, fetchExpenses, addExpense }}>
      {children}
    </ExpenseContext.Provider>
  );
};
