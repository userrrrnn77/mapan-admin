import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { LogOut, Menu, Moon, Sun, User } from 'lucide-react';

const Navbar = ({ pageTitle, onMenuClick }) => {
  const { userData, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="navbar">
      <div className="nav-left">
        {/* Tombol Burger Muncul Cuma di HP */}
        <button className="burger-btn" onClick={onMenuClick}>
          <Menu size={24} />
        </button>
        <div className="title-group">
          <p className="breadcrumb">Sistem / {pageTitle}</p>
          <h2 className="page-title">{pageTitle}</h2>
        </div>
      </div>

      <div className="nav-right">
        {/* Toggle Dark Mode */}
        <button onClick={toggleTheme} className="nav-icon-btn shadow-sm">
          {theme === 'light' ? (
            <Moon size={18} color="var(--text-main)" />
          ) : (
            <Sun size={18} color="#FFB547" />
          )}
        </button>

        {/* Admin Info */}
        <div className="admin-profile-wrapper">
          <div className="admin-info-content">
            <div className="admin-avatar-circle">
              <User size={18} color="var(--primary)" />
            </div>
            <div className="admin-text-details">
              <span className="admin-name">{userData?.name || 'Admin Mapan'}</span>
              <span className="admin-role">{userData?.role || 'Administrator'}</span>
            </div>
          </div>

          {/* Tombol Logout yang Lebih Pro */}
          <button onClick={logout} className="logout-icon-btn" title="Keluar Sistem">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
