import React from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="p-4 flex justify-end">
        <div className="space-x-4">
          <button
            className="register px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            onClick={() => navigate("/register")}
          >
            Register
          </button>
          <button
            className="login px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
          <button
            className="dashboard px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="hero flex-grow flex flex-col items-center justify-center text-center">
        <div>
          <h1 className="text-gray-800 text-3xl font-bold">
            WELCOME TO WALLY'S BUDGETING APP
          </h1>
          <p className="text-gray-600">
            Want to track your finances but don't know how?
          </p>
          <p className="text-gray-600">Let's help you get it done!</p>
          <button
          className="mt-4 px-6 py-2 bg-blue-500 text-gray-800 rounded-lg hover:bg-blue-600"
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