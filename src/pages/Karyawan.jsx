import React, { useState, useEffect, useMemo } from 'react';
import {
  UserPlus,
  Trash2,
  Search,
  CheckCircle,
  XCircle,
  CircleUserRound,
  UserCheck,
  Clock,
  Pencil,
  Lock,
  Filter,
  Briefcase,
  MapPin,
  Eye,
  EyeClosed,
} from 'lucide-react';
import {
  getSemuaUserApi,
  buatUserBaruApi,
  deleteUserById,
  updateStatusUserApi,
  verifyUserApi,
  updateRoleUserApi,
  getAllWorkLocationApi,
} from '../api';
import { Helmet } from 'react-helmet-async';
import { formatRupiah } from '../utils/formatCurrency';
import toast from 'react-hot-toast';

const Karyawan = () => {
  // --- STATE MANAGEMENT ---
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [divisi, setDivisi] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [showPassword, setShowPassword] = useState(false);
  const [getWorkLocation, setGetWorkLocation] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    username: '',
    phone: '',
    password: '',
    role: '',
    assignedWorkLocations: '',
    profilePhoto: '',
    isVerified: true,
  });

  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    role: '',
    password: '', // Password baru di sini
    assignedWorkLocations: [],
  });

  const divisiToUppercase = (role) => {
    if (!role) return '';
    // /_/g artinya cari SEMUA underscore global
    // .toUpperCase() bikin semua jadi huruf gede
    return role.replace(/_/g, ' ').toUpperCase();
  };

  const lokasiPilihan = [
    { label: 'FEB Tembalang', value: 'FEB_TEMBALANG' },
    { label: 'FEB Pleburan', value: 'FEB_PLEBURAN' },
  ];

  // --- API CALLS ---
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

  const fetchDataLocation = async () => {
    try {
      const res = await getAllWorkLocationApi();
      setGetWorkLocation(res.data.data);
    } catch (error) {
      toast.error('Gagal Ambil Data Bre');
      console.log(error.message, 'error bre haha');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDataLocation();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'name') {
      const autoUser = value.toLowerCase().replace(/\s/g, '');
      setForm({ ...form, [name]: value, username: autoUser });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validasi
    if (!form.role) return toast.error('Pilih Divisi dulu, Bre!');
    if (!form.assignedWorkLocations) return toast.error('Pilih Lokasi dulu, Bre!');
    if (form.password.length < 6) return toast.error('Password minimal 6 karakter!');

    setLoading(true);
    try {
      // 2. Siapin Payload (Gak perlu ambil dari e.target lagi, ambil dari state 'form')
      // Karena username udah otomatis ke-update di 'handleChange', tinggal kirim aja
      const newUser = {
        ...form,
        isVerified: true,
        // Pastikan lokasi dikirim sebagai array jika API minta array
        assignedWorkLocations: Array.isArray(form.assignedWorkLocations)
          ? form.assignedWorkLocations
          : [form.assignedWorkLocations],
      };

      const result = await buatUserBaruApi(newUser);

      // 3. Handle Success
      if (result.success || result.data) {
        // Tergantung struktur response API lu
        toast.success('Mantap! Karyawan berhasil didaftarkan');
        setShowModal(false);

        // Reset Form
        setForm({
          name: '',
          username: '',
          phone: '',
          password: '',
          role: '',
          assignedWorkLocations: '',
          profilePhoto: '',
          isVerified: true,
        });

        fetchUsers(); // Refresh data table
      }
    } catch (err) {
      // Pake 'err' biar nyambung sama baris bawahnya
      console.error(err);
      const msg = err.response?.data?.message || err.message;
      toast.error('Gagal Simpan: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAction = async (userId, action, name) => {
    const confirmMsg =
      action === 'approve'
        ? `Terima ${name} sebagai karyawan?`
        : `Tolak & Hapus permanen pendaftaran ${name}?`;

    if (window.confirm(confirmMsg)) {
      try {
        await verifyUserApi(userId, action);
        toast.success(`Berhasil di-${action === 'approve' ? 'setujui' : 'hapus'}`);
        fetchUsers();
      } catch (err) {
        toast.error('Gagal memproses verifikasi');
      }
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Yakin mau hapus permanen ${name}?`)) {
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

  const handleUpdateAssignment = async () => {
    try {
      const payload = {
        role: editForm.role,
        assignedWorkLocations: editForm.assignedWorkLocations,
      };

      // Jika password diisi, masukkan ke payload
      if (editForm.password && editForm.password.trim() !== '') {
        payload.password = editForm.password;
      }

      await updateRoleUserApi(editForm.id, payload);

      alert('Mantap Bre! Perubahan berhasil disimpan.');
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      alert('Gagal Update: ' + (err.response?.data?.message || err.message));
    }
  };

  const toggleLocationSelection = (locValue) => {
    const currentLocs = [...editForm.assignedWorkLocations];
    const index = currentLocs.indexOf(locValue);

    if (index > -1) {
      currentLocs.splice(index, 1);
    } else {
      currentLocs.push(locValue);
    }

    setEditForm({ ...editForm, assignedWorkLocations: currentLocs });
  };

  const listDivisi = useMemo(() => {
    return [...new Set(users.map((u) => u.role))].filter(
      (role) => role && role !== 'admin' && role !== 'owner',
    );
  }, [users]); // Cuma dihitung ulang kalo data users dari API berubah

  const listLocations = useMemo(() => {
    return [
      ...new Set(
        users.flatMap(
          (u) =>
            u.assignedWorkLocations?.map((loc) => (typeof loc === 'object' ? loc.code : loc)) || [],
        ),
      ),
    ].filter(Boolean);
  }, [users]);

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase());

    const filterByDivisi = divisi === 'All' || divisi === '' ? true : u.role === divisi;

    const filterByLocation =
      locationFilter === 'All' || locationFilter === ''
        ? true
        : u.assignedWorkLocations?.some((loc) => {
            // Cek apakah data sudah di-populate (berbentuk objek) atau masih ID mentah
            const locationCode = typeof loc === 'object' ? loc.code : loc;
            return locationCode === locationFilter;
          });

    if (activeTab === 'pending') {
      return matchSearch && u.isVerified === false;
    }
    return matchSearch && u.isVerified === true && filterByDivisi && filterByLocation;
  });

  const getRoleStyle = (role) => {
    switch (role) {
      case 'cleaning_service':
        return { bg: '#e0f2fe', text: '#0369a1' }; // Biru Muda
      case 'customer_service':
        return { bg: '#dcfce7', text: '#15803d' }; // Hijau
      case 'gardener':
        return { bg: '#fef9c3', text: '#a16207' }; // Kuning
      case 'security':
        return { bg: '#fee2e2', text: '#b91c1c' }; // Merah
      default:
        return { bg: '#f3f4f6', text: '#374151' }; // Abu-abu (Staf lain)
    }
  };

  const getStyleWorkLocation = (loc) => {
    switch (loc) {
      case 'FEB_TEMBALANG':
        return { bg: 'var(--primary)', text: 'var(--text-main)' };
      case 'FEB_PLEBURAN':
        return { bg: 'var(--text-muted)', text: 'var(--bg-sidebar)' };
      default:
        return { bg: '#f3f4f6', text: '#374151' }; // Abu-abu (Staf lain)
    }
  };

  const roleSquad = [
    { label: '-- Pilih Divisi Kerja --', value: '' },
    { label: 'Security', value: 'security' },
    { label: 'Cleaning Service', value: 'cleaning_service' },
    { label: 'Customer Service', value: 'customer_service' },
    { label: 'Gardener', value: 'gardener' },
  ];

  const lokasiTersedia = [
    { label: '-- Pilih Lokasi Tugas --', value: '' },
    { label: 'FEB TEMBALANG', value: 'FEB_TEMBALANG' },
    { label: 'FEB PLEBURAN', value: 'FEB_PLEBURAN' },
  ];

  return (
    <>
      <Helmet>
        <title>Daftar Karyawan</title>
      </Helmet>

      <div className="karyawan-container">
        <div
          className="tabs-navigation"
          style={{
            display: 'flex',
            gap: '20px',
            marginBottom: '25px',
            borderBottom: '2px solid #f0f0f0',
          }}
        >
          <button
            onClick={() => setActiveTab('active')}
            style={{
              padding: '12px 20px',
              cursor: 'pointer',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'active' ? '3px solid #3498db' : 'none',
              fontWeight: activeTab === 'active' ? '700' : '400',
              color: activeTab === 'active' ? '#3498db' : '#888',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <UserCheck size={18} /> Karyawan Aktif
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            style={{
              padding: '12px 20px',
              cursor: 'pointer',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'pending' ? '3px solid #e67e22' : 'none',
              fontWeight: activeTab === 'pending' ? '700' : '400',
              color: activeTab === 'pending' ? '#e67e22' : '#888',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Clock size={18} /> Butuh ACC
            <span
              style={{
                backgroundColor: '#e67e22',
                color: '#fff',
                fontSize: '11px',
                padding: '2px 7px',
                borderRadius: '10px',
              }}
            >
              {users.filter((u) => !u.isVerified).length}
            </span>
          </button>
        </div>

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
          <div className="period-picker">
            <Filter size={18} color="var(--primary)" />
            <select
              value={divisi}
              onChange={(e) => setDivisi(e.target.value)}
              style={{
                border: 'none',
                background: 'var(--bg-card)',
                outline: 'none',
                fontWeight: '600',
                cursor: 'pointer',
                color: 'var(--text-main)',
              }}
            >
              <option style={{ color: 'var(--text-main)' }} value="All">
                Semua Divisi
              </option>
              {listDivisi.map((role) => (
                <option key={role} value={role}>
                  {divisiToUppercase(role)}
                </option>
              ))}
            </select>
          </div>
          <div className="period-picker">
            <MapPin size={18} color="var(--primary)" />
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              style={{
                border: 'none',
                background: 'var(--bg-card)',
                outline: 'none',
                fontWeight: '600',
                cursor: 'pointer',
                color: 'var(--text-main)',
              }}
            >
              <option style={{ color: 'var(--text-main)' }} value="All">
                Semua Lokasi
              </option>
              {listLocations.map((code) => (
                <option key={code} value={code}>
                  {divisiToUppercase(code)}
                </option>
              ))}
            </select>
          </div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <UserPlus size={18} />
            <span>Tambah Karyawan</span>
          </button>
        </div>

        <div className="table-wrapper">
          <table className="karyawan-table">
            <thead>
              <tr>
                <th>Karyawan</th>
                <th>Username</th>
                <th>Divisi</th>
                <th>Lokasi Kerja</th>
                {activeTab === 'active' ? <th>Status</th> : <th>Konfirmasi</th>}
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                    Memuat data...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                    Data kosong.
                  </td>
                </tr>
              ) : (
                filteredUsers
                  .filter((user) => user.role !== 'owner' && user.role !== 'admin')
                  .map((user) => (
                    <tr
                      key={user._id}
                      onClick={() =>
                        activeTab === 'active' && setSelectedUser(user) & setShowDetailModal(true)
                      }
                    >
                      <td data-label="Karyawan">
                        <div className="user-info">
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
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '2px',
                            }}
                          >
                            <span className="user-name">{user.name}</span>
                            <span className="user-phone">{user.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td data-label="Username">@{user.username}</td>
                      <td data-label="Divisi">
                        {(() => {
                          const style = getRoleStyle(user.role);
                          return (
                            <span
                              className="role-badge"
                              style={{
                                backgroundColor: style.bg,
                                color: style.text,
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '11px',
                                fontWeight: '700',
                                display: 'inline-block',
                              }}
                            >
                              {divisiToUppercase(user.role)}
                            </span>
                          );
                        })()}
                      </td>
                      <td data-label="Lokasi">
                        {(() => {
                          const style = getStyleWorkLocation(
                            user.assignedWorkLocations?.[0]?.code || '',
                          );
                          return (
                            <span
                              style={{
                                backgroundColor: style.bg,
                                color: style.text,
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '11px',
                                fontWeight: '700',
                                display: 'inline-block',
                              }}
                            >
                              {user.assignedWorkLocations && user.assignedWorkLocations.length > 0
                                ? user.assignedWorkLocations[0].code
                                : 'Tidak ada lokasi'}
                            </span>
                          );
                        })()}
                      </td>
                      <td data-label={activeTab === 'active' ? 'Status' : 'Konfirmasi'}>
                        {activeTab === 'active' ? (
                          <button
                            className={`status-pill ${user.status}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStatus(user._id, user.status);
                            }}
                          >
                            {user.status}
                          </button>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              className="btn-acc"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVerifyAction(user._id, 'approve', user.name);
                              }}
                              style={{
                                backgroundColor: '#27ae60',
                                color: 'white',
                                padding: '6px 12px',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                              }}
                            >
                              Terima
                            </button>
                            <button
                              className="btn-reject"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVerifyAction(user._id, 'reject', user.name);
                              }}
                              style={{
                                backgroundColor: '#e74c3c',
                                color: 'white',
                                padding: '6px 12px',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                              }}
                            >
                              Tolak
                            </button>
                          </div>
                        )}
                      </td>
                      <td
                        data-label="Aksi"
                        onClick={(e) => e.stopPropagation()}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                      >
                        <button
                          style={{ background: 'none', outline: 'none', border: 'none' }}
                          className="btn-icon delete"
                          onClick={() => handleDelete(user._id, user.name)}
                        >
                          <Trash2 size={18} style={{ color: 'red' }} />
                        </button>
                        <button
                          style={{
                            background: 'none',
                            outline: 'none',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditForm({
                              id: user._id,
                              name: user.name,
                              role: user.role,
                              password: '', // Reset password field saat buka modal
                              assignedWorkLocations:
                                user.assignedWorkLocations?.map((l) => l.code) || [],
                            });
                            setShowEditModal(true);
                          }}
                        >
                          <Pencil size={18} style={{ color: 'blue' }} />
                        </button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

        {/* --- MODAL TAMBAH KARYAWAN --- */}
        {showModal && (
          <form className="modal-overlay" onSubmit={handleSubmit}>
            <div className="modal-content">
              <div className="modal-header">
                <h3>Tambah Karyawan Baru</h3>
                <button className="btn-close" onClick={() => setShowModal(false)}>
                  ×
                </button>
              </div>
              <div className="content-body">
                <div className="info-grid">
                  <div className="input-group">
                    <label>Nama Lengkap</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={handleChange}
                      required
                      name="name"
                      placeholder="Contoh: Budi Santoso"
                    />
                  </div>
                  <div className="input-group">
                    <label>Username</label>
                    <input
                      name="username"
                      placeholder="username"
                      required
                      type="text"
                      value={form.username}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Nomor HP</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    name="phone"
                    placeholder="0891234xxxxxxx"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>

                <div className="input-group">
                  <label>Password</label>
                  <div className="ShowPassword">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                    <div onClick={() => setShowPassword(!showPassword)} className="eyeIcon">
                      {showPassword ? <Eye /> : <EyeClosed />}
                    </div>
                  </div>
                </div>
                <div className="input-group">
                  <label>Divisi</label>
                  <select
                    style={{
                      padding: '10px',
                      background: 'var(--bg-main)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                    value={form.role}
                    name="role"
                    required
                    onChange={handleChange}
                  >
                    {roleSquad.map((r) => (
                      <option value={r.value} key={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label>Pilih Lokasi Kerja</label>
                  <select
                    style={{
                      padding: '10px',
                      background: 'var(--bg-main)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                    value={form.assignedWorkLocations}
                    name="assignedWorkLocations"
                    required
                    onChange={handleChange}
                  >
                    {lokasiTersedia.map((l) => (
                      <option value={l.value} key={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-gap" style={{ marginTop: '20px' }}>
                  <button
                    style={{
                      flex: 1,
                      background: '#ff0e0e',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                    }}
                    className="button-danger"
                    onClick={() => setShowModal(false)}
                  >
                    Batal
                  </button>
                  <button className="btn-primary" type="submit" style={{ flex: 2 }}>
                    Simpan Karyawan
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* --- MODAL DETAIL (PASSWORD HAPUS) --- */}
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
                <div
                  className="detail-profile"
                  style={{ textAlign: 'center', marginBottom: '20px' }}
                >
                  <div className="detail-avatar-fallback">
                    {selectedUser.profilePhoto ? (
                      <img src={selectedUser.profilePhoto} />
                    ) : (
                      <CircleUserRound size={80} />
                    )}
                  </div>
                  <h4>{selectedUser.name}</h4>
                  <span className={`badge-role ${selectedUser.role}`}>{selectedUser.role}</span>
                </div>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Nama</label>
                    <p>{selectedUser.name}</p>
                  </div>
                  <div className="info-item">
                    <label>Username</label>
                    <p>@{selectedUser.username}</p>
                  </div>
                  <div className="info-item">
                    <label>BPJS Kesehatan</label>
                    <p>{selectedUser.bpjsKesehatan ? 'Aktif' : ''}</p>
                  </div>
                  <div className="info-item">
                    <label>WhatsApp</label>
                    <p>{selectedUser.phone}</p>
                  </div>
                  <div className="info-item">
                    <label>BPJS Ketenaga kerjaan</label>
                    <p>{selectedUser.bpjsKetenagakerjaan ? 'Aktif' : ''}</p>
                  </div>
                  <div className="info-item">
                    <label>Lokasi</label>
                    <p>{selectedUser?.assignedWorkLocations?.[0]?.code || 'Belum diatur'}</p>
                  </div>
                  <div className="info-item">
                    <label>Status Akun</label>
                    <p>{selectedUser.status}</p>
                  </div>
                  <div className="info-item">
                    <label>Basic Salary</label>
                    <p>{formatRupiah(selectedUser.basicSalary)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- MODAL EDIT ROLE, LOKASI & PASSWORD --- */}
        {showEditModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Edit Data: {editForm.name}</h3>
                <button className="btn-close" onClick={() => setShowEditModal(false)}>
                  ×
                </button>
              </div>

              <div className="content-body" style={{ padding: '20px' }}>
                <div className="input-group" style={{ marginBottom: '20px' }}>
                  <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                    Pilih Divisi/Role
                  </label>
                  <select
                    className="form-control"
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                    }}
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  >
                    <option value="karyawan">Karyawan</option>
                    <option value="security">Security</option>
                    <option value="cleaning_service">Cleaning Service</option>
                    <option value="gardener">Gardener</option>
                    <option value="customer_service">Customer Service</option>
                  </select>
                </div>

                <div className="input-group" style={{ marginBottom: '20px' }}>
                  <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                    Lokasi Penugasan (Bisa Pilih lebih dari 1)
                  </label>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {lokasiPilihan.map((loc) => {
                      const isActive = editForm.assignedWorkLocations.includes(loc.value);
                      return (
                        <button
                          key={loc.value}
                          type="button"
                          onClick={() => toggleLocationSelection(loc.value)}
                          style={{
                            padding: '10px 15px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: '0.3s',
                            border: `2px solid ${isActive ? '#3498db' : '#eee'}`,
                            backgroundColor: isActive ? '#ebf5fb' : '#fff',
                            color: isActive ? '#3498db' : '#666',
                            fontWeight: isActive ? '700' : '400',
                          }}
                        >
                          {isActive ? '✅ ' : '+ '} {loc.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* --- INPUT PASSWORD PINDAH KE SINI --- */}
                <hr style={{ margin: '20px 0', border: '0.5px solid #eee' }} />
                <div className="input-group">
                  <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                    Reset Password (Kosongkan jika tidak diubah)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock
                      size={16}
                      style={{ position: 'absolute', left: '12px', top: '12px', color: '#888' }}
                    />
                    <input
                      type="password"
                      placeholder="Masukkan password baru..."
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 10px 10px 35px',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                </div>

                <div
                  className="modal-footer"
                  style={{ marginTop: '30px', display: 'flex', gap: '10px' }}
                >
                  <button
                    className="logout-icon-btn"
                    style={{ flex: 1 }}
                    onClick={() => setShowEditModal(false)}
                  >
                    Batal
                  </button>
                  <button
                    className="btn-primary"
                    style={{ flex: 2 }}
                    onClick={handleUpdateAssignment}
                  >
                    Simpan Perubahan
                  </button>
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
