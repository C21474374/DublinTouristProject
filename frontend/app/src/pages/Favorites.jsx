import { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Favorites.scss';

const API_BASE = 'http://localhost:8000/api';

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const response = await axios.get(`${API_BASE}/favourites/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setFavorites(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setLoading(false);
    }
  };

  if (loading) return <div>Loading favorites...</div>;

  return (
    <div className="favorites-container">
      <h1>❤️ My Favorite Places</h1>

      {favorites.length === 0 ? (
        <p className="empty-state">No favorites yet. Add some from the map!</p>
      ) : (
        <div className="favorites-grid">
          {favorites.map((fav) => (
            <div key={fav.id} className="favorite-card">
              <h3>{fav.place.name}</h3>
              <p>{fav.place.description}</p>
              <p><strong>Price:</strong> ${fav.place.price}</p>
              <p><strong>Rating:</strong> {fav.place.ratings?.length || 0} reviews</p>
              <button className="remove-btn">Remove from Favorites</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}