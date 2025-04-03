import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import './Suppliers.css';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    business_type: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    is_verified: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('profile_id', profile.id)
        .order('name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setError('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    if (!newSupplier.name || !newSupplier.business_type) {
      setError('Name and business type are required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const { error } = await supabase
        .from('suppliers')
        .insert([{
          ...newSupplier,
          profile_id: profile.id
        }]);

      if (error) throw error;

      setNewSupplier({
        name: '',
        business_type: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        is_verified: false
      });
      setShowModal(false);
      fetchSuppliers();
    } catch (error) {
      console.error('Error adding supplier:', error);
      setError('Failed to add supplier');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySupplier = async (supplierId, isVerified) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('suppliers')
        .update({ is_verified: !isVerified })
        .eq('id', supplierId);

      if (error) throw error;
      fetchSuppliers();
    } catch (error) {
      console.error('Error verifying supplier:', error);
      setError('Failed to verify supplier');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSupplier = async (supplierId) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplierId);

      if (error) throw error;
      fetchSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      setError('Failed to delete supplier');
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         supplier.business_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'verified' && supplier.is_verified) ||
                         (filterType === 'unverified' && !supplier.is_verified);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="suppliers-container">
      <div className="suppliers-header">
        <h1>Suppliers Management</h1>
        <button 
          className="add-supplier-btn"
          onClick={() => setShowModal(true)}
        >
          <span className="material-icons">add</span>
          Add Supplier
        </button>
      </div>

      <div className="suppliers-filters">
        <input
          type="text"
          placeholder="Search suppliers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="type-filter"
        >
          <option value="all">All Suppliers</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
        </select>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="suppliers-grid">
        {filteredSuppliers.map(supplier => (
          <div key={supplier.id} className="supplier-card">
            <div className="supplier-info">
              <h3>{supplier.name}</h3>
              <div className="supplier-type">{supplier.business_type}</div>
              <div className="supplier-contact">
                <div>{supplier.contact_person}</div>
                <div>{supplier.email}</div>
                <div>{supplier.phone}</div>
              </div>
              <div className="supplier-address">{supplier.address}</div>
            </div>
            <div className="supplier-actions">
              <button
                className={`verify-btn ${supplier.is_verified ? 'verified' : ''}`}
                onClick={() => handleVerifySupplier(supplier.id, supplier.is_verified)}
                disabled={loading}
              >
                {supplier.is_verified ? 'Verified' : 'Verify'}
              </button>
              <button
                className="delete-btn"
                onClick={() => handleDeleteSupplier(supplier.id)}
                disabled={loading}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <>
          <div className="modal-backdrop" onClick={() => setShowModal(false)} />
          <dialog open className="modal">
            <div className="modal-content">
              <h2>Add New Supplier</h2>
              <form onSubmit={handleAddSupplier}>
                <div className="form-group">
                  <label htmlFor="name">Supplier Name</label>
                  <input
                    type="text"
                    id="name"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="business_type">Business Type</label>
                  <select
                    id="business_type"
                    value={newSupplier.business_type}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, business_type: e.target.value }))}
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Manufacturer">Manufacturer</option>
                    <option value="Distributor">Distributor</option>
                    <option value="Wholesaler">Wholesaler</option>
                    <option value="Retailer">Retailer</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="contact_person">Contact Person</label>
                  <input
                    type="text"
                    id="contact_person"
                    value={newSupplier.contact_person}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, contact_person: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address">Address</label>
                  <textarea
                    id="address"
                    value={newSupplier.address}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="modal-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={loading}
                  >
                    {loading ? 'Adding...' : 'Add Supplier'}
                  </button>
                </div>
              </form>
            </div>
          </dialog>
        </>
      )}
    </div>
  );
};

export default Suppliers; 