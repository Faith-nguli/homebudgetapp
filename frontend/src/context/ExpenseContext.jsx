import React, { createContext, useState, useEffect } from "react";
import { toast } from "react-toastify";

export const ExpenseContext = createContext();

export const ExpenseProvider = ({ children }) => {
  const [expenses, setExpenses] = useState([]);

  // 🔹 FETCH EXPENSES (Runs on load)
  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/expense");

      if (!response.ok) {
        throw new Error("Failed to fetch expenses.");
      }

      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Error fetching expenses.");
    }
  };

  // 🔹 ADD NEW EXPENSE
  const addExpense = async (expenseData) => {
    toast.loading("Adding expense...");

    try {
      const response = await fetch("http://127.0.0.1:5000/expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expenseData),
      });

      if (!response.ok) {
        throw new Error("Failed to add expense.");
      }

      const newExpense = await response.json();
      setExpenses((prevExpenses) => [...prevExpenses, newExpense]); 

      toast.dismiss();
      toast.success("Expense added successfully!");
    } catch (error) {
      toast.dismiss();
      console.error("Add expense error:", error);
      toast.error("Error adding expense.");
    }
  };

  // 🔹 UPDATE EXPENSE
  const updateExpense = async (expenseId, updatedData) => {
    toast.loading("Updating expense...");

    try {
      const response = await fetch(`http://127.0.0.1:5000/expense/${expenseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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

      toast.dismiss();
      toast.success("Expense updated successfully!");
    } catch (error) {
      toast.dismiss();
      console.error("Update error:", error);
      toast.error("Error updating expense.");
    }
  };

  // 🔹 DELETE EXPENSE
  const deleteExpense = async (expenseId) => {
    toast.loading("Deleting expense...");

    try {
      const response = await fetch(`http://127.0.0.1:5000/expense/${expenseId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete expense.");
      }

      setExpenses((prevExpenses) => prevExpenses.filter((expense) => expense.id !== expenseId));

      toast.dismiss();
      toast.success("Expense deleted successfully!");
    } catch (error) {
      toast.dismiss();
      console.error("Delete error:", error);
      toast.error("Error deleting expense.");
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
