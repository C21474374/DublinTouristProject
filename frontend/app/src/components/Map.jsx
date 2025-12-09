/**
 * Main Map Component
 * Interactive map with place markers, filtering, directions, and photo upload
 * Features:
 * - Display places with category-based emoji markers
 * - Filter places by category, amenities, distance, and area
 * - Show user location and get directions
 * - Upload photos to places
 * - View and rate places
 * - Add/remove favorites
 * - Display area boundaries as GeoJSON polygons
 */

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

const API_BASE = 
  process.env.NODE_ENV === 'production'
    ? 'https://dublin-guide.onrender.com/api'
    : 'http://localhost:8000/api';

export default function Map() {
  // ===== REFS =====
  // Refs are used to store direct DOM/Leaflet references that don't trigger re-renders
  
  const mapContainerRef = useRef(null);  // DOM container for Leaflet map
  const mapRef = useRef(null);  // Leaflet map instance
  const markersRef = useRef([]);  // Store all markers for cleanup
  const geoJsonLayerRef = useRef(null);  // Area boundaries layer
  const routingControlRef = useRef(null);  // Directions/routing control
  const userMarkerRef = useRef(null);  // Blue marker for user location

  // ===== CONTEXT =====
  // Get values from React context providers
  const { theme } = useTheme();  // Theme object with colors
  
  // ===== STATE =====
  // Places data from API
  const [places, setPlaces] = useState([]);  // All places from API
  const [categories, setCategories] = useState([]);  // Place categories (Museum, Park, etc)
  const [loading, setLoading] = useState(true);  // Loading state for API calls
  
  // User data
  const [favorites, setFavorites] = useState([]);  // User's favorite places
  const [userLocation, setUserLocation] = useState(null);  // User's GPS coordinates [lat, lng]
  
  // UI state
  const [showFilters, setShowFilters] = useState(false);  // Show/hide filter panel on mobile
  const [showPhotoModal, setShowPhotoModal] = useState(false);  // Show photo upload modal
  const [selectedPlaceForPhoto, setSelectedPlaceForPhoto] = useState(null);  // Place to upload photo to
  const [directionsOpen, setDirectionsOpen] = useState(false);  // Directions panel visible
  
  // Filter state - controls which places are displayed
  const [filters, setFilters] = useState({
    category: '',  // Filter by category ID
    childFriendly: false,  // Only show child-friendly places
    wheelchairAccess: false,  // Only show wheelchair accessible places
    favoritesOnly: false,  // Only show favorite places
    nearbyOnly: false,  // Only show places near user
    nearbyDistance: 5,  // Distance radius in kilometers
    selectedArea: null,  // Filter by geographic area
  });
  
  // Modal state - for place details
  const [selectedPlace, setSelectedPlace] = useState(null);  // Currently viewing this place
  const [showPlaceModal, setShowPlaceModal] = useState(false);  // Show place details modal
  
  // Geographic data
  const [areas, setAreas] = useState([]);  // Dublin area boundaries from API
  const { token } = useAuth();  // User's auth token

  // ===== GEOSPATIAL UTILITIES =====

  /**
   * Check if a point is within a polygon using ray casting algorithm
   * Handles both Polygon and MultiPolygon geometries
   * Used for area filtering - check if place is inside selected area
   * 
   * @param {Array} point - [longitude, latitude]
   * @param {Object} polygon - GeoJSON geometry object
   * @returns {boolean} True if point is inside polygon
   */
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

  /**
   * Ray casting algorithm to check if point is inside polygon ring
   * Shoots a ray from the point and counts intersections with polygon edges
   * Odd number of intersections = inside, even = outside
   * 
   * @param {Array} point - [longitude, latitude]
   * @param {Array} ring - Array of [lon, lat] coordinate pairs forming polygon ring
   * @returns {boolean} True if point is inside the ring
   */
  const isPointInRing = (point, ring) => {
    const [x, y] = point;
    let inside = false;

    // Check each edge of the polygon
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1];
      const xj = ring[j][0], yj = ring[j][1];

      // Check if ray from point intersects this edge
      const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }

    return inside;
  };

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Used for "nearby places" filtering
   * 
   * @param {Array} loc1 - [latitude, longitude]
   * @param {Array} loc2 - [longitude, latitude]
   * @returns {number} Distance in kilometers
   */
  const calculateDistance = (loc1, loc2) => {
    const [lat1, lon1] = loc1;
    const [lon2, lat2] = loc2;
    const R = 6371;  // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // ===== FILTERING LOGIC =====

  /**
   * Apply all filters to places array
   * Returns filtered places based on:
   * - Category
   * - Child friendly
   * - Wheelchair accessible
   * - Favorites only
   * - Nearby (distance from user)
   * - Area (polygon containment)
   * 
   * @returns {Array} Filtered places array
   */
  const getFilteredPlaces = () => {
    return places.filter((place) => {
      const props = place.properties || place;
      const placeId = props.id || place.id;

      // Filter by category - skip if place category doesn't match filter
      if (filters.category && props.category !== parseInt(filters.category)) {
        return false;
      }

      // Filter by child friendly - skip if filter enabled but place isn't child-friendly
      if (filters.childFriendly && !props.child_friendly) {
        return false;
      }

      // Filter by wheelchair access - skip if filter enabled but place isn't accessible
      if (filters.wheelchairAccess && !props.wheelchair_access) {
        return false;
      }

      // Filter by favorites - skip if "favorites only" enabled and place isn't favorited
      if (filters.favoritesOnly) {
        const isFav = favorites.some(fav => fav.place?.id === placeId);
        if (!isFav) return false;
      }

      // Filter by nearby distance - skip if place is farther than selected radius
      if (filters.nearbyOnly && userLocation) {
        // Extract place coordinates from various possible formats
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

        // Skip if we can't find coordinates
        if (!coords || coords.length !== 2) {
          return false;
        }

        // Calculate distance and skip if outside radius
        const distance = calculateDistance(userLocation, coords);
        if (distance > filters.nearbyDistance) return false;
      }

      // Filter by area - skip if place is outside selected geographic area
      if (filters.selectedArea) {
        const selectedAreaObj = areas.find(a => a.id === parseInt(filters.selectedArea));
        
        if (!selectedAreaObj) return false;

        // Extract place coordinates
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

        // Skip if we can't find coordinates
        if (!coords || coords.length !== 2) {
          return false;
        }

        // Skip if place is outside the selected area polygon
        if (!pointInPolygonCheck(coords, selectedAreaObj.geojson)) {
          return false;
        }
      }

      // Place passed all filters
      return true;
    });
  };

  // Get currently filtered places
  const filteredPlaces = getFilteredPlaces();

  // ===== INITIALIZATION EFFECTS =====

  /**
   * Fetch categories from API on component mount
   */
  useEffect(() => {
    fetchCategories();
  }, []);

  /**
   * Initialize Leaflet map on component mount
   * Creates map instance, adds tile layer, and sets default view
   */
  useEffect(() => {
    // Skip if map already initialized or container not found
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      // Create Leaflet map instance centered on Dublin
      mapRef.current = L.map(mapContainerRef.current).setView([53.3498, -6.2603], 13);

      // Add OpenStreetMap tiles (free map layer)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
        maxNativeZoom: 18,
      }).addTo(mapRef.current);

      // Force map to recalculate size after small delay
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 100);
    } catch (error) {
      console.error('Map initialization error:', error);
    }
  }, []);

  /**
   * Fetch user's favorite places when auth token changes
   * Re-fetch when user logs in/out
   */
  useEffect(() => {
    if (token) {
      fetchFavorites();
    }
  }, [token]);

  /**
   * Re-render markers whenever filter state or places change
   * Runs when: filtered places, favorites, filter values, user location, or selected area changes
   */
  useEffect(() => {
    renderMarkers();
  }, [filteredPlaces, favorites, filters.nearbyDistance, userLocation, filters.nearbyOnly, filters.selectedArea]);

  // ===== API CALLS =====

  /**
   * Fetch categories from API
   * Categories are: Museum, Park, Restaurant, etc.
   * Handles both array and paginated response formats
   */
  const fetchCategories = async () => {
    try {
      console.log('Fetching categories from:', `${API_BASE}/categories/`);
      
      const response = await axios.get(`${API_BASE}/categories/`);
      console.log('Raw categories response:', response.data);
      
      let categoriesData = [];
      // Handle different response formats
      if (Array.isArray(response.data)) {
        console.log('Categories: Using direct array');
        categoriesData = response.data;
      } else if (response.data.results && Array.isArray(response.data.results)) {
        console.log('Categories: Using paginated results');
        categoriesData = response.data.results;
      } else {
        console.warn('Unknown categories response format:', response.data);
        categoriesData = [];
      }
      
      console.log('Final categoriesData:', categoriesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  /**
   * Fetch all places from API
   * Includes location coordinates and place details
   * Handles GeoJSON, paginated, and array response formats
   */
  const fetchPlaces = async () => {
    try {
      setLoading(true);
      console.log('Fetching places from:', `${API_BASE}/places/`);
      
      const response = await axios.get(`${API_BASE}/places/`);
      console.log('Raw response:', response.data);
      console.log('Response type:', typeof response.data);
      console.log('Is array?', Array.isArray(response.data));
      
      let placesData = [];
      // Handle different response formats
      if (response.data.features && Array.isArray(response.data.features)) {
        console.log('Using GeoJSON features');
        placesData = response.data.features;
      } else if (response.data.results && Array.isArray(response.data.results)) {
        console.log('Using paginated results');
        placesData = response.data.results;
      } else if (Array.isArray(response.data)) {
        console.log('Using direct array');
        placesData = response.data;
      } else {
        console.warn('Unknown response format:', response.data);
        placesData = [];
      }
      
      console.log('Final placesData:', placesData);
      setPlaces(placesData);
    } catch (error) {
      console.error('Error fetching places:', error);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch places on component mount
   */
  useEffect(() => {
    fetchPlaces();
  }, []);

  /**
   * Fetch user's favorite places from API
   * Only called if user is authenticated
   * Stores favorite data with place details
   */
  const fetchFavorites = async () => {
    try {
      const response = await axios.get(`${API_BASE}/favourites/`, {
        headers: { Authorization: `Token ${token}` }
      });
      const favData = Array.isArray(response.data) 
        ? response.data 
        : response.data.results || [];
      
      // Map favorite data to include place ID at top level
      const favoritesData = favData.map(fav => ({
        id: fav.place.id,
        ...fav
      }));
      setFavorites(favoritesData);
    } catch (error) {
      console.error('Error fetching favourites:', error);
    }
  };

  /**
   * Fetch detailed place information and open modal
   * Gets full place details including ratings and reviews
   * 
   * @param {Object} place - Place object to fetch details for
   */
  const fetchPlaceDetails = async (place) => {
    try {
      const response = await axios.get(`${API_BASE}/places/${place.id}/`);
      setSelectedPlace(place);
      setShowPlaceModal(true);
    } catch (error) {
      console.error('Error fetching place details:', error);
    }
  };

  /**
   * Check if a place is in user's favorites
   * 
   * @param {number} placeId - Place ID to check
   * @returns {boolean} True if place is favorited
   */
  const isFavorite = (placeId) => {
    return favorites.some(fav => fav.place?.id === placeId);
  };

  /**
   * Toggle favorite status for a place
   * Adds to or removes from user's favorites via API
   * Handles authentication check
   * 
   * @param {Object} place - Place to toggle favorite for
   */
  const toggleFavorite = async (place) => {
    // Check if user is logged in
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
        // Remove from favorites - DELETE request
        await axios.delete(`${API_BASE}/favourites/${placeId}/`, {
          headers: { Authorization: `Token ${token}` }
        });
        setFavorites(favorites.filter(fav => fav.place?.id !== placeId));
      } else {
        // Add to favorites - POST request
        await axios.post(`${API_BASE}/favourites/`, 
          { place: parseInt(placeId) },
          { headers: { Authorization: `Token ${token}` } }
        );
        // Refresh favorites to get latest data
        await fetchFavorites();
      }
    } catch (error) {
      console.error('Error toggling favourite:', error);
    }
  };

  // ===== USER LOCATION =====

  /**
   * Request user's geolocation using browser Geolocation API
   * Adds blue marker for user location on map
   * Centers map on user location
   * Used for "nearby places" feature
   */
  const getUserLocation = () => {
    // Check if browser supports geolocation
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        
        // Remove old user marker if one already exists
        if (userMarkerRef.current) {
          mapRef.current.removeLayer(userMarkerRef.current);
        }

        // Add blue marker for user's current location
        userMarkerRef.current = L.marker([latitude, longitude], {
          icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
          })
        }).addTo(mapRef.current).bindPopup('📍 Your Location');
        
        // Center map on user and zoom in
        mapRef.current.setView([latitude, longitude], 15);
        console.log('✅ User location:', latitude, longitude);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Please enable location access');
      }
    );
  };

  // ===== DIRECTIONS =====

  /**
   * Show directions from user location to selected place
   * Uses Leaflet Routing Machine plugin for routing
   * Draws route polyline on map
   * 
   * @param {Object} place - Destination place
   */
  const showDirections = (place) => {
    // Check if user location is available
    if (!userLocation) {
      alert('Please enable location access first');
      getUserLocation();
      return;
    }

    const props = place.properties || place;
    let coords;
    
    // Extract coordinates from various possible formats
    if (place.geometry?.coordinates?.length === 2) {
      coords = place.geometry.coordinates;
    } else if (props.location?.coordinates?.length === 2) {
      coords = props.location.coordinates;
    } else if (props.latitude && props.longitude) {
      coords = [props.longitude, props.latitude];
    } else if (place.latitude && place.longitude) {
      coords = [place.longitude, place.latitude];
    }

    // Skip if coordinates not found
    if (!coords) {
      alert('Cannot find directions for this place');
      return;
    }

    // Remove old routing control if one exists
    if (routingControlRef.current) {
      mapRef.current.removeControl(routingControlRef.current);
    }

    // Create new routing control with start and end points
    const newRoutingControl = L.Routing.control({
      waypoints: [
        L.latLng(userLocation[0], userLocation[1]),  // Start: user location
        L.latLng(coords[1], coords[0])  // End: place location
      ],
      routeWhileDragging: false,
      show: true,
      addWaypoints: false,
      alternative: false,
      language: 'en',
      lineOptions: {
        styles: [{ color: '#287ab4ff', weight: 4, opacity: 0.8 }]
      }
    }).addTo(mapRef.current);

    routingControlRef.current = newRoutingControl;
    setDirectionsOpen(true);
    console.log('Directions shown to', props.name);
  };

  /**
   * Close and remove directions from map
   * Removes routing control and hides direction panel
   */
  const closeDirections = () => {
    if (routingControlRef.current) {
      mapRef.current.removeControl(routingControlRef.current);
      routingControlRef.current = null;
      setDirectionsOpen(false);
      console.log('Directions closed');
    }
  };

  /**
   * Handle click on place card in filter panel
   * Navigates map to place, centers on it, and opens marker popup
   * 
   * @param {Object} place - Place to navigate to
   */
  const handlePlaceCardClick = (place) => {
    const props = place.properties || place;
    const placeId = props.id || place.id;
    
    // Extract place coordinates
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

    // Skip if coordinates not found
    if (!coords || coords.length !== 2) {
      console.error('❌ Cannot find valid coordinates');
      return;
    }

    try {
      // Center map on place and zoom to level 16
      mapRef.current.setView([coords[1], coords[0]], 16, { animate: true });

      // Find and open popup for matching marker
      markersRef.current.forEach(marker => {
        if (marker.getLatLng().lat === coords[1] && marker.getLatLng().lng === coords[0]) {
          marker.openPopup();
        }
      });
    } catch (error) {
      console.error('Error zooming map:', error);
    }
  };

  // ===== MARKER RENDERING =====

  /**
   * Get emoji icon for place category
   * Maps category names to emoji icons
   * 
   * @param {number} categoryId - Category ID
   * @param {Array} categoriesData - Categories array (optional, defaults to state)
   * @returns {string} Emoji character for marker
   */
  const getCategoryIcon = (categoryId, categoriesData = categories) => {
    // Mapping of category names to emoji
    const categoryMap = {
      'Attraction': '🎡',
      'Museum': '🏛️',
      'Restaurant': '🍽️',
      'Park': '🌳',
      'Nightlife': '🎉',
      'Historical': '📖',
    };

    // Find category by ID from API data
    const category = categoriesData.find(cat => cat.id === categoryId);
    const categoryName = category?.name || 'Place';
    
    // Return emoji or default pin
    return categoryMap[categoryName] || '📍';
  };

  /**
   * Create custom Leaflet icon with emoji
   * Used instead of default map pins
   * 
   * @param {string} emoji - Emoji character to display
   * @returns {Object} Leaflet icon object
   */
  const createCustomIcon = (emoji) => {
    return L.divIcon({
      html: `<div class="custom-marker">${emoji}</div>`,
      className: 'custom-icon-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
    });
  };

  /**
   * Render all place markers on map
   * Creates popup with place info and action buttons
   * Called whenever filtered places change
   * 
   * Marker actions:
   * - Directions: Show route to place
   * - Photos: Upload or view photos
   * - Favorite: Add/remove from favorites
   * - View More: Open place details modal
   */
  const renderMarkers = () => {
    console.log('🎨 Rendering markers. Count:', filteredPlaces.length);
    
    // Clear all existing markers from map
    if (mapRef.current) {
      markersRef.current.forEach(marker => {
        mapRef.current.removeLayer(marker);
      });
    }
    markersRef.current = [];

    // Skip if map not initialized
    if (!mapRef.current) return;

    // Add marker for each filtered place
    filteredPlaces.forEach((place) => {
      const props = place.properties || place;
      const placeId = props.id || place.id;
      const categoryId = props.category;
      
      // Extract place coordinates from various formats
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

      // Skip place if we can't find valid coordinates
      if (!coords || coords.length !== 2 || !placeId) {
        console.warn(`⚠️ Invalid data - ${props.name}`);
        return;
      }

      try {
        const isFav = isFavorite(placeId);
        const emoji = getCategoryIcon(categoryId, categories);
        const customIcon = createCustomIcon(emoji);
        
        // Create marker on map
        const marker = L.marker([coords[1], coords[0]], { icon: customIcon }).addTo(mapRef.current);
        const avgRating = props.average_rating || 0;

        /**
         * Create popup HTML content with place info and action buttons
         * Shows inside popup when marker is clicked
         * 
         * @param {boolean} isFavStatus - Whether place is currently favorited
         * @returns {HTMLElement} Popup content
         */
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
              <button class="directions-popup-btn">Directions</button>
              <button class="photo-popup-btn">Photos</button>
              <button class="favorite-popup-btn">${isFavStatus ? '❤️' : '🤍'}</button>
              <button class="details-popup-btn">View More</button>
            </div>
          `;
          return popupContent;
        };

        // Store place data on marker for later access
        marker.placeData = place;
        marker.bindPopup(createPopupContent(isFav));

        // Attach event handlers when popup opens
        marker.on('popupopen', () => {
          const popupElement = marker.getPopup().getElement();
          
          // Directions button - show route to place
          const dirBtn = popupElement.querySelector('.directions-popup-btn');
          dirBtn.onclick = (e) => {
            e.stopPropagation();
            showDirections(marker.placeData);
          };

          // Photos button - upload or view photos
          const photoBtn = popupElement.querySelector('.photo-popup-btn');
          photoBtn.onclick = (e) => {
            e.stopPropagation();
            setSelectedPlaceForPhoto(marker.placeData);
            setShowPhotoModal(true);
          };
          
          // Favorite button - add/remove from favorites
          const favBtn = popupElement.querySelector('.favorite-popup-btn');
          favBtn.onclick = (e) => {
            e.stopPropagation();
            toggleFavorite(marker.placeData);
          };

          // Details button - open full place details modal
          const detailsBtn = popupElement.querySelector('.details-popup-btn');
          detailsBtn.onclick = (e) => {
            e.stopPropagation();
            fetchPlaceDetails(marker.placeData);
          };
        });

        // Store marker reference for cleanup
        markersRef.current.push(marker);
      } catch (error) {
        console.error('Error adding marker:', error);
      }
    });
  };

  /**
   * Fetch area boundaries (Dublin regions) from API
   * GeoJSON data used for filtering and map display
   * Handles both array and paginated response formats
   */
  const fetchAreas = async () => {
    try {
      console.log('Fetching areas from:', `${API_BASE}/areas/`);
      
      const response = await fetch(`${API_BASE}/areas/`);
      const data = await response.json();
      
      console.log('Raw areas response:', data);
      console.log('Areas response type:', typeof data);
      console.log('Is array?', Array.isArray(data));
      
      let areasData = [];
      // Handle different response formats
      if (Array.isArray(data)) {
        console.log('Using direct array');
        areasData = data;
      } else if (data.results && Array.isArray(data.results)) {
        console.log('Using paginated results');
        areasData = data.results;
      } else {
        console.warn('Unknown areas response format:', data);
        areasData = [];
      }
      
      console.log('Final areasData:', areasData);
      setAreas(areasData);
    } catch (error) {
      console.error('Error fetching areas:', error);
      setAreas([]);
    }
  };

  /**
   * Fetch areas on component mount
   */
  useEffect(() => {
    fetchAreas();
  }, []);

  // ===== AREA BOUNDARIES RENDERING =====

  /**
   * Render area boundaries on map as GeoJSON layers
   * Shows polygon outlines for Dublin areas
   * Only shows selected area if an area filter is applied
   * Updates when areas data or selected area filter changes
   */
  useEffect(() => {
    if (!mapRef.current || !areas || areas.length === 0) return;

    // Remove existing area layer if one exists
    if (geoJsonLayerRef.current) {
      mapRef.current.removeLayer(geoJsonLayerRef.current);
    }

    // Determine which areas to display (all or just selected)
    const areasToDisplay = filters.selectedArea 
      ? areas.filter(a => a.id === parseInt(filters.selectedArea))
      : areas;

    // Convert area data to GeoJSON features
    const geoJsonFeatures = areasToDisplay.map(area => ({
      type: 'Feature',
      properties: { name: area.name, id: area.id },
      geometry: area.geojson
    }));

    // Create GeoJSON layer with styling
    const geoJsonLayer = L.geoJSON(geoJsonFeatures, {
      style: {
        color: theme.primary,  // Primary theme color
        weight: 2,  // Line thickness
        opacity: 0.7,  // Line transparency
        fillOpacity: 0.1,  // Fill transparency
        dashArray: '5, 5'  // Dashed line pattern
      },
      onEachFeature: (feature, layer) => {
        // Add popup on click
        layer.bindPopup(`<strong>${feature.properties.name}</strong>`);
        
        // Highlight area on hover
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

    // Store reference for cleanup
    geoJsonLayerRef.current = geoJsonLayer;
  }, [areas, filters.selectedArea, mapRef.current, theme]);

  // ===== RENDER =====

  return (
    <>
      {/* Mobile filters toggle button */}
      <button 
        className="mobile-filters-toggle" 
        onClick={() => setShowFilters(!showFilters)}
        aria-label="Toggle filters"
      >
        {showFilters ? 'Close' : 'Filters'}
      </button>

      {/* Get user location button */}
      <button 
        onClick={getUserLocation}
        className="location-btn"
        title="Get your location"
      >
        📍 My Location
      </button>

      {/* Cancel directions button - shows when directions are open */}
      {directionsOpen && (
        <button 
          onClick={closeDirections}
          className="close-directions-btn"
          title="Close directions"
        >
          ✕ Cancel Directions
        </button>
      )}

      <div className="map-wrapper">
        {/* Left panel - filters and place list */}
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

        {/* Map container */}
        <div className="map-container" ref={mapContainerRef}></div>

        {/* Place details modal - shows when user clicks "View More" */}
        {showPlaceModal && selectedPlace && (
          <PlaceDetailsModal
            place={selectedPlace}
            onClose={() => setShowPlaceModal(false)}
            onRatingAdded={() => fetchPlaces()}
          />
        )}

        {/* Photo upload modal - shows when user clicks "Photos" */}
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