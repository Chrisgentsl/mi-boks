import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Settings from './pages/Settings';
import './App.css';

const App = () => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div className="app">
        {session ? (
          <div className="app-content">
            <Sidebar profile={profile} onLogout={handleLogout} />
            <main className="main-content">
              <Routes>
                <Route path="/vendor-dashboard" element={<div>Dashboard</div>} />
                <Route path="/vendor-dashboard/sales" element={<Sales />} />
                <Route path="/vendor-dashboard/inventory" element={<Inventory />} />
                <Route path="/vendor-dashboard/orders" element={<div>Orders</div>} />
                <Route path="/vendor-dashboard/invoice" element={<div>Invoice</div>} />
                <Route path="/vendor-dashboard/receipts" element={<div>Receipts</div>} />
                <Route path="/vendor-dashboard/suppliers" element={<div>Suppliers</div>} />
                <Route path="/vendor-dashboard/settings" element={<Settings profile={profile} />} />
                <Route path="*" element={<Navigate to="/vendor-dashboard" replace />} />
              </Routes>
            </main>
          </div>
        ) : (
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
      </div>
    </Router>
  );
};

export default App;
