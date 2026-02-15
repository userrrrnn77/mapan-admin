import { NavLink } from 'react-router-dom';
import { LayoutDashboard, UserCheck, Users, Banknote, MapPin, LogOut, X } from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const Sidebar = ({ isOpen, onClose }) => {
  const { logout } = useContext(AuthContext);

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      <aside className={`sidebar ${isOpen ? 'active' : ''}`}>
        <div className="sidebar-logo">
          <h2 style={{ color: 'var(--white)', fontSize: '24px', letterSpacing: '1px' }}>
            MAPAN <span style={{ fontWeight: '300' }}>ADMIN</span>
          </h2>
          <button className="close-sidebar" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            onClick={onClose}
            to="/dashboard"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            onClick={onClose}
            to="/absensi"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <UserCheck size={20} />
            <span>Absensi</span>
          </NavLink>

          <NavLink
            onClick={onClose}
            to="/karyawan"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <Users size={20} />
            <span>Data Karyawan</span>
          </NavLink>

          <NavLink
            onClick={onClose}
            to="/payroll"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <Banknote size={20} />
            <span>Payroll (Gaji)</span>
          </NavLink>

          <NavLink
            onClick={onClose}
            to="/lokasi"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <MapPin size={20} />
            <span>Setting Lokasi</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer" style={{ marginTop: 'auto', padding: '20px' }}>
          <button onClick={logout} className="sidebar-logout-link">
            <LogOut size={20} />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>
    </>
  );
};
