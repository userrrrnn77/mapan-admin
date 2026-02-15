import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Search, CheckCircle, XCircle, CircleUserRound } from 'lucide-react';
import {
  getSemuaUserApi,
  buatUserBaruApi, // Sekarang ini udah pasti ada
  deleteUserById,
  updateStatusUserApi,
} from '../api'; // Tanpa 'index.js' juga gapapa kalau namanya index.js
import { Helmet } from 'react-helmet-async';

const Karyawan = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Fungsi buat buka detail
  const handleRowClick = (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  // Fungsi update password (pake API update yang ada atau bikin baru)
  const handleResetPassword = async () => {
    if (!newPassword) return alert('Isi password baru dulu, Bre!');
    try {
      // Kita asumsikan pake endpoint update user biasa
      await buatUserBaruApi({ ...selectedUser, password: newPassword });
      alert('Password berhasil diupdate!');
      setNewPassword('');
    } catch (err) {
      alert('Gagal update password');
    }
  };

  const [form, setForm] = useState({
    name: '',
    phone: '',
    password: '',
    role: 'karyawan',
    username: '',
    assignedBuilding: 'Gedung FEB',
    assignedWorkLocation: 'FEB_TEMBALANG',
    profilePhoto: '',
  });

  const lokasiPilihan = [
    { label: 'FEB Tembalang', value: 'FEB_TEMBALANG' },
    { label: 'FEB Pleburan', value: 'FEB_PLEBURAN' },
  ];

  const handleTambah = async (e) => {
    if (e) e.preventDefault(); // Biar gak reload page
    try {
      const cleanForm = {
        ...form,
        username: form.username.trim().toLowerCase(),
        name: form.name.trim(),
        assignedWorkLocation: form.assignedWorkLocation.trim(),
        assignedBuilding: form.assignedBuilding.trim(),
      };

      await buatUserBaruApi(cleanForm);
      alert('Sukses: Karyawan berhasil didaftarkan');
      setShowModal(false); // Tutup modal

      // Reset Form persis Mobile
      setForm({
        name: '',
        phone: '',
        password: '',
        role: 'karyawan',
        username: '',
        assignedBuilding: 'Gedung FEB',
        assignedWorkLocation: 'FEB_TEMBALANG',
        profilePhoto: '',
      });

      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      alert('Gagal Simpan: ' + msg);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getSemuaUserApi();
      const data = res.data?.data || res.data;
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Gagal load karyawan', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Yakin mau hapus ${name}?`)) {
      try {
        await deleteUserById(id);
        fetchUsers();
      } catch (err) {
        alert('Gagal hapus');
      }
    }
  };

  const toggleStatus = async (id, current) => {
    try {
      const next = current === 'active' ? 'inactive' : 'active';
      await updateStatusUserApi(id, next);
      fetchUsers();
    } catch (err) {
      alert('Gagal ubah status');
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      {/* karyawab bre */}
      <Helmet>
        <title>Daftar Karyawan</title>
        <meta name="description" content="Daftar Manajemen Karyawan" />
      </Helmet>
      <div className="karyawan-container">
        {/* Header Actions */}
        <div className="action-bar">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Cari nama atau username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <UserPlus size={18} />
            <span>Tambah Karyawan</span>
          </button>
        </div>

        {/* Table Data */}
        <div className="table-wrapper">
          <table className="karyawan-table">
            <thead>
              <tr>
                <th>Karyawan</th>
                <th>Username</th>
                <th>Role</th>
                <th>Lokasi</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                    Memuat data...
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} onClick={() => handleRowClick(user)}>
                    <td data-label="Karyawan">
                      <div className="user-info" style={{ cursor: 'pointer' }}>
                        {/* Avatar otomatis ilang di HP gara-gara CSS di atas */}
                        {user.profilePhoto ? (
                          <img
                            src={user.profilePhoto}
                            alt={user.name}
                            className="user-avatar-img"
                          />
                        ) : (
                          <div className="user-avatar">{user.name.charAt(0)}</div>
                        )}
                        <div
                          style={{
                            textAlign: 'left',
                            gap: 5,
                            flexDirection: 'column',
                            display: 'flex',
                          }}
                        >
                          <div className="user-name">{user.name}</div>
                          <div className="user-phone">{user.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td data-label="Username">@{user.username}</td>
                    <td data-label="Role">
                      <span className={`badge-role ${user.role}`}>{user.role}</span>
                    </td>
                    <td data-label="Lokasi">
                      <div className="loc-info">
                        <strong>{user.assignedBuilding}</strong>
                      </div>
                    </td>
                    <td data-label="Status">
                      <button
                        className={`status-pill ${user.status}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStatus(user._id, user.status);
                        }}
                      >
                        {user.status}
                      </button>
                    </td>
                    <td data-label="Aksi" onClick={(e) => e.stopPropagation()}>
                      <div className="action-btns">
                        <button
                          className="btn-icon delete"
                          onClick={() => handleDelete(user._id, user.name)}
                        >
                          <Trash2 size={18} style={{ color: 'red' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Tambah (CSS Sederhana) */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="page-title">Tambah Karyawan Baru</h3>
                <button className="btn-close" onClick={() => setShowModal(false)}>
                  ×
                </button>
              </div>

              <div className="content-body">
                <div className="input-group">
                  <label>Nama Lengkap</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        name: e.target.value,
                        username: e.target.value.toLowerCase().replace(/\s/g, ''),
                      })
                    }
                    placeholder="Contoh: Budi Santoso"
                  />
                </div>

                <div className="info-grid">
                  <div className="input-group">
                    <label>Username</label>
                    <input
                      type="text"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label>Nomor HP</label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label>ID Bangunan</label>
                  <input
                    type="text"
                    value={form.assignedBuilding}
                    onChange={(e) => setForm({ ...form, assignedBuilding: e.target.value })}
                  />
                </div>

                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: 'var(--text-main)',
                    marginBottom: '8px',
                    display: 'block',
                  }}
                >
                  Lokasi Kerja
                </label>
                <div className="flex-gap" style={{ marginBottom: '20px' }}>
                  {lokasiPilihan.map((item) => (
                    <div
                      key={item.value}
                      onClick={() => {
                        const namaGedung =
                          item.value === 'FEB_TEMBALANG'
                            ? 'Gedung FEB Tembalang'
                            : 'Gedung FEB Pleburan';
                        setForm({
                          ...form,
                          assignedWorkLocation: item.value,
                          assignedBuilding: namaGedung,
                        });
                      }}
                      className="loc-badge"
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        cursor: 'pointer',
                        padding: '12px',
                        border: `2px solid ${form.assignedWorkLocation === item.value ? 'var(--primary)' : 'var(--border-color)'}`,
                        color:
                          form.assignedWorkLocation === item.value
                            ? 'var(--primary)'
                            : 'var(--text-main)',
                        fontWeight: '600',
                      }}
                    >
                      {item.label}
                    </div>
                  ))}
                </div>

                <div className="flex-gap">
                  <button
                    className="logout-icon-btn"
                    style={{ borderRadius: '10px', width: 'auto', flex: 1, height: '45px' }}
                    onClick={() => setShowModal(false)}
                  >
                    Batal
                  </button>
                  <button
                    className="btn-primary"
                    style={{ flex: 2, justifyContent: 'center' }}
                    onClick={handleTambah}
                  >
                    Simpan Karyawan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Detail & Edit */}
        {showDetailModal && selectedUser && (
          <div className="modal-overlay">
            <div className="modal-content detail-modal">
              <div className="modal-header">
                <h3>Detail Karyawan</h3>
                <button className="btn-close" onClick={() => setShowDetailModal(false)}>
                  ×
                </button>
              </div>

              <div className="detail-body">
                <div className="detail-profile">
                  {selectedUser.profilePhoto ? (
                    <img
                      src={selectedUser.profilePhoto}
                      alt="Profile"
                      className="detail-avatar-img"
                    />
                  ) : (
                    <div className="detail-avatar-fallback">
                      <CircleUserRound size={80} strokeWidth={1.5} />
                    </div>
                  )}
                  <h4>{selectedUser.name}</h4>
                  <span className={`badge-role ${selectedUser.role}`}>{selectedUser.role}</span>
                </div>

                <div className="info-grid">
                  <div className="info-item">
                    <label>Username</label>
                    <p>@{selectedUser.username}</p>
                  </div>
                  <div className="info-item">
                    <label>WhatsApp</label>
                    <p>{selectedUser.phone}</p>
                  </div>
                  <div className="info-item">
                    <label>Shift</label>
                    <p className="capitalize">{selectedUser.shift || '-'}</p>
                  </div>
                  <div className="info-item">
                    <label>Gaji Pokok</label>
                    <p>Rp {selectedUser.basicSalary?.toLocaleString()}</p>
                  </div>
                  <div className="info-item">
                    <label>Lokasi Gedung</label>
                    <p>{selectedUser.assignedBuilding}</p>
                  </div>
                  <div className="info-item">
                    <label>Lokasi Kerja</label>
                    <p>
                      {selectedUser.assignedWorkLocation === ''
                        ? ''
                        : selectedUser.assignedWorkLocation === '69809101f786b25b5149e3d6'
                          ? 'FEB_PLEBURAN'
                          : 'FEB_TEMBALANG'}
                    </p>
                  </div>
                </div>

                <hr />

                <div className="reset-password-section">
                  <h4>Ganti Password</h4>
                  <div className="flex-gap">
                    <input
                      type="password"
                      placeholder="Password baru..."
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button className="btn-primary" onClick={handleResetPassword}>
                      Simpan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Karyawan;
