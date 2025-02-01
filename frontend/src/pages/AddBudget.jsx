import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { BudgetContext } from '../context/BudgetContext';

function AddBudget() {
  const navigate = useNavigate();
  const { handleFileUpload } = useContext(BudgetContext); // Get image upload function

  const [budget, setBudget] = useState({
    category: '', // New field for category selection
    amount: '',
    limit: '',
    image: '',
  });

  // Handle changes for inputs
  function handleChange(e) {
    const { name, value } = e.target;
    setBudget(prev => ({ ...prev, [name]: value }));
  }

  // Handle category selection
  function handleCategoryChange(e) {
    setBudget(prev => ({ ...prev, category: e.target.value }));
  }

  // Handle image upload
  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file).then((url) => {
        setBudget((prev) => ({ ...prev, image: url }));
      });
    }
  } 

  // Handle form submission
  function handleSubmit(e) {
    e.preventDefault();
    if (!budget.category) {
      alert('Please select a category');
      return;
    }

    const categoryKey = budget.category;
    const budgetData = {
      [categoryKey + 'Amount']: parseFloat(budget.amount),
      [categoryKey + 'Limit']: parseFloat(budget.limit),
      [categoryKey + 'Image']: budget.image,
    };

    console.log('Attempting to submit:', budgetData);

    fetch('http://localhost:5000/add-budget', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(budgetData),
    })
    .then(response => {
      if (!response.ok) {
        // Fixed template literal syntax
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        console.log('Budget added successfully');
        navigate('/');
      } else {
        alert('Failed to add budget: ' + (data.message || 'Unknown error'));
      }
    })
    .catch(error => {
      console.error('Error submitting budget:', error);
      alert('Failed to submit budget: ' + error.message);
    });
  }

  return (
    <div className="add-budget-form">
      <h2>Add Budget</h2>
      <form onSubmit={handleSubmit}>
        {/* Category Selection */}
        <div className="form-group">
          <label>Category</label>
          <select name="category" value={budget.category} onChange={handleCategoryChange} required>
            <option value="">Select Category</option>
            <option value="food">Food</option>
            <option value="transport">Transport</option>
            <option value="entertainment">Entertainment</option>
            <option value="rent">Rent</option>
          </select>
        </div>

        {/* Amount & Limit Inputs */}
        <div className="form-group">
          <label>Amount</label>
          <input
            type="number"
            name="amount"
            value={budget.amount}
            onChange={handleChange}
            placeholder="Enter amount"
            required
          />

          <label>Limit</label>
          <input
            type="number"
            name="limit"
            value={budget.limit}
            onChange={handleChange}
            placeholder="Set limit"
            required
          />
        </div>

        {/* Image Upload */}
        <div className="form-group">
          <label>Upload Image</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} />
          {budget.image && <img src={budget.image} alt="Uploaded" width="100" />}
        </div>

        <button type="submit" className="submit-btn">Add Budget</button>
      </form>
    </div>
  );
}

export default AddBudget;
