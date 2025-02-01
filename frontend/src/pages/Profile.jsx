import React from 'react';
import { useNavigate } from 'react-router-dom'; // Make sure to import useNavigate from react-router-dom
import { Wallet } from "lucide-react"; // Import Wallet icon

function Profile() {
  const navigate = useNavigate(); // Define navigate

  return (
    <div className="profile-container">
      <header className="header">
        <nav className="nav">
          <button
            className="btn dashboard-btn"
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </button>
          <button
            className="btn logout-btn"
            onClick={() => navigate("/logout")}
          >
            Logout
          </button>
        </nav>
      </header>

      <main className="main-content">
        <div className="profile-card">
          <div className="profile-header">
            <img src="profile-pic.jpg" alt="Profile Picture" className="profile-pic" />
            <div className="user-info">
              <h2 className="user-name">Username</h2>
              <p className="user-email">email@example.com</p>
            </div>
          </div>
          {/* Add more profile content here (e.g., bio, settings) */}
        </div>
      </main>

      <div className="buttons-container">
        <button className="btn edit-btn">Edit</button>
        <button className="btn delete-btn">Delete</button>
      </div>
    </div>
  );
}

export default Profile;
