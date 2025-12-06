import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import '../styles/Map.scss';
import RatingModal from './RatingModal';
import PlaceDetailsModal from './PlaceDetailsModal';
import Filters from './Filters';
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
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    category: '',
    childFriendly: false,
    wheelchairAccess: false,
    favoritesOnly: false,
    nearbyOnly: false,
    nearbyDistance: 5,
    selectedArea: null,
  });
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showPlaceModal, setShowPlaceModal] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [areas, setAreas] = useState([]);
  const { token } = useAuth();

  // ===== DEFINE ALL FUNCTIONS FIRST =====
  
  const calculateDistance = (loc1, loc2) => {
    const [lat1, lon1] = loc1;
    const [lon2, lat2] = loc2;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const isPointInArea = (place, area) => {
    return true;
  };

  const getFilteredPlaces = () => {
    return places.filter((place) => {
      const props = place.properties || place;
      const placeId = props.id || place.id;

      // Log first place to see structure
      if (places.length > 0 && places[0] === place) {
        console.log('🔍 PLACE DATA STRUCTURE:', JSON.stringify(place, null, 2));
      }

      if (filters.category && props.category !== parseInt(filters.category)) {
        return false;
      }

      if (filters.childFriendly && !props.child_friendly) {
        return false;
      }

      if (filters.wheelchairAccess && !props.wheelchair_access) {
        return false;
      }

      if (filters.favoritesOnly) {
        const isFav = favorites.some(fav => fav.place?.id === placeId);
        if (!isFav) return false;
      }

      if (filters.nearbyOnly && userLocation) {
        // Extract coords properly
        let coords;
        if (place.geometry?.coordinates?.length === 2) {
          coords = place.geometry.coordinates;
        } else if (props.location?.coordinates?.length === 2) {
          coords = props.location.coordinates;
        } else if (props.latitude && props.longitude) {
          coords = [parseFloat(props.longitude), parseFloat(props.latitude)];
        } else if (place.latitude && place.longitude) {
          coords = [parseFloat(place.longitude), parseFloat(place.latitude)];
        }

        if (!coords || coords.length !== 2) {
          console.warn(`⚠️ No coords found for ${props.name}`);
          return false;
        }

        const distance = calculateDistance(userLocation, coords);
        console.log(`📏 ${props.name}: ${distance.toFixed(2)}km (limit: ${filters.nearbyDistance}km)`);
        if (distance > filters.nearbyDistance) return false;
      }

      if (filters.selectedArea) {
        if (!isPointInArea(place, filters.selectedArea)) {
          return false;
        }
      }

      return true;
    });
  };

  const filteredPlaces = getFilteredPlaces();

  // ===== useEffects =====

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      mapRef.current = L.map(mapContainerRef.current).setView([53.3498, -6.2603], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
        maxNativeZoom: 18,
      }).addTo(mapRef.current);

      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 100);
    } catch (error) {
      console.error('Map initialization error:', error);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchFavorites();
    }
  }, [token]);

  useEffect(() => {
    renderMarkers();
  }, [filteredPlaces, favorites, filters.nearbyDistance, userLocation, filters.nearbyOnly]);

  // Fetch places
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
      const response = await axios.get(`${API_BASE}/places/`);
      setPlaces(response.data.features || response.data);
    } catch (error) {
      console.error('Error fetching places:', error);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  const fetchFavorites = async () => {
    try {
      const response = await axios.get(`${API_BASE}/favourites/`, {
        headers: { Authorization: `Token ${token}` }
      });
      const favoritesData = response.data.map(fav => ({
        id: fav.place.id,
        ...fav
      }));
      setFavorites(favoritesData);
    } catch (error) {
      console.error('Error fetching favourites:', error);
    }
  };

  const fetchPlaceDetails = async (place) => {
    try {
      const response = await axios.get(`${API_BASE}/places/${place.id}/`);
      setSelectedPlace(place);
      setShowPlaceModal(true);
    } catch (error) {
      console.error('Error fetching place details:', error);
    }
  };

  const isFavorite = (placeId) => {
    return favorites.some(fav => fav.place?.id === placeId);
  };

  const toggleFavorite = async (place) => {
    try {
      const placeId = place.id || place.properties?.id;
      
      if (!placeId) {
        console.error('No place ID found');
        return;
      }

      const isFav = isFavorite(placeId);

      if (isFav) {
        await axios.delete(`${API_BASE}/favourites/${placeId}/`, {
          headers: { Authorization: `Token ${token}` }
        });
        setFavorites(favorites.filter(fav => fav.place?.id !== placeId));
      } else {
        await axios.post(`${API_BASE}/favourites/`, 
          { place: parseInt(placeId) },
          { headers: { Authorization: `Token ${token}` } }
        );
        await fetchFavorites();
      }
    } catch (error) {
      console.error('Error toggling favourite:', error);
    }
  };

  const handlePlaceCardClick = (place) => {
    console.log('🔍 FULL PLACE OBJECT:', JSON.stringify(place, null, 2));
    
    const props = place.properties || place;
    const placeId = props.id || place.id;
    
    // Try all possible coordinate locations
    let coords;
    if (place.geometry?.coordinates?.length === 2) {
      coords = place.geometry.coordinates;
    } else if (props.location?.coordinates?.length === 2) {
      coords = props.location.coordinates;
    } else if (props.latitude && props.longitude) {
      coords = [props.longitude, props.latitude];
    } else if (place.latitude && place.longitude) {
      coords = [place.longitude, place.latitude];
    }

    console.log(`📍 Clicked: ${props.name}, ID: ${placeId}, Coords: ${JSON.stringify(coords)}`);

    if (!coords || coords.length !== 2) {
      console.error('❌ Cannot find valid coordinates');
      return;
    }

    try {
      mapRef.current.setView([coords[1], coords[0]], 16, { animate: true });

      markersRef.current.forEach(marker => {
        if (marker.getLatLng().lat === coords[1] && marker.getLatLng().lng === coords[0]) {
          marker.openPopup();
        }
      });
    } catch (error) {
      console.error('Error zooming map:', error);
    }
  };

  const renderMarkers = () => {
    console.log('🎨 Rendering markers. Count:', filteredPlaces.length);
    
    // Clear ALL markers first
    if (mapRef.current) {
      markersRef.current.forEach(marker => {
        mapRef.current.removeLayer(marker);
      });
    }
    markersRef.current = [];

    if (!mapRef.current) return;

    filteredPlaces.forEach((place) => {
      const props = place.properties || place;
      const placeId = props.id || place.id;
      
      let coords;
      if (place.geometry?.coordinates?.length === 2) {
        coords = place.geometry.coordinates;
      } else if (props.location?.coordinates?.length === 2) {
        coords = props.location.coordinates;
      } else if (props.latitude && props.longitude) {
        coords = [props.longitude, props.latitude];
      } else if (place.latitude && place.longitude) {
        coords = [place.longitude, place.latitude];
      }

      if (!coords || coords.length !== 2 || !placeId) {
        console.warn(`⚠️ Invalid data - ${props.name}`);
        return;
      }

      try {
        const isFav = isFavorite(placeId);
        const marker = L.marker([coords[1], coords[0]]).addTo(mapRef.current);
        const avgRating = props.average_rating || 0;

        const createPopupContent = (isFavStatus) => {
          const popupContent = document.createElement('div');
          popupContent.className = 'map-popup';
          popupContent.innerHTML = `
            <h5>${props.name || 'Unknown'}</h5>
            <p style="margin: 0.5rem 0; font-size: 0.85rem; color: #666;">
              <span style="color: #ffc107;">
                ${'★'.repeat(Math.round(avgRating))}${'☆'.repeat(5 - Math.round(avgRating))}
              </span>
              (${avgRating.toFixed(1)}/5)
            </p>
            <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
              <button class="favorite-popup-btn" style="flex: 1; padding: 0.5rem; font-size: 0.85rem;">
                ${isFavStatus ? '❤️' : '🤍'}
              </button>
              <button class="details-popup-btn" style="flex: 1; padding: 0.5rem; font-size: 0.85rem; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">
                View More →
              </button>
            </div>
          `;
          return popupContent;
        };

        marker.placeData = place;
        marker.bindPopup(createPopupContent(isFav));

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
          };
        });

        markersRef.current.push(marker);
      } catch (error) {
        console.error('Error adding marker:', error);
      }
    });
  };

  return (
    <>
      <button className="mobile-filters-toggle" onClick={() => setShowFilters(!showFilters)}>
        {showFilters ? '✕ Close' : '☰ Filters'}
      </button>

      <div className="map-wrapper">
        <div className={`left-panel ${showFilters ? 'show' : ''}`}>
          <h1>🗺️ Tourist Guide</h1>
          
          <Filters 
            filters={filters}
            setFilters={setFilters}
            categories={categories}
            areas={areas}
            filteredPlaces={filteredPlaces}
            loading={loading}
            favorites={favorites}
            onPlaceCardClick={handlePlaceCardClick}
            onToggleFavorite={toggleFavorite}
            isFavorite={isFavorite}
            onGetLocation={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    const { latitude, longitude } = position.coords;
                    console.log('📍 User location:', latitude, longitude);
                    setUserLocation([latitude, longitude]);
                  },
                  (error) => {
                    console.error('Geolocation error:', error);
                    alert('Please enable location access to use nearby filter');
                    setFilters(prev => ({ ...prev, nearbyOnly: false }));
                  }
                );
              } else {
                alert('Geolocation is not supported by your browser');
              }
            }}
          />
        </div>

        <div className="map-container" ref={mapContainerRef}></div>

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
    </>
  );
}