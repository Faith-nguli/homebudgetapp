import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { UserProvider } from './context/userContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Register from './pages/Register';
import Profile from './pages/Profile';
import NotFound from "./pages/NotFoundPage";
import Login from './pages/Login';
import Dashboard from './components/Dashboard';
import BudgetDetail from './components/BudgetDetail';
import ExpenseDetail from './components/ExpenseDetail';


import './App.css';

function App() {
  return (
    <Router>
      <UserProvider> 
        <Routes>
          {/* Wrap everything inside Layout */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="register" element={<Register />} />
            <Route path="profile" element={<Profile />} />
            <Route path="login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="budget-detail/:id" element={<BudgetDetail />} />
            <Route path="expense-detail/:id" element={<ExpenseDetail />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </UserProvider> 
    </Router>
  );
}

export default App;
