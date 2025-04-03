import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import './VendorSettings.css';

const VendorSettings = () => {
  const [vendorProfile, setVendorProfile] = useState({
    business_name: '',
    email: '',
    phone: '',
    address: '',
    business_description: '',
    payment_methods: [],
    notification_preferences: {
      email_notifications: true,
      sms_notifications: false
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchVendorProfile();
  }, []);

  const fetchVendorProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (data) setVendorProfile(data);
    } catch (error) {
      console.error('Error fetching vendor profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile data' });
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('notification_preferences.')) {
      const prefName = name.split('.')[1];
      setVendorProfile(prev => ({
        ...prev,
        notification_preferences: {
          ...prev.notification_preferences,
          [prefName]: checked
        }
      }));
    } else {
      setVendorProfile(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('vendors')
        .update(vendorProfile)
        .eq('id', user.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Profile updated successfully' });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating vendor profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="vendor-settings">
      <div className="settings-header">
        <h2>Vendor Settings</h2>
        {!isEditing && (
          <button
            className="edit-button"
            onClick={() => setIsEditing(true)}
          >
            <i className="material-icons">edit</i>
            Edit Profile
          </button>
        )}
      </div>

      {message.text && (
        <div className={`alert ${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="settings-form">
        <div className="form-section">
          <h3>Business Information</h3>
          <div className="form-group">
            <label htmlFor="business_name">Business Name</label>
            <input
              type="text"
              id="business_name"
              name="business_name"
              value={vendorProfile.business_name}
              onChange={handleInputChange}
              disabled={!isEditing}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="business_description">Business Description</label>
            <textarea
              id="business_description"
              name="business_description"
              value={vendorProfile.business_description}
              onChange={handleInputChange}
              disabled={!isEditing}
              rows="4"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Contact Information</h3>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={vendorProfile.email}
              onChange={handleInputChange}
              disabled={!isEditing}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={vendorProfile.phone}
              onChange={handleInputChange}
              disabled={!isEditing}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Business Address</label>
            <textarea
              id="address"
              name="address"
              value={vendorProfile.address}
              onChange={handleInputChange}
              disabled={!isEditing}
              rows="3"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Notification Preferences</h3>
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="notification_preferences.email_notifications"
                checked={vendorProfile.notification_preferences.email_notifications}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
              Email Notifications
            </label>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="notification_preferences.sms_notifications"
                checked={vendorProfile.notification_preferences.sms_notifications}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
              SMS Notifications
            </label>
          </div>
        </div>

        {isEditing && (
          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => {
                setIsEditing(false);
                fetchVendorProfile(); // Reset form
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="save-button"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default VendorSettings;