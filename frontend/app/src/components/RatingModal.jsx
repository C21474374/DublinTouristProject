import { useState } from 'react';
import axios from 'axios';
import '../styles/RatingModal.scss';

const API_BASE = 'http://localhost:8000/api';

export default function RatingModal({ place, onClose, onRatingAdded, userRating }) {
  const [stars, setStars] = useState(userRating?.stars || 0);
  const [comment, setComment] = useState(userRating?.comment || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const placeId = place.id || place.properties?.id;
      
      if (userRating) {
        // Update existing rating
        await axios.put(`${API_BASE}/ratings/${userRating.id}/`, {
          stars,
          comment,
        });
      } else {
        // Create new rating
        await axios.post(`${API_BASE}/places/${placeId}/ratings/create/`, {
          stars,
          comment,
        });
      }

      onRatingAdded();
      onClose();
    } catch (err) {
      console.error('Rating error:', err);
      console.error('Response data:', err.response?.data);
      setError(JSON.stringify(err.response?.data) || 'Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!userRating || !window.confirm('Delete this rating?')) return;

    try {
      await axios.delete(`${API_BASE}/ratings/${userRating.id}/`);
      onRatingAdded();
      onClose();
    } catch (err) {
      setError('Failed to delete rating');
    }
  };

  return (
    <div className="rating-modal-overlay" onClick={onClose}>
      <div className="rating-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Rate {place.name || place.properties?.name}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="rating-form">
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

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="submit" className="submit-btn" disabled={!stars || loading}>
              {loading ? 'Submitting...' : userRating ? 'Update Rating' : 'Submit Rating'}
            </button>
            
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