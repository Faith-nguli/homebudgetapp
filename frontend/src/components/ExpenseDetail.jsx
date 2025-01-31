import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ExpenseCard from "./ExpenseCard"; // Import ExpenseCard

const ExpenseDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const expense = location.state?.expense; // Get expense from navigation state

  return (
    <div>
      <ExpenseCard expense={expense} />
      <button className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg" onClick={() => navigate("/")}>
        Back to Dashboard
      </button>
    </div>
  );
};

export default ExpenseDetail;
