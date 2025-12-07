import { useState } from 'react';
import axios from 'axios';
import '../styles/PhotoUploadModal.scss';

const API_BASE = 'http://localhost:8000/api';

export default function PhotoUploadModal({ place, token, onClose, onUploadSuccess }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const props = place.properties || place;
  const placeId = props.id || place.id;

  const handleFileSelect = (e) => {
    setSelectedFiles(Array.from(e.target.files));
    setError('');
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one photo');
      return;
    }

    setUploading(true);
    setError('');

    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('caption', caption);
        formData.append('place', placeId);

        await axios.post(`${API_BASE}/photos/`, formData, {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      setSelectedFiles([]);
      setCaption('');
      onUploadSuccess();
      setTimeout(onClose, 1000);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📷 Upload Photos</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.9rem', color: '#666' }}>
            <strong>Place:</strong> {props.name}
          </p>

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
            <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.5rem' }}>
              {selectedFiles.length} file(s) selected
            </p>
          </div>

          <div className="caption-group">
            <label htmlFor="caption">Caption (optional):</label>
            <textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption for your photos..."
              disabled={uploading}
              rows="3"
            />
          </div>

          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}

          <div className="preview-grid">
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="preview-item">
                <img src={URL.createObjectURL(file)} alt={`preview-${idx}`} />
                <p>{file.name.substring(0, 15)}...</p>
              </div>
            ))}
          </div>
        </div>

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
            {uploading ? '⏳ Uploading...' : '✓ Upload Photos'}
          </button>
        </div>
      </div>
    </div>
  );
}