import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import Sidebar from '../../components/Sidebar';
import '../Dashboard.css';

const Orders = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ordersData, setOrdersData] = useState({
    totalOrders: 6200,
    pendingOrders: 45,
    completedOrders: 6155,
    orders: [
      { 
        id: '#4550',
        date: 'Aug 26, 2023',
        customer: 'John Doe',
        products: ['White Business Utility Shirt'],
        total: 89.95,
        status: 'Pending',
        payment: 'Paid'
      },
      { 
        id: '#4549',
        date: 'Aug 26, 2023',
        customer: 'Jane Smith',
        products: ['Hooded Japanese Oversize'],
        total: 149.95,
        status: 'Processing',
        payment: 'Unpaid'
      },
      { 
        id: '#4548',
        date: 'Aug 26, 2023',
        customer: 'Mike Johnson',
        products: ['Lined Brand T-shirt'],
        total: 39.95,
        status: 'Delivered',
        payment: 'Paid'
      },
      { 
        id: '#4547',
        date: 'Aug 26, 2023',
        customer: 'Sarah Williams',
        products: ['Go Harris Sportswear'],
        total: 89.95,
        status: 'Shipped',
        payment: 'Paid'
      },
      { 
        id: '#4546',
        date: 'Aug 26, 2023',
        customer: 'Tom Brown',
        products: ['Lined Black T-shirt'],
        total: 39.95,
        status: 'Delivered',
        payment: 'Paid'
      }
    ]
  });

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
      <Sidebar profile={profile} />

      <main className="main-content">
        <header className="dashboard-header">
          <div className="header-content">
            <h1>Orders Management</h1>
            <div className="header-actions">
              <div className="search-bar">
                <input type="text" placeholder="Search orders..." />
              </div>
              <select className="filter-select">
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          </div>
        </header>

        <div className="dashboard-grid">
          {/* Orders Overview */}
          <section className="orders-overview">
            <div className="stats-grid">
              <div className="stat-card total-orders">
                <div className="stat-icon"></div>
                <div className="stat-info">
                  <span className="stat-value">{ordersData.totalOrders}</span>
                  <span className="stat-label">Total Orders</span>
                </div>
              </div>

              <div className="stat-card pending-orders">
                <div className="stat-icon"></div>
                <div className="stat-info">
                  <span className="stat-value">{ordersData.pendingOrders}</span>
                  <span className="stat-label">Pending Orders</span>
                </div>
              </div>

              <div className="stat-card completed-orders">
                <div className="stat-icon"></div>
                <div className="stat-info">
                  <span className="stat-value">{ordersData.completedOrders}</span>
                  <span className="stat-label">Completed Orders</span>
                </div>
              </div>
            </div>
          </section>

          {/* Orders Table */}
          <section className="orders-section">
            <div className="section-header">
              <h2>Recent Orders</h2>
            </div>

            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Products</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ordersData.orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.date}</td>
                    <td>{order.customer}</td>
                    <td>{order.products.join(', ')}</td>
                    <td>${order.total.toFixed(2)}</td>
                    <td>
                      <span className={`status-badge ${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <span className={`payment-status ${order.payment.toLowerCase()}`}>
                        {order.payment}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="action-button view">View</button>
                        <button className="action-button update">Update</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Orders;