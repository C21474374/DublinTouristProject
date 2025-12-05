import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import '../styles/Map.scss';
import RatingModal from './RatingModal';
import PlaceDetailsModal from './PlaceDetailsModal';
import { useAuth } from '../hooks/useAuth';

const API_BASE = 'http://localhost:8000/api';

export default function Map() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [places, setPlaces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [filters, setFilters] = useState({
    category: '',
    childFriendly: false,
    wheelchairAccess: false,
  });
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [placeDetails, setPlaceDetails] = useState(null);
  const [showPlaceModal, setShowPlaceModal] = useState(false);
  const { token } = useAuth();

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

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

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

  // Check if we need to center on a specific place from Favorites
  useEffect(() => {
    const centerPlace = sessionStorage.getItem('centerPlace');
    if (centerPlace && mapRef.current && markersRef.current.length > 0) {
      try {
        const place = JSON.parse(centerPlace);
        handlePlaceCardClick(place);
        sessionStorage.removeItem('centerPlace');
      } catch (error) {
        console.error('Error centering on place:', error);
        sessionStorage.removeItem('centerPlace');
      }
    }
  }, [markersRef.current.length]);

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
        const avgRating = properties.average_rating || 0;

        const popupContent = document.createElement('div');
        popupContent.className = 'map-popup';
        popupContent.innerHTML = `
          <h5>${properties.name || 'Unknown'}</h5>
          <p style="margin: 0.5rem 0; font-size: 0.85rem; color: #666;">
            <span style="color: #ffc107;">
              ${'★'.repeat(Math.round(avgRating))}${'☆'.repeat(5 - Math.round(avgRating))}
            </span>
            (${avgRating.toFixed(1)}/5)
          </p>
          <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
            <button class="favorite-popup-btn" style="flex: 1; padding: 0.5rem; font-size: 0.85rem;">
              ${isFavorite ? '❤️' : '🤍'}
            </button>
            <button class="details-popup-btn" style="flex: 1; padding: 0.5rem; font-size: 0.85rem; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">
              View More →
            </button>
          </div>
        `;

        // Store place data on the marker for later access
        marker.placeData = place;

        
        // Add event listener to popup after it opens
        marker.on('popupopen', () => {
          const popupElement = marker.getPopup().getElement();
          
          const favBtn = popupElement.querySelector('.favorite-popup-btn');
          favBtn.onclick = (e) => {
            e.stopPropagation();
            toggleFavorite(marker.placeData);
          };

          const detailsBtn = popupElement.querySelector('.details-popup-btn');
          detailsBtn.onclick = (e) => {
            e.stopPropagation();
            fetchPlaceDetails(marker.placeData);
            setShowPlaceModal(true);
          };
        });

        marker.bindPopup(popupContent);
        markersRef.current.push(marker);
      } catch (error) {
        console.error('Error adding marker:', error);
      }
    });
  }, [places, favorites]); // <-- IMPORTANT: Add favorites here

  // Replace the two useEffects with this:
  useEffect(() => {
    if (token) {
      console.log('🔄 Fetching favourites with token:', token);
      fetchFavorites();
    }
  }, [token]);

  // Render markers whenever places or favorites change
  useEffect(() => {
    console.log('📍 Rendering markers. Places:', places.length, 'Favourites:', favorites.length);
    if (places.length > 0) {
      renderMarkers();
    }
  }, [places, favorites]);

  const renderMarkers = () => {
    console.log('🎨 renderMarkers called. Favorites:', favorites);
    console.log('📋 Favorite IDs:', favorites.map(f => f.id)); // ADD THIS LINE
    
    if (!mapRef.current) {
      console.warn('⚠️ Map ref not ready');
      return;
    }

    markersRef.current.forEach(marker => {
      mapRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    places.forEach((place) => {
      const coords = place.geometry?.coordinates || 
                     place.location?.coordinates || 
                     [place.longitude, place.latitude];

      if (!coords || coords.length < 2) return;

      try {
        const isFavorite = favorites.some(fav => fav.id === place.id);
        console.log(`✅ Place: ${place.id} - "${place.properties?.name}" - Favourite: ${isFavorite}`);
        
        const marker = L.marker([coords[1], coords[0]]).addTo(mapRef.current);
        const properties = place.properties || place;
        const avgRating = properties.average_rating || 0;

        const popupContent = document.createElement('div');
        popupContent.className = 'map-popup';
        popupContent.innerHTML = `
          <h5>${properties.name || 'Unknown'}</h5>
          <p style="margin: 0.5rem 0; font-size: 0.85rem; color: #666;">
            <span style="color: #ffc107;">
              ${'★'.repeat(Math.round(avgRating))}${'☆'.repeat(5 - Math.round(avgRating))}
            </span>
            (${avgRating.toFixed(1)}/5)
          </p>
          <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
            <button class="favorite-popup-btn" style="flex: 1; padding: 0.5rem; font-size: 0.85rem;">
              ${isFavorite ? '❤️' : '🤍'}
            </button>
            <button class="details-popup-btn" style="flex: 1; padding: 0.5rem; font-size: 0.85rem; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">
              View More →
            </button>
          </div>
        `;

        marker.placeData = place;

        marker.on('popupopen', () => {
          const popupElement = marker.getPopup().getElement();
          
          const favBtn = popupElement.querySelector('.favorite-popup-btn');
          favBtn.onclick = (e) => {
            e.stopPropagation();
            toggleFavorite(marker.placeData);
          };

          const detailsBtn = popupElement.querySelector('.details-popup-btn');
          detailsBtn.onclick = (e) => {
            e.stopPropagation();
            fetchPlaceDetails(marker.placeData);
            setShowPlaceModal(true);
          };
        });

        marker.bindPopup(popupContent);
        markersRef.current.push(marker);
      } catch (error) {
        console.error('Error adding marker:', error);
      }
    });
  };

  // Fetch favorites from backend on mount
  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE}/categories/`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchPlaces = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE}/places/`;

      const params = new URLSearchParams();
      if (filters.category) {
        params.append('category', filters.category);
      }
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

  const fetchFavorites = async () => {
    try {
      console.log('📥 Fetching favourites from API...');
      const response = await axios.get(`${API_BASE}/favourites/`, {
        headers: { Authorization: `Token ${token}` }
      });
      console.log('✅ Raw response:', response.data);
      console.log('📊 Response structure:', response.data[0]); // Log first item
    
      const favoritesData = response.data.map(fav => ({
        id: fav.place.id,
        ...fav
      }));
      console.log('✅ Processed favourites:', favoritesData);
      console.log('🔑 Processed IDs:', favoritesData.map(f => f.id));
      setFavorites(favoritesData);
    } catch (error) {
      console.error('❌ Error fetching favourites:', error);
    }
  };

  const fetchPlaceDetails = async (place) => {
    try {
      const response = await axios.get(`${API_BASE}/places/${place.id}/`);
      setPlaceDetails(response.data.properties || response.data);
      setSelectedPlace(place);
    } catch (error) {
      console.error('Error fetching place details:', error);
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

  const isFavorite = (placeId) => {
    console.log('🔍 Checking if favorite. PlaceId:', placeId, 'Favorites:', favorites.map(f => ({ id: f.id, place_id: f.place?.id })));
    return favorites.some(fav => fav.place?.id === placeId);
  };

  const toggleFavorite = async (place) => {
    try {
      const placeId = place.id || place.properties?.id;
      console.log('🔄 Toggling favourite for place:', placeId);
      
      if (!placeId) {
        console.error('❌ No place ID found:', place);
        return;
      }

      const isFav = favorites.some(fav => fav.place?.id === placeId);
      console.log('📊 Currently favourited:', isFav);

      if (isFav) {
        console.log('🗑️ Deleting favourite...');
        await axios.delete(`${API_BASE}/favourites/${placeId}/`, {
          headers: { Authorization: `Token ${token}` }
        });
        setFavorites(favorites.filter(fav => fav.place?.id !== placeId));
      } else {
        console.log('➕ Adding favourite...');
        await axios.post(`${API_BASE}/favourites/`, 
          { place: parseInt(placeId) },
          { headers: { Authorization: `Token ${token}` } }
        );
        await fetchFavorites();
      }
    } catch (error) {
      console.error('❌ Error toggling favourite:', error.response?.data || error);
    }
  };

  return (
    <div className="map-wrapper">
      <div className="filters-sidebar">
        <h3>🔍 Filters</h3>
        
        <select name="category" value={filters.category} onChange={handleFilterChange}>
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
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
              const avgRating = properties.average_rating || 0;
              
              return (
                <div 
                  key={idx} 
                  className="place-card"
                  onClick={() => handlePlaceCardClick(place)}
                >
                  <div style={{ cursor: 'pointer' }}>
                    <h5>{properties.name}</h5>
                    <p className="desc">{properties.description?.substring(0, 50)}...</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                      <p className="price"><strong>€{properties.price}</strong></p>
                      <div style={{ fontSize: '0.9rem' }}>
                        <span style={{ color: '#ffc107' }}>
                          {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}
                        </span>
                        <span style={{ color: '#666', marginLeft: '0.25rem' }}>
                          ({avgRating.toFixed(1)})
                        </span>
                      </div>
                    </div>
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

      {showRatingModal && placeDetails && (
        <RatingModal
          place={selectedPlace}
          onClose={() => setShowRatingModal(false)}
          onRatingAdded={() => {
            fetchPlaces(); // Refresh to get updated ratings
          }}
          userRating={placeDetails.user_rating}
        />
      )}

      {showPlaceModal && selectedPlace && (
        <PlaceDetailsModal
          place={selectedPlace}
          onClose={() => setShowPlaceModal(false)}
          onRatingAdded={() => {
            fetchPlaces();
          }}
        />
      )}
    </div>
  );
}