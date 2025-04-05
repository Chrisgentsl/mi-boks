import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import './Dashboard.css';

const SupplierDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        
        // Verify this is a supplier
        if (data.business_type !== 'supplier') {
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
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Supplier Dashboard</h1>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="business-info-section">
          <h2>Business Information</h2>
          <div className="info-card">
            <div className="info-item">
              <label>Business Name:</label>
              <span>{profile?.business_name}</span>
            </div>
            <div className="info-item">
              <label>Business Type:</label>
              <span>{profile?.business_type}</span>
            </div>
            <div className="info-item">
              <label>Business Address:</label>
              <span>{profile?.business_address}</span>
            </div>
            <div className="info-item">
              <label>Contact Name:</label>
              <span>{profile?.full_name}</span>
            </div>
            <div className="info-item">
              <label>Contact Email:</label>
              <span>{profile?.email}</span>
            </div>
            <div className="info-item">
              <label>Contact Phone:</label>
              <span>{profile?.phone}</span>
            </div>
          </div>
        </section>

        <section className="dashboard-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button className="action-button">
              Manage Products
            </button>
            <button className="action-button">
              View Orders
            </button>
            <button className="action-button">
              Update Inventory
            </button>
            <button className="action-button">
              View Performance
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SupplierDashboard;