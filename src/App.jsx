import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useState } from 'react';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Components Layout
import { Sidebar } from './components/Sidebar';
import Navbar from './components/Navbar';
import Attendance from './pages/Attendance';
import Karyawan from './pages/Karyawan';
import Payroll from './pages/Payroll';
import WorkLocation from './pages/WorkLocation';
import Reports from './pages/Reports';

// Layout Wrapper
const DashboardLayout = ({ children, title }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  return (
    <div className="layout-wrapper">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="main-content">
        <Navbar pageTitle={title} onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="content-body">{children}</div>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Jalur Publik */}
        <Route path="/login" element={<Login />} />

        {/* Jalur Terproteksi */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout title="Dashboard">
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/absensi"
          element={
            <ProtectedRoute>
              <DashboardLayout title="Data Absensi">
                <Attendance />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/karyawan"
          element={
            <ProtectedRoute>
              <DashboardLayout title="Manajemen Karyawan">
                <Karyawan />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/payroll"
          element={
            <ProtectedRoute>
              <DashboardLayout title="Payroll Gaji">
                <Payroll />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <DashboardLayout title="Laporan Bulanan">
                <Reports />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/lokasi"
          element={
            <ProtectedRoute>
              <DashboardLayout title="Konfigurasi Lokasi">
                <WorkLocation />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
