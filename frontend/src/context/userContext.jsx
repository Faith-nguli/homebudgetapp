import React, { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const defaultUserContext = {
  current_user: null,
  login: async () => {},
  logout: () => {},
  addUser: async () => {},
  updateUser: async () => {},
  deleteUser: async () => {},
};

export const UserContext = createContext(defaultUserContext);

export const UserProvider = ({ children }) => {
  const navigate = useNavigate();
  const [authToken, setAuthToken] = useState(() => sessionStorage.getItem("token"));
  const [current_user, setCurrentUser] = useState(null);

  // Fetch current user
  const fetchCurrentUser = async (token) => {
    if (!token) return;

    try {
      const res = await fetch("https://homebudgetapp-1.onrender.com/user", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          console.warn("Unauthorized: Token expired or invalid");
          logout();
          return;
        }
        throw new Error(`Failed to fetch user: ${res.statusText}`);
      }

      const data = await res.json();
      setCurrentUser(data);
    } catch (error) {
      console.error("Error fetching user:", error.message);
    }
  };

  useEffect(() => {
    if (authToken) fetchCurrentUser(authToken);
  }, [authToken]);

  // User Login
  const login = async (email, password) => {
    const toastId = toast.loading("Logging you in...");

    try {
      const response = await fetch("https://homebudgetapp-1.onrender.com/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Login failed" }));
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      const responseData = await response.json();
      if (!responseData.access_token) throw new Error("No access token received");

      sessionStorage.setItem("token", responseData.access_token);
      setAuthToken(responseData.access_token);
      await fetchCurrentUser(responseData.access_token);

      toast.update(toastId, { render: "Login successful!", type: "success", isLoading: false, autoClose: 2000 });
      setTimeout(() => navigate("/dashboard"), 500);
    } catch (error) {
      toast.update(toastId, { render: error.message || "Login failed", type: "error", isLoading: false, autoClose: 3000 });
      console.error("Login error:", error);
    }
  };

  // User Logout
  const logout = () => {
    sessionStorage.removeItem("token");
    setAuthToken(null);
    setCurrentUser(null);
    toast.info("Logged out successfully");
    setTimeout(() => navigate("/login"), 500);
  };

  // User Registration
  const addUser = async (username, email, password) => {
    const toastId = toast.loading("Registering you...");

    try {
      const response = await fetch("https://homebudgetapp-1.onrender.com/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Registration failed" }));
        throw new Error(errorData.error || "Registration failed");
      }

      const responseData = await response.json();
      if (!responseData.data?.access_token) throw new Error("No access token received");

      sessionStorage.setItem("token", responseData.data.access_token);
      setAuthToken(responseData.data.access_token);
      await fetchCurrentUser(responseData.data.access_token);

      toast.update(toastId, { render: "Registration successful! Redirecting...", type: "success", isLoading: false, autoClose: 2000 });
      setTimeout(() => navigate("/dashboard"), 500);
    } catch (error) {
      toast.update(toastId, { render: error.message || "Registration failed", type: "error", isLoading: false, autoClose: 3000 });
      console.error("Registration error:", error);
    }
  };

  // Update User
  const updateUser = async (user_id, updatedInfo) => {
    if (!authToken) {
      toast.error("Unauthorized! Please log in again.");
      return;
    }

    try {
      const res = await fetch(`https://homebudgetapp-1.onrender.com/user/${user_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updatedInfo),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Failed to update user" }));
        throw new Error(errorData.error);
      }

      const updatedUser = await res.json();
      setCurrentUser(updatedUser);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
      console.error("Update error:", error);
    }
  };

  // Delete User
  const deleteUser = async (user_id) => {
    if (!authToken) {
      toast.error("Unauthorized! Please log in again.");
      return;
    }

    try {
      const res = await fetch(`https://homebudgetapp-1.onrender.com/user/${user_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Failed to delete user" }));
        throw new Error(errorData.error);
      }

      toast.success("Account deleted successfully");
      logout();
    } catch (error) {
      toast.error(error.message || "Failed to delete account");
      console.error("Delete error:", error);
    }
  };

  return (
    <UserContext.Provider value={{ current_user, setUser: setCurrentUser, login, logout, addUser, updateUser, deleteUser }}>
      {children}
    </UserContext.Provider>
  );
};
