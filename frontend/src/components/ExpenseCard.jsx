import React from "react";

const ExpenseCard = ({ expense, onEdit, onDelete }) => {
  return (
    <div className="expense-card border p-4 rounded-lg shadow-md bg-white">
      <h3 className="text-lg font-semibold">{expense.category}</h3>
      <p className="text-gray-700">Spent: KES {expense.amount.toLocaleString()}</p>
      <div className="mt-3 flex space-x-2">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          onClick={() => onEdit(expense)}
        >
          Edit
        </button>
        <button
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          onClick={() => onDelete(expense.id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default ExpenseCard;
