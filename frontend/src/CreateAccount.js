import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './CreateAccount.css';

function CreateAccount() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'student',
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { username, email, password, role } = formData;

    if (!username || !email || !password) {
      alert('Please fill all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:4000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || 'Registration failed');
        setLoading(false);
        return;
      }

      alert('Account created successfully');
      navigate('/login');
    } catch (error) {
      console.error('Register error:', error);
      alert('Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-page">
      <div className="signup-wrapper">
        <div className="signup-left">
          <h1>
            Join <span>Smart Farming Monitor</span> Today
          </h1>
          <p>
            Create your account to access live weather updates, soil condition
            monitoring, smart farming insights, and dashboard analysis.
          </p>
        </div>

        <div className="signup-box">
          <h2>Create Account</h2>

          <form onSubmit={handleSubmit}>
            <label>Username</label>
            <input
              type="text"
              id="username"
              placeholder="Enter your username"
              value={formData.username}
              onChange={handleChange}
              required
            />

            <p className="help-text">
              Use letters, numbers, or hyphens only.
            </p>

            <label>Email</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <label>Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              minLength="8"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <p className="help-text">
              Password must be at least 8 characters.
            </p>

            <label>Role</label>
            <select
              id="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="student">User</option>
              <option value="admin">Admin</option>
            </select>

            <button type="submit" className="signup-btn" disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </button>

            <div className="bottom-links">
              <p>
                Already have an account? <Link to="/login">Sign In</Link>
              </p>
              <Link to="/">Back to Home</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateAccount;