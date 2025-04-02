import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VendorDashboard from './pages/VendorDashboard';
import SupplierDashboard from './pages/SupplierDashboard';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and subscribe to auth changes
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={!isAuthenticated ? <Login /> : <Navigate to="/vendor-dashboard" />} 
        />
        <Route 
          path="/signup" 
          element={!isAuthenticated ? <Signup /> : <Navigate to="/vendor-dashboard" />} 
        />
        <Route 
          path="/vendor-dashboard/*" 
          element={isAuthenticated ? <VendorDashboard /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/supplier-dashboard/*" 
          element={isAuthenticated ? <SupplierDashboard /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/" 
          element={<Navigate to={isAuthenticated ? "/vendor-dashboard" : "/login"} />} 
        />
      </Routes>
    </Router>
  );
};

export default App;
