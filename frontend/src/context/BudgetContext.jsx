import React, { createContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import jwtDecode from "jwt-decode";

export const BudgetContext = createContext();

export const BudgetProvider = ({ children }) => {
  const [budgets, setBudgets] = useState([]);
  const [imageUrl, setImageUrl] = useState("");

  // 🔹 Fetch Budgets (Runs on load if logged in)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchBudgets(token);
    } else {
      console.error("No token found. Please log in.");
    }
  }, []);

  const fetchBudgets = async () => {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            console.error("No token found. User is not authenticated.");
            return;
        }

        const response = await fetch("https://homebudgetapp-1.onrender.com/budgets", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`, // Ensure authentication
                "Content-Type": "application/json"
            },
        });

        if (response.status === 401) {
            console.error("Unauthorized access. Redirecting to login.");
            localStorage.removeItem("token");
            navigate("/login");
            return;
        }

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        setBudgets(data); // Assuming you store budgets in state
    } catch (error) {
        console.error("Fetch budgets error:", error);
        alert("Failed to load budgets.");
    }
};


  // 🔹 Fetch Single Budget By ID
  const fetchBudgetById = async (budget_id) => {
    try {
      const response = await fetch(`https://homebudgetapp-1.onrender.com/budget/${budget_id}`);

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

  // 🔹 Handle Image Upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    const toastId = toast.loading("Uploading image...");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found. Please log in.");
      }

      const response = await fetch("https://homebudgetapp-1.onrender.com/budgets/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setImageUrl(data.image_url);
        toast.update(toastId, {
          render: "Image uploaded successfully",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      } else {
        throw new Error(data.error || "Image upload failed");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.update(toastId, {
        render: error.message || "Image upload failed",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  // 🔹 Add New Budget
  const addBudget = async (budgetData) => {
    const toastId = toast.loading("Adding budget...");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found. Please log in.");
      }

      const response = await fetch("https://homebudgetapp-1.onrender.com/budgets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(budgetData),
      });

      if (!response.ok) {
        throw new Error("Failed to add budget.");
      }

      const newBudget = await response.json();
      setBudgets((prevBudgets) => [...prevBudgets, newBudget]);

      toast.update(toastId, {
        render: "Budget added successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      toast.update(toastId, {
        render: error.message || "Error adding budget.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
      console.error("Add budget error:", error);
    }
  };

  // 🔹 Update Budget
  const updateBudget = async (budget_id, updatedData) => {
    const toastId = toast.loading("Updating budget...");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found. Please log in.");
      }

      const response = await fetch(`https://homebudgetapp-1.onrender.com/budgets/${budget_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        throw new Error("Failed to update budget.");
      }

      const updatedBudget = await response.json();
      setBudgets((prevBudgets) =>
        prevBudgets.map((budget) =>
          budget.id === budget_id ? updatedBudget : budget
        )
      );

      toast.update(toastId, {
        render: "Budget updated successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      toast.update(toastId, {
        render: error.message || "Error updating budget.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
      console.error("Update error:", error);
    }
  };

  // 🔹 Delete Budget
  const deleteBudget = async (budget_id) => {
    const toastId = toast.loading("Deleting budget...");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found. Please log in.");
      }

      const response = await fetch(`https://homebudgetapp-1.onrender.com/budgets/${budget_id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete budget.");
      }

      setBudgets((prevBudgets) => prevBudgets.filter((budget) => budget.id !== budget_id));

      toast.update(toastId, {
        render: "Budget deleted successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      toast.update(toastId, {
        render: error.message || "Error deleting budget.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
      console.error("Delete error:", error);
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
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
};
