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

        <style jsx>{`
          .sidebar {
            width: 260px;
            background: var(--bg-sidebar);
            height: 100vh;
            position: fixed;
            left: 0;
            top: 0;
            display: flex;
            flex-direction: column;
            color: var(--white);
            z-index: 1000;
          }
          .sidebar-logo {
            padding: 30px 25px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }
          .sidebar-nav {
            padding: 20px 15px;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .sidebar-nav a,
          .sidebar-logout-link {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 12px 15px;
            color: rgba(255, 255, 255, 0.7);
            text-decoration: none;
            border-radius: var(--radius-sm);
            transition: 0.3s;
            background: transparent;
            border: none;
            width: 100%;
            font-family: inherit;
            cursor: pointer;
          }

          .sidebar-nav a:hover,
          .sidebar-logout-link:hover {
            background: rgba(255, 255, 255, 0.1);
            color: var(--white);
          }

          .sidebar-nav a.active {
            background: var(--white);
            color: var(--primary);
            font-weight: bold;
            box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
          }

          .sidebar-logout-link {
            color: #ffbaba;
            margin-top: 10px;
          }
          .close-sidebar {
            display: none;
            background: none;
            border: none;
            color: white;
          }
          @media (max-width: 992px) {
            .sidebar {
              transform: translateX(-100%);
              transition: transform 0.3s ease;
            }
            .sidebar.active {
              transform: translateX(0);
            }
            .close-sidebar {
              display: block;
              position: absolute;
              right: 15px;
              top: 30px;
            }
            .sidebar-overlay {
              position: fixed;
              inset: 0;
              background: rgba(0, 0, 0, 0.5);
              z-index: 999;
            }
          }
        `}</style>
      </aside>
    </>
  );
};
