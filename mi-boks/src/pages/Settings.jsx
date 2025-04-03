import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import './Settings.css';

const Settings = () => {
  const [profile, setProfile] = useState({
    business_name: '',
    email: '',
    phone: '',
    address: '',
    business_type: '',
    description: ''
  });
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchProfile();
    fetchPaymentMethods();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data || {});
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('vendor_id', user.id);

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      setError('Failed to load payment methods');
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('profiles')
        .update(profile)
        .eq('id', user.id);

      if (error) throw error;
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentMethodAdd = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('payment_methods')
        .insert([{
          vendor_id: user.id,
          type: e.target.type.value,
          details: e.target.details.value,
          is_default: paymentMethods.length === 0
        }]);

      if (error) throw error;
      await fetchPaymentMethods();
      e.target.reset();
      setSuccess('Payment method added successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error adding payment method:', error);
      setError('Failed to add payment method');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentMethodDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payment method?')) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchPaymentMethods();
      setSuccess('Payment method deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error deleting payment method:', error);
      setError('Failed to delete payment method');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Settings</h1>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="settings-section">
        <h2>Business Profile</h2>
        <form onSubmit={handleProfileUpdate} className="profile-form">
          <div className="form-group">
            <label htmlFor="business_name">Business Name</label>
            <input
              type="text"
              id="business_name"
              value={profile.business_name}
              onChange={(e) => setProfile({ ...profile, business_name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone</label>
            <input
              type="tel"
              id="phone"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <textarea
              id="address"
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="business_type">Business Type</label>
            <select
              id="business_type"
              value={profile.business_type}
              onChange={(e) => setProfile({ ...profile, business_type: e.target.value })}
              required
            >
              <option value="">Select Business Type</option>
              <option value="retail">Retail</option>
              <option value="wholesale">Wholesale</option>
              <option value="manufacturer">Manufacturer</option>
              <option value="service">Service</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={profile.description}
              onChange={(e) => setProfile({ ...profile, description: e.target.value })}
              rows="4"
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      <div className="settings-section">
        <h2>Payment Methods</h2>
        <form onSubmit={handlePaymentMethodAdd} className="payment-form">
          <div className="form-group">
            <label htmlFor="type">Payment Type</label>
            <select id="type" required>
              <option value="">Select Payment Type</option>
              <option value="bank">Bank Account</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="cash">Cash</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="details">Payment Details</label>
            <input
              type="text"
              id="details"
              placeholder="Account number, phone number, etc."
              required
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Adding...' : 'Add Payment Method'}
          </button>
        </form>

        <div className="payment-methods">
          {paymentMethods.map(method => (
            <div key={method.id} className="payment-method-card">
              <div className="method-info">
                <h4>{method.type.toUpperCase()}</h4>
                <p>{method.details}</p>
                {method.is_default && <span className="default-badge">Default</span>}
              </div>
              <button
                className="delete-btn"
                onClick={() => handlePaymentMethodDelete(method.id)}
                disabled={loading}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Settings; 