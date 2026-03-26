import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './../index.css';

const Home = () => {
  const [modal, setModal] = useState({
    active: false,
    title: '',
    text: '',
    img: '',
  });

  const showCard = (title, text, img) => {
    setModal({ active: true, title, text, img });
  };

  const closeCard = () => {
    setModal((prev) => ({ ...prev, active: false }));
  };

  return (
    <div className="home-wrapper">
      <header
        className="navbar"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div className="logo" style={{ fontSize: '32px' }}>
          Smart Farming Monitor
        </div>

        <nav className="quick-links" style={{ marginRight: '30px', marginLeft: '50px' }} >
          <a href="#features" >Features</a>
          <a href="#how">How It Works</a>
          <a href="#modules">Modules</a>
          <a href="#benefits">Benefits</a>
          <Link
            to="/login"
            className="nav-btn"
            style={{
              background: '#22c55e',
              marginLeft: '10px',
              padding: '10px 16px',
              borderRadius: '8px',
              color: '#fff',
              textDecoration: 'none',
            }}
          >
            Login
          </Link>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-text">
          <span
            className="hero-badge"
            style={{
              background: 'linear-gradient(135deg, #14532d, #15803d, #22c55e)',
              color: '#fff',
              padding: '8px 14px',
              borderRadius: '20px',
              display: 'inline-block',
              marginBottom: '20px',
            }}
          >
            Software Based Agriculture Monitoring
          </span>

          <h1 style={{ color: 'aliceblue' }}>
            IoT Based Smart
            <br />
            Farming Monitor
          </h1>

          <p>
            A smart software platform for modern agriculture. Monitor live weather,
            soil moisture, pH, crop conditions, alerts, satellite view, and
            archived farm records in one intelligent dashboard.
          </p>

          <div className="hero-buttons">
            <Link to="/login" className="btn primary">
              Get Started
            </Link>
            <Link to="/dashboard" className="btn outline">
              Open Dashboard
            </Link>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '20px',
              marginTop: '30px',
              flexWrap: 'wrap',
            }}
          >
            <div className="step-card" style={{ minWidth: '160px', padding: '16px' }}>
              <h3>24/7</h3>
              <p>Monitoring Support</p>
            </div>
            <div className="step-card" style={{ minWidth: '160px', padding: '16px' }}>
              <h3>Live</h3>
              <p>Weather Analysis</p>
            </div>
            <div className="step-card" style={{ minWidth: '160px', padding: '16px' }}>
              <h3>Smart</h3>
              <p>Crop Suggestion</p>
            </div>
          </div>
        </div>

        <div className="hero-image">
          <img src="/img/22.webp" alt="Smart Farming" />
        </div>
      </section>

      <section
        id="features"
        className="how-it-works"
        style={{ background: '#0a0f1e', padding: '60px 0' }}
      >
        <div className="section-heading">
          <h2 style={{ color: '#22c55e' }}>Main Features</h2>
          <p>Advanced software features included in the smart farming monitor.</p>
        </div>

        <div className="steps">
          <div
            className="step-card"
            onClick={() =>
              showCard(
                'Live Weather Monitoring',
                'The system retrieves real-time weather data such as temperature and humidity to help users understand changing environmental conditions and react quickly.',
                '/img/3.jpeg'
              )
            }
          >
            <img src="/img/3.jpeg" alt="Weather" />
            <h3>Live Weather Data</h3>
            <p>Track temperature and humidity in real time.</p>
          </div>

          <div
            className="step-card"
            onClick={() =>
              showCard(
                'Satellite Map Integration',
                'The project uses a real satellite map to display farm locations and marked monitoring points for digital field observation and intelligent land tracking.',
                '/img/4.jpeg'
              )
            }
          >
            <img src="/img/4.jpeg" alt="Map" />
            <h3>Satellite Map View</h3>
            <p>Visualize farm areas through real map display.</p>
          </div>

          <div
            className="step-card"
            onClick={() =>
              showCard(
                'Soil Analysis Simulation',
                'The software simulates soil moisture and pH values to provide farming insights even without physical hardware sensors.',
                '/img/5.jpeg'
              )
            }
          >
            <img src="/img/5.jpeg" alt="Soil" />
            <h3>Soil Condition Analysis</h3>
            <p>Monitor moisture and pH using software simulation.</p>
          </div>

          <div
            className="step-card"
            onClick={() =>
              showCard(
                'Smart Alerts',
                'The system generates warning messages for high temperature, low soil moisture, and pH imbalance, helping the user respond faster.',
                '/img/6.jpeg'
              )
            }
          >
            <img src="/img/6.jpeg" alt="Alerts" />
            <h3>Intelligent Alerts</h3>
            <p>Receive fast warnings when farm conditions change.</p>
          </div>
        </div>
      </section>

      <section className="how-it-works" id="how">
        <div className="section-heading">
          <h2>How It Works</h2>
          <p>Simple software flow of the smart farming monitor.</p>
        </div>

        <div className="steps">
          <div
            className="step-card"
            onClick={() =>
              showCard(
                'Data Collection',
                'The application collects location-based weather information using APIs and combines it with simulated farming parameters like moisture and pH.',
                '/img/7.jpeg'
              )
            }
          >
            <img src="/img/7.jpeg" alt="Collection" />
            <h3>1. Collect Data</h3>
            <p>Fetch weather values and generate farm-related inputs.</p>
          </div>

          <div
            className="step-card"
            onClick={() =>
              showCard(
                'Data Processing',
                'The system processes temperature, humidity, moisture, and pH to generate warnings, crop suggestions, and real-time dashboard values.',
                '/img/8.jpeg'
              )
            }
          >
            <img src="/img/8.jpeg" alt="Processing" />
            <h3>2. Process Data</h3>
            <p>Analyze live and simulated values intelligently.</p>
          </div>

          <div
            className="step-card"
            onClick={() =>
              showCard(
                'User Output',
                'The user sees all outputs in the dashboard as cards, map markers, smart status messages, charts, and archive records.',
                '/img/9.jpeg'
              )
            }
          >
            <img src="/img/9.jpeg" alt="Output" />
            <h3>3. Display Results</h3>
            <p>Show smart results through dashboard and charts.</p>
          </div>
        </div>
      </section>

      <section
        className="how-it-works"
        id="modules"
        style={{ background: '#0a0f1e', padding: '60px 0' }}
      >
        <div className="section-heading">
          <h2 style={{ color: '#22c55e' }}>Software Modules</h2>
          <p>Main modules included in this project.</p>
        </div>

        <div className="steps">
          <div className="step-card">
            <h3>GPS Module</h3>
            <p>Detects current location and locks the map to user position.</p>
          </div>

          <div className="step-card">
            <h3>Weather API Module</h3>
            <p>Fetches live temperature and humidity from online sources.</p>
          </div>

          <div className="step-card">
            <h3>Soil Monitoring Module</h3>
            <p>Simulates soil moisture and pH conditions in software form.</p>
          </div>

          <div className="step-card">
            <h3>Crop Suggestion Module</h3>
            <p>Provides crop recommendations based on field conditions.</p>
          </div>

          <div className="step-card">
            <h3>Alert Module</h3>
            <p>Shows warnings for high temperature, low moisture, and pH imbalance.</p>
          </div>

          <div className="step-card">
            <h3>Data Archive Module</h3>
            <p>Saves scan records and supports CSV export for reports.</p>
          </div>
        </div>
      </section>

      <section className="how-it-works" id="benefits">
        <div className="section-heading">
          <h2>Project Benefits</h2>
          <p>Why this system is useful for smart agriculture and academic projects.</p>
        </div>

        <div className="steps">
          <div className="step-card">
            <h3>Better Decision Making</h3>
            <p>Helps users understand field conditions and take action faster.</p>
          </div>
          <div className="step-card">
            <h3>Software-Only Model</h3>
            <p>Works even without physical sensors, useful for demos and academic review.</p>
          </div>
          <div className="step-card">
            <h3>Data Visualization</h3>
            <p>Displays farm values through charts, cards, maps, and records.</p>
          </div>
          <div className="step-card">
            <h3>Academic Value</h3>
            <p>Good for final year presentation, review, viva, and software demo.</p>
          </div>
        </div>
      </section>

      <section
        className="how-it-works"
        style={{ background: '#07111d', padding: '60px 0' }}
      >
        <div className="section-heading">
          <h2 style={{ color: '#22c55e' }}>Ready to Explore Smart Farming?</h2>
          <p>
            Access the dashboard, view farm insights, and experience a modern
            agriculture monitoring system.
          </p>
          <div className="hero-buttons" style={{ justifyContent: 'center', marginTop: '20px' }}>
            <Link to="/login" className="btn primary">
              Login Now
            </Link>
            <Link to="/dashboard" className="btn outline">
              View Dashboard
            </Link>
          </div>
        </div>
      </section>

      <footer className="footer" id="contact">
        <div className="footer-content">
          <div>
            <h3>Smart Farming Monitor</h3>
            <p>Software-Based IoT Agriculture Monitoring System</p>
          </div>

         <div className="quick-links">
  <h4>Quick Links</h4>
  <p><Link to="/login">Login</Link></p>
  <p><Link to="/dashboard">Dashboard</Link></p>
  <p><Link to="/live-data">Live Data</Link></p>
</div>
</div>

        <p className="copyright">
          © 2026 IoT Based Smart Farming Monitor. All Rights Reserved.
        </p>
      </footer>

      {modal.active && (
        <>
          <div
            className="overlay"
            style={{ display: 'block' }}
            onClick={closeCard}
          ></div>

          <div id="bigCard" style={{ display: 'block' }}>
            <img src={modal.img} alt="Feature" />
            <h2>{modal.title}</h2>
            <p>{modal.text}</p>
            <button onClick={closeCard}>Close</button>
          </div>
        </>
      )}
    </div>
  );
};

export default Home;