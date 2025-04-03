import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import './Dashboard.css';

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    }
  };

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Fetch total products
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', profile.id);

      // Fetch total sales (you'll need to implement this based on your sales table)
      const { count: salesCount } = await supabase
        .from('sales')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', profile.id);

      // Fetch total orders (you'll need to implement this based on your orders table)
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', profile.id);

      // Fetch total customers (you'll need to implement this based on your customers table)
      const { count: customersCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', profile.id);

      setStats({
        totalSales: salesCount || 0,
        totalProducts: productsCount || 0,
        totalOrders: ordersCount || 0,
        totalCustomers: customersCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="welcome-section">
        <h1>Welcome back, {profile?.business_name || 'Vendor'}!</h1>
        <p>Here's what's happening with your business today.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon sales">
            <span className="material-icons">trending_up</span>
          </div>
          <div className="stat-info">
            <h3>Total Sales</h3>
            <p>${stats.totalSales.toLocaleString()}</p>
            <span className="trend positive">
              <span className="material-icons">arrow_upward</span>
              12% from last month
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon products">
            <span className="material-icons">inventory_2</span>
          </div>
          <div className="stat-info">
            <h3>Total Products</h3>
            <p>{stats.totalProducts.toLocaleString()}</p>
            <span className="trend positive">
              <span className="material-icons">arrow_upward</span>
              8% from last month
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orders">
            <span className="material-icons">shopping_cart</span>
          </div>
          <div className="stat-info">
            <h3>Total Orders</h3>
            <p>{stats.totalOrders.toLocaleString()}</p>
            <span className="trend positive">
              <span className="material-icons">arrow_upward</span>
              15% from last month
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon customers">
            <span className="material-icons">people</span>
          </div>
          <div className="stat-info">
            <h3>Total Customers</h3>
            <p>{stats.totalCustomers.toLocaleString()}</p>
            <span className="trend positive">
              <span className="material-icons">arrow_upward</span>
              10% from last month
            </span>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default Dashboard; 