/**
 * User Profile Page Component
 * 
 * Displays and manages user account information:
 * - User details (name, email, username)
 * - User statistics (photos, favorites, ratings)
 * - Profile editing
 * - Password changing
 * - Logout functionality
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';
import '../styles/Profile.scss';

const API_BASE = 
  process.env.NODE_ENV === 'production'
    ? 'https://dublin-guide.onrender.com/api'
    : 'http://localhost:8000/api';

export default function Profile() {
  // Auth and navigation
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();

  // Profile editing state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
  });

  // User statistics state
  const [stats, setStats] = useState({
    photos: 0,  // Photos uploaded
    favorites: 0,  // Favorite places
    ratings: 0,  // Ratings given
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  
  // Password change form state
  const [passwords, setPasswords] = useState({
    old_password: '',
    new_password: '',
    new_password2: '',
  });

  // Fetch user statistics on component mount
  useEffect(() => {
    fetchStats();
  }, [token]);

  /**
   * Fetch user's statistics from API
   * Gets count of photos, favorites, and ratings
   * Handles both array and paginated response formats
   */
  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch photos count
      const photosRes = await axios.get(`${API_BASE}/photos/`, {
        headers: { Authorization: `Token ${token}` }
      });
      const photosCount = Array.isArray(photosRes.data) 
        ? photosRes.data.length 
        : (photosRes.data.results?.length || 0);

      // Fetch favorites count
      const favRes = await axios.get(`${API_BASE}/favourites/`, {
        headers: { Authorization: `Token ${token}` }
      });
      const favsCount = Array.isArray(favRes.data) 
        ? favRes.data.length 
        : (favRes.data.results?.length || 0);

      // Count ratings from places (more complex query)
      let ratingCount = 0;
      try {
        const placesRes = await axios.get(`${API_BASE}/places/`, {
          headers: { Authorization: `Token ${token}` }
        });

        const places = Array.isArray(placesRes.data) 
          ? placesRes.data 
          : (placesRes.data.results || []);
        
        // Count ratings belonging to current user
        places.forEach(place => {
          const ratings = place.ratings || [];
          if (Array.isArray(ratings)) {
            ratingCount += ratings.filter(r => r.user === user?.id).length;
          }
        });
      } catch (placesErr) {
        console.error('Error fetching places:', placesErr);
      }

      console.log('Stats:', { photos: photosCount, favorites: favsCount, ratings: ratingCount });

      setStats({
        photos: photosCount,
        favorites: favsCount,
        ratings: ratingCount,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle text input changes in profile edit form
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Handle input changes in password change form
   */
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Send updated profile data to API
   * Validates first and last name are not empty
   * Shows success/error messages
   */
  const updateProfile = async () => {
    // Validation
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setMessage('First and last name are required');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Update user profile via API
      await axios.patch(`${API_BASE}/users/${user.id}/`, formData, {
        headers: { Authorization: `Token ${token}` }
      });
      setMessage('Profile updated successfully!');
      setIsEditing(false);
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`${error.response?.data?.detail || 'Update failed'}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Change user's password via API
   * Validates all fields are filled and match
   * Shows success/error messages
   */
  const updatePassword = async () => {
    // Validation: all fields required
    if (!passwords.old_password || !passwords.new_password || !passwords.new_password2) {
      setMessage('All password fields are required');
      return;
    }

    // Validation: passwords must match
    if (passwords.new_password !== passwords.new_password2) {
      setMessage('New passwords do not match');
      return;
    }

    // Validation: minimum password length
    if (passwords.new_password.length < 8) {
      setMessage('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Send password change request to API
      await axios.post(`${API_BASE}/change-password/`, passwords, {
        headers: { Authorization: `Token ${token}` }
      });
      setMessage('Password changed successfully!');
      // Clear form
      setPasswords({ old_password: '', new_password: '', new_password2: '' });
      setShowPasswordForm(false);
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      // Show specific error if old password is wrong
      setMessage(`${error.response?.data?.detail || error.response?.data?.old_password?.[0] || 'Password change failed'}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user and redirect to login page
   */
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-card">
          {/* ===== PROFILE HEADER ===== */}
          <div className="profile-header">
            {/* Avatar - first letter of first name or username */}
            <div className="avatar">
              {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </div>
            <h1>{user?.first_name} {user?.last_name}</h1>
            <p>@{user?.username}</p>
          </div>

          {/* Message/Alert Display */}
          {message && (
            <div className={`alert ${message.includes('success') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          {/* ===== USER STATISTICS ===== */}
          {/* Stats are clickable - navigate to relevant pages */}
          <div className="stats-grid">
            {/* Photos stat - click to go to gallery */}
            <div 
              className="stat-item"
              onClick={() => navigate('/gallery')}
              style={{ cursor: 'pointer' }}
              title="View Gallery"
            >
              <span className="stat-number">{stats.photos}</span>
              <span className="stat-label">Photos</span>
            </div>
            
            {/* Favorites stat - click to go to favorites page */}
            <div 
              className="stat-item"
              onClick={() => navigate('/favorites')}
              style={{ cursor: 'pointer' }}
              title="View Favorites"
            >
              <span className="stat-number">{stats.favorites}</span>
              <span className="stat-label">Favorites</span>
            </div>
            
            {/* Ratings stat - non-clickable */}
            <div className="stat-item">
              <span className="stat-number">{stats.ratings}</span>
              <span className="stat-label">Ratings</span>
            </div>
          </div>

          {/* ===== PROFILE EDIT SECTION ===== */}
          {isEditing ? (
            // Edit form - shown when editing
            <div className="profile-form">
              <h3>Edit Profile</h3>
              
              <div className="form-group">
                <label>First Name:</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="First name"
                />
              </div>

              <div className="form-group">
                <label>Last Name:</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Last name"
                />
              </div>

              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                />
              </div>

              {/* Form action buttons */}
              <div className="form-buttons">
                <button 
                  className="btn-cancel" 
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  className="btn-save" 
                  onClick={updateProfile}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            // View mode - shown by default
            <>
              {/* Profile information display */}
              <div className="profile-info">
                <div className="info-item">
                  <span className="label">Email:</span>
                  <span className="value">{user?.email}</span>
                </div>
                <div className="info-item">
                  <span className="label">Member ID:</span>
                  <span className="value">#{user?.id}</span>
                </div>
                <div className="info-item">
                  <span className="label">Username:</span>
                  <span className="value">@{user?.username}</span>
                </div>
              </div>

              {/* Button to switch to edit mode */}
              <button 
                className="btn-edit"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
            </>
          )}

          {/* ===== PASSWORD CHANGE SECTION ===== */}
          {showPasswordForm ? (
            // Password change form
            <div className="password-form">
              <h3>Change Password</h3>

              <div className="form-group">
                <label>Current Password:</label>
                <input
                  type="password"
                  name="old_password"
                  value={passwords.old_password}
                  onChange={handlePasswordChange}
                  placeholder="Current password"
                />
              </div>

              <div className="form-group">
                <label>New Password:</label>
                <input
                  type="password"
                  name="new_password"
                  value={passwords.new_password}
                  onChange={handlePasswordChange}
                  placeholder="New password (min 8 characters)"
                />
              </div>

              <div className="form-group">
                <label>Confirm Password:</label>
                <input
                  type="password"
                  name="new_password2"
                  value={passwords.new_password2}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                />
              </div>

              {/* Form action buttons */}
              <div className="form-buttons">
                <button 
                  className="btn-cancel" 
                  onClick={() => setShowPasswordForm(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  className="btn-save" 
                  onClick={updatePassword}
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
          ) : (
            // Button to show password change form
            <button 
              className="btn-password"
              onClick={() => setShowPasswordForm(true)}
            >
              Change Password
            </button>
          )}

          {/* ===== LOGOUT BUTTON ===== */}
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
