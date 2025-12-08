import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';
import '../styles/Profile.scss';

const API_BASE = 'http://localhost:8000/api';

export default function Profile() {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
  });
  const [stats, setStats] = useState({
    photos: 0,
    favorites: 0,
    ratings: 0,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwords, setPasswords] = useState({
    old_password: '',
    new_password: '',
    new_password2: '',
  });

  useEffect(() => {
    fetchStats();
  }, [token]);

  const fetchStats = async () => {
    try {
      // Get photos
      const photosRes = await axios.get(`${API_BASE}/photos/`, {
        headers: { Authorization: `Token ${token}` }
      });

      // Get favorites
      const favRes = await axios.get(`${API_BASE}/favourites/`, {
        headers: { Authorization: `Token ${token}` }
      });

      // Get ratings from places
      let ratingCount = 0;
      try {
        const placesRes = await axios.get(`${API_BASE}/places/`, {
          headers: { Authorization: `Token ${token}` }
        });

        // PlaceDetailSerializer returns ratings in the data
        const places = placesRes.data;
        
        if (Array.isArray(places)) {
          places.forEach(place => {
            const ratings = place.ratings || [];
            if (Array.isArray(ratings)) {
              ratingCount += ratings.filter(r => r.user === user?.id).length;
            }
          });
        }
      } catch (placesErr) {
        console.error('Error fetching places:', placesErr);
      }

      console.log('Stats:', { photos: photosRes.data.length, favorites: favRes.data.length, ratings: ratingCount });

      setStats({
        photos: photosRes.data.length || 0,
        favorites: favRes.data.length || 0,
        ratings: ratingCount,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const updateProfile = async () => {
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setMessage('First and last name are required');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await axios.patch(`${API_BASE}/users/${user.id}/`, formData, {
        headers: { Authorization: `Token ${token}` }
      });
      setMessage('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`${error.response?.data?.detail || 'Update failed'}`);
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    if (!passwords.old_password || !passwords.new_password || !passwords.new_password2) {
      setMessage('All password fields are required');
      return;
    }

    if (passwords.new_password !== passwords.new_password2) {
      setMessage('New passwords do not match');
      return;
    }

    if (passwords.new_password.length < 8) {
      setMessage('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await axios.post(`${API_BASE}/change-password/`, passwords, {
        headers: { Authorization: `Token ${token}` }
      });
      setMessage('Password changed successfully!');
      setPasswords({ old_password: '', new_password: '', new_password2: '' });
      setShowPasswordForm(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`${error.response?.data?.detail || error.response?.data?.old_password?.[0] || 'Password change failed'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-card">
          {/* Header */}
          <div className="profile-header">
            <div className="avatar">
              {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </div>
            <h1>{user?.first_name} {user?.last_name}</h1>
            <p>@{user?.username}</p>
          </div>

          {/* Message Alert */}
          {message && (
            <div className={`alert ${message.includes('success') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          {/* Stats - CLICKABLE */}
          <div className="stats-grid">
            <div 
              className="stat-item"
              onClick={() => navigate('/gallery')}
              style={{ cursor: 'pointer' }}
              title="View Gallery"
            >
              <span className="stat-number">{stats.photos}</span>
              <span className="stat-label">Photos</span>
            </div>
            <div 
              className="stat-item"
              onClick={() => navigate('/favorites')}
              style={{ cursor: 'pointer' }}
              title="View Favorites"
            >
              <span className="stat-number">{stats.favorites}</span>
              <span className="stat-label">Favorites</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.ratings}</span>
              <span className="stat-label">Ratings</span>
            </div>
          </div>

          {/* Edit Profile Form */}
          {isEditing ? (
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
            <>
              {/* Profile Info */}
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

              {/* Edit Button */}
              <button 
                className="btn-edit"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
            </>
          )}

          {/* Password Change Form */}
          {showPasswordForm ? (
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
            <button 
              className="btn-password"
              onClick={() => setShowPasswordForm(true)}
            >
              Change Password
            </button>
          )}

          {/* Logout Button */}
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
