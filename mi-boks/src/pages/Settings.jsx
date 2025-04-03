import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Sidebar from '../components/Sidebar';
import './Settings.css';

const Settings = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    business_name: '',
    business_type: '',
    business_address: '',
    business_phone: '',
    business_email: '',
    currency: 'SLL',
    time_zone: 'UTC',
    notification_preferences: {
      email: true,
      sms: false,
      push: true,
      order_updates: true,
      inventory_alerts: true,
      payment_reminders: true
    }
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        setProfile(data);
        setFormData({
          business_name: data.business_name || '',
          business_type: data.business_type || '',
          business_address: data.business_address || '',
          business_phone: data.business_phone || '',
          business_email: data.business_email || '',
          currency: data.currency || 'SLL',
          time_zone: data.time_zone || 'UTC',
          notification_preferences: data.notification_preferences || {
            email: true,
            sms: false,
            push: true,
            order_updates: true,
            inventory_alerts: true,
            payment_reminders: true
          }
        });
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          business_name: formData.business_name,
          business_type: formData.business_type,
          business_address: formData.business_address,
          business_phone: formData.business_phone,
          business_email: formData.business_email,
          currency: formData.currency,
          time_zone: formData.time_zone,
          notification_preferences: formData.notification_preferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setSuccess('Settings updated successfully');
    } catch (err) {
      console.error('Error updating settings:', err);
      setError('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = (type) => {
    setFormData(prev => ({
      ...prev,
      notification_preferences: {
        ...prev.notification_preferences,
        [type]: !prev.notification_preferences[type]
      }
    }));
  };

  if (loading) {
    return (
      <div className="settings-container">
        <div className="loading-spinner">
          <span className="material-icons">refresh</span>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <Sidebar profile={profile} />
      <main className="main-content">
        <div className="settings-section">
          <h1>Settings</h1>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <div className="business-info-section">
            <h2>Business Information</h2>
            <div className="business-info-card">
              <div className="business-logo-display">
                {profile?.business_logo ? (
                  <img src={profile.business_logo} alt="Business Logo" />
                ) : (
                  <div className="logo-placeholder">
                    <span className="material-icons">business</span>
                  </div>
                )}
              </div>
              <div className="business-details">
                <div className="detail-item">
                  <span className="detail-label">Business Name:</span>
                  <span className="detail-value">{profile?.business_name || 'Not set'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Business Type:</span>
                  <span className="detail-value">{profile?.business_type || 'Not set'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Address:</span>
                  <span className="detail-value">{profile?.business_address || 'Not set'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">{profile?.business_phone || 'Not set'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{profile?.business_email || 'Not set'}</span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="settings-form">
            <section className="form-section">
              <h2>Preferences</h2>
              <div className="form-group">
                <label htmlFor="currency">Currency</label>
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                >
                  <option value="SLL">SLL</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="time_zone">Time Zone</label>
                <select
                  id="time_zone"
                  value={formData.time_zone}
                  onChange={(e) => setFormData({ ...formData, time_zone: e.target.value })}
                >
                  <option value="UTC">UTC</option>
                  <option value="EST">EST</option>
                  <option value="PST">PST</option>
                  <option value="GMT">GMT</option>
                </select>
              </div>
            </section>

            <section className="form-section">
              <h2>Notifications</h2>
              <div className="notification-options">
                <div className="notification-option">
                  <input
                    type="checkbox"
                    id="email_notifications"
                    checked={formData.notification_preferences.email}
                    onChange={() => handleNotificationChange('email')}
                  />
                  <label htmlFor="email_notifications">Email Notifications</label>
                </div>

                <div className="notification-option">
                  <input
                    type="checkbox"
                    id="sms_notifications"
                    checked={formData.notification_preferences.sms}
                    onChange={() => handleNotificationChange('sms')}
                  />
                  <label htmlFor="sms_notifications">SMS Notifications</label>
                </div>

                <div className="notification-option">
                  <input
                    type="checkbox"
                    id="push_notifications"
                    checked={formData.notification_preferences.push}
                    onChange={() => handleNotificationChange('push')}
                  />
                  <label htmlFor="push_notifications">Push Notifications</label>
                </div>

                <div className="notification-option">
                  <input
                    type="checkbox"
                    id="order_updates"
                    checked={formData.notification_preferences.order_updates}
                    onChange={() => handleNotificationChange('order_updates')}
                  />
                  <label htmlFor="order_updates">Order Updates</label>
                </div>

                <div className="notification-option">
                  <input
                    type="checkbox"
                    id="inventory_alerts"
                    checked={formData.notification_preferences.inventory_alerts}
                    onChange={() => handleNotificationChange('inventory_alerts')}
                  />
                  <label htmlFor="inventory_alerts">Inventory Alerts</label>
                </div>

                <div className="notification-option">
                  <input
                    type="checkbox"
                    id="payment_reminders"
                    checked={formData.notification_preferences.payment_reminders}
                    onChange={() => handleNotificationChange('payment_reminders')}
                  />
                  <label htmlFor="payment_reminders">Payment Reminders</label>
                </div>
              </div>
            </section>

            <div className="form-actions">
              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Settings;