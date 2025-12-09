/**
 * Itinerary Page Component
 * Allows users to create new itineraries by adding places in sequence.
 * Users can also view, load, and delete previously saved itineraries.
 * Supports drag-and-drop reordering of stops.
 * Displays route on map with markers and polyline.
 */

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import axios from 'axios';
import L from 'leaflet';
import { useAuth } from '../hooks/useAuth';
import '../styles/Itinerary.scss';

const API_BASE = 
  process.env.NODE_ENV === 'production'
    ? 'https://dublin-guide.onrender.com/api'
    : 'http://localhost:8000/api';

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function Itinerary() {
  const { user } = useAuth();
  const [mode, setMode] = useState('create'); // 'create' or 'view'
  const [newItineraryName, setNewItineraryName] = useState('');
  const [places, setPlaces] = useState([]);
  const [stops, setStops] = useState([]);  // Current route being built
  const [savedItineraries, setSavedItineraries] = useState([]);  // All user's saved itineraries
  const [selectedItinerary, setSelectedItinerary] = useState(null);  // Currently viewing this itinerary
  const [loading, setLoading] = useState(false);
  const [draggedStop, setDraggedStop] = useState(null);  // Index of stop being dragged

  // Fetch all places and saved itineraries on component mount
  useEffect(() => {
    fetchPlaces();
    fetchSavedItineraries();
  }, []);

  /**
   * Fetch all available places from API
   * Handles both GeoJSON and paginated responses
   */
  const fetchPlaces = async () => {
    try {
      const response = await axios.get(`${API_BASE}/places/`);
      const placesData = response.data.features || Array.isArray(response.data) 
        ? response.data 
        : response.data.results || [];
      setPlaces(placesData);
    } catch (error) {
      console.error('Error fetching places:', error);
    }
  };

  /**
   * Fetch user's saved itineraries from API
   * Handles both array and paginated responses
   */
  const fetchSavedItineraries = async () => {
    try {
      const response = await axios.get(`${API_BASE}/itineraries/`);
      const itinerariesData = Array.isArray(response.data) 
        ? response.data 
        : response.data.results || [];
      setSavedItineraries(itinerariesData);
    } catch (error) {
      console.error('Error fetching itineraries:', error);
    }
  };

  /**
   * Add a place to the current route being built
   * Creates a new stop with unique ID and order
   */
  const addPlaceToRoute = (place) => {
    const properties = place.properties || place;
    const newStop = {
      id: Date.now(),
      place: place,
      order: stops.length + 1,
    };
    setStops([...stops, newStop]);
  };

  /**
   * Remove a stop from the current route
   * Re-orders remaining stops to maintain sequence
   */
  const removeStop = (id) => {
    const updated = stops.filter(stop => stop.id !== id);
    // Reorder stops to ensure consecutive numbering
    const reordered = updated.map((stop, idx) => ({
      ...stop,
      order: idx + 1,
    }));
    setStops(reordered);
  };

  /**
   * Handle drag start for stop reordering
   */
  const handleDragStart = (e, index) => {
    setDraggedStop(index);
  };

  /**
   * Allow drag over for drop zone
   */
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  /**
   * Handle drop to reorder stops
   * Removes dragged item and inserts at target position
   */
  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedStop === null || draggedStop === targetIndex) return;

    const newStops = [...stops];
    const [draggedItem] = newStops.splice(draggedStop, 1);
    newStops.splice(targetIndex, 0, draggedItem);

    // Re-order all stops after drop
    const reordered = newStops.map((stop, idx) => ({
      ...stop,
      order: idx + 1,
    }));
    setStops(reordered);
    setDraggedStop(null);
  };

  /**
   * Calculate total cost and time for all stops in route
   * Sums price and time_required from each place
   */
  const calculateTotals = () => {
    let totalCost = 0;
    let totalTime = 0;

    stops.forEach(stop => {
      const props = stop.place.properties || stop.place;
      totalCost += parseFloat(props.price || 0);
      totalTime += parseInt(props.time_required || 0);
    });

    return { totalCost: totalCost.toFixed(2), totalTime };
  };

  /**
   * Save itinerary to API
   * Creates itinerary then adds all stops as separate API calls
   */
  const saveItinerary = async () => {
    if (!newItineraryName.trim()) {
      alert('Please enter an itinerary name');
      return;
    }

    if (stops.length === 0) {
      alert('Please add at least one place to your itinerary');
      return;
    }

    try {
      setLoading(true);

      const { totalCost, totalTime } = calculateTotals();

      // Create itinerary
      const itineraryResponse = await axios.post(`${API_BASE}/itineraries/`, {
        name: newItineraryName,
        total_cost: totalCost,
        total_time_minutes: totalTime,
      });

      const itineraryId = itineraryResponse.data.id;

      // Add each stop to the itinerary
      for (let i = 0; i < stops.length; i++) {
        const stop = stops[i];
        const placeId = stop.place.id || stop.place.properties?.id;
        
        await axios.post(`${API_BASE}/itineraries/${itineraryId}/stops/`, {
          place: placeId,
          order: i + 1,
          arrival_time: null,
          departure_time: null,
        });
      }

      alert('✅ Itinerary saved successfully!');
      setNewItineraryName('');
      setStops([]);
      fetchSavedItineraries();
      setMode('view');
    } catch (error) {
      console.error('Error saving itinerary:', error);
      alert('Error saving itinerary');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load a saved itinerary for viewing
   * Switches to view mode and displays the selected itinerary
   */
  const loadItinerary = (itinerary) => {
    setSelectedItinerary(itinerary);
    setMode('view');
  };

  /**
   * Delete an itinerary after confirmation
   */
  const deleteItinerary = async (id) => {
    if (!window.confirm('Delete this itinerary?')) return;

    try {
      await axios.delete(`${API_BASE}/itineraries/${id}/`);
      fetchSavedItineraries();
      setSelectedItinerary(null);
      alert('✅ Itinerary deleted');
    } catch (error) {
      console.error('Error deleting itinerary:', error);
    }
  };

  const { totalCost, totalTime } = calculateTotals();

  // Extract coordinates for polyline and map center
  const routeCoordinates = mode === 'view' 
    ? (selectedItinerary?.stops || []).map((stop) => {
        const place = stop.place || stop;
        const coords = place.geometry?.coordinates || place.location?.coordinates || [0, 0];
        return [coords[1], coords[0]];  // Leaflet uses [lat, lng]
      })
    : stops.map((stop) => {
        const place = stop.place || stop;
        const coords = place.geometry?.coordinates || place.location?.coordinates || [0, 0];
        return [coords[1], coords[0]];
      });

  // Center map on first stop or default to Dublin
  const mapCenter = routeCoordinates.length > 0 ? routeCoordinates[0] : [53.3498, -6.2603];

  return (
    <div className="itinerary-container">
      {/* Left Panel - Itinerary Builder/Viewer */}
      <div className="itinerary-panel">
        {mode === 'create' ? (
          <>
            {/* Create Mode Header */}
            <div className="panel-header">
              <h2>Create New Itinerary</h2>
              <button className="view-btn" onClick={() => {
                setMode('view');
                setStops([]);
                setNewItineraryName('');
              }}>
                View Saved
              </button>
            </div>

            {/* Itinerary Name Input */}
            <div className="input-group">
              <label>Itinerary Name</label>
              <input
                type="text"
                placeholder="e.g., Day in Dublin"
                value={newItineraryName}
                onChange={(e) => setNewItineraryName(e.target.value)}
              />
            </div>

            {/* Add Places Section - Shows first 10 places */}
            <div className="add-places-section">
              <h3>Add Places</h3>
              <div className="places-search">
                {places.slice(0, 10).map((place) => {
                  const props = place.properties || place;
                  const isAdded = stops.some(s => (s.place.id || s.place.properties?.id) === (place.id || props.id));
                  
                  return (
                    <div key={place.id || props.id} className="place-item">
                      <div className="place-info">
                        <h4>{props.name}</h4>
                        <p className="place-details">
                          €{props.price} •  {props.time_required}min
                        </p>
                      </div>
                      <button
                        className={`add-btn ${isAdded ? 'added' : ''}`}
                        onClick={() => !isAdded && addPlaceToRoute(place)}
                        disabled={isAdded}
                      >
                        {isAdded ? '✓' : '+'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current Route Display */}
            <div className="route-section">
              <h3>Your Route ({stops.length} stops)</h3>
              
              {stops.length === 0 ? (
                <p className="empty-msg">Add places to create your route</p>
              ) : (
                // Draggable stops list
                <ol className="stops-list">
                  {stops.map((stop, idx) => {
                    const props = stop.place.properties || stop.place;
                    return (
                      <li
                        key={stop.id}
                        className="stop-item"
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, idx)}
                      >
                        <div className="stop-header">
                          <span className="stop-number">#{idx + 1}</span>
                          <h4>{props.name}</h4>
                          <button
                            className="remove-btn"
                            onClick={() => removeStop(stop.id)}
                          >
                            ✕
                          </button>
                        </div>
                        <p className="stop-meta">
                          €{props.price} • {props.time_required}min
                        </p>
                      </li>
                    );
                  })}
                </ol>
              )}

              {/* Route totals and save button */}
              {stops.length > 0 && (
                <div className="totals">
                  <div className="total-item">
                    <span>Total Cost:</span>
                    <strong>€{totalCost}</strong>
                  </div>
                  <div className="total-item">
                    <span>Total Time:</span>
                    <strong>{totalTime} min</strong>
                  </div>
                </div>
              )}

              <button
                className="save-btn"
                onClick={saveItinerary}
                disabled={stops.length === 0 || loading}
              >
                {loading ? 'Saving...' : 'Save Itinerary'}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* View Mode - Show Saved Itineraries */}
            <div className="panel-header">
              <h2>Saved Itineraries</h2>
              <button className="create-btn" onClick={() => {
                setMode('create');
                setSelectedItinerary(null);
                setStops([]);
              }}>
                Create New
              </button>
            </div>

            {/* Saved itineraries list */}
            {savedItineraries.length === 0 ? (
              <p className="empty-msg">No saved itineraries yet</p>
            ) : (
              <div className="itineraries-list">
                {savedItineraries.map((itinerary) => (
                  <div key={itinerary.id} className="itinerary-card">
                    <div className="card-header">
                      <h3>{itinerary.name}</h3>
                      <button
                        className="delete-btn"
                        onClick={() => deleteItinerary(itinerary.id)}
                      >
                        🗑️
                      </button>
                    </div>
                    <p className="card-stats">
                      {itinerary.stops?.length || 0} stops • €{itinerary.total_cost} • {itinerary.total_time_minutes} min
                    </p>
                    <button
                      className="view-itinerary-btn"
                      onClick={() => loadItinerary(itinerary)}
                    >
                      View Route →
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Selected itinerary details */}
            {selectedItinerary && (
              <div className="selected-itinerary">
                <h3>{selectedItinerary.name}</h3>
                <ol className="stops-list">
                  {selectedItinerary.stops?.map((stop, idx) => {
                    const props = stop.place.properties || stop.place;
                    return (
                      <li key={stop.id} className="stop-item">
                        <div className="stop-header">
                          <span className="stop-number">#{idx + 1}</span>
                          <h4>{props.name}</h4>
                        </div>
                        <p className="stop-meta">
                          €{props.price} •  {props.time_required}min
                        </p>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
          </>
        )}
      </div>

      {/* Right Panel - Map Display */}
      {routeCoordinates.length > 0 && (
        <MapContainer 
          key={`${mode}-${selectedItinerary?.id}`} 
          center={mapCenter} 
          zoom={13} 
          style={{ height: '100%', flex: 1 }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />

          {/* Blue polyline connecting all stops */}
          {routeCoordinates.length > 1 && (
            <Polyline positions={routeCoordinates} color="blue" weight={3} />
          )}

          {/* Markers for each stop */}
          {(selectedItinerary?.stops || stops).map((stop, idx) => {
            const place = stop.place || stop;
            const coords = place.geometry?.coordinates || place.location?.coordinates || [0, 0];
            const position = [coords[1], coords[0]];
            const props = place.properties || place;
            
            return (
              <Marker key={`${stop.id}-${idx}`} position={position}>
                <Popup>
                  <div>
                    <h4>Stop {idx + 1}: {props.name}</h4>
                    <p>€{props.price}</p>
                    <p>{props.time_required} min</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      )}
    </div>
  );
}