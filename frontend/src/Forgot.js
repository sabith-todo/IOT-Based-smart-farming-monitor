import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './login.css';

function Forgot() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
  });

  const [loading, setLoading] = useState(false);

  // Handle input change
  const handleChange = (e) => {
    const { id, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    const email = formData.email.trim().toLowerCase();
    const newPassword = formData.newPassword.trim();

    // Validation
    if (!email || !newPassword) {
      alert("Please fill all fields");
      return;
    }

    if (newPassword.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:4000/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, newPassword }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Reset failed ❌");
        return;
      }

      alert("Password updated successfully ✅");

      // Clear form
      setFormData({
        email: '',
        newPassword: '',
      });

      // Redirect to login
      navigate('/login');

    } catch (error) {
      console.error("Forgot error:", error);
      alert("Server error. Check backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-wrapper">

        {/* LEFT SIDE */}
        <div className="login-left">
          <h1>
            Reset <span>Password</span>
          </h1>
          <p>
            Enter your registered email and create a new password to continue using the Smart Farming Monitor system.
          </p>
        </div>

        {/* RIGHT SIDE */}
        <div className="login-box">
          <h2>Reset Password</h2>

          <form onSubmit={handleSubmit}>

            <label>Email</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <label>New Password</label>
            <input
              type="password"
              id="newPassword"
              placeholder="Enter new password"
              minLength="8"
              value={formData.newPassword}
              onChange={handleChange}
              required
            />

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Updating..." : "Reset Password"}
            </button>

            <div className="links">
              <Link to="/login">Back to Login</Link>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}

export default Forgot;