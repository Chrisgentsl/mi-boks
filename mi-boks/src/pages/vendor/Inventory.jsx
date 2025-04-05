import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import Sidebar from '../../components/Sidebar';
import '../Dashboard.css';

const Inventory = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inventoryData, setInventoryData] = useState({
    totalProducts: 156,
    lowStock: 12,
    outOfStock: 3,
    products: [
      { id: 1, name: 'White Business Utility Shirt', sku: 'WBS001', stock: 45, reorderPoint: 20, status: 'In Stock' },
      { id: 2, name: 'Hooded Japanese Oversize', sku: 'HJO002', stock: 8, reorderPoint: 15, status: 'Low Stock' },
      { id: 3, name: 'Lined Brand T-shirt', sku: 'LBT003', stock: 0, reorderPoint: 25, status: 'Out of Stock' },
      { id: 4, name: 'Go Harris Sportswear', sku: 'GHS004', stock: 32, reorderPoint: 20, status: 'In Stock' },
      { id: 5, name: 'Lined Black T-shirt', sku: 'LBT005', stock: 67, reorderPoint: 30, status: 'In Stock' }
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
            <h1>Inventory Management</h1>
            <div className="header-actions">
              <button className="primary-button">
                Add New Product
              </button>
            </div>
          </div>
        </header>

        <div className="dashboard-grid">
          {/* Inventory Overview */}
          <section className="inventory-overview">
            <div className="stats-grid">
              <div className="stat-card total-products">
                <div className="stat-icon"></div>
                <div className="stat-info">
                  <span className="stat-value">{inventoryData.totalProducts}</span>
                  <span className="stat-label">Total Products</span>
                </div>
              </div>

              <div className="stat-card low-stock">
                <div className="stat-icon"></div>
                <div className="stat-info">
                  <span className="stat-value">{inventoryData.lowStock}</span>
                  <span className="stat-label">Low Stock Items</span>
                </div>
              </div>

              <div className="stat-card out-of-stock">
                <div className="stat-icon"></div>
                <div className="stat-info">
                  <span className="stat-value">{inventoryData.outOfStock}</span>
                  <span className="stat-label">Out of Stock</span>
                </div>
              </div>
            </div>
          </section>

          {/* Products Table */}
          <section className="products-section">
            <div className="section-header">
              <h2>Products</h2>
              <div className="table-actions">
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  className="search-input"
                />
              </div>
            </div>

            <table className="products-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Stock</th>
                  <th>Reorder Point</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventoryData.products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.sku}</td>
                    <td>{product.stock}</td>
                    <td>{product.reorderPoint}</td>
                    <td>
                      <span className={`status-badge ${product.status.toLowerCase().replace(' ', '-')}`}>
                        {product.status}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="action-button edit">Edit</button>
                        <button className="action-button delete">Delete</button>
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

export default Inventory;