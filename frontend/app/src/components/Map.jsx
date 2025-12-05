import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import '../styles/Map.scss';

const API_BASE = 'http://localhost:8000/api';

export default function Map() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [filters, setFilters] = useState({
    category: '',
    childFriendly: false,
    wheelchairAccess: false,
  });

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Initialize map ONCE
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      mapRef.current = L.map(mapContainerRef.current).setView([53.3498, -6.2603], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
        maxNativeZoom: 18,
      }).addTo(mapRef.current);

      // Fix for map not initializing properly
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 100);
    } catch (error) {
      console.error('Map initialization error:', error);
    }

    // Cleanup
    return () => {
      // Don't destroy on unmount
    };
  }, []);

  // Focus on place from Favorites page
  useEffect(() => {
    const focusPlaceStr = sessionStorage.getItem('focusPlace');
    if (focusPlaceStr && mapRef.current) {
      const focusPlace = JSON.parse(focusPlaceStr);
      const coords = focusPlace.geometry?.coordinates || 
                     focusPlace.location?.coordinates || 
                     [focusPlace.longitude, focusPlace.latitude];

      if (coords && coords.length === 2) {
        mapRef.current.setView([coords[1], coords[0]], 16, { animate: true });
        
        // Find and open the marker
        setTimeout(() => {
          markersRef.current.forEach(marker => {
            if (marker.getLatLng().lat === coords[1] && marker.getLatLng().lng === coords[0]) {
              marker.openPopup();
            }
          });
        }, 300);
      }

      // Clear the sessionStorage
      sessionStorage.removeItem('focusPlace');
    }
  }, []);

  // Fetch places when filters change
  useEffect(() => {
    fetchPlaces();
  }, [filters]);

  // Update markers when places change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear old markers
    markersRef.current.forEach(marker => {
      mapRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Add new markers
    places.forEach((place) => {
      const coords = place.geometry?.coordinates || 
                     place.location?.coordinates || 
                     [place.longitude, place.latitude];

      if (!coords || coords.length < 2) return;

      try {
        const isFavorite = favorites.some(fav => fav.id === place.id);
        const marker = L.marker([coords[1], coords[0]]).addTo(mapRef.current);
        const properties = place.properties || place;

        const popupContent = document.createElement('div');
        popupContent.className = 'map-popup';
        popupContent.innerHTML = `
          <h5>${properties.name || 'Unknown'}</h5>
          <p>${properties.description || 'No description'}</p>
          <p><strong>Price:</strong> $${properties.price || 0}</p>
          <p><strong>Time:</strong> ${properties.time_required || 0} min</p>
        `;

        const btn = document.createElement('button');
        btn.className = 'favorite-popup-btn';
        btn.innerHTML = isFavorite ? '❤️ Favorited' : '🤍 Add to Favorites';
        btn.onclick = () => toggleFavorite(place);
        popupContent.appendChild(btn);

        marker.bindPopup(popupContent);
        markersRef.current.push(marker);
      } catch (error) {
        console.error('Error adding marker:', error);
      }
    });
  }, [places, favorites]);

  const fetchPlaces = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE}/places/`;

      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.childFriendly) params.append('child_friendly', true);
      if (filters.wheelchairAccess) params.append('wheelchair_access', true);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url);
      setPlaces(response.data.features || response.data);
    } catch (error) {
      console.error('Error fetching places:', error);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters({
      ...filters,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handlePlaceCardClick = (place) => {
    const coords = place.geometry?.coordinates || 
                   place.location?.coordinates || 
                   [place.longitude, place.latitude];

    if (coords && coords.length === 2 && mapRef.current) {
      // Zoom to the place with animation
      mapRef.current.setView([coords[1], coords[0]], 16, { animate: true });

      // Find and open the marker popup
      markersRef.current.forEach(marker => {
        if (marker.getLatLng().lat === coords[1] && marker.getLatLng().lng === coords[0]) {
          marker.openPopup();
        }
      });
    }
  };

  const toggleFavorite = (place) => {
    const isFavorite = favorites.some(fav => fav.id === place.id);
    
    if (isFavorite) {
      setFavorites(favorites.filter(fav => fav.id !== place.id));
    } else {
      setFavorites([...favorites, place]);
    }
  };

  const isFavorite = (placeId) => {
    return favorites.some(fav => fav.id === placeId);
  };

  return (
    <div className="map-wrapper">
      <div className="filters-sidebar">
        <h3>🔍 Filters</h3>
        
        <select name="category" value={filters.category} onChange={handleFilterChange}>
          <option value="">All Categories</option>
          <option value="restaurant">🍽️ Restaurant</option>
          <option value="museum">🏛️ Museum</option>
          <option value="park">🌳 Park</option>
          <option value="beach">🏖️ Beach</option>
        </select>

        <label>
          <input
            type="checkbox"
            name="childFriendly"
            checked={filters.childFriendly}
            onChange={handleFilterChange}
          />
          👶 Child Friendly
        </label>

        <label>
          <input
            type="checkbox"
            name="wheelchairAccess"
            checked={filters.wheelchairAccess}
            onChange={handleFilterChange}
          />
          ♿ Wheelchair Access
        </label>

        <div className="places-list">
          <h4>📍 Places ({places.length})</h4>
          {loading ? (
            <p className="status">Loading...</p>
          ) : places.length === 0 ? (
            <p className="status">No places found</p>
          ) : (
            places.map((place, idx) => {
              const properties = place.properties || place;
              const favorite = isFavorite(place.id);
              return (
                <div 
                  key={idx} 
                  className="place-card"
                >
                  <div onClick={() => handlePlaceCardClick(place)} style={{ cursor: 'pointer' }}>
                    <h5>{properties.name}</h5>
                    <p className="desc">{properties.description?.substring(0, 50)}...</p>
                    <p className="price"><strong>${properties.price}</strong></p>
                  </div>
                  <button 
                    className={`favorite-btn ${favorite ? 'favorited' : ''}`}
                    onClick={() => toggleFavorite(place)}
                    title={favorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {favorite ? '❤️' : '🤍'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="map-container" ref={mapContainerRef}></div>
    </div>
  );
}