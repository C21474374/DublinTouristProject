import { useState, useEffect } from 'react';
import '../styles/OfflineIndicator.scss';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <div className="offline-indicator">
      📡 You're offline - Using cached data
    </div>
  );
}