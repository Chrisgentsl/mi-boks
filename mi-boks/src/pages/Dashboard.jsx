import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Handle logout logic here
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Mi-Boks Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </header>
      <main className="dashboard-content">
        <h2>Welcome to Mi-Boks</h2>
        <p>Your business management solution</p>
      </main>
    </div>
  );
};

export default Dashboard; 