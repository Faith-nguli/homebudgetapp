import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { UserProvider } from './context/userContext';
import { BudgetProvider } from './context/BudgetContext';
import { ExpenseProvider } from './context/ExpenseContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Register from './pages/Register';
import Profile from './pages/Profile';
import NotFound from "./pages/NotFoundPage";
import Login from './pages/Login';
import Dashboard from './components/Dashboard';

import AddBudget from './pages/AddBudget';
import AddExpense from './pages/AddExpense';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import './App.css';

function App() {
  return (
    <Router>
      <UserProvider> 
        <BudgetProvider> 
          <ExpenseProvider> 
            <ToastContainer /> 
            <Routes>
              {/* Wrap everything inside Layout */}
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="register" element={<Register />} />
                <Route path="profile" element={<Profile />} />
                <Route path="login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="add-budget" element={<AddBudget />} />  
                <Route path="add-expense" element={<AddExpense />} />

                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </ExpenseProvider>
        </BudgetProvider>
      </UserProvider>
    </Router>
  );
}

export default App;
