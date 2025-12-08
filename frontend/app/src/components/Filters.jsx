import { useState } from 'react';
import '../styles/Filters.scss';

export default function Filters({ 
  filters, 
  setFilters, 
  categories, 
  areas, 
  onGetLocation,
  filteredPlaces,
  loading,
  favorites,
  onPlaceCardClick,
  onToggleFavorite,
  isFavorite
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (value) => {
    setSearchTerm(value);
    // You can add search filter here if needed
  };

  return (
    <div className="filters-panel">
      <h3>Filter by:</h3>



      {/* Category Filter */}
      <select 
        value={filters.category}
        onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
        className="filter-select"
      >
        <option value="">All Categories</option>
        {categories.map(cat => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>

      {/* Favorites Filter */}
      <label className="filter-checkbox">
        <input
          type="checkbox"
          checked={filters.favoritesOnly}
          onChange={(e) => setFilters(prev => ({ ...prev, favoritesOnly: e.target.checked }))}
        />
        ❤️ Favorites
      </label>

      {/* Child Friendly Filter */}
      <label className="filter-checkbox">
        <input
          type="checkbox"
          checked={filters.childFriendly}
          onChange={(e) => setFilters(prev => ({ ...prev, childFriendly: e.target.checked }))}
        />
        👧 Child Friendly
      </label>

      {/* Wheelchair Access Filter */}
      <label className="filter-checkbox">
        <input
          type="checkbox"
          checked={filters.wheelchairAccess}
          onChange={(e) => setFilters(prev => ({ ...prev, wheelchairAccess: e.target.checked }))}
        />
        ♿ Wheelchair Access
      </label>

      {/* Nearby Filter */}
      <label className="filter-checkbox">
        <input
          type="checkbox"
          checked={filters.nearbyOnly}
          onChange={(e) => {
            if (e.target.checked) {
              setFilters(prev => ({ ...prev, nearbyOnly: true }));
              onGetLocation();
            } else {
              setFilters(prev => ({ ...prev, nearbyOnly: false }));
            }
          }}
        />
        📍 Nearby Places
      </label>

      {filters.nearbyOnly && (
        <div className="filter-input">
          <label>Within (km):</label>
          <input
            type="range"
            min="1"
            max="50"
            value={filters.nearbyDistance}
            onChange={(e) => setFilters(prev => ({ ...prev, nearbyDistance: parseInt(e.target.value) }))}
          />
          <span>{filters.nearbyDistance} km</span>
        </div>
      )}

      {/* Area Filter */}
      <select 
        value={filters.selectedArea || ''}
        onChange={(e) => setFilters(prev => ({ ...prev, selectedArea: e.target.value || null }))}
        className="filter-select"
      >
        <option value="">All Areas</option>
        {areas.map(area => (
          <option key={area.id} value={area.id}>{area.name}</option>
        ))}
      </select>

      {/* Places List */}
      <div className="places-list">
        <h4>📍 Places ({filteredPlaces.filter(p => {
          const props = p.properties || p;
          return props.name.toLowerCase().includes(searchTerm.toLowerCase());
        }).length})</h4>

        {/* Search Bar */}
        <div className="filter-search">
          <input
            type="text"
            placeholder="🔍 Search places..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="filter-search-input"
          />
        </div>

        {loading ? (
          <p className="status">Loading...</p>
        ) : filteredPlaces.filter(p => {
          const props = p.properties || p;
          return props.name.toLowerCase().includes(searchTerm.toLowerCase());
        }).length === 0 ? (
          <p className="status">No places found</p>
        ) : (
          filteredPlaces.filter(p => {
            const props = p.properties || p;
            return props.name.toLowerCase().includes(searchTerm.toLowerCase());
          }).map((place, idx) => {
            const properties = place.properties || place;
            const favorite = isFavorite(place.id);
            const avgRating = properties.average_rating || 0;
            
            return (
              <div 
                key={idx} 
                className="place-card"
                onClick={() => onPlaceCardClick(place)}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(place);
                  }}
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
  );
}