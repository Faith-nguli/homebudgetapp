import React from 'react';
import { Wallet } from "lucide-react"; // Import Wallet icon


function Profile() {
  return (
    <div className="profile-container">
    <header className="relative w-full flex items-center p-4">
  {/* <div className="logo-icon">
    <Wallet size={24} />
  </div> */}
  <nav className="absolute top-4 right-4 flex gap-4">
        <button
          className="dashboard"
          onClick={() => navigate("/dashboard")}
        >
          Dashboard
        </button>
        <button
          className="logout"
          onClick={() => navigate("/logout")}
        >
          Logout
        </button>
  </nav>
</header>


      <main>
        <div className="user-info">
          <img src="profile-pic.jpg" alt="Profile Picture" />
          <div className="user-details">
            <p>Username: { /* Replace with actual username */ }</p>
            <p>Email: { /* Replace with actual email */ }</p>
          </div>
        </div>
        {/* Add more profile content here (e.g., bio, settings) */}
      </main>

      <footer>
        <button>Edit</button>
        <button>Delete</button>
      </footer>
    </div>
  );
}

export default Profile;