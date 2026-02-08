import React, { useState, useEffect } from 'react';
import { MapPin, Save, Globe, Loader2, Target, Navigation } from 'lucide-react';
import { getAllWorkLocationApi, updateWorkLocationApi } from '../api';
import { Helmet } from 'react-helmet-async';

const WorkLocation = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

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
      const payload = {
        name: loc.name,
        code: loc.code,
        // Gunakan parseFloat pas mau kirim ke API agar formatnya numeric
        lat: parseFloat(loc.center.lat),
        lng: parseFloat(loc.center.lng),
        radiusMeter: parseInt(loc.radiusMeter),
      };
      await updateWorkLocationApi(loc._id, payload);
      alert(`Berhasil update lokasi ${loc.name}!`);
    } catch (err) {
      alert('Gagal update lokasi, cek koneksi Bre!');
    } finally {
      setUpdatingId(null);
    }
  };

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
              <div key={loc._id} className="table-wrapper" style={{ padding: '0' }}>
                {/* Header Card dengan Variabel CSS */}
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
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default WorkLocation;
