import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import '../pages/Auth.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    businessName: '',
    businessType: '',
    businessAddress: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName) newErrors.fullName = 'Full name is required';
    if (!formData.businessName) newErrors.businessName = 'Business name is required';
    if (!formData.businessType) newErrors.businessType = 'Business type is required';
    if (!formData.businessAddress) newErrors.businessAddress = 'Business address is required';
    if (!formData.email && !formData.phone) {
      newErrors.email = 'Either email or phone is required';
      newErrors.phone = 'Either email or phone is required';
    }
    if (!formData.password) newErrors.password = 'Password is required';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    if (!formData.termsAccepted) newErrors.termsAccepted = 'You must accept the terms and conditions';

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phone && !/^\+?[1-9]\d{1,14}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (formData.password) {
      if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters long';
      } else if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(formData.password)) {
        newErrors.password = 'Password must contain both letters and numbers';
      }
    }

    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Sign up with email or phone
      let authResponse;
      if (formData.email) {
        console.log('Attempting signup with email:', formData.email);
        authResponse = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              business_name: formData.businessName,
              business_type: formData.businessType,
              business_address: formData.businessAddress,
              phone: formData.phone
            }
          }
        });
      } else {
        console.log('Attempting signup with phone:', formData.phone);
        authResponse = await supabase.auth.signUp({
          phone: formData.phone,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              business_name: formData.businessName,
              business_type: formData.businessType,
              business_address: formData.businessAddress
            }
          }
        });
      }

      console.log('Auth response:', authResponse);

      if (authResponse.error) {
        console.error('Signup auth error:', authResponse.error);
        throw authResponse.error;
      }

      if (!authResponse.data?.user?.id) {
        console.error('No user ID in auth response');
        throw new Error('Failed to create account. Please try again.');
      }

      console.log('Creating profile for user:', authResponse.data.user.id);

      // Profile will be created automatically through database triggers
      console.log('User created successfully:', authResponse.data.user);

      // Redirect based on business type
      if (formData.businessType === 'vendor') {
        navigate('/vendor-dashboard');
      } else if (formData.businessType === 'supplier') {
        navigate('/supplier-dashboard');
      } else {
        navigate('/complete-profile');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setErrors({ 
        submit: error.message || 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Background Shapes */}
      <div className="shape-1"></div>
      <div className="shape-2"></div>
      <div className="shape-3"></div>
      <div className="shape-4"></div>

      {/* Main Content */}
      <div className="main-content">
        <div className="auth-form-section">
          <div className="form-wrapper">
            <div className="form-header">
              <h1>Register</h1>
              <p className="subtitle">
                Create your Mi-Boks account to manage your business operations efficiently. 
                Track invoices, manage receipts, and streamline your sales process with our comprehensive platform.
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group full-width">
                <label htmlFor="fullName">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                  className={`form-input ${errors.fullName ? 'error' : ''}`}
                />
                {errors.fullName && <span className="error-message">{errors.fullName}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="businessName">Business Name</label>
                  <input
                    type="text"
                    id="businessName"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    placeholder="Enter your business name"
                    required
                    className={`form-input ${errors.businessName ? 'error' : ''}`}
                  />
                  {errors.businessName && <span className="error-message">{errors.businessName}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="businessType">Business Type</label>
                  <select
                    id="businessType"
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    required
                    className={`form-input ${errors.businessType ? 'error' : ''}`}
                  >
                    <option value="">Select business type</option>
                    <option value="vendor">Vendor</option>
                    <option value="supplier">Supplier</option>
                  </select>
                  {errors.businessType && <span className="error-message">{errors.businessType}</span>}
                </div>
              </div>

              <div className="form-group full-width">
                <label htmlFor="businessAddress">Business Address</label>
                <textarea
                  id="businessAddress"
                  name="businessAddress"
                  value={formData.businessAddress}
                  onChange={handleChange}
                  placeholder="Enter your business address"
                  required
                  className={`form-input ${errors.businessAddress ? 'error' : ''}`}
                  rows="3"
                />
                {errors.businessAddress && <span className="error-message">{errors.businessAddress}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email address"
                    className={`form-input ${errors.email ? 'error' : ''}`}
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    className={`form-input ${errors.phone ? 'error' : ''}`}
                  />
                  {errors.phone && <span className="error-message">{errors.phone}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    required
                    className={`form-input ${errors.password ? 'error' : ''}`}
                  />
                  {errors.password && <span className="error-message">{errors.password}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    required
                    className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                  />
                  {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                </div>
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    name="termsAccepted"
                    checked={formData.termsAccepted}
                    onChange={handleChange}
                    className={errors.termsAccepted ? 'error' : ''}
                  />
                  <span>I agree to the <Link to="/terms">Terms & Conditions</Link></span>
                </label>
                {errors.termsAccepted && <span className="error-message">{errors.termsAccepted}</span>}
              </div>

              {errors.submit && <div className="submit-error">{errors.submit}</div>}

              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <p className="switch-auth">
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </div>
        </div>

        <div className="auth-image-section">
          <div className="overlay"></div>
          <img 
            src="/assets/login-illustration.png" 
            alt="Sign Up" 
            style={{
              maxWidth: '80%',
              maxHeight: '80%',
              objectFit: 'contain',
              position: 'relative',
              zIndex: 2
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Signup;