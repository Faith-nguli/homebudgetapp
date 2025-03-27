import React, { createContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";


const defaultUserContext = {
  current_user: null,
  login: async () => {},
  logout: () => {},
  addUser: async () => {},
  updateUser: async () => {},
  deleteUser: async () => {},
  loading: true,
};

export const UserContext = createContext(defaultUserContext);

export const UserProvider = ({ children }) => {
  const navigate = useNavigate();
  const [authToken, setAuthToken] = useState(() => localStorage.getItem("token"));
  const [current_user, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async (token) => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:5000/user", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Session expired. Please log in again.");
          logout();
          return;
        }
        throw new Error(`Failed to fetch user: ${res.statusText}`);
      }

      const data = await res.json();
      setCurrentUser(data);
    } catch (error) {
      console.error("Error fetching user:", error.message);
      toast.error("Failed to fetch user details. Please log in again.");
      logout();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authToken) {
      fetchCurrentUser(authToken);
    } else {
      setLoading(false);
      logout();
    }
  }, [authToken, fetchCurrentUser]);

  const login = async (email, password) => {
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    const toastId = toast.loading("Logging in...");

    try {
      const response = await fetch("http://127.0.0.1:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const responseData = await response.json();

      if (!response.ok || responseData.status !== "success") {
        throw new Error(responseData.message || "Invalid email or password");
      }

      localStorage.setItem("token", responseData.data.access_token);
      setAuthToken(responseData.data.access_token);
      await fetchCurrentUser(responseData.data.access_token);

      toast.update(toastId, {
        render: "Login successful!",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });

      setTimeout(() => navigate("/dashboard"), 500);
    } catch (error) {
      toast.update(toastId, {
        render: error.message || "Login failed",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
      console.error("Login error:", error.message);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setAuthToken(null);
    setCurrentUser(null);
    toast.info("Logged out successfully");
    navigate("/login");
  }, [navigate]);

  const addUser = async (username, email, password) => {
    const toastId = toast.loading("Registering...");

    try {
      const response = await fetch("http://127.0.0.1:5000/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const responseData = await response.json();
      console.log("Backend Response:", responseData); // Debugging log

      if (!response.ok) {
        throw new Error(responseData.error || "Registration failed");
      }

      // ✅ Extract token correctly
      const token = responseData?.data?.access_token;
      if (!token) {
        console.error("No access token received:", responseData); // Debugging log
        throw new Error("No access token received");
      }

      localStorage.setItem("token", token);
      setAuthToken(token);
      fetchCurrentUser(token);

      toast.update(toastId, {
        render: "Registration successful!",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });

      setTimeout(() => navigate("/dashboard"), 500);
    } catch (error) {
      console.error("Registration error:", error);
      toast.update(toastId, {
        render: error.message || "Registration failed",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };



  const updateUser = async (user_id, updatedInfo) => {
    if (!authToken) {
      toast.error("Unauthorized! Please log in again.");
      return;
    }

    try {
      const res = await fetch(`http://127.0.0.1:5000/user/${user_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updatedInfo),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update user");
      }

      const updatedUser = await res.json();
      setCurrentUser(updatedUser);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
      console.error("Update error:", error);
    }
  };

  const deleteUser = async (user_id) => {
    if (!authToken) {
      toast.error("Unauthorized! Please log in again.");
      return;
    }

    try {
      const res = await fetch(`http://127.0.0.1:5000/user/${user_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete user");
      }

      toast.success("Account deleted successfully");
      logout();
    } catch (error) {
      toast.error(error.message || "Failed to delete account");
      console.error("Delete error:", error);
    }
  };

  return (
    <UserContext.Provider
      value={{
        current_user,
        login,
        logout,
        addUser,
        updateUser,
        deleteUser,
        loading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};