import api from './axios';

// ===== AUTH =====
export const loginAdmin = (data) => api.post('/auth/login', data);

// ===== DASHBOARD STATS =====
export const getDashboardStatsApi = () => api.get('/users/dashboard-stats');

// ===== ABSENSI =====
export const getAbsebsiApi = (start, end, phone = '', status = '') =>
  api.get(`/attendance/all-attendance`, {
    params: {
      startDate: start,
      endDate: end,
      phone: phone,
      status: status,
    },
  });

// ===== KARYAWAN (USERS) =====
export const getSemuaUserApi = () => api.get('/users');

export const getUserByIdApi = (id) => api.get(`/users/${id}`);

export const buatUserBaruApi = async (data) => {
  const res = await api.post('/users', data);
  return res.data; // Kita return res.data biar sesuai sama logic di Karyawan.jsx
};

export const updateStatusUserApi = (userId, status) =>
  api.patch(`/users/${userId}/status`, { status });

export const updateRoleUserApi = (userId, role) => api.patch(`/users/${userId}/role`, { role });

export const deleteUserById = (userId) => api.delete(`/users/${userId}`);

export const updateLokasiKaryawanApi = (userId, locationId) =>
  api.patch(`/users/${userId}/location`, { locationId });

// ===== LOKASI =====
export const getLokasiApi = () => api.get('/work-locations');
export const updateLokasiApi = (id, data) => api.put(`/work-locations/${id}`, data);

// ===== AKTIVITAS & LAPORAN =====
export const postAktivitasApi = (formData) =>
  api.post('/activities', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getSemuaAktivitasApi = () => api.get('/activities');

export const getSemuaLaporanApi = () => api.get('/reports');

export const postLaporanApi = (formData) =>
  api.post('/reports', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// ===== KEBUTUHAN (NEEDS) =====
export const getSemuaKebutuhanApi = () => api.get('/needs');
export const postKebutuhanApi = (data) => api.post('/needs', data);

// ===== PAYROLL (GAJI) =====
export const getPayrollKaryawanApi = () => api.get('/users');

// Proses hitung gaji per user
export const prosesPayrollApi = (userId, periode) =>
  api.post('/payroll/process', { userId, periode });

// ===== LOKASI TUGAS =====
export const getAllWorkLocationApi = () => api.get('/work-locations');
export const updateWorkLocationApi = (id, data) => api.put(`/work-locations/${id}`, data);
