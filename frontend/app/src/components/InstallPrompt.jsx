import { useState, useEffect } from 'react';
import '../styles/InstallPrompt.scss';

/**
 * Install Prompt Component
 * Shows PWA (Progressive Web App) install prompt to users.
 * Allows users to install the app on their home screen.
 * Handles the beforeinstallprompt and appinstalled events.
 * Only shows if app is not already installed.
 */
export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed (running in standalone mode)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    setIsInstalled(mediaQuery.matches);

    /**
     * beforeinstallprompt event fired when browser is ready to prompt install
     * Prevent default and store the event for later use
     */
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      console.log('📲 Install prompt available');
      if (!isInstalled) {
        setShow(true);
      }
      window.deferredPrompt = e;  // Save for later use
    };

    /**
     * appinstalled event fires when user completes app installation
     */
    const handleAppInstalled = () => {
      console.log('✅ App installed');
      setIsInstalled(true);
      setShow(false);
      window.deferredPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  /**
   * Trigger browser's native install prompt
   * Shows system dialog for installing the app
   */
  const handleInstall = async () => {
    if (!window.deferredPrompt) {
      console.warn('Install prompt not available');
      return;
    }

    // Show native install dialog
    window.deferredPrompt.prompt();
    const { outcome } = await window.deferredPrompt.userChoice;
    console.log(`Install outcome: ${outcome}`);
    
    setShow(false);
    window.deferredPrompt = null;
  };

  // Don't show if already installed or prompt not available
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