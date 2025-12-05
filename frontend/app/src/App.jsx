import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { FaBars } from 'react-icons/fa';

import Sidebar from './components/Sidebar.jsx';
import Footer from './components/Footer.jsx';

import Home from './pages/Home.jsx';
import Itinerary from './pages/Itinerary.jsx';
import Favorites from './pages/Favorites.jsx';
import Profile from './pages/Profile.jsx';
import NotFound from './pages/NotFound.jsx';

import './styles.scss';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleToggleSidebar = (value) => {
    setSidebarOpen(value);
  };

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

export default App;
