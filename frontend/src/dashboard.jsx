import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './../container.css'; 

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="dashboard-page">
      <header className="navbar">
        <div className="logo">SmartFarm</div>
        <nav>
          <Link to="/">Home</Link>
          <button className="logout-btn" onClick={() => navigate('/login')}>Logout</button>
        </nav>
      </header>

      <section className="dashboard-hero">
        <div className="hero-text">
          <h1>Welcome to Your <span>Smart Farming Dashboard</span></h1>
          <p>Monitor farm conditions and track live sensor data saved in your SQLite database.</p>
        </div>
      </section>

      <section className="project-section">
        <h2>System Modules</h2>
        <div className="project-grid">A
          <div className="project-card">
            <h3>Live Monitoring</h3>
            <p>View real-time updates for Temperature, Humidity, and Soil Moisture.</p>
            <button onClick={() => navigate('/live-data')}>Open Live Chart</button>
          </div>

          <div className="project-card">
            <h3>Soil Analysis</h3>
            <p>Check pH levels and light intensity values for crop health.</p>
            <button onClick={() => navigate('/live-data')}>View Soil Stats</button>
          </div>

          <div className="project-card">
            <h3>Device History</h3>
            <p>Access the last 100 readings stored in your data.db file.</p>
            <button onClick={() => alert('History log coming soon!')}>View Logs</button>
          </div>
        </div>
      </section>

      <footer className="footer">
        <p>Author: Sabith</p>
        <p>© 2026 Smart Farming Monitor. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Dashboard;