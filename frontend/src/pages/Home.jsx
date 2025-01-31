import React from "react";
import { useNavigate } from "react-router-dom";


function Home() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <nav> {/* No className needed here, styled in CSS */}
        <div className="space-x-4"> {/* Flexbox for spacing */}
        {/* Added classes for styling */}
        <button
          className="register"
          onClick={() => navigate("/register")}
        >
          Register
        </button>
        {/* Added classes */}
        <button
          className="login"
          onClick={() => navigate("/login")}
        >
          Login
        </button>
        <button
          className="dashboard"
          onClick={() => navigate("/dashboard")}
        >
          Dashboard
        </button>

        </div>
      </nav>
      <div className="hero"> {/* Added hero class */}
        <div>
          <h1>
            WELCOME TO WALLY'S BUDGETING APP
          </h1>
          <p>
            Want to track your finances but don't know how?
          </p>
          <p>
            Let's help you get it done!
          </p>
        {/* Added class */}
        <button
          className="get-started"
          onClick={() => navigate("/register")}
        >
          Get Started
        </button>


        </div>
      </div>
    </div>
  );
}

export default Home;