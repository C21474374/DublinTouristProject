import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import '../styles/Gallery.scss';

const API_BASE = 
  process.env.NODE_ENV === 'production'
    ? 'https://dublin-guide.onrender.com/api'
    : 'http://localhost:8000/api';

export default function Gallery() {
  const { token } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    fetchPlaces();
    fetchAllPhotos();
  }, []);

  const fetchPlaces = async () => {
    try {
      console.log('Fetching places...');
      const response = await axios.get(`${API_BASE}/places/`);
      console.log('Places response:', response.data);
      
      // Handle both direct array and paginated responses
      let placesData = [];
      if (Array.isArray(response.data)) {
        placesData = response.data;
      } else if (response.data.results && Array.isArray(response.data.results)) {
        placesData = response.data.results;
      } else if (response.data.features && Array.isArray(response.data.features)) {
        placesData = response.data.features;
      }
      
      setPlaces(placesData);
    } catch (err) {
      console.error('Error fetching places:', err);
      setError('Failed to load places');
    }
  };

  const fetchAllPhotos = async () => {
    try {
      setLoading(true);
      console.log('Fetching photos...');
      const response = await axios.get(`${API_BASE}/photos/`);
      console.log('Photos response:', response.data);
      
      // Handle both direct array and paginated responses
      let photosData = [];
      if (Array.isArray(response.data)) {
        photosData = response.data;
      } else if (response.data.results && Array.isArray(response.data.results)) {
        photosData = response.data.results;
      }
      
      setPhotos(photosData);
      console.log('📷 Photos loaded:', photosData);
    } catch (err) {
      console.error('Error fetching photos:', err);
      setError('Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotosForPlace = async (placeId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/photos/?place_id=${placeId}`);
      console.log('Photos for place response:', response.data);
      
      // Handle both direct array and paginated responses
      let photosData = [];
      if (Array.isArray(response.data)) {
        photosData = response.data;
      } else if (response.data.results && Array.isArray(response.data.results)) {
        photosData = response.data.results;
      }
      
      setPhotos(photosData);
      setSelectedPlace(placeId);
    } catch (err) {
      console.error('Error fetching photos:', err);
      setError('Failed to load photos for this place');
    } finally {
      setLoading(false);
    }
  };

  const deletePhoto = async (photoId) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) return;

    try {
      await axios.delete(`${API_BASE}/photos/${photoId}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setPhotos(photos.filter(p => p.id !== photoId));
      setSelectedPhoto(null);
      console.log('✅ Photo deleted');
    } catch (err) {
      console.error('Error deleting photo:', err);
      alert(err.response?.data?.detail || 'Failed to delete photo');
    }
  };

  const filteredPlaces = places.filter(place => {
    const props = place.properties || place;
    const name = props.name || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const currentPlace = places.find(p => {
    const props = p.properties || p;
    return (props.id || p.id) === selectedPlace;
  });

  const currentPlaceProps = currentPlace?.properties || currentPlace;

  return (
    <div className="gallery-container">
      <div className="gallery-header">
        <h1>Gallery</h1>
        <p>View and manage photos from your favorite places</p>
      </div>

      <div className="gallery-content">
        {/* Left Panel - Places List */}
        <div className="gallery-places-panel">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search places..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="places-list">
            <button
              className={`place-item ${!selectedPlace ? 'active' : ''}`}
              onClick={() => {
                setSelectedPlace(null);
                fetchAllPhotos();
              }}
            >
              <span>All Places</span>
              <span className="photo-count">
                {photos.length}
              </span>
            </button>

            {filteredPlaces.map((place) => {
              const props = place.properties || place;
              const placeId = props.id || place.id;
              const placePhotos = photos.filter(p => p.place === placeId);

              return (
                <button
                  key={placeId}
                  className={`place-item ${selectedPlace === placeId ? 'active' : ''}`}
                  onClick={() => fetchPhotosForPlace(placeId)}
                >
                  <span className="place-name">{props.name}</span>
                  <span className="photo-count">{placePhotos.length}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Panel - Photos Grid */}
        <div className="gallery-photos-panel">
          {selectedPlace && currentPlaceProps && (
            <div className="place-info">
              <h2>{currentPlaceProps.name}</h2>
              <p className="place-description">
                {currentPlaceProps.description || 'No description available'}
              </p>
              {currentPlaceProps.average_rating !== null && currentPlaceProps.average_rating !== undefined && currentPlaceProps.average_rating > 0 ? (
                <div className="place-rating">
                  <span style={{ color: '#ffc107' }}>
                    {'★'.repeat(Math.round(currentPlaceProps.average_rating))}
                    {'☆'.repeat(5 - Math.round(currentPlaceProps.average_rating))}
                  </span>
                  <span>({currentPlaceProps.average_rating.toFixed(1)}/5)</span>
                </div>
              ) : (
                <div className="place-rating">
                  <span style={{ color: 'var(--text)' }}>No ratings yet</span>
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div className="loading">Loading photos...</div>
          ) : error ? (
            <div className="error">❌ {error}</div>
          ) : photos.length === 0 ? (
            <div className="empty-state">
              <p>No photos yet</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
                Upload photos from the map to see them here
              </p>
            </div>
          ) : (
            <div className="photos-grid">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="photo-card"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <div className="photo-image">
                    <img
                      src={photo.image}
                      alt={photo.caption || 'Place photo'}
                      loading="lazy"
                    />
                  </div>
                  <div className="photo-info">
                    <p className="photo-caption">{photo.caption || 'No caption'}</p>
                    <p className="photo-meta">
                      by <strong>{photo.user}</strong>
                    </p>
                    <p className="photo-date">
                      {new Date(photo.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <div className="photo-modal-overlay" onClick={() => setSelectedPhoto(null)}>
          <div className="photo-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSelectedPhoto(null)}
            >
              ✕
            </button>

            <img src={selectedPhoto.image} alt={selectedPhoto.caption} />

            <div className="modal-info">
              <h3>{selectedPhoto.place_name}</h3>
              {selectedPhoto.caption && (
                <p className="caption">{selectedPhoto.caption}</p>
              )}
              <p className="meta">
                Photo by: <strong>{selectedPhoto.user}</strong>
              </p>
              <p className="date">
                Date/Time: {new Date(selectedPhoto.uploaded_at).toLocaleString()}
              </p>

              {token && (
                <button
                  className="delete-btn"
                  onClick={() => deletePhoto(selectedPhoto.id)}
                >
                  Delete Photo
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}