import React, { createContext, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export const BudgetContext = createContext();

export const BudgetProvider = ({ children }) => {
  const [budgets, setBudgets] = useState([]);
  const [imageUrl, setImageUrl] = useState("");
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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

      const responseData = await response.json();

      if (response.status === 401) {
        toast.error("Session expired. Please log in again.");
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (!response.ok) throw new Error(responseData.error || "Failed to fetch budgets");

      setBudgets(responseData.map((budget) => ({ ...budget, saving: budget.saving || 0 })));
    } catch (error) {
      toast.error(error.message || "Failed to fetch budgets.");
      setError(error.message);
    } finally {
      setBudgetLoading(false);
    }
  };

  const fetchBudgetById = async (budgetId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found. Please log in.");

      const response = await fetch(`http://127.0.0.1:5000/budgets/${budgetId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return null;
      }

      if (!response.ok) throw new Error("Failed to fetch budget.");

      return await response.json();
    } catch (error) {
      toast.error(error.message);
      return null;
    }
  };

  const handleFileUpload = async (budgetId, event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found. Please log in.");

      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(`http://127.0.0.1:5000/budgets/upload/${budgetId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to upload image.");

      setImageUrl(data.image_url);
      updateBudget(budgetId, { image_url: data.image_url });
    } catch (error) {
      toast.error(error.message || "Error uploading image.");
    }
  };

  const addBudget = async (budgetData) => {
    const toastId = toast.loading("Adding budget...");

    try {
      if (!budgetData.category || isNaN(budgetData.limit) || budgetData.limit < 0) {
        throw new Error("Invalid budget data.");
      }

      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found. Please log in.");

      const response = await fetch("http://127.0.0.1:5000/budgets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(budgetData),
      });

      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.error || "Failed to add budget.");

      setBudgets((prev) => [...prev, responseData.budget]);

      toast.update(toastId, { render: "Budget added successfully!", type: "success", isLoading: false, autoClose: 3000 });
      navigate("/dashboard");
    } catch (error) {
      toast.update(toastId, { render: error.message || "Error adding budget.", type: "error", isLoading: false, autoClose: 3000 });
    }
  };

  const updateBudget = async (budgetId, updatedData) => {
    const toastId = toast.loading("Updating budget...");

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found. Please log in.");

      const response = await fetch(`http://127.0.0.1:5000/budgets/${budgetId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });

      const updatedBudget = await response.json();
      if (!response.ok) throw new Error(updatedBudget.error || "Failed to update budget.");

      setBudgets((prev) => prev.map((budget) => (budget.id === budgetId ? updatedBudget : budget)));

      toast.update(toastId, { render: "Budget updated successfully!", type: "success", isLoading: false, autoClose: 3000 });
    } catch (error) {
      toast.update(toastId, { render: error.message || "Error updating budget.", type: "error", isLoading: false, autoClose: 3000 });
    }
  };

  const deleteBudget = async (budgetId) => {
    const toastId = toast.loading("Deleting budget...");

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found. Please log in.");

      const response = await fetch(`http://127.0.0.1:5000/budgets/${budgetId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete budget.");
      }

      setBudgets((prev) => prev.filter((budget) => budget.id !== budgetId));

      toast.update(toastId, { render: "Budget deleted successfully!", type: "success", isLoading: false, autoClose: 3000 });
    } catch (error) {
      toast.update(toastId, { render: error.message || "Error deleting budget.", type: "error", isLoading: false, autoClose: 3000 });
    }
  };

  return (
    <BudgetContext.Provider
      value={{
        budgets,
        fetchBudgets,
        fetchBudgetById,
        addBudget,
        updateBudget,
        deleteBudget,
        handleFileUpload,
        imageUrl,
        budgetLoading,
        error,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
};
