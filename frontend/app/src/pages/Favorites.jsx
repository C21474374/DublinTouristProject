import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import '../styles/Favorites.scss';

const API_BASE = 
  process.env.NODE_ENV === 'production'
    ? 'https://dublin-guide.onrender.com/api'
    : 'http://localhost:8000/api';

export default function Favorites() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchFavorites();
    }
  }, [token]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/favourites/`, {
        headers: { Authorization: `Token ${token}` }
      });
      // Fix: Handle paginated response
      const favData = Array.isArray(response.data) 
        ? response.data 
        : response.data.results || [];
      
      setFavorites(favData);
    } catch (error) {
      console.error('Error fetching favourites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (placeId) => {
    try {
      await axios.delete(`${API_BASE}/favourites/${placeId}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setFavorites(favorites.filter(fav => fav.place.id !== placeId));
    } catch (error) {
      console.error('Error removing favourite:', error);
    }
  };

  if (loading) {
    return <div className="favorites-page"><p>Loading...</p></div>;
  }

  if (favorites.length === 0) {
    return (
      <div className="favorites-page">
        <div className="empty-state">
          <h2>No Favourites Yet ❤️</h2>
          <p>Add places to your favourites on the map to see them here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-page">
      <div className="favorites-header">
        <h1>My Favourites ❤️</h1>
        <p>{favorites.length} place{favorites.length !== 1 ? 's' : ''} saved</p>
      </div>

      <div className="favorites-grid">
        {favorites.map((favorite) => {
          const place = favorite.place;
          const props = place.properties || place;
          const avgRating = props.average_rating || 0;
          const placeId = place.id;

          return (
            <div key={favorite.id} className="favorite-card">
              <div className="card-header">
                <div className="card-title">
                  <h3>{props.name || 'Unknown'}</h3>
                  <p className="category">{props.category_name || 'N/A'}</p>
                </div>
                <button
                  className="remove-btn"
                  onClick={() => removeFavorite(placeId)}
                  title="Remove from favourites"
                >
                  ✕
                </button>
              </div>

              <p className="description">{props.description || 'No description'}</p>

              <div className="card-stats">
                <div className="stat-item">
                  
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
                  
                  <div className="stat-content">
                    <span className="stat-label">Price</span>
                    <span className="stat-value">€{props.price || '0'}</span>
                  </div>
                </div>

                <div className="stat-item">
                 
                  <div className="stat-content">
                    <span className="stat-label">Duration</span>
                    <span className="stat-value">{props.time_required || '0'} min</span>
                  </div>
                </div>

                <div className="stat-item">
                  
                  <div className="stat-content">
                    <span className="stat-label">Popularity</span>
                    <span className="stat-value">{props.popularity || '0'} visits</span>
                  </div>
                </div>
              </div>

              <div className="card-amenities">
                {props.child_friendly && (
                  <span className="amenity-tag child-friendly">Child Friendly</span>
                )}
                {props.wheelchair_access && (
                  <span className="amenity-tag wheelchair">Wheelchair Access</span>
                )}
              </div>

              <button
                className="view-map-btn"
                onClick={() => {
                  const coords = place.geometry?.coordinates || [0, 0];
                  const placeData = {
                    id: placeId,
                    coordinates: coords,
                    name: props.name,
                    properties: props,
                    geometry: place.geometry,
                  };
                  sessionStorage.setItem('centerPlace', JSON.stringify(placeData));
                  navigate('/');
                }}
              >
                View on Map
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}