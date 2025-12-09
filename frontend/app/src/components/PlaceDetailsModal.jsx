import { useState, useEffect } from 'react';
import axios from 'axios';
import RatingModal from './RatingModal';
import '../styles/PlaceDetailsModal.scss';

const API_BASE = 
  process.env.NODE_ENV === 'production'
    ? 'https://dublin-guide.onrender.com/api'
    : 'http://localhost:8000/api';

/**
 * Place Details Modal Component
 * Displays comprehensive information about a selected place.
 * Shows ratings, reviews, accessibility info, pricing, and time required.
 * Allows users to add or edit their own rating.
 */
export default function PlaceDetailsModal({ place, onClose, onRatingAdded }) {
  const [placeDetails, setPlaceDetails] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch detailed place information when component mounts or place changes
  useEffect(() => {
    fetchPlaceDetails();
  }, [place.id]);

  /**
   * Fetch detailed place data from API
   * Includes ratings, average rating, and user's own rating
   */
  const fetchPlaceDetails = async () => {
    try {
      const response = await axios.get(`${API_BASE}/places/${place.id}/`);
      console.log('📋 Full API Response:', response.data);
      
      // Handle both GeoJSON and regular responses
      const data = response.data.properties || response.data;
      console.log('📊 Processed data:', data);
      
      setPlaceDetails({
        ...data,
        ratings: data.ratings || [],
        user_rating: data.user_rating || null,
        average_rating: data.average_rating || 0,
      });
    } catch (error) {
      console.error('Error fetching place details:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Callback when rating is added/updated
   * Refreshes place details to show new rating
   */
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
            {/* Place header with name and description */}
            <div className="place-header">
              <h1>{placeDetails.name}</h1>
              <p className="description">{placeDetails.description}</p>
            </div>

            {/* Basic place info: price, time, popularity */}
            <div className="place-info">
              <div className="info-item">
                <span className="label">Price:</span>
                <span className="value">€{placeDetails.price}</span>
              </div>
              <div className="info-item">
                <span className="label">Time:</span>
                <span className="value">{placeDetails.time_required} min</span>
              </div>
              <div className="info-item">
                <span className="label">Popularity:</span>
                <span className="value">{placeDetails.popularity} visits</span>
              </div>
            </div>

            {/* Ratings and reviews section */}
            <div className="rating-section">
              <div className="rating-header">
                <h2>Ratings</h2>
                {/* Average rating display */}
                <div className="rating-stats">
                  <span className="stars">
                    {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}
                  </span>
                  <span className="rating-text">{avgRating.toFixed(1)}/5 ({ratings.length} {ratings.length === 1 ? 'rating' : 'ratings'})</span>
                </div>
              </div>

              {/* User's own rating or button to add one */}
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
                        Edit
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
                  Add Your Rating
                </button>
              )}

              {/* Other users' reviews section */}
              <div className="other-reviews">
                <h3>Other Reviews:</h3>
                {ratings.filter(r => r.user?.id !== placeDetails.user_rating?.user?.id).length > 0 ? (
                  ratings.filter(r => r.user?.id !== placeDetails.user_rating?.user?.id).map((rating) => (
                    <div key={rating.id} className="review-item">
                      <div className="review-header">
                        <span className="reviewer-name">{rating.user?.username || 'Anonymous'}</span>
                        <span className="review-stars">
                          {'⭐'.repeat(rating.stars)}{'☆'.repeat(5 - rating.stars)}
                        </span>
                      </div>
                      <p className="review-comment">{rating.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="no-reviews">No other reviews yet</p>
                )}
              </div>
            </div>

            {/* Accessibility tags */}
            <div className="modal-tags">
              {placeDetails.child_friendly && <span className="tag">Child Friendly</span>}
              {placeDetails.wheelchair_access && <span className="tag">Wheelchair Access</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Rating modal - shown when user clicks "Add" or "Edit" */}
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