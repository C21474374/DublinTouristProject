/**
 * Login Page Component
 * 
 * Allows users to authenticate with username/password
 * Redirects to home page on successful login
 * Provides link to signup for new users
 * Includes theme toggle button
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FaMoon, FaSun } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import '../styles/Auth.scss';

export default function Login() {
  // Form input state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Hooks for navigation and authentication
  const navigate = useNavigate();
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  /**
   * Handle login form submission
   * Calls login function from auth context
   * On success, redirects to home page
   * On failure, displays error message
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Call auth login function with credentials
    const result = await login(username, password);
    
    if (result.success) {
      // Small delay ensures auth state updates before navigation
      setTimeout(() => {
        navigate('/');
      }, 100);
    } else {
      // Display error message from API
      setError(result.error.detail || result.error.non_field_errors?.[0] || 'Login failed');
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
          {/* Header with app name and welcome message */}
          <div className="auth-header">
            <h1>Dublin Guide</h1>
            <p>Welcome back!</p>
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Username input */}
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>

            {/* Password input */}
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
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
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Footer with signup link */}
          <div className="auth-footer">
            <p>Don't have an account? <Link to="/signup">Sign up here</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}