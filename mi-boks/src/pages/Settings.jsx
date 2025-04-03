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
    notification_preferences: {
      email: true,
      sms: false,
      push: true
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
          notification_preferences: data.notification_preferences || {
            email: true,
            sms: false,
            push: true
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
          notification_preferences: formData.notification_preferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setSuccess('Profile updated successfully');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
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
          <h2>Business Profile</h2>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="business_name">Business Name</label>
              <input
                type="text"
                id="business_name"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="business_type">Business Type</label>
              <select
                id="business_type"
                value={formData.business_type}
                onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                required
              >
                <option value="">Select Type</option>
                <option value="retail">Retail</option>
                <option value="wholesale">Wholesale</option>
                <option value="manufacturer">Manufacturer</option>
                <option value="service">Service</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="business_address">Business Address</label>
              <textarea
                id="business_address"
                value={formData.business_address}
                onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="business_phone">Business Phone</label>
              <input
                type="tel"
                id="business_phone"
                value={formData.business_phone}
                onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="business_email">Business Email</label>
              <input
                type="email"
                id="business_email"
                value={formData.business_email}
                onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Notification Preferences</label>
              <div className="notification-options">
                <div 
                  className="notification-option"
                  onClick={() => handleNotificationChange('email')}
                >
                  <input
                    type="checkbox"
                    checked={formData.notification_preferences.email}
                    onChange={() => {}}
                  />
                  <span>Email Notifications</span>
                </div>
                <div 
                  className="notification-option"
                  onClick={() => handleNotificationChange('sms')}
                >
                  <input
                    type="checkbox"
                    checked={formData.notification_preferences.sms}
                    onChange={() => {}}
                  />
                  <span>SMS Notifications</span>
                </div>
                <div 
                  className="notification-option"
                  onClick={() => handleNotificationChange('push')}
                >
                  <input
                    type="checkbox"
                    checked={formData.notification_preferences.push}
                    onChange={() => {}}
                  />
                  <span>Push Notifications</span>
                </div>
              </div>
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Settings;