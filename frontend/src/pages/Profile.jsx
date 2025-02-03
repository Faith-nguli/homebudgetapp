import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    username: "",
    email: "",
    profilePic: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ username: "", email: "", profilePic: "" });
  const [loading, setLoading] = useState(false);

  // Password State
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [isPasswordChanging, setIsPasswordChanging] = useState(false);

  // State for Password Visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove token
    navigate("/login"); // Redirect to login page
  };

  // Fetch User Profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/user/profile", {
          method: "GET",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        if (!response.ok) throw new Error("Failed to fetch profile");

        const data = await response.json();
        setUser(data);
        setFormData({ username: data.username, email: data.email, profilePic: data.profilePic });
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, []);

  // Handle Image Upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setFormData((prev) => ({ ...prev, profilePic: reader.result }));
      };
    }
  };

  // Handle Input Change
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Save Updated Profile
  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:5000/user/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to update profile");

      const updatedUser = await response.json();
      setUser(updatedUser);
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      alert("Error updating profile");
      console.error(error);
    }
    setLoading(false);
  };

  // Confirm and Delete Profile
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your profile?")) return;

    try {
      const response = await fetch("http://127.0.0.1:5000/user", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (!response.ok) throw new Error("Failed to delete profile");

      localStorage.removeItem("token");
      alert("Profile deleted successfully.");
      navigate("/register");
    } catch (error) {
      alert("Error deleting profile");
      console.error(error);
    }
  };

  // Handle Password Change
  const handlePasswordChange = async () => {
    setPasswordError("");

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/user/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(passwords),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to change password");

      alert("Password changed successfully!");
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setIsPasswordChanging(false);
    } catch (error) {
      setPasswordError(error.message);
      console.error(error);
    }
  };

  // Handle Password Input Change
  const handlePasswordInputChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  // Toggle Password Visibility
  const togglePasswordVisibility = (field) => {
    if (field === "current") {
      setShowCurrentPassword((prev) => !prev);
    } else if (field === "new") {
      setShowNewPassword((prev) => !prev);
    } else if (field === "confirm") {
      setShowConfirmPassword((prev) => !prev);
    }
  };

  return (
    <div className="profile-container">
      <header className="header">
        <nav className="nav">
          <button className="btn dashboard-btn" onClick={() => navigate("/dashboard")}>
            Dashboard
          </button>
          <button className="btn logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </header>

      <main className="main-content">
        <div className="profile-card">
          <div className="profile-header">
            <img
              src={formData.profilePic || "/default-avatar.png"}
              alt="Profile"
              className="profile-pic"
            />
            <input type="file" accept="image/*" onChange={handleImageUpload} hidden id="file-upload" />
            <label htmlFor="file-upload" className="upload-btn">Upload Image</label>

            <div className="user-info">
              {isEditing ? (
                <>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                </>
              ) : (
                <>
                  <h2 className="user-name">{user.username || "Guest"}</h2>
                  <p className="user-email">{user.email || "email@example.com"}</p>
                </>
              )}
            </div>
          </div>

          {/* Password Change Section */}
          <div className="password-change-section">
            <h3>Change Password</h3>
            {isPasswordChanging ? (
              <>
                <div className="password-input-group">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    name="currentPassword"
                    placeholder="Current Password"
                    value={passwords.currentPassword}
                    onChange={handlePasswordInputChange}
                    className="input-field"
                  />
                  <button type="button" onClick={() => togglePasswordVisibility("current")}>
                    {showCurrentPassword ? "Hide" : "Show"}
                  </button>
                </div>

                <div className="password-input-group">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    placeholder="New Password"
                    value={passwords.newPassword}
                    onChange={handlePasswordInputChange}
                    className="input-field"
                  />
                  <button type="button" onClick={() => togglePasswordVisibility("new")}>
                    {showNewPassword ? "Hide" : "Show"}
                  </button>
                </div>

                <div className="password-input-group">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm New Password"
                    value={passwords.confirmPassword}
                    onChange={handlePasswordInputChange}
                    className="input-field"
                  />
                  <button type="button" onClick={() => togglePasswordVisibility("confirm")}>
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>

                {passwordError && <p className="error-text">{passwordError}</p>}
                <button className="btn save-btn" onClick={handlePasswordChange}>
                  Change Password
                </button>
                <button className="btn cancel-btn" onClick={() => setIsPasswordChanging(false)}>
                  Cancel
                </button>
              </>
            ) : (
              <button className="btn change-password-btn" onClick={() => setIsPasswordChanging(true)}>
                Change Password
              </button>
            )}
          </div>
        </div>
      </main>

      <div className="buttons-container">
        {isEditing ? (
          <button className="btn save-btn" onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
        ) : (
          <button className="btn edit-btn" onClick={() => setIsEditing(true)}>
            Edit
          </button>
        )}
        <button className="btn delete-btn" onClick={handleDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}

export default Profile;
