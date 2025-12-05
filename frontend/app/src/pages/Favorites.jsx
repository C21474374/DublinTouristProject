import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Favorites.scss';

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  const removeFavorite = (placeId) => {
    const updated = favorites.filter(fav => fav.id !== placeId);
    setFavorites(updated);
    localStorage.setItem('favorites', JSON.stringify(updated));
  };

  const handleViewOnMap = (place) => {
    // Store the place to focus on in sessionStorage
    sessionStorage.setItem('focusPlace', JSON.stringify(place));
    // Navigate to map
    navigate('/');
  };

  return (
    <div className="favorites-page">
      <div className="favorites-container">
        <h1>❤️ My Favorites</h1>

        {favorites.length === 0 ? (
          <div className="empty-state">
            <p>No favorites yet!</p>
            <p className="subtitle">Explore places on the map and add them to your favorites.</p>
          </div>
        ) : (
          <>
            <p className="favorites-count">You have {favorites.length} favorite place{favorites.length !== 1 ? 's' : ''}</p>
            <div className="favorites-grid">
              {favorites.map((place) => {
                const properties = place.properties || place;
                return (
                  <div key={place.id} className="favorite-card">
                    <div className="card-header">
                      <h3>{properties.name}</h3>
                      <button
                        className="remove-btn"
                        onClick={() => removeFavorite(place.id)}
                        title="Remove from favorites"
                      >
                        ✕
                      </button>
                    </div>

                    <p className="description">{properties.description}</p>

                    <div className="card-info">
                      <div className="info-item">
                        <span className="label">Price:</span>
                        <span className="value">${properties.price}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Time:</span>
                        <span className="value">{properties.time_required} min</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Popularity:</span>
                        <span className="value">{properties.popularity} visits</span>
                      </div>
                    </div>

                    <div className="card-tags">
                      {properties.child_friendly && <span className="tag">👶 Child Friendly</span>}
                      {properties.wheelchair_access && <span className="tag">♿ Wheelchair Access</span>}
                    </div>

                    <button 
                      className="view-btn"
                      onClick={() => handleViewOnMap(place)}
                    >
                      View on Map →
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}