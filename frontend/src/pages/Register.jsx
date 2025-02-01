import React, { useState, useContext } from "react";
import { UserContext } from "../context/userContext";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react"; // Import eye icons


const Register = () => {


 const [showPassword, setShowPassword] = useState(false); // Toggle state


 const togglePasswordVisibility = () => {
   setShowPassword((prev) => !prev);
 };


 const [formData, setFormData] = useState({
   username: '',
   email: '',
   password: ''
 });
 const { addUser } = useContext(UserContext);


 const handleSubmit = async (e) => {
   e.preventDefault();
   try {
     await addUser(formData.username, formData.email, formData.password);
   } catch (error) {
     console.error("Error during registration:", error);
   }
 };

 const handleChange = (e) => {
  setFormData(prev => ({
    ...prev,
    [e.target.name]: e.target.value
  }));
};


return (
  <div className="register-container">
    <form onSubmit={handleSubmit} className="register-form">
      <h2 className="register-header">Register with us</h2>


      <div className="input-group">
        <label htmlFor="username" className="label">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          value={formData.username}
          onChange={handleChange}
          className="input-field"
          required
        />
      </div>


      <div className="input-group">
        <label htmlFor="email" className="label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          className="input-field"
          required
          />
          </div>
   
   
          <div className="input-group password-group">
            <label htmlFor="password" className="label">
              Password
            </label>
            <div className="password-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                className="input-field"
                required
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
            Register
          </button>
   
   
          <p className="login-text">
            Already have an account?{" "}
            <Link to="/login" className="login-link">
              Log in
            </Link>
          </p>
        </form>
      </div>
      );
    };
    
    
    export default Register;
    
    
    
   



  