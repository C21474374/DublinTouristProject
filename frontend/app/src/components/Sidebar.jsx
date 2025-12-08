import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaTimes, FaMap, FaRoute, FaUser, FaHeart, FaCog, FaImages, FaMoon, FaSun } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import '../styles/Sidebar.scss';

export default function Sidebar({ toggled, handleToggleSidebar }) {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  const menuItems = [
    { path: '/', label: 'Map Explorer', icon: <FaMap /> },
    { path: '/itinerary', label: 'Route Planner', icon: <FaRoute /> },
    { path: '/favorites', label: 'Favorites', icon: <FaHeart /> },
    { path: '/gallery', label: 'Gallery', icon: <FaImages /> },
    { path: '/profile', label: 'My Account', icon: <FaUser /> },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside className={`sidebar ${toggled ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <h1>Dublin Guide</h1>
        <button
          className="close-btn"
          onClick={() => handleToggleSidebar(false)}
          aria-label="Close menu"
        >
          <FaTimes />
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => handleToggleSidebar(false)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button 
          className="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {isDark ? <FaSun /> : <FaMoon />} {isDark ? 'Light' : 'Dark'}
        </button>
      </div>
    </aside>
  );
}