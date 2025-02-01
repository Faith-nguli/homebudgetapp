import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';


const CategoryDetails = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { expense } = state || {}; // Get the expense details
  const [categoryDetails, setCategoryDetails] = useState(null);

  useEffect(() => {
    if (expense) {
      setCategoryDetails({
        items: ["Groceries", "Dining Out", "Snacks"], // Example items
        total: expense.amount, 
      });
    }
  }, [expense]);

  if (!expense) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-700">
          No budget data found. 
          <button 
            className="text-blue-500 underline ml-2" 
            onClick={() => navigate("/")}
          >
            Go back
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-gray-800">{expense.category} Details</h1>
        <p className="text-lg font-medium text-gray-600 mt-4">
          Total Budget: KES {expense.amount.toLocaleString()}
        </p>

        {/* Display budget breakdown */}
        <div className="mt-6">
          <h2 className="text-2xl font-semibold text-gray-700">Budget Items</h2>
          <ul className="mt-3 space-y-2">
            {categoryDetails?.items?.map((item, index) => (
              <li key={index} className="flex justify-between text-gray-700">
                <span>{item}</span>
                <span>KES {(Math.random() * expense.amount * 0.3).toFixed(2)}</span> 
              </li>
            ))}
          </ul>
        </div>
        
        {/* Back Button */}
        <button 
          className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600"
          onClick={() => navigate('/')}
        >
          Back to Dashboard
        </button>
       
      </div>
    </div>
    
  );
};

export default CategoryDetails;
