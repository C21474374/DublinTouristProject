import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import axios from 'axios';
import L from 'leaflet';
import '../styles/Itinerary.scss';

const API_BASE = 'http://localhost:8000/api';

// Fix Leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function Itinerary() {
  const [budget, setBudget] = useState('');
  const [time, setTime] = useState('');
  const [people, setPeople] = useState('');
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateRoute = async () => {
    if (!budget && !time && !people) {
      alert('Please fill in at least one filter');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE}/itinerary/generate/`, {
        budget: budget ? parseFloat(budget) : null,
        time_available: time ? parseInt(time) : null,
        group_size: people ? parseInt(people) : null,
      });

      setItinerary(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error generating itinerary:', error);
      alert('Error generating route. Make sure backend is running.');
      setLoading(false);
    }
  };

  const routeCoordinates = itinerary?.stops?.map((stop) => {
    const coords = stop.place.geometry?.coordinates || [0, 0];
    return [coords[1], coords[0]];
  }) || [];

  return (
    <div className="itinerary-container">
      <div className="itinerary-panel">
        <h2>🛣️ Route Planner</h2>

        <div className="input-group">
          <label>Budget ($)</label>
          <input
            type="number"
            placeholder="Enter budget"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label>Time Available (minutes)</label>
          <input
            type="number"
            placeholder="Enter time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label>Number of People</label>
          <input
            type="number"
            placeholder="Enter group size"
            value={people}
            onChange={(e) => setPeople(e.target.value)}
          />
        </div>

        <button onClick={generateRoute} disabled={loading} className="generate-btn">
          {loading ? 'Generating...' : 'Generate Route'}
        </button>

        {itinerary && (
          <div className="itinerary-result">
            <h3>Your Itinerary</h3>
            <p><strong>Total Cost:</strong> ${itinerary.total_cost}</p>
            <p><strong>Total Time:</strong> {itinerary.total_time} min</p>

            <ol className="stops-list">
              {itinerary.stops?.map((stop, idx) => (
                <li key={idx} className="stop-item">
                  <h4>{stop.place.properties?.name || stop.place.name}</h4>
                  <p>📍 {stop.place.properties?.description || 'No description'}</p>
                  <p>💰 ${stop.place.properties?.price || 0}</p>
                  <p>⏱️ {stop.place.properties?.time_required || 0} min</p>
                  <p>🕐 Arrive: {stop.arrival_time}</p>
                  <p>🕐 Leave: {stop.departure_time}</p>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {itinerary && (
        <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: '100%', flex: 1 }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Draw route line */}
          {routeCoordinates.length > 1 && (
            <Polyline positions={routeCoordinates} color="blue" weight={3} />
          )}

          {/* Markers for each stop */}
          {itinerary?.stops?.map((stop, idx) => {
            const coords = stop.place.geometry?.coordinates || [0, 0];
            const position = [coords[1], coords[0]];
            return (
              <Marker key={idx} position={position}>
                <Popup>
                  <div>
                    <h4>Stop {idx + 1}</h4>
                    <p>{stop.place.properties?.name || stop.place.name}</p>
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