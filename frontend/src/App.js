import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Home from './components/Home';
import Login from './login';
import Dashboard from './components/Dashboard';
import FrequencyDashboard from './components/FrequencyDashboard';
import Forgot from './Forgot';
import CreateAccount from './CreateAccount';
import Reset from './Reset';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot" element={<Forgot />} />
        <Route path="/create" element={<CreateAccount />} />
        <Route path="/reset" element={<Reset />} />

        {/* Protected dashboard route with nested pages */}
        <Route
  path="/dashboard/*"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>

        {/* Optional separate live-data route */}
        <Route
          path="/live-data"
          element={
            <ProtectedRoute>
              <FrequencyDashboard />
            </ProtectedRoute>
          }
        />

        {/* Friendly route aliases */}
        <Route path="/plant-analysis" element={<Navigate to="/dashboard/plant-analysis" replace />} />
        <Route path="/history" element={<Navigate to="/dashboard/history" replace />} />
        <Route path="/irrigation" element={<Navigate to="/dashboard/irrigation" replace />} />

        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;