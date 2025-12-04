import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { FaBars } from 'react-icons/fa';

import Sidebar from './components/Sidebar.jsx';
import Footer from './components/Footer.jsx';

import Home from './pages/Home.jsx';
import NotFound from './pages/NotFound.jsx';
import Components from './pages/Components.jsx';
import Profile from './pages/Profile.jsx';

import './styles.scss';

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [image, setImage] = useState(false);
  const [toggled, setToggled] = useState(false);

  const handleCollapsedChange = () => {
    setCollapsed(!collapsed);
  };

  const handleImageChange = (checked) => {
    setImage(checked);
  };

  const handleToggleSidebar = (value) => {
    setToggled(value);
  };

  return (
    <div className={`app ${toggled ? 'toggled' : ''}`}>
      <Sidebar
        image={image}
        collapsed={collapsed}
        toggled={toggled}
        handleToggleSidebar={handleToggleSidebar}
        handleCollapsedChange={handleCollapsedChange}
      />

      <main>
        <div className="btn-toggle" onClick={() => handleToggleSidebar(true)}>
          <FaBars />
        </div>

        <Routes>
          <Route path="/" element={<Home image={image} handleImageChange={handleImageChange} />} />
          <Route path="/components" element={<Components />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/not-found" element={<NotFound />} />

          {/* React Router v6 replacement for Redirect */}
          <Route path="*" element={<Navigate to="/not-found" />} />
        </Routes>

        <Footer />
      </main>
    </div>
  );
}

export default App;
