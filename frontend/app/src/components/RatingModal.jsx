import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import '../styles/RatingModal.scss';

const API_BASE = 
  process.env.NODE_ENV === 'production'
    ? 'https://dublin-guide.onrender.com/api'
    : 'http://localhost:8000/api';

/**
 * Rating Modal Component
 * Modal for users to submit, edit, or delete ratings for places.
 * Shows star rating selector and optional comment textarea.
 * Can create new ratings or update existing ones.
 */
export default function RatingModal({ place, onClose, onRatingAdded, userRating }) {
  const [stars, setStars] = useState(userRating?.stars || 0);
  const [comment, setComment] = useState(userRating?.comment || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { token } = useAuth();

  /**
   * Submit rating to API
   * If user already rated, updates existing rating with PATCH
   * Otherwise creates new rating with POST
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const placeId = place.id || place.properties?.id;
      
      if (userRating && userRating.id) {
        // Update existing rating
        await axios.patch(`${API_BASE}/ratings/${userRating.id}/`, {
          stars,
          comment,
        }, {
          headers: { Authorization: `Token ${token}` }
        });
        console.log('✅ Rating updated');
      } else {
        // Create new rating
        await axios.post(`${API_BASE}/places/${placeId}/ratings/create/`, {
          stars,
          comment,
        }, {
          headers: { Authorization: `Token ${token}` }
        });
        console.log('✅ Rating created');
      }

      onRatingAdded();  // Refresh place details
      onClose();
    } catch (err) {
      console.error('Rating error:', err);
      console.error('UserRating object:', userRating);
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete user's rating from API
   * Requires confirmation before deleting
   */
  const handleDelete = async () => {
    if (!userRating?.id || !window.confirm('Delete this rating?')) {
      setError('Cannot delete rating - ID missing');
      return;
    }

    try {
      await axios.delete(`${API_BASE}/ratings/${userRating.id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      onRatingAdded();  // Refresh place details
      onClose();
    } catch (err) {
      setError('Failed to delete rating');
    }
  };

  return (
    <div className="rating-modal-overlay" onClick={onClose}>
      <div className="rating-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal header */}
        <div className="modal-header">
          <h2>Rate {place.name || place.properties?.name}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="rating-form">
          {/* Star rating selector (1-5 stars) */}
          <div className="stars-section">
            <p>Rating:</p>
            <div className="stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star ${star <= stars ? 'active' : ''}`}
                  onClick={() => setStars(star)}
                >
                  ★
                </button>
              ))}
            </div>
            <p className="stars-text">{stars} / 5 stars</p>
          </div>

          {/* Optional comment textarea */}
          <div className="comment-section">
            <label htmlFor="comment">Comment (optional)</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              rows="4"
            />
          </div>

          {/* Error message display */}
          {error && <div className="error-message">{error}</div>}

          {/* Form action buttons */}
          <div className="modal-actions">
            <button type="submit" className="submit-btn" disabled={!stars || loading}>
              {loading ? 'Submitting...' : userRating ? 'Update Rating' : 'Submit Rating'}
            </button>
            
            {/* Delete button only shows if editing existing rating */}
            {userRating && (
              <button 
                type="button" 
                className="delete-btn" 
                onClick={handleDelete}
                disabled={loading}
              >
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}