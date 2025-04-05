import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import Sidebar from '../../components/Sidebar';
import '../Dashboard.css';

const Settings = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    businessName: '',
    businessAddress: '',
    contactName: '',
    email: '',
    phone: '',
    currency: 'SLL',
    timeZone: 'UTC',
    notifications: {
      email: true,
      sms: false,
      orderUpdates: true,
      inventoryAlerts: true,
      paymentReminders: true
    }
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
        setFormData({
          ...formData,
          businessName: data.business_name || '',
          businessAddress: data.business_address || '',
          contactName: data.full_name || '',
          email: data.email || '',
          phone: data.phone || ''
        });
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('notifications.')) {
      const notificationKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          [notificationKey]: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          business_name: formData.businessName,
          business_address: formData.businessAddress,
          full_name: formData.contactName,
          email: formData.email,
          phone: formData.phone,
          settings: {
            currency: formData.currency,
            timeZone: formData.timeZone,
            notifications: formData.notifications
          }
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;
      // Show success message
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message);
    }
  };

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
            <h1>Settings</h1>
          </div>
        </header>

        <div className="settings-container">
          <form onSubmit={handleSubmit} className="settings-form">
            <section className="settings-section">
              <h2>Business Information</h2>
              <div className="form-group">
                <label htmlFor="businessName">Business Name</label>
                <input
                  type="text"
                  id="businessName"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="businessAddress">Business Address</label>
                <textarea
                  id="businessAddress"
                  name="businessAddress"
                  value={formData.businessAddress}
                  onChange={handleChange}
                  rows="3"
                />
              </div>
            </section>

            <section className="settings-section">
              <h2>Contact Information</h2>
              <div className="form-group">
                <label htmlFor="contactName">Contact Name</label>
                <input
                  type="text"
                  id="contactName"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </section>

            <section className="settings-section">
              <h2>Preferences</h2>
              <div className="form-group">
                <label htmlFor="currency">Currency</label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                >
                  <option value="SLL">SLL</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="JPY">JPY</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="timeZone">Time Zone</label>
                <select
                  id="timeZone"
                  name="timeZone"
                  value={formData.timeZone}
                  onChange={handleChange}
                >
                  <option value="UTC">UTC</option>
                  <option value="EST">EST</option>
                  <option value="PST">PST</option>
                  <option value="GMT">GMT</option>
                </select>
              </div>
            </section>

            <section className="settings-section">
              <h2>Notifications</h2>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="notifications.email"
                    checked={formData.notifications.email}
                    onChange={handleChange}
                  />
                  Email Notifications
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="notifications.sms"
                    checked={formData.notifications.sms}
                    onChange={handleChange}
                  />
                  SMS Notifications
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="notifications.orderUpdates"
                    checked={formData.notifications.orderUpdates}
                    onChange={handleChange}
                  />
                  Order Updates
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="notifications.inventoryAlerts"
                    checked={formData.notifications.inventoryAlerts}
                    onChange={handleChange}
                  />
                  Inventory Alerts
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="notifications.paymentReminders"
                    checked={formData.notifications.paymentReminders}
                    onChange={handleChange}
                  />
                  Payment Reminders
                </label>
              </div>
            </section>

            <div className="form-actions">
              <button type="submit" className="primary-button">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Settings;