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
  const [authToken, setAuthToken] = useState(() => localStorage.getItem("token"));
  const [current_user, setCurrentUser] = useState(null);

  // 🔹 FETCH CURRENT USER
  const fetchCurrentUser = async (token) => {
    if (!token) return;

    try {
      const res = await fetch("https://homebudgetapp-1.onrender.com/user", {
        method: "GET",
        headers: {
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

  // 🔹 LOGIN
  const login = async (email, password) => {
    const toastId = toast.loading("Logging in...");

    try {
      const response = await fetch("https://homebudgetapp-1.onrender.com/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const responseData = await response.json();

      if (!response.ok || !responseData.token) {
        throw new Error(responseData.error || "Login failed");
      }

      // Store token and fetch user
      localStorage.setItem("token", responseData.token);
      setAuthToken(responseData.token);
      fetchCurrentUser(responseData.token);

      toast.update(toastId, { render: "Login successful!", type: "success", isLoading: false, autoClose: 2000 });
      setTimeout(() => navigate("/dashboard"), 500);
    } catch (error) {
      toast.update(toastId, { render: error.message || "Login failed", type: "error", isLoading: false, autoClose: 3000 });
      console.error("Login error:", error);
    }
  };

  // 🔹 LOGOUT
  const logout = () => {
    localStorage.removeItem("token");
    setAuthToken(null);
    setCurrentUser(null);
    toast.info("Logged out successfully");
    setTimeout(() => navigate("/login"), 500);
  };

  // 🔹 REGISTER USER
  const addUser = async (username, email, password) => {
    const toastId = toast.loading("Registering...");

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

        // Log the response
        const responseData = await response.json();
        console.log("🔍 Full server response:", responseData);

        if (!response.ok) {
            throw new Error(responseData.error || "Registration failed");
        }

        // ✅ Fix: Access token is inside responseData.data.access_token
        const token = responseData.data?.access_token;  
        if (!token) {
            throw new Error("No access token received");
        }

        // ✅ Store token and set authentication state
        sessionStorage.setItem("token", token);
        setAuthToken(token);
        fetchCurrentUser(token);

        toast.update(toastId, { render: "Registration successful!", type: "success", isLoading: false, autoClose: 2000 });
        setTimeout(() => navigate("/dashboard"), 500);
    } catch (error) {
        toast.update(toastId, { render: error.message || "Registration failed", type: "error", isLoading: false, autoClose: 3000 });
        console.error("❌ Registration error:", error);
    }
};



  // 🔹 UPDATE USER
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

  // 🔹 DELETE USER
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
    <UserContext.Provider value={{ current_user, setUser: setCurrentUser, login, logout, addUser, updateUser, deleteUser }}>
      {children}
    </UserContext.Provider>
  );
};
