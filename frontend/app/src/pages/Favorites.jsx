import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import '../styles/Favorites.scss';

const API_BASE = 'http://localhost:8000/api';

export default function Favorites() {
  const { token } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, [token]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/favorites/`);
      setFavorites(response.data);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (placeId) => {
    try {
      await axios.delete(`${API_BASE}/favorites/${placeId}/`);
      setFavorites(favorites.filter(fav => fav.id !== placeId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  if (loading) {
    return <div className="favorites-page"><p>Loading...</p></div>;
  }

  if (favorites.length === 0) {
    return (
      <div className="favorites-page">
        <div className="empty-state">
          <h2>❤️ No Favorites Yet</h2>
          <p>Add places to your favorites on the map to see them here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-page">
      <div className="favorites-header">
        <h1>❤️ My Favorites</h1>
        <p>{favorites.length} place{favorites.length !== 1 ? 's' : ''} saved</p>
      </div>

      <div className="favorites-grid">
        {favorites.map((place) => {
          const props = place.properties || place;
          const avgRating = props.average_rating || 0;

          return (
            <div key={place.id} className="favorite-card">
              <div className="card-header">
                <div className="card-title">
                  <h3>{props.name}</h3>
                  <p className="category">{props.category_name || props.category}</p>
                </div>
                <button
                  className="remove-btn"
                  onClick={() => removeFavorite(place.id)}
                  title="Remove from favorites"
                >
                  ✕
                </button>
              </div>

              <p className="description">{props.description}</p>

              <div className="card-stats">
                <div className="stat-item">
                  <span className="stat-icon">⭐</span>
                  <div className="stat-content">
                    <span className="stat-label">Rating</span>
                    <span className="stat-value">
                      {avgRating > 0 ? (
                        <>
                          <span className="stars">
                            {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}
                          </span>
                          {avgRating.toFixed(1)}/5
                        </>
                      ) : (
                        'No ratings'
                      )}
                    </span>
                  </div>
                </div>

                <div className="stat-item">
                  <span className="stat-icon">💰</span>
                  <div className="stat-content">
                    <span className="stat-label">Price</span>
                    <span className="stat-value">€{props.price}</span>
                  </div>
                </div>

                <div className="stat-item">
                  <span className="stat-icon">⏱️</span>
                  <div className="stat-content">
                    <span className="stat-label">Duration</span>
                    <span className="stat-value">{props.time_required} min</span>
                  </div>
                </div>

                <div className="stat-item">
                  <span className="stat-icon">👥</span>
                  <div className="stat-content">
                    <span className="stat-label">Popularity</span>
                    <span className="stat-value">{props.popularity} visits</span>
                  </div>
                </div>
              </div>

              <div className="card-amenities">
                {props.child_friendly && (
                  <span className="amenity-tag child-friendly">👶 Child Friendly</span>
                )}
                {props.wheelchair_access && (
                  <span className="amenity-tag wheelchair">♿ Wheelchair Access</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}