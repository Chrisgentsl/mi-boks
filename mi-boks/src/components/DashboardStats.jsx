import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import './DashboardStats.css';

const DashboardStats = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    monthlyRevenue: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch orders statistics
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('status, total_amount')
          .eq('vendor_id', user.id);

        if (ordersError) throw ordersError;

        // Calculate statistics
        const totalOrders = orders?.length || 0;
        const activeOrders = orders?.filter(order => order.status === 'active').length || 0;
        const completedOrders = orders?.filter(order => order.status === 'completed').length || 0;
        const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

        // Calculate monthly revenue
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyRevenue = orders
          ?.filter(order => {
            const orderDate = new Date(order.created_at);
            return orderDate.getMonth() === currentMonth && 
                   orderDate.getFullYear() === currentYear;
          })
          .reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

        setStats({
          totalOrders,
          activeOrders,
          completedOrders,
          totalRevenue,
          monthlyRevenue
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 300000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard-stats">
      <div className="stat-card total-orders">
        <div className="stat-icon">
          <i className="material-icons">shopping_cart</i>
        </div>
        <div className="stat-content">
          <h3>Total Orders</h3>
          <p className="stat-number">{stats.totalOrders}</p>
        </div>
      </div>

      <div className="stat-card active-orders">
        <div className="stat-icon">
          <i className="material-icons">pending_actions</i>
        </div>
        <div className="stat-content">
          <h3>Active Orders</h3>
          <p className="stat-number">{stats.activeOrders}</p>
        </div>
      </div>

      <div className="stat-card completed-orders">
        <div className="stat-icon">
          <i className="material-icons">task_alt</i>
        </div>
        <div className="stat-content">
          <h3>Completed Orders</h3>
          <p className="stat-number">{stats.completedOrders}</p>
        </div>
      </div>

      <div className="stat-card total-revenue">
        <div className="stat-icon">
          <i className="material-icons">payments</i>
        </div>
        <div className="stat-content">
          <h3>Total Revenue</h3>
          <p className="stat-number">${stats.totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      <div className="stat-card monthly-revenue">
        <div className="stat-icon">
          <i className="material-icons">trending_up</i>
        </div>
        <div className="stat-content">
          <h3>Monthly Revenue</h3>
          <p className="stat-number">${stats.monthlyRevenue.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;