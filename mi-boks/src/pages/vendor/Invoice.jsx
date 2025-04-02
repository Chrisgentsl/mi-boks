import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import Sidebar from '../../components/Sidebar';
import '../Dashboard.css';

const Invoice = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invoiceData, setInvoiceData] = useState({
    totalInvoices: 245,
    pendingPayment: 12,
    paidInvoices: 233,
    invoices: [
      {
        id: 'INV-2023-001',
        date: 'Aug 26, 2023',
        customer: 'John Doe',
        amount: 89.95,
        status: 'Paid',
        dueDate: 'Sep 25, 2023'
      },
      {
        id: 'INV-2023-002',
        date: 'Aug 26, 2023',
        customer: 'Jane Smith',
        amount: 149.95,
        status: 'Pending',
        dueDate: 'Sep 25, 2023'
      },
      {
        id: 'INV-2023-003',
        date: 'Aug 26, 2023',
        customer: 'Mike Johnson',
        amount: 39.95,
        status: 'Paid',
        dueDate: 'Sep 25, 2023'
      },
      {
        id: 'INV-2023-004',
        date: 'Aug 26, 2023',
        customer: 'Sarah Williams',
        amount: 89.95,
        status: 'Overdue',
        dueDate: 'Aug 25, 2023'
      },
      {
        id: 'INV-2023-005',
        date: 'Aug 26, 2023',
        customer: 'Tom Brown',
        amount: 39.95,
        status: 'Paid',
        dueDate: 'Sep 25, 2023'
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
            <h1>Invoice Management</h1>
            <div className="header-actions">
              <button className="primary-button">
                Create New Invoice
              </button>
            </div>
          </div>
        </header>

        <div className="dashboard-grid">
          {/* Invoice Overview */}
          <section className="invoice-overview">
            <div className="stats-grid">
              <div className="stat-card total-invoices">
                <div className="stat-icon"></div>
                <div className="stat-info">
                  <span className="stat-value">{invoiceData.totalInvoices}</span>
                  <span className="stat-label">Total Invoices</span>
                </div>
              </div>

              <div className="stat-card pending-payment">
                <div className="stat-icon"></div>
                <div className="stat-info">
                  <span className="stat-value">{invoiceData.pendingPayment}</span>
                  <span className="stat-label">Pending Payment</span>
                </div>
              </div>

              <div className="stat-card paid-invoices">
                <div className="stat-icon"></div>
                <div className="stat-info">
                  <span className="stat-value">{invoiceData.paidInvoices}</span>
                  <span className="stat-label">Paid Invoices</span>
                </div>
              </div>
            </div>
          </section>

          {/* Invoices Table */}
          <section className="invoices-section">
            <div className="section-header">
              <h2>Recent Invoices</h2>
              <div className="table-actions">
                <input 
                  type="text" 
                  placeholder="Search invoices..." 
                  className="search-input"
                />
                <select className="filter-select">
                  <option value="all">All Invoices</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>

            <table className="invoices-table">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>{invoice.id}</td>
                    <td>{invoice.date}</td>
                    <td>{invoice.customer}</td>
                    <td>${invoice.amount.toFixed(2)}</td>
                    <td>{invoice.dueDate}</td>
                    <td>
                      <span className={`status-badge ${invoice.status.toLowerCase()}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="action-button view">View</button>
                        <button className="action-button download">Download</button>
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

export default Invoice;