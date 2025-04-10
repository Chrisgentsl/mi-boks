import { Link, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import './Sidebar.css';

const Sidebar = ({ profile, onLogout }) => {
  const location = useLocation();

  const navItems = [
    { path: '/vendor-dashboard', icon: 'dashboard', label: 'Dashboard' },
    { path: '/vendor-dashboard/sales', icon: 'trending_up', label: 'Sales' },
    { path: '/vendor-dashboard/inventory', icon: 'inventory_2', label: 'Inventory' },
    { path: '/vendor-dashboard/orders', icon: 'shopping_cart', label: 'Orders' },
    { path: '/vendor-dashboard/invoice', icon: 'receipt', label: 'Invoice' },
    { path: '/vendor-dashboard/receipts', icon: 'description', label: 'Receipts' },
    { path: '/vendor-dashboard/suppliers', icon: 'local_shipping', label: 'Suppliers' },
    { path: '/vendor-dashboard/settings', icon: 'settings', label: 'Settings' }
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <aside className="sidebar">
      <div className="profile-section">
        <img 
          src={profile?.avatar_url || '/assets/default-avatar.png'} 
          alt="Profile" 
          className="profile-image" 
        />
        <span className="business-name">{profile?.business_name || 'Sales Store'}</span>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
          >
            <i className="material-icons nav-icon">{item.icon}</i>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button onClick={onLogout} className="nav-item logout-button">
          <i className="material-icons nav-icon">logout</i>
          <span className="nav-label">Logout</span>
        </button>
      </div>
    </aside>
  );
};

Sidebar.propTypes = {
  profile: PropTypes.shape({
    avatar_url: PropTypes.string,
    business_name: PropTypes.string
  }),
  onLogout: PropTypes.func.isRequired
};

export default Sidebar;