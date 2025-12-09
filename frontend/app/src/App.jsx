/**
 * Root Application Component
 * 
 * Manages:
 * - Authentication state and routing
 * - Theme and sidebar UI state
 * - Global app layout
 * - PWA notifications (offline indicator, install prompt)
 */

import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { FaBars } from 'react-icons/fa';

// Context providers for auth and theme
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth } from './hooks/useAuth';

// Layout components
import Sidebar from './components/Sidebar.jsx';
import InstallPrompt from './components/InstallPrompt';
import OfflineIndicator from './components/OfflineIndicator';

// Page components
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Itinerary from './pages/Itinerary.jsx';
import Favorites from './pages/Favorites.jsx';
import Gallery from './pages/Gallery.jsx';
import Profile from './pages/Profile.jsx';
import NotFound from './pages/NotFound.jsx';

import './styles.scss';

/**
 * AppContent Component
 * Contains all routing and layout logic
 * Separated from App wrapper to access auth context
 */
function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { token, loading } = useAuth();

  /**
   * Toggle sidebar open/closed state
   * Called from Sidebar component when user clicks menu items
   * 
   * @param {boolean} value - True to open, false to close
   */
  const handleToggleSidebar = (value) => {
    setSidebarOpen(value);
  };

  // Show loading state while checking authentication
  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // Show only login/signup pages if user not authenticated
  if (!token) {
    return (
      <div className="auth-container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          {/* Redirect all other routes to login */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    );
  }

  // Show main app with sidebar if user is authenticated
  return (
    <div className={`app ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Left sidebar with navigation menu */}
      <Sidebar toggled={sidebarOpen} handleToggleSidebar={handleToggleSidebar} />

      {/* Main content area */}
      <main className="main-content">
        {/* Hamburger menu button to open sidebar on mobile when closed */}
        {!sidebarOpen && (
          <button
            className="btn-toggle"
            onClick={() => handleToggleSidebar(true)}
            title="Open Menu"
            aria-label="Toggle navigation"
          >
            <FaBars size={24} />
          </button>
        )}

        {/* Page routes - only accessible when authenticated */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/itinerary" element={<Itinerary />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/not-found" element={<NotFound />} />
          {/* Catch-all - redirect unknown routes to 404 page */}
          <Route path="*" element={<Navigate to="/not-found" />} />
        </Routes>
      </main>
    </div>
  );
}

/**
 * App Component
 * Wraps AppContent with context providers
 * Providers must be at top level to work throughout app
 */
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        {/* Offline indicator banner */}
        <OfflineIndicator />
        
        {/* PWA install prompt */}
        <InstallPrompt />
        
        {/* Main app content with routing and auth */}
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
