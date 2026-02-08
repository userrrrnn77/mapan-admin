import React, { useState, useEffect } from 'react';
import { Search, Calculator, CheckCircle, Calendar, AlertCircle } from 'lucide-react';
import { getPayrollKaryawanApi, prosesPayrollApi, getAbsebsiApi } from '../api';
import { Helmet } from 'react-helmet-async';

const Payroll = () => {
  const [karyawan, setKaryawan] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [periode, setPeriode] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [showSlip, setShowSlip] = useState(false);
  const [slipData, setSlipData] = useState(null);

  const fetchKaryawanDanPenalty = async () => {
    setLoading(true);
    try {
      // 1. Ambil data Karyawan
      const resKaryawan = await getPayrollKaryawanApi();
      const listKaryawan = resKaryawan.data?.data || resKaryawan.data;

      // 2. Ambil data Absensi untuk periode ini buat itung penalty
      // Kita ambil range tanggal awal sampe akhir bulan dari state 'periode'
      const start = `${periode}-01`;
      const end = `${periode}-31`;
      const resAbsensi = await getAbsebsiApi(start, end);
      const listAbsensi = resAbsensi.data.allAttendance || resAbsensi.data.data || [];

      // 3. Gabungkan: Hitung total penalty per User ID
      const mappedKaryawan = listKaryawan.map((user) => {
        const totalPenalty = listAbsensi
          .filter((abs) => abs.user?._id === user._id)
          .reduce((sum, current) => sum + (current.penalty || 0), 0);

        return {
          ...user,
          calculatedPenalty: totalPenalty, // Kita simpan di property baru
        };
      });

      setKaryawan(Array.isArray(mappedKaryawan) ? mappedKaryawan : []);
    } catch (err) {
      console.error('Gagal load data payroll', err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger ulang tiap periode ganti biar penalty-nya update sesuai bulan
  useEffect(() => {
    fetchKaryawanDanPenalty();
  }, [periode]);

  const handleHitungGaji = async (user) => {
    if (!window.confirm(`Hitung gaji ${user.name} untuk periode ${periode}?`)) return;
    try {
      const res = await prosesPayrollApi(user._id, periode);
      if (res.data.success) {
        setSlipData({ ...res.data.data, name: user.name });
        setShowSlip(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal proses payroll');
    }
  };

  const filtered = karyawan.filter((u) => u.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <>
      <Helmet>
        <title>Payroll</title>
        <meta name="description" content="Payroll Karyawan" />
      </Helmet>
      <div className="karyawan-container">
        <div className="action-bar">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Cari nama karyawan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div
            className="period-picker"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'var(--bg-card)',
              padding: '5px 15px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
            }}
          >
            <Calendar size={18} color="var(--primary)" />
            <input
              type="month"
              style={{
                border: 'none',
                background: 'none',
                color: 'var(--text-main)',
                fontWeight: 'bold',
                cursor: 'pointer',
                outline: 'none',
              }}
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrapper">
          <table className="karyawan-table">
            <thead>
              <tr>
                <th>Karyawan</th>
                <th>Gaji Pokok</th>
                <th>Penalty ({periode})</th>
                <th>Lokasi</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                    Narik data bentar Bre...
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((user) => (
                  <tr key={user._id}>
                    {/* Kolom Karyawan */}
                    <td data-label="Karyawan">
                      <div className="user-info">
                        <div className="user-avatar">{user.name.charAt(0)}</div>
                        <div>
                          <div className="user-name">{user.name}</div>
                        </div>
                      </div>
                    </td>

                    {/* Kolom Gaji Pokok */}
                    <td data-label="Gaji Pokok">
                      <strong style={{ color: '#10b981', fontWeight: '700' }}>
                        Rp {user.basicSalary?.toLocaleString('id-ID')}
                      </strong>
                    </td>

                    {/* Kolom Penalty */}
                    <td data-label={`Penalty (${periode})`}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          color: '#ef4444',
                          fontWeight: '600',
                        }}
                      >
                        <AlertCircle size={14} />
                        <span>Rp {(user.calculatedPenalty || 0).toLocaleString('id-ID')}</span>
                      </div>
                    </td>

                    {/* Kolom Lokasi */}
                    <td data-label="Lokasi">
                      <span style={{ fontSize: '13px' }}>
                        {user.assignedBuilding || 'Semua Lokasi'}
                      </span>
                    </td>

                    {/* Kolom Aksi */}
                    <td data-label="Aksi">
                      <button
                        className="btn-primary"
                        onClick={() => handleHitungGaji(user)}
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        <Calculator size={16} />
                        <span>Hitung Gaji</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}
                  >
                    Karyawan nggak ketemu, Bre.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {showSlip && slipData && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ width: '400px' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <CheckCircle color="#4CAF50" size={48} />
                <h3 style={{ marginTop: '10px' }}>Payroll Berhasil</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Periode: {periode}</p>
              </div>

              <div
                style={{
                  background: 'var(--bg-main)',
                  padding: '20px',
                  borderRadius: '15px',
                  marginBottom: '20px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>Karyawan</span>
                  <strong style={{ color: 'var(--text-main)' }}>{slipData.name}</strong>
                </div>
                <div
                  style={{ height: '1px', background: 'var(--border-color)', margin: '10px 0' }}
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    fontSize: '14px',
                  }}
                >
                  <span>Gaji Pokok</span>
                  <span>Rp {slipData.nominalGajiPokok?.toLocaleString()}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    fontSize: '14px',
                    color: '#f44336',
                  }}
                >
                  <span>Potongan Telat</span>
                  <span>- Rp {slipData.potonganTelat?.toLocaleString()}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '15px',
                    fontSize: '14px',
                    color: '#f44336',
                  }}
                >
                  <span>Potongan BPJS</span>
                  <span>- Rp {slipData.potonganBPJS?.toLocaleString()}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderTop: '2px dashed var(--border-color)',
                    paddingTop: '15px',
                  }}
                >
                  <strong style={{ color: 'var(--text-main)' }}>Total Diterima</strong>
                  <strong style={{ color: '#4CAF50', fontSize: '18px' }}>
                    Rp {slipData.takeHomePay?.toLocaleString()}
                  </strong>
                </div>
              </div>

              <button
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setShowSlip(false)}
              >
                Selesai
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Payroll;
