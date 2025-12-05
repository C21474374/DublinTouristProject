import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { FaBars } from 'react-icons/fa';

import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import Sidebar from './components/Sidebar.jsx';
import Footer from './components/Footer.jsx';

import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Itinerary from './pages/Itinerary.jsx';
import Favorites from './pages/Favorites.jsx';
import Profile from './pages/Profile.jsx';
import NotFound from './pages/NotFound.jsx';

import './styles.scss';

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { token, loading } = useAuth();

  const handleToggleSidebar = (value) => {
    setSidebarOpen(value);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // Show auth pages without sidebar
  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  // Show main app with sidebar if logged in
  return (
    <div className={`app ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <Sidebar toggled={sidebarOpen} handleToggleSidebar={handleToggleSidebar} />

      <main className="main-content">
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

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/itinerary" element={<Itinerary />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/not-found" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/not-found" />} />
        </Routes>

        <Footer />
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
