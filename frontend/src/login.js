import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './login.css';

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: '',
    remember: false,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberEmail');
    if (savedEmail) {
      setFormData((prev) => ({
        ...prev,
        email: savedEmail,
        remember: true,
      }));
    }
  }, []);

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value,
    }));
  };

  const loginUser = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:4000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || 'Invalid login details');
        return;
      }

      if (formData.role && data.user.role !== formData.role) {
        alert('Selected role does not match your account');
        return;
      }

      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('token', data.token); // important
      localStorage.setItem('role', data.user.role);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (formData.remember) {
        localStorage.setItem('rememberEmail', formData.email);
      } else {
        localStorage.removeItem('rememberEmail');
      }

      alert('Login successful');
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      alert('Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-wrapper">
        <div className="login-left">
          <h1>
            Welcome Back to <span>Smart Farming Monitor</span>
          </h1>
          <p>
            Login to monitor weather data, soil condition, farming insights,
            and manage your smart farming dashboard.
          </p>
        </div>

        <div className="login-box">
          <h2>Sign In</h2>

          <form onSubmit={loginUser}>
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

            <label>Role</label>
            <select
              id="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="">Select Role</option>
              <option value="admin">Admin</option>
              <option value="student">student</option>
            </select>

            <div className="remember-row">
              <label className="remember-me">
                <input
                  type="checkbox"
                  id="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                />
                Remember Me
              </label>
            </div>

            <div className="links">
              <Link to="/forgot">Forgot Password?</Link>
              <p>
                New user? <Link to="/create">Create an account</Link>
              </p>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <div className="links">
              <Link to="/">Back to Home</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;