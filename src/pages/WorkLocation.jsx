import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Save,
  Globe,
  Loader2,
  Target,
  Navigation,
  Shield,
  PaintBucket,
  UserCircle,
  TreePine,
  Briefcase,
  Plus,
  X,
  Trash2,
} from 'lucide-react';
import {
  createLocation,
  deleteLocation,
  getAllWorkLocationApi,
  updateWorkLocationApi,
} from '../api';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { getRoleStyle } from '../assets/css/style';

const WorkLocation = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);

  const [formLocation, setFormLocation] = useState({
    code: '',
    name: '',
    role: '',
    lat: '',
    lng: '',
    radiusMeter: 100,
    shiftConfigs: {
      weekday: {
        pagi: { hour: 6, minute: 0, endHour: 14, endMinute: 0 },
        siang: { hour: 11, minute: 0, endHour: 19, endMinute: 0 },
        malam: { hour: 0, minute: 0, endHour: 0, endMinute: 0 },
      },
      weekend: {
        pagi: { hour: 7, minute: 0, endHour: 12, endMinute: 0 },
        siang: { hour: 12, minute: 0, endHour: 17, endMinute: 0 },
        malam: { hour: 0, minute: 0, endHour: 0, endMinute: 0 },
      },
    },
  });

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await getAllWorkLocationApi();
      setLocations(res.data?.data || []);
    } catch (err) {
      console.error('Gagal load lokasi', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleUpdate = async (loc) => {
    setUpdatingId(loc._id);
    try {
      const rawLat = loc.center?.lat ?? loc.lat;
      const rawLng = loc.center?.lng ?? loc.lng;

      const payload = {
        name: loc.name,
        code: loc.code,
        lat: parseFloat(rawLat),
        lng: parseFloat(rawLng),
        radiusMeter: parseInt(loc.radiusMeter),
        shiftConfigs: loc.shiftConfigs,
      };
      await updateWorkLocationApi(loc._id, payload);
      toast.success(`Berhasil update lokasi ${loc.name}!`);
    } catch (err) {
      alert('Gagal update lokasi, cek koneksi Bre!');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formLocation.code || !formLocation.role || !formLocation.lat || !formLocation.lng) {
      return toast.error('Data belum lengkap, jangan buru-buru Bre!');
    }
    setBtnLoading(true);
    try {
      await createLocation(formLocation);
      toast.success('Mantap! Lokasi baru berhasil ditanam');
      setShowModal(false);
      setFormLocation({
        code: '',
        name: '',
        role: '',
        lat: '',
        lng: '',
        radiusMeter: 100,
        shiftConfigs: {
          weekday: {
            pagi: { hour: 0, minute: 0 },
            siang: { hour: 0, minute: 0 },
            malam: { hour: 0, minute: 0 },
          },
          weekend: {
            pagi: { hour: 0, minute: 0 },
            siang: { hour: 0, minute: 0 },
            malam: { hour: 0, minute: 0 },
          },
        },
      });
      fetchLocations();
    } catch (error) {
      const message = error.response?.data?.message || 'Gagal Bikin Lokasi';
      toast.error(message);
    } finally {
      setBtnLoading(false);
    }
  };

  const handleShiftChange = (locationId, dayType, shiftTime, field, value) => {
    const [h, m] = value.split(':');
    setLocations((prev) =>
      prev.map((l) =>
        l._id === locationId
          ? {
              ...l,
              shiftConfigs: {
                ...l.shiftConfigs,
                [dayType]: {
                  ...l.shiftConfigs[dayType],
                  [shiftTime]: {
                    ...l.shiftConfigs[dayType][shiftTime],
                    [field === 'masuk' ? 'hour' : 'endHour']: parseInt(h),
                    [field === 'masuk' ? 'minute' : 'endMinute']: parseInt(m),
                  },
                },
              },
            }
          : l,
      ),
    );
  };

  const handleDeleteLocation = async (id, code) => {
    if (window.confirm(`Yakin mau delete lokasi dengan code: ${code} secara permanen?`))
      try {
        await deleteLocation(id);
        fetchLocations();
      } catch (error) {
        toast.error('Gagal, Hapus lokasi bre');
      } finally {
        fetchLocations();
      }
  };

  const toUpperCaseRole = (role) => {
    if (!role) return '';
    return role.replace(/_/g, ' ');
  };

  const roles = [
    { id: 'security', label: 'Security', icon: <Shield size={14} /> },
    { id: 'cleaning_service', label: 'Cleaning Service', icon: <PaintBucket size={14} /> },
    { id: 'customer_service', label: 'Customer Service', icon: <UserCircle size={14} /> },
    { id: 'gardener', label: 'Gardener', icon: <TreePine size={14} /> },
    { id: 'karyawan', label: 'Karyawan Umum', icon: <Briefcase size={14} /> },
  ];

  const uniqueCode = [
    { code: 'FEB_TEMBALANG', label: 'FEB Undip Tembalang' },
    { code: 'FEB_PLEBURAN', label: 'FEB Undip Pleburan' },
    { code: 'REKTORAT', label: 'Rektorat Undip' },
    { code: 'GARDENER', label: 'Taman Undip' },
  ];

  return (
    <>
      {/* worklocation bre */}
      <Helmet>
        <title>Lokasi Kerja</title>
        <meta name="description" content="Lokasi Kerja Karyawan | Penempatan" />
      </Helmet>
      <div className="attendance-container">
        {/* Header Mengikuti Style Action Bar Lu */}
        <div className="navbar" style={{ marginBottom: '25px' }}>
          <div>
            <div className="breadcrumb">Pengaturan Sistem</div>
            <h2 className="page-title">Lokasi Kerja & Geofencing</h2>
          </div>
          <div className="nav-right">
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={18} />
              <span>Tambah Lokasi</span>
            </button>
            <button className="nav-icon-btn" onClick={fetchLocations} title="Refresh Data">
              <Loader2 size={18} className={loading ? 'spin' : ''} />
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '20px',
          }}
        >
          {loading ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '50px' }}>
              <p style={{ color: 'var(--text-muted)' }}>Menarik data koordinat...</p>
            </div>
          ) : (
            locations.map((loc) => (
              <div key={loc._id} className="worklocWrap" style={{ padding: '0' }}>
                {/* Header Card dengan Variabel CSS */}
                {/* ini masih belum responsive bre */}
                <div
                  style={{
                    padding: '20px',
                    background: 'rgba(70, 48, 235, 0.05)',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Target size={20} color="var(--primary)" />
                    <strong style={{ color: 'var(--text-main)', fontSize: '16px' }}>
                      {loc.code}
                    </strong>
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${loc.center.lat},${loc.center.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="loc-badge"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      textDecoration: 'none',
                      color: 'var(--primary)',
                      fontWeight: '600',
                    }}
                  >
                    <Globe size={14} /> Maps
                  </a>
                </div>

                {/* Form Area */}
                <div
                  style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}
                >
                  <div className="input-group">
                    <label style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                      NAMA KANTOR
                    </label>
                    <input
                      type="text"
                      value={loc.name}
                      onChange={(e) =>
                        setLocations((prev) =>
                          prev.map((l) => (l._id === loc._id ? { ...l, name: e.target.value } : l)),
                        )
                      }
                      style={{
                        background: 'var(--bg-main)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-main)',
                        padding: '12px',
                        borderRadius: '10px',
                        width: '100%',
                      }}
                      readOnly
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="input-group">
                      <label style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                        LATITUDE
                      </label>
                      <input
                        type="number"
                        step={'any'}
                        value={loc.center.lat}
                        onChange={(e) => {
                          const val = e.target.value; // Ambil raw string-nya
                          setLocations((prev) =>
                            prev.map((l) =>
                              l._id === loc._id
                                ? { ...l, center: { ...l.center, lat: val } } // Simpan apa adanya
                                : l,
                            ),
                          );
                        }}
                        style={{
                          background: 'var(--bg-main)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-main)',
                          padding: '12px',
                          borderRadius: '10px',
                          width: '100%',
                        }}
                      />
                    </div>
                    <div className="input-group">
                      <label style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                        LONGITUDE
                      </label>
                      <input
                        type="number"
                        step={'any'}
                        value={loc.center.lng}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLocations((prev) =>
                            prev.map((l) =>
                              l._id === loc._id
                                ? { ...l, center: { ...l.center, lng: val } } // <-- Pastikan 'lng', bukan 'lat'
                                : l,
                            ),
                          );
                        }}
                        style={{
                          background: 'var(--bg-main)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-main)',
                          padding: '12px',
                          borderRadius: '10px',
                          width: '100%',
                        }}
                      />
                    </div>
                  </div>

                  <div className="stylusBoy">
                    <div className="input-group">
                      <label style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                        RADIUS ABSEN (METER)
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="number"
                          value={loc.radiusMeter}
                          onChange={(e) =>
                            setLocations((prev) =>
                              prev.map((l) =>
                                l._id === loc._id ? { ...l, radiusMeter: e.target.value } : l,
                              ),
                            )
                          }
                          style={{
                            background: 'var(--bg-main)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-main)',
                            padding: '12px',
                            borderRadius: '10px',
                            width: '120px',
                          }}
                        />
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          Maksimal jarak karyawan bisa absen
                        </span>
                      </div>
                    </div>
                    <div className="input-group" style={{ width: '30%' }}>
                      <label style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Divisi</label>
                      <p className="roleWorkLocation">
                        {(() => {
                          const style = getRoleStyle(loc.role);
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
                              {toUpperCaseRole(loc.role)}
                            </span>
                          );
                        })()}
                      </p>
                    </div>
                  </div>

                  <div className="roleShift">
                    <div className="roleShiftGroupColum" style={{ width: '100%' }}>
                      <label
                        className=""
                        style={{
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          fontSize: '12px',
                        }}
                      >
                        Shift Konfigurasi
                      </label>

                      <div className="shift-container">
                        {['weekday', 'weekend'].map((dayType) => (
                          <div key={dayType} className="shift-day-section">
                            <h4>{dayType}</h4>

                            {/* Header Kecil buat Penanda */}
                            <div className="input-header">
                              <span></span>
                              <span>Jam Masuk</span>
                              <span>Jam Pulang</span>
                            </div>

                            {['pagi', 'siang', 'malam'].map((shiftTime) => (
                              <div key={shiftTime} className="shift-row">
                                <span className="shift-label">{shiftTime}</span>

                                <input
                                  type="time"
                                  className="input-style-bre"
                                  value={`${String(loc.shiftConfigs[dayType][shiftTime]?.hour || 0).padStart(2, '0')}:${String(loc.shiftConfigs[dayType][shiftTime]?.minute || 0).padStart(2, '0')}`}
                                  onChange={(e) =>
                                    handleShiftChange(
                                      loc._id,
                                      dayType,
                                      shiftTime,
                                      'masuk',
                                      e.target.value,
                                    )
                                  }
                                />

                                <input
                                  type="time"
                                  className="input-style-bre"
                                  value={`${String(loc.shiftConfigs[dayType][shiftTime]?.endHour || 0).padStart(2, '0')}:${String(loc.shiftConfigs[dayType][shiftTime]?.endMinute || 0).padStart(2, '0')}`}
                                  onChange={(e) =>
                                    handleShiftChange(
                                      loc._id,
                                      dayType,
                                      shiftTime,
                                      'pulang',
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flexButton">
                    <button
                      className="btn-danger"
                      style={{
                        width: '100%',
                        marginTop: '10px',
                        justifyContent: 'center',
                        height: '50px',
                      }}
                      onClick={() => handleDeleteLocation(loc._id, loc.code)}
                      disabled={updatingId === loc._id}
                    >
                      {updatingId === loc._id ? (
                        <Loader2 className="spin" size={20} />
                      ) : (
                        <Trash2 size={20} />
                      )}
                      <span>Hapus Lokasi</span>
                    </button>

                    <button
                      className="btn-primary"
                      style={{
                        width: '100%',
                        marginTop: '10px',
                        justifyContent: 'center',
                        height: '50px',
                      }}
                      onClick={() => handleUpdate(loc)}
                      disabled={updatingId === loc._id}
                    >
                      {updatingId === loc._id ? (
                        <Loader2 className="spin" size={20} />
                      ) : (
                        <Save size={20} />
                      )}
                      <span>Simpan Konfigurasi</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px', width: '90%' }}>
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="icon-box-primary">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0 }}>Tambah Lokasi Baru</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                      Tentukan jatah lokasi per divisi
                    </p>
                  </div>
                </div>
                <button className="close-btn" onClick={() => setShowModal(false)}>
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={handleCreate}
                style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}
              >
                <div className="input-group">
                  <label>Pilih Divisi / Role</label>
                  <select
                    value={formLocation.role}
                    onChange={(e) => setFormLocation({ ...formLocation, role: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-dropdown-search)',
                    }}
                    required
                  >
                    <option style={{ background: 'var(--bg-dropdown-search)' }} value="">
                      -- Pilih Divisi --
                    </option>
                    {roles.map((r) => (
                      <option
                        style={{ background: 'var(--bg-dropdown-search)' }}
                        key={r.id}
                        value={r.id}
                      >
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label>Kode Lokasi (Contoh: FEB_TEMBALANG)</label>
                  <label style={{ color: 'red', fontSize: '10px', textTransform: 'capitalize' }}>
                    *spasi ganti underscore
                  </label>
                  <select
                    value={formLocation.code}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-dropdown-search)',
                    }}
                    required
                    onChange={(e) => setFormLocation({ ...formLocation, code: e.target.value })}
                  >
                    <option style={{ background: 'var(--bg-dropdown-search)' }} value="">
                      -- Pilih Lokasi --
                    </option>
                    {uniqueCode.map((l) => (
                      <option value={l.code} key={l.code}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label>Nama Lokasi (Label Display)</label>
                  <input
                    type="text"
                    placeholder="Contoh: FEB Tembalang"
                    value={formLocation.name}
                    onChange={(e) => setFormLocation({ ...formLocation, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="input-group">
                    <label>Latitude</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="-7.000..."
                      value={formLocation.lat}
                      onChange={(e) => setFormLocation({ ...formLocation, lat: e.target.value })}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Longitude</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="110.000..."
                      value={formLocation.lng}
                      onChange={(e) => setFormLocation({ ...formLocation, lng: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Radius Absensi (Meter)</label>
                  <input
                    type="number"
                    value={formLocation.radiusMeter}
                    onChange={(e) =>
                      setFormLocation({ ...formLocation, radiusMeter: e.target.value })
                    }
                  />
                </div>

                <div
                  className="shift-config-section"
                  style={{
                    marginTop: '20px',
                    borderTop: '1px dashed var(--border-color)',
                    paddingTop: '15px',
                  }}
                >
                  <label style={{ fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>
                    Konfigurasi Shift (Jam Masuk)
                  </label>

                  {['weekday', 'weekend'].map((day) => (
                    <div key={day} style={{ marginBottom: '15px' }}>
                      <span
                        style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '700' }}
                      >
                        {day.toUpperCase()}
                      </span>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr 1fr',
                          gap: '10px',
                          marginTop: '5px',
                        }}
                      >
                        {['pagi', 'siang', 'malam'].map((waktu) => (
                          <div
                            key={waktu}
                            className="shift-card"
                            style={{
                              background: 'var(--bg-secondary)',
                              padding: '10px',
                              borderRadius: '8px',
                            }}
                          >
                            <label style={{ fontWeight: 'bold', fontSize: '11px' }}>
                              {waktu.toUpperCase()}
                            </label>

                            {/* JAM MASUK */}
                            <div className="input-group">
                              <label style={{ fontSize: '9px' }}>Masuk</label>
                              <input
                                type="time"
                                onChange={(e) => {
                                  const [h, m] = e.target.value.split(':');
                                  handleShiftChange(day, waktu, 'hour', h);
                                  handleShiftChange(day, waktu, 'minute', m);
                                }}
                              />
                            </div>

                            {/* JAM PULANG (TAMBAHAN SAKTI) */}
                            <div className="input-group" style={{ marginTop: '5px' }}>
                              <label style={{ fontSize: '9px', color: 'var(--danger)' }}>
                                Pulang
                              </label>
                              <input
                                type="time"
                                onChange={(e) => {
                                  const [h, m] = e.target.value.split(':');
                                  handleShiftChange(day, waktu, 'endHour', h);
                                  handleShiftChange(day, waktu, 'endMinute', m);
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="modal-footer" style={{ marginTop: '20px' }}>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => setShowModal(false)}
                    style={{ flex: 1 }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ flex: 2 }}
                    disabled={btnLoading}
                  >
                    {btnLoading ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
                    Tanam Lokasi
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default WorkLocation;
