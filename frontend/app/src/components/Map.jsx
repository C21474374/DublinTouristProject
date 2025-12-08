import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import '../styles/Map.scss';
import RatingModal from './RatingModal';
import PlaceDetailsModal from './PlaceDetailsModal';
import PhotoUploadModal from './PhotoUploadModal';
import Filters from './Filters';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';

const API_BASE = 'http://localhost:8000/api';

export default function Map() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const geoJsonLayerRef = useRef(null);
  const routingControlRef = useRef(null);
  const userMarkerRef = useRef(null);
  const { theme } = useTheme();
  
  const [places, setPlaces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPlaceForPhoto, setSelectedPlaceForPhoto] = useState(null);
  const [directionsOpen, setDirectionsOpen] = useState(false);
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

  // ===== POINT IN POLYGON CHECK =====
  const pointInPolygonCheck = (point, polygon) => {
    const [lon, lat] = point;
    
    if (polygon.type === 'Polygon') {
      const ring = polygon.coordinates[0];
      return isPointInRing([lon, lat], ring);
    } else if (polygon.type === 'MultiPolygon') {
      return polygon.coordinates.some(poly => {
        return isPointInRing([lon, lat], poly[0]);
      });
    }
    return false;
  };

  const isPointInRing = (point, ring) => {
    const [x, y] = point;
    let inside = false;

    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1];
      const xj = ring[j][0], yj = ring[j][1];

      const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }

    return inside;
  };

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

  const getFilteredPlaces = () => {
    return places.filter((place) => {
      const props = place.properties || place;
      const placeId = props.id || place.id;

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
          return false;
        }

        const distance = calculateDistance(userLocation, coords);
        if (distance > filters.nearbyDistance) return false;
      }

      if (filters.selectedArea) {
        const selectedAreaObj = areas.find(a => a.id === parseInt(filters.selectedArea));
        
        if (!selectedAreaObj) return false;

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
          return false;
        }

        if (!pointInPolygonCheck(coords, selectedAreaObj.geojson)) {
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
  }, [filteredPlaces, favorites, filters.nearbyDistance, userLocation, filters.nearbyOnly, filters.selectedArea]);

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
    if (!token) {
      alert('Please log in to add favorites');
      return;
    }

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

  // ===== GET USER LOCATION =====
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        
        // Remove old user marker
        if (userMarkerRef.current) {
          mapRef.current.removeLayer(userMarkerRef.current);
        }

        // Add blue marker for user location
        userMarkerRef.current = L.marker([latitude, longitude], {
          icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
          })
        }).addTo(mapRef.current).bindPopup('📍 Your Location');
        
        mapRef.current.setView([latitude, longitude], 15);
        console.log('✅ User location:', latitude, longitude);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Please enable location access');
      }
    );
  };

  // ===== SHOW DIRECTIONS =====
  const showDirections = (place) => {
    if (!userLocation) {
      alert('Please enable location access first');
      getUserLocation();
      return;
    }

    const props = place.properties || place;
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

    if (!coords) {
      alert('Cannot find directions for this place');
      return;
    }

    if (routingControlRef.current) {
      mapRef.current.removeControl(routingControlRef.current);
    }

    const newRoutingControl = L.Routing.control({
      waypoints: [
        L.latLng(userLocation[0], userLocation[1]),
        L.latLng(coords[1], coords[0])
      ],
      routeWhileDragging: true,
      show: true,
      addWaypoints: false,
      lineOptions: {
        styles: [{ color: '#28a745', weight: 4, opacity: 0.8 }]
      }
    }).addTo(mapRef.current);

    routingControlRef.current = newRoutingControl;
    setDirectionsOpen(true);
    console.log('🧭 Directions shown to', props.name);
  };

  // Add this new function to close directions
  const closeDirections = () => {
    if (routingControlRef.current) {
      mapRef.current.removeControl(routingControlRef.current);
      routingControlRef.current = null;
      setDirectionsOpen(false);
      console.log('🧭 Directions closed');
    }
  };

  const handlePlaceCardClick = (place) => {
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
            <p class="popup-rating">
              <span class="popup-stars">
                ${'★'.repeat(Math.round(avgRating))}${'☆'.repeat(5 - Math.round(avgRating))}
              </span>
              (${avgRating.toFixed(1)}/5)
            </p>
            <div class="popup-buttons">
              <button class="directions-popup-btn">
                🧭 Directions
              </button>
              <button class="photo-popup-btn">
                📷 Photos
              </button>
              <button class="favorite-popup-btn">
                ${isFavStatus ? '❤️' : '🤍'}
              </button>
              <button class="details-popup-btn">
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
          
          const dirBtn = popupElement.querySelector('.directions-popup-btn');
          dirBtn.onclick = (e) => {
            e.stopPropagation();
            showDirections(marker.placeData);
          };

          const photoBtn = popupElement.querySelector('.photo-popup-btn');
          photoBtn.onclick = (e) => {
            e.stopPropagation();
            setSelectedPlaceForPhoto(marker.placeData);
            setShowPhotoModal(true);
          };
          
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

  const fetchAreas = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/areas/');
      const data = await response.json();
      setAreas(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error fetching areas:', error);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  useEffect(() => {
    if (!mapRef.current || !areas || areas.length === 0) return;

    if (geoJsonLayerRef.current) {
      mapRef.current.removeLayer(geoJsonLayerRef.current);
    }

    const areasToDisplay = filters.selectedArea 
      ? areas.filter(a => a.id === parseInt(filters.selectedArea))
      : areas;

    const geoJsonFeatures = areasToDisplay.map(area => ({
      type: 'Feature',
      properties: { name: area.name, id: area.id },
      geometry: area.geojson
    }));

    const geoJsonLayer = L.geoJSON(geoJsonFeatures, {
      style: {
        color: theme.primary,
        weight: 2,
        opacity: 0.7,
        fillOpacity: 0.1,
        dashArray: '5, 5'
      },
      onEachFeature: (feature, layer) => {
        layer.bindPopup(`<strong>${feature.properties.name}</strong>`);
        layer.on('mouseover', function() {
          this.setStyle({
            opacity: 1,
            fillOpacity: 0.2,
            weight: 3
          });
        });
        layer.on('mouseout', function() {
          this.setStyle({
            opacity: 0.7,
            fillOpacity: 0.1,
            weight: 2
          });
        });
      }
    }).addTo(mapRef.current);

    geoJsonLayerRef.current = geoJsonLayer;
  }, [areas, filters.selectedArea, mapRef.current, theme]);

  return (
    <>
      <button 
        className="mobile-filters-toggle" 
        onClick={() => setShowFilters(!showFilters)}
        style={{ background: theme.primary }}
      >
        {showFilters ? '✕ Close' : '☰ Filters'}
      </button>

      <button 
        onClick={getUserLocation}
        className="location-btn"
        style={{ background: theme.primary }}
      >
        📍 My Location
      </button>

      {directionsOpen && (
        <button 
          onClick={closeDirections}
          className="close-directions-btn"
        >
          ✕ Close Directions
        </button>
      )}

      <div className="map-wrapper">
        <div className={`left-panel ${showFilters ? 'show' : ''}`} style={{ background: theme.background, color: theme.text }}>
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
            onGetLocation={getUserLocation}
          />
        </div>

        <div className="map-container" ref={mapContainerRef}></div>

        {showPlaceModal && selectedPlace && (
          <PlaceDetailsModal
            place={selectedPlace}
            onClose={() => setShowPlaceModal(false)}
            onRatingAdded={() => fetchPlaces()}
          />
        )}

        {showPhotoModal && selectedPlaceForPhoto && (
          <PhotoUploadModal
            place={selectedPlaceForPhoto}
            token={token}
            onClose={() => {
              setShowPhotoModal(false);
              setSelectedPlaceForPhoto(null);
            }}
            onUploadSuccess={() => {
              console.log('Photo uploaded successfully');
            }}
          />
        )}
      </div>
    </>
  );
}