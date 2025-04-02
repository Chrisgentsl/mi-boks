import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import Sidebar from '../../components/Sidebar';
import '../Dashboard.css';

const Receipts = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [receiptsData, setReceiptsData] = useState({
    totalReceipts: 6155,
    totalAmount: 245600.50,
    pendingReceipts: 45,
    receipts: [
      {
        id: 'RCP-2023-001',
        date: 'Aug 26, 2023',
        orderId: '#4550',
        customer: 'John Doe',
        amount: 89.95,
        paymentMethod: 'Credit Card',
        status: 'Completed'
      },
      {
        id: 'RCP-2023-002',
        date: 'Aug 26, 2023',
        orderId: '#4549',
        customer: 'Jane Smith',
        amount: 149.95,
        paymentMethod: 'PayPal',
        status: 'Pending'
      },
      {
        id: 'RCP-2023-003',
        date: 'Aug 26, 2023',
        orderId: '#4548',
        customer: 'Mike Johnson',
        amount: 39.95,
        paymentMethod: 'Bank Transfer',
        status: 'Completed'
      },
      {
        id: 'RCP-2023-004',
        date: 'Aug 26, 2023',
        orderId: '#4547',
        customer: 'Sarah Williams',
        amount: 89.95,
        paymentMethod: 'Credit Card',
        status: 'Completed'
      },
      {
        id: 'RCP-2023-005',
        date: 'Aug 26, 2023',
        orderId: '#4546',
        customer: 'Tom Brown',
        amount: 39.95,
        paymentMethod: 'PayPal',
        status: 'Completed'
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
            <h1>Receipts Management</h1>
            <div className="header-actions">
              <div className="search-bar">
                <input type="text" placeholder="Search receipts..." />
              </div>
              <button className="primary-button">
                Generate Receipt
              </button>
            </div>
          </div>
        </header>

        <div className="dashboard-grid">
          {/* Receipts Overview */}
          <section className="receipts-overview">
            <div className="stats-grid">
              <div className="stat-card total-receipts">
                <div className="stat-icon"></div>
                <div className="stat-info">
                  <span className="stat-value">{receiptsData.totalReceipts}</span>
                  <span className="stat-label">Total Receipts</span>
                </div>
              </div>

              <div className="stat-card total-amount">
                <div className="stat-icon"></div>
                <div className="stat-info">
                  <span className="stat-value">${receiptsData.totalAmount.toLocaleString()}</span>
                  <span className="stat-label">Total Amount</span>
                </div>
              </div>

              <div className="stat-card pending-receipts">
                <div className="stat-icon"></div>
                <div className="stat-info">
                  <span className="stat-value">{receiptsData.pendingReceipts}</span>
                  <span className="stat-label">Pending Receipts</span>
                </div>
              </div>
            </div>
          </section>

          {/* Receipts Table */}
          <section className="receipts-section">
            <div className="section-header">
              <h2>Recent Receipts</h2>
              <div className="table-actions">
                <select className="filter-select">
                  <option value="all">All Receipts</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>

            <table className="receipts-table">
              <thead>
                <tr>
                  <th>Receipt ID</th>
                  <th>Date</th>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {receiptsData.receipts.map((receipt) => (
                  <tr key={receipt.id}>
                    <td>{receipt.id}</td>
                    <td>{receipt.date}</td>
                    <td>{receipt.orderId}</td>
                    <td>{receipt.customer}</td>
                    <td>${receipt.amount.toFixed(2)}</td>
                    <td>{receipt.paymentMethod}</td>
                    <td>
                      <span className={`status-badge ${receipt.status.toLowerCase()}`}>
                        {receipt.status}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="action-button view">View</button>
                        <button className="action-button download">Download</button>
                        <button className="action-button print">Print</button>
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

export default Receipts;