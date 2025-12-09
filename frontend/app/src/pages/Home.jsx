/**
 * Home Page Component
 * Wrapper for the Map component
 * Displays the interactive map explorer with all features
 */

import Map from '../components/Map';
import '../styles/Map.scss';

export default function Home() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex' }}>
      <Map />
    </div>
  );
}
