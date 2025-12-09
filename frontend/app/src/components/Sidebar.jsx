import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaTimes, FaMap, FaRoute, FaUser, FaHeart, FaCog, FaImages, FaMoon, FaSun } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import '../styles/Sidebar.scss';

/**
 * Sidebar Navigation Component
 * Displays main navigation menu with links to different pages.
 * Supports theme toggle (light/dark mode).
 * Can be toggled open/closed on mobile devices.
 */
export default function Sidebar({ toggled, handleToggleSidebar }) {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  // Navigation menu items with routes and icons
  const menuItems = [
    { path: '/', label: 'Map Explorer', icon: <FaMap /> },
    { path: '/itinerary', label: 'Route Planner', icon: <FaRoute /> },
    { path: '/favorites', label: 'Favorites', icon: <FaHeart /> },
    { path: '/gallery', label: 'Gallery', icon: <FaImages /> },
    { path: '/profile', label: 'My Account', icon: <FaUser /> },
  ];

  // Check if current page matches the nav link
  const isActive = (path) => location.pathname === path;

  return (
    <aside className={`sidebar ${toggled ? 'open' : 'closed'}`}>
      {/* Sidebar header with title and close button */}
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

      {/* Main navigation menu */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => handleToggleSidebar(false)}  // Close sidebar when link clicked
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer section with theme toggle button */}
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