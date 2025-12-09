import { useState } from 'react';
import axios from 'axios';
import '../styles/PhotoUploadModal.scss';

const API_BASE = 
  process.env.NODE_ENV === 'production'
    ? 'https://dublin-guide.onrender.com/api'
    : 'http://localhost:8000/api';

/**
 * Photo Upload Modal Component
 * Allows authenticated users to upload multiple photos to a place.
 * Supports optional captions for each upload.
 * Shows preview of selected files before uploading.
 */
export default function PhotoUploadModal({ place, token, onClose, onUploadSuccess }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Extract place info (handles both GeoJSON and regular objects)
  const props = place.properties || place;
  const placeId = props.id || place.id;

  /**
   * Handle file selection from input
   * Stores selected files in state
   */
  const handleFileSelect = (e) => {
    setSelectedFiles(Array.from(e.target.files));
    setError('');
  };

  /**
   * Upload selected photos to API
   * Sends each file as multipart form data
   * Includes place ID and optional caption
   */
  const handleUpload = async () => {
    // Validation checks
    if (selectedFiles.length === 0) {
      setError('Please select at least one photo');
      return;
    }

    if (!token) {
      setError('You must be logged in to upload photos');
      return;
    }

    if (!placeId) {
      setError('Place ID not found');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // Upload each file separately
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('caption', caption);
        formData.append('place', placeId);

        console.log('Uploading photo for place:', placeId);
        console.log('Token:', token ? 'Present' : 'Missing');

        const response = await axios.post(`${API_BASE}/photos/`, formData, {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        console.log('Photo uploaded:', response.data);
      }

      // Clear form and show success
      setSelectedFiles([]);
      setCaption('');
      alert('Photos uploaded successfully!');
      onUploadSuccess();  // Trigger parent component refresh
      setTimeout(onClose, 1000);
    } catch (err) {
      console.error('Upload error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      // Extract error message from API response
      const errorMessage = err.response?.data?.image?.[0] || 
                          err.response?.data?.place?.[0] ||
                          err.response?.data?.detail || 
                          'Upload failed';
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal header */}
        <div className="modal-header">
          <h2>Upload Photos</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Display selected place */}
          <p style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
            <strong>Place:</strong> {props.name}
          </p>

          {/* File input for selecting photos */}
          <div className="file-input-group">
            <label htmlFor="photo-input">Select Photos:</label>
            <input
              id="photo-input"
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            <p style={{ fontSize: '0.8rem', color: 'var(--background)', marginTop: '0.5rem' }}>
              {selectedFiles.length} file(s) selected
            </p>
          </div>

          {/* Optional caption for photos */}
          <div className="caption-group">
            <label htmlFor="caption">Caption (optional):</label>
            <textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              style={{ color: 'var(--text)' }}
              placeholder="Add a caption for your photos..."
              disabled={uploading}
              rows="3"
            />
          </div>

          {/* Error message display */}
          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}

          {/* Preview grid showing selected images */}
          <div className="preview-grid">
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="preview-item">
                <img src={URL.createObjectURL(file)} alt={`preview-${idx}`} />
                <p>{file.name.substring(0, 15)}...</p>
              </div>
            ))}
          </div>
        </div>

        {/* Modal action buttons */}
        <div className="modal-footer">
          <button 
            className="btn-cancel" 
            onClick={onClose}
            disabled={uploading}
          >
            Cancel
          </button>
          <button 
            className="btn-upload" 
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
          >
            {uploading ? 'Uploading...' : 'Upload Photos'}
          </button>
        </div>
      </div>
    </div>
  );
}