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

export const verifyUserApi = (userId, action) => api.patch(`/users/verify/${userId}`, { action }); // action: 'approve' atau 'reject'

export const buatUserBaruApi = async (data) => {
  const res = await api.post('/users', data);
  return res.data; // Kita return res.data biar sesuai sama logic di Karyawan.jsx
};

export const updateStatusUserApi = (userId, status) =>
  api.patch(`/users/${userId}/status`, { status });

export const updateRoleUserApi = (userId, data) => api.patch(`/users/${userId}/role`, { data }); // ini bre update njir

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

// 1. Ambil daftar karyawan (untuk list di halaman payroll)
export const getPayrollListApi = () => api.get('/payroll/karyawan');

// 2. Proses hitung awal (auto-calculate telat dll)
export const prosesPayrollApi = (userId, periode) =>
  api.post('/payroll/process', { userId, periode });

// 3. Update/Save manual adjustment (Bonus, Potongan, Status)
// Ini yang bakal dipake buat "Save" setelah admin edit manual
export const updatePayrollApi = (id, data) => api.put(`/payroll/update/${id}`, data);

// 4. Ambil Slip Gaji (Buat liat hasil akhir atau cetak)
export const getSlipGajiApi = (userId, periode) =>
  api.get('/payroll/slip', { params: { userId, periode } });

// ===== LOKASI TUGAS =====
export const getAllWorkLocationApi = () => api.get('/work-locations');
export const updateWorkLocationApi = (id, data) => api.put(`/work-locations/${id}`, data);
export const createLocation = (data) => api.post("/work-locations", data)
export const deleteLocation = (id) => api.delete(`/work-locations/${id}`)
