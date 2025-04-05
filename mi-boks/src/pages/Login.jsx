import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import '../pages/Auth.css';

const Login = () => {
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'phone'
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    
    if (loginMethod === 'email') {
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    } else {
      if (!formData.phone) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^\+?[1-9]\d{1,14}$/.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      let authResponse;
      if (loginMethod === 'email') {
        authResponse = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });
      } else {
        authResponse = await supabase.auth.signInWithPassword({
          phone: formData.phone,
          password: formData.password
        });
      }

      if (authResponse.error) throw authResponse.error;

      // Get user profile to check role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authResponse.data.user.id)
        .single();

      if (profileError) throw profileError;

      // Redirect based on user role
      if (profile) {
        if (profile.business_type === 'vendor') {
          navigate('/vendor-dashboard');
        } else if (profile.business_type === 'supplier') {
          navigate('/supplier-dashboard');
        } else {
          navigate('/complete-profile');
        }
      } else {
        navigate('/complete-profile');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ submit: error.message });
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
              <h1>Welcome Back</h1>
              <p className="subtitle">
                Sign in to your Mi-Boks account to manage your business operations.
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="login-method-toggle">
                <button
                  type="button"
                  className={`toggle-button ${loginMethod === 'email' ? 'active' : ''}`}
                  onClick={() => setLoginMethod('email')}
                >
                  Email
                </button>
                <button
                  type="button"
                  className={`toggle-button ${loginMethod === 'phone' ? 'active' : ''}`}
                  onClick={() => setLoginMethod('phone')}
                >
                  Phone
                </button>
              </div>

              {loginMethod === 'email' ? (
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
              ) : (
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
              )}

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={`form-input ${errors.password ? 'error' : ''}`}
                />
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" name="remember" />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>
              </div>

              {errors.submit && <div className="submit-error">{errors.submit}</div>}

              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="switch-auth">
              Don't have an account? <Link to="/signup">Register</Link>
            </p>
          </div>
        </div>

        <div className="auth-image-section">
          <div className="overlay"></div>
          <img 
            src="/assets/login-illustration.png" 
            alt="Login" 
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

export default Login; 