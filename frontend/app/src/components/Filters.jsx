import '../styles/Filters.scss';

export default function Filters({ filters, setFilters, categories, areas, onGetLocation }) {
  return (
    <div className="filters-panel">
      <h3>🔍 Filters</h3>

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
        ❤️ Favorites Only
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
    </div>
  );
}