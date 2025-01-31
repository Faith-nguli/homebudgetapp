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

// Create the context
export const UserContext = createContext(defaultUserContext);

export const UserProvider = ({ children }) => {
  const navigate = useNavigate();
  const [authToken, setAuthToken] = useState(() => sessionStorage.getItem("token"));
  const [current_user, setCurrentUser] = useState(null);

  const fetchCurrentUser = async (token) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/user`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      console.log("Fetching current user:", res);

      if (!res.ok) {
        if (res.status === 401) {
          console.warn("Unauthorized: Token expired or invalid");
          logout();
        }
        throw new Error(`Failed to fetch user: ${await res.text()}`);
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

  const login = async (email, password) => {
    const toastId = toast.loading("Logging you in...");

    try {
      const response = await fetch(`http://127.0.0.1:5000/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      const responseData = await response.json();

      if (responseData.access_token) {
        sessionStorage.setItem("token", responseData.access_token);
        setAuthToken(responseData.access_token);
        await fetchCurrentUser(responseData.access_token);

        toast.update(toastId, {
          render: "Login successful!",
          type: "success",
          isLoading: false,
          autoClose: 2000,
        });

        navigate("/dashboard");
      } else {
        throw new Error("No access token received from the server.");
      }
    } catch (error) {
      toast.update(toastId, {
        render: error.message || "Login failed",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
      console.error("Login error:", error);
    }
  };

  const logout = () => {
    sessionStorage.removeItem("token");
    setAuthToken(null);
    setCurrentUser(null);
    toast.info("Logged out successfully");
    navigate("/login");
  };

  const addUser = async (username, email, password) => {
    const toastId = toast.loading("Registering you...");
  
    try {
      const response = await fetch("http://127.0.0.1:5000/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }
  
      const responseData = await response.json();
  
      if (responseData.access_token) {
        sessionStorage.setItem("token", responseData.access_token);
        setAuthToken(responseData.access_token);
  
        await fetchCurrentUser(responseData.access_token); // Fetch user after successful registration
  
        toast.update(toastId, {
          render: "Registered successfully! Redirecting...",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
  
        navigate("/dashboard"); // Redirect after successful registration
      } else {
        throw new Error("Registration failed. No token returned.");
      }
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
  
  
  const updateUser = async (userId, updatedInfo) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/user/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify(updatedInfo),
      });

      if (!res.ok) {
        throw new Error(`Failed to update user: ${await res.text()}`);
      }

      const updatedUser = await res.json();
      setCurrentUser(updatedUser);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
      console.error("Update error:", error);
    }
  };

  const deleteUser = async (userId) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/user/${userId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${authToken}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to delete user: ${await res.text()}`);
      }

      toast.success("Account deleted successfully");
      logout();
    } catch (error) {
      toast.error("Failed to delete account");
      console.error("Delete error:", error);
    }
  };

  return (
    <UserContext.Provider value={{ current_user, login, logout, addUser, updateUser, deleteUser }}>
      {children}
    </UserContext.Provider>
  );
};
