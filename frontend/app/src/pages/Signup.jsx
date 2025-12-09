/**
 * Signup Page Component
 * 
 * Allows new users to create an account
 * Collects: username, email, password, first name, last name
 * Validates password confirmation
 * Redirects to home page on successful signup
 * Includes theme toggle button
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FaMoon, FaSun } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import '../styles/Auth.scss';

export default function Signup() {
  // Form input state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',  // Confirmation password
    first_name: '',
    last_name: '',
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Hooks for navigation, authentication, and theme
  const navigate = useNavigate();
  const { register } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  /**
   * Handle form input changes
   * Updates formData state with new value
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Handle signup form submission
   * Validates passwords match
   * Calls register function from auth context
   * On success, redirects to home page
   * On failure, displays specific error messages
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Client-side validation: passwords must match
    if (formData.password !== formData.password2) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Call auth register function with form data
    const result = await register(
      formData.username,
      formData.email,
      formData.password,
      formData.password2,
      formData.first_name,
      formData.last_name
    );

    if (result.success) {
      // Small delay ensures auth state updates before navigation
      setTimeout(() => {
        navigate('/');
      }, 100);
    } else {
      // Display specific error from API response
      const errorObj = result.error;
      if (errorObj.username) {
        setError(errorObj.username[0]);  // Username already exists, etc
      } else if (errorObj.email) {
        setError(errorObj.email[0]);  // Email already registered, etc
      } else if (errorObj.password) {
        setError(errorObj.password[0]);  // Password too weak, etc
      } else {
        setError('Registration failed');
      }
    }

    setLoading(false);
  };

  return (
    <div className="auth-page">
      {/* Floating theme toggle button (light/dark mode) */}
      <button 
        className="floating-theme-toggle"
        onClick={toggleTheme}
        aria-label="Toggle theme"
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {isDark ? <FaSun /> : <FaMoon />}
      </button>

      <div className="auth-container">
        <div className="auth-card">
          {/* Header with app name and signup message */}
          <div className="auth-header">
            <h1>Dublin Guide</h1>
            <p>Create your account</p>
          </div>

          {/* Signup form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* First and last name in side-by-side row */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="first_name">First Name</label>
                <input
                  id="first_name"
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="First name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="last_name">Last Name</label>
                <input
                  id="last_name"
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Last name"
                />
              </div>
            </div>

            {/* Username input - must be unique */}
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a username"
                required
              />
            </div>

            {/* Email input - must be valid and unique */}
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
              />
            </div>

            {/* Password input */}
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
              />
            </div>

            {/* Confirm password input - must match password field */}
            <div className="form-group">
              <label htmlFor="password2">Confirm Password</label>
              <input
                id="password2"
                type="password"
                name="password2"
                value={formData.password2}
                onChange={handleChange}
                placeholder="Confirm password"
                required
              />
            </div>

            {/* Error message display */}
            {error && <div className="error-message">{error}</div>}

            {/* Submit button */}
            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          {/* Footer with login link */}
          <div className="auth-footer">
            <p>Already have an account? <Link to="/login">Login here</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}