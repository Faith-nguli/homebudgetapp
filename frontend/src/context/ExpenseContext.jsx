// ExpenseContext.js
import React, { createContext, useState, useEffect, useCallback, useContext } from "react";
import { toast } from "react-toastify";
import { UserContext } from "./userContext";

export const ExpenseContext = createContext();

export const ExpenseProvider = ({ children }) => {
  const [expenses, setExpenses] = useState([]);
  const { current_user } = useContext(UserContext);

  const getToken = () => localStorage.getItem("token") || "";

  const fetchExpenses = useCallback(async () => {
    const token = getToken();
    const userId = current_user?.id;

    if (!token || !userId) {
      console.warn("No token or user ID found. Redirecting to login.");
      toast.error("Session expired. Please log in.");
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:5000/expenses`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        toast.error("Unauthorized. Please log in again.");
        localStorage.removeItem("token");
        return;
      }

      if (!response.ok) throw new Error("Failed to fetch expenses.");

      const data = await response.json();
      setExpenses(data.data); // Assuming the backend returns { success: true, data: [...] }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error(error.message || "Error fetching expenses.");
    }
  }, [current_user]);

  useEffect(() => {
    if (current_user?.id) {
      fetchExpenses();
    }
  }, [current_user, fetchExpenses]);

  const addExpense = async (expenseData) => {
    const token = getToken();
    const userId = current_user?.id;

    if (!token || !userId) {
      toast.error("Session expired. Please log in.");
      return;
    }

    const toastId = toast.loading("Adding expense...");

    try {
      const response = await fetch("http://127.0.0.1:5000/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...expenseData, user_id: userId }),
      });

      if (response.status === 401) {
        toast.error("Unauthorized. Please log in again.");
        localStorage.removeItem("token");
        return;
      }

      if (!response.ok) throw new Error("Failed to add expense.");

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