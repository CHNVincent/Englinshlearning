import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="header">
      <Link to="/" className="logo">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <path d="M12 19v3"/>
          <path d="M8 22h8"/>
        </svg>
        EnglishEcho
      </Link>

      <nav className="nav">
        <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
          Home
        </Link>
        <Link to="/practice" className={`nav-link ${isActive('/practice') ? 'active' : ''}`}>
          Practice
        </Link>
        <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>
          Admin
        </Link>
      </nav>

      <div className="header-actions">
        <Link to="/practice" className="btn btn-primary">
          Start Practice
        </Link>
      </div>
    </header>
  );
};

export default Header;
