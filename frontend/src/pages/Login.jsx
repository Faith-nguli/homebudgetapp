import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { UserContext } from "../context/userContext"; 
import { toast } from "react-toastify";

export default function Login() {
  const navigate = useNavigate();
  const userContext = useContext(UserContext); // Get context
  const { setUser } = userContext || {}; // Ensure setUser exists

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter both email and password.");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.data.access_token);

        if (setUser) {
          setUser(data.data.user); // Ensure setUser exists before calling it
        } else {
          console.warn("setUser is not available in UserContext");
        }

        toast.success("Login successful!");
        navigate("/dashboard");
      } else {
        toast.error(data.message || "Invalid credentials.");
      }
    } catch (error) {
      console.error("Login failed:", error);
      toast.error("Server error. Please try again.");
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h3 className="login-header">Login to continue</h3>

        <div className="input-group">
          <label htmlFor="email" className="label">Email</label>
          <input
            id="email"
            type="email"
            className="input-field"
            placeholder="Enter your email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="input-group password-group">
          <label htmlFor="password" className="label">Password</label>
          <div className="password-wrapper">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              className="input-field"
              placeholder="Enter your password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="toggle-password-btn"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <button type="submit" className="submit-btn">
          Login
        </button>

        <div className="login-link">
          Don't have an account?{" "}
          <span className="login-link-text" onClick={() => navigate("/register")}>
            Register
          </span>
        </div>
      </form>
    </div>
  );
}
