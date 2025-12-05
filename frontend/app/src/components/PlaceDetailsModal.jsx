import { useState, useEffect } from 'react';
import axios from 'axios';
import RatingModal from './RatingModal';
import '../styles/PlaceDetailsModal.scss';

const API_BASE = 'http://localhost:8000/api';

export default function PlaceDetailsModal({ place, onClose, onRatingAdded }) {
  const [placeDetails, setPlaceDetails] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlaceDetails();
  }, [place.id]);

  const fetchPlaceDetails = async () => {
    try {
      const response = await axios.get(`${API_BASE}/places/${place.id}/`);
      setPlaceDetails(response.data.properties || response.data);
    } catch (error) {
      console.error('Error fetching place details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingAdded = () => {
    fetchPlaceDetails();
    onRatingAdded();
  };

  if (loading) {
    return (
      <div className="place-modal-overlay" onClick={onClose}>
        <div className="place-modal" onClick={(e) => e.stopPropagation()}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!placeDetails) return null;

  const avgRating = placeDetails.average_rating || 0;
  const ratings = placeDetails.ratings || [];

  return (
    <>
      <div className="place-modal-overlay" onClick={onClose}>
        <div className="place-modal" onClick={(e) => e.stopPropagation()}>
          <button className="close-btn" onClick={onClose}>✕</button>

          <div className="modal-content">
            <div className="place-header">
              <h1>{placeDetails.name}</h1>
              <p className="description">{placeDetails.description}</p>
            </div>

            <div className="place-info">
              <div className="info-item">
                <span className="label">💰 Price:</span>
                <span className="value">${placeDetails.price}</span>
              </div>
              <div className="info-item">
                <span className="label">⏱️ Time:</span>
                <span className="value">{placeDetails.time_required} min</span>
              </div>
              <div className="info-item">
                <span className="label">👥 Popularity:</span>
                <span className="value">{placeDetails.popularity} visits</span>
              </div>
            </div>

            <div className="rating-section">
              <div className="rating-header">
                <h2>⭐ Ratings</h2>
                <div className="rating-stats">
                  <span className="stars">
                    {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}
                  </span>
                  <span className="rating-text">{avgRating.toFixed(1)}/5 ({ratings.length} {ratings.length === 1 ? 'rating' : 'ratings'})</span>
                </div>
              </div>

              {placeDetails.user_rating ? (
                <div className="user-rating">
                  <p className="your-rating">Your Rating:</p>
                  <div className="rating-card your-rating-card">
                    <div className="rating-top">
                      <span className="stars">
                        {'★'.repeat(placeDetails.user_rating.stars)}{'☆'.repeat(5 - placeDetails.user_rating.stars)}
                      </span>
                      <button 
                        className="edit-btn"
                        onClick={() => setShowRatingModal(true)}
                      >
                        ✏️ Edit
                      </button>
                    </div>
                    {placeDetails.user_rating.comment && (
                      <p className="comment">{placeDetails.user_rating.comment}</p>
                    )}
                  </div>
                </div>
              ) : (
                <button 
                  className="add-rating-btn"
                  onClick={() => setShowRatingModal(true)}
                >
                  ⭐ Add Your Rating
                </button>
              )}

              <div className="other-ratings">
                <p className="other-ratings-title">Other Reviews:</p>
                {ratings.filter(r => r.id !== placeDetails.user_rating?.id).length > 0 ? (
                  ratings.filter(r => r.id !== placeDetails.user_rating?.id).map((rating) => (
                    <div key={rating.id} className="rating-card">
                      <div className="rating-header-card">
                        <div>
                          <p className="rater-name">@{rating.user_username}</p>
                          <span className="stars">
                            {'★'.repeat(rating.stars)}{'☆'.repeat(5 - rating.stars)}
                          </span>
                        </div>
                      </div>
                      {rating.comment && (
                        <p className="comment">{rating.comment}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="no-reviews">No other reviews yet</p>
                )}
              </div>
            </div>

            <div className="modal-tags">
              {placeDetails.child_friendly && <span className="tag">👶 Child Friendly</span>}
              {placeDetails.wheelchair_access && <span className="tag">♿ Wheelchair Access</span>}
            </div>
          </div>
        </div>
      </div>

      {showRatingModal && (
        <RatingModal
          place={place}
          onClose={() => setShowRatingModal(false)}
          onRatingAdded={handleRatingAdded}
          userRating={placeDetails.user_rating}
        />
      )}
    </>
  );
}