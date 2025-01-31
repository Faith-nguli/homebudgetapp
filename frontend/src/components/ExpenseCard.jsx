import React from "react";
import { useNavigate } from "react-router-dom";

const ExpenseCard = ({ expense }) => {
  const navigate = useNavigate();

  if (!expense) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-red-100 p-6 rounded-lg shadow-lg text-center">
          <p className="text-red-500 text-lg font-semibold">No expense found!</p>
          <button
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg shadow"
            onClick={() => navigate("/")}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-96 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">{expense.category}</h2>
        <p className="text-2xl font-bold text-green-500">KES {expense.amount.toLocaleString()}</p>
        <button
          className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg shadow"
          onClick={() => navigate("/")}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default ExpenseCard;
