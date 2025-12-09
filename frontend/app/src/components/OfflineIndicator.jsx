import { useState, useEffect } from 'react';
import '../styles/OfflineIndicator.scss';

/**
 * Offline Indicator Component
 * Shows a banner when the user loses internet connection.
 * Uses browser's online/offline events to track connection status.
 * Component only renders when offline.
 */
export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Setup event listeners for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('📡 Online');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('📴 Offline');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup event listeners on unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't render anything if online
  if (isOnline) {
    return null;
  }

  // Show offline banner
  return (
    <div className="offline-indicator">
      📡 You're offline - Using cached data
    </div>
  );
}