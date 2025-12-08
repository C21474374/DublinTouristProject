import { useState, useEffect } from 'react';
import '../styles/InstallPrompt.scss';

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    setIsInstalled(mediaQuery.matches);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      console.log('📲 Install prompt available');
      if (!isInstalled) {
        setShow(true);
      }
      window.deferredPrompt = e;
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      console.log('✅ App installed');
      setIsInstalled(true);
      setShow(false);
      window.deferredPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  const handleInstall = async () => {
    if (!window.deferredPrompt) {
      console.warn('Install prompt not available');
      return;
    }

    window.deferredPrompt.prompt();
    const { outcome } = await window.deferredPrompt.userChoice;
    console.log(`Install outcome: ${outcome}`);
    
    setShow(false);
    window.deferredPrompt = null;
  };

  if (!show || isInstalled) {
    return null;
  }

  return (
    <div className="install-prompt">
      <div className="install-prompt-content">
        <div className="install-prompt-icon">⬇️</div>
        <div className="install-prompt-text">
          <h4>Install Dublin Guide</h4>
          <p>Add to home screen for quick access</p>
        </div>
        <button 
          className="install-prompt-btn install"
          onClick={handleInstall}
        >
          Install
        </button>
        <button 
          className="install-prompt-btn close"
          onClick={() => setShow(false)}
        >
          ✕
        </button>
      </div>
    </div>
  );
}