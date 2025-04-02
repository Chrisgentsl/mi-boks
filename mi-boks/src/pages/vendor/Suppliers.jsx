import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import Sidebar from '../../components/Sidebar';
import '../Dashboard.css';

const Suppliers = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [suppliersData, setSuppliersData] = useState({
    totalSuppliers: 24,
    activeSuppliers: 18,
    pendingOrders: 8,
    suppliers: [
      {
        id: 'SUP001',
        name: 'Fashion Wholesale Co.',
        contact: 'John Smith',
        email: 'john@fashionwholesale.com',
        phone: '+1-555-0123',
        status: 'Active',
        lastOrder: 'Aug 20, 2023',
        totalOrders: 156
      },
      {
        id: 'SUP002',
        name: 'Textile Solutions Ltd.',
        contact: 'Mary Johnson',
        email: 'mary@textilesolutions.com',
        phone: '+1-555-0124',
        status: 'Active',
        lastOrder: 'Aug 22, 2023',
        totalOrders: 142
      },
      {
        id: 'SUP003',
        name: 'Global Fabrics Inc.',
        contact: 'Robert Lee',
        email: 'robert@globalfabrics.com',
        phone: '+1-555-0125',
        status: 'Inactive',
        lastOrder: 'Jul 15, 2023',
        totalOrders: 89
      },
      {
        id: 'SUP004',
        name: 'Premium Materials Co.',
        contact: 'Sarah Brown',
        email: 'sarah@premiummaterials.com',
        phone: '+1-555-0126',
        status: 'Active',
        lastOrder: 'Aug 25, 2023',
        totalOrders: 112
      },
      {
        id: 'SUP005',
        name: 'Fashion Forward Supply',
        contact: 'Michael Wilson',
        email: 'michael@fashionforward.com',
        phone: '+1-555-0127',
        status: 'Active',
        lastOrder: 'Aug 24, 2023',
        totalOrders: 98
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
            <h1>Suppliers Management</h1>
            <div className="header-actions">
              <button className="primary-button">
                Add New Supplier
              </button>
            </div>
          </div>
        </header>

        <div className="dashboard-grid">
          {/* Suppliers Overview */}
          <section className="suppliers-overview">
            <div className="stats-grid">
              <div className="stat-card total-suppliers">
                <div className="stat-icon"></div>
                <div className="stat-info">
                  <span className="stat-value">{suppliersData.totalSuppliers}</span>
                  <span className="stat-label">Total Suppliers</span>
                </div>
              </div>

              <div className="stat-card active-suppliers">
                <div className="stat-icon"></div>
                <div className="stat-info">
                  <span className="stat-value">{suppliersData.activeSuppliers}</span>
                  <span className="stat-label">Active Suppliers</span>
                </div>
              </div>

              <div className="stat-card pending-orders">
                <div className="stat-icon"></div>
                <div className="stat-info">
                  <span className="stat-value">{suppliersData.pendingOrders}</span>
                  <span className="stat-label">Pending Orders</span>
                </div>
              </div>
            </div>
          </section>

          {/* Suppliers Table */}
          <section className="suppliers-section">
            <div className="section-header">
              <h2>Supplier List</h2>
              <div className="table-actions">
                <input 
                  type="text" 
                  placeholder="Search suppliers..." 
                  className="search-input"
                />
                <select className="filter-select">
                  <option value="all">All Suppliers</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <table className="suppliers-table">
              <thead>
                <tr>
                  <th>Supplier ID</th>
                  <th>Name</th>
                  <th>Contact Person</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Last Order</th>
                  <th>Total Orders</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliersData.suppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td>{supplier.id}</td>
                    <td>{supplier.name}</td>
                    <td>{supplier.contact}</td>
                    <td>{supplier.email}</td>
                    <td>{supplier.phone}</td>
                    <td>
                      <span className={`status-badge ${supplier.status.toLowerCase()}`}>
                        {supplier.status}
                      </span>
                    </td>
                    <td>{supplier.lastOrder}</td>
                    <td>{supplier.totalOrders}</td>
                    <td>
                      <div className="table-actions">
                        <button className="action-button view">View</button>
                        <button className="action-button edit">Edit</button>
                        <button className="action-button orders">Orders</button>
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

export default Suppliers;