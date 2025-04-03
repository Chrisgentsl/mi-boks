import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Sidebar from '../components/Sidebar';
import './Dashboard.css';

const VendorDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (err) {
      console.error('Error logging out:', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        if (!data) throw new Error('Profile not found');
        
        if (data.business_type !== 'vendor') {
          navigate('/login');
          return;
        }

        setProfile(data);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <div className="sidebar-container">
        <Sidebar profile={profile} onLogout={handleLogout} />
      </div>
      <main className="main-content">
        <div className="dashboard-header">
          <h1>Welcome, {profile.business_name || 'Vendor'}</h1>
          <p>Manage your business and orders from here</p>
        </div>
        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>Total Orders</h3>
            <p className="stat-number">0</p>
          </div>
          <div className="stat-card">
            <h3>Active Orders</h3>
            <p className="stat-number">0</p>
          </div>
          <div className="stat-card">
            <h3>Completed Orders</h3>
            <p className="stat-number">0</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VendorDashboard;