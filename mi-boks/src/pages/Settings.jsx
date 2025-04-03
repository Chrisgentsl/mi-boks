import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Sidebar from '../components/Sidebar';
import './Settings.css';

const Settings = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

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
        if (data.business_logo) {
          setLogoPreview(data.business_logo);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Create a preview URL for the image
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);

      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload the image to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // First, try to delete the old logo if it exists
      if (profile?.business_logo) {
        const oldLogoPath = profile.business_logo.split('/').pop();
        await supabase.storage
          .from('business-logos')
          .remove([`${user.id}/${oldLogoPath}`]);
      }

      // Upload the new logo
      const { error: uploadError } = await supabase.storage
        .from('business-logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('business-logos')
        .getPublicUrl(filePath);

      // Update the profile with the new logo URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ business_logo: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update the profile state
      setProfile(prev => ({ ...prev, business_logo: publicUrl }));

      // Clean up the old preview URL
      if (logoPreview && logoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreview);
      }

      setSuccess('Logo updated successfully');
    } catch (err) {
      console.error('Error uploading logo:', err);
      setError('Failed to upload logo. Please try again.');
      // Reset the preview if upload failed
      if (profile?.business_logo) {
        setLogoPreview(profile.business_logo);
      } else {
        setLogoPreview(null);
      }
    } finally {
      setLoading(false);
    }
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
                {logoPreview ? (
                  <img src={logoPreview} alt="Business Logo" />
                ) : (
                  <div className="logo-placeholder">
                    <span className="material-icons">business</span>
                  </div>
                )}
                <div className="upload-overlay">
                  <span className="material-icons">upload</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  style={{ display: 'none' }}
                  id="logo-upload"
                />
                <label htmlFor="logo-upload" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, cursor: 'pointer' }} />
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
                <div className="detail-item">
                  <span className="detail-label">Currency:</span>
                  <span className="detail-value">SLL</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Time Zone:</span>
                  <span className="detail-value">UTC</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;