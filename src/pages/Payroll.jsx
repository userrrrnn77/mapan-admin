import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Calculator,
  CheckCircle,
  Calendar,
  Save,
  Clock,
  FileSpreadsheet,
  Filter,
} from 'lucide-react';
import { getPayrollListApi, prosesPayrollApi, getAbsebsiApi, updatePayrollApi } from '../api';
import { Helmet } from 'react-helmet-async';
import * as XLSX from 'xlsx';
import { formatRupiah } from '../utils/formatCurrency';

const Payroll = () => {
  const [karyawan, setKaryawan] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [divisi, setDivisi] = useState('All');
  const [periode, setPeriode] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    basicSalary: 0,
    bonus: 0,
    persenBPJS: 4,
    totalMenitTelat: 0,
    hargaPerMenit: 1000,
    jumlahAlpha: 0,
    catatan: '',
  });

  const [showSlip, setShowSlip] = useState(false);

  // Fungsi cleaning text biar rapi di UI
  const divisiToUppercase = (role) => {
    if (!role) return '';
    return role.replace(/_/g, ' ').toUpperCase();
  };

  const getNominalAlpha = (hari, salary) => Math.round(Number(hari) * (Number(salary) / 26));

  const getNominalBPJS = (persen, salary) => {
    const basic = Number(salary);
    const salaryForKes = Math.min(basic, 12000000);
    if (Number(persen) === 4) {
      return Math.round(0.01 * salaryForKes + 0.03 * basic);
    }
    return Math.round((Number(persen) / 100) * basic);
  };

  const fetchKaryawanDanDataAbsen = useCallback(async () => {
    setLoading(true);
    try {
      const resKaryawan = await getPayrollListApi();
      const listKaryawan = resKaryawan.data?.data || resKaryawan.data;

      const [year, month] = periode.split('-').map(Number);
      const endDate = new Date(year, month, 0);

      const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
      const endStr = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

      const resAbsensi = await getAbsebsiApi(startStr, endStr);
      const listAbsensi = resAbsensi.data.allAttendance || resAbsensi.data.data || [];

      const masterWorkingDates = [
        ...new Set(
          listAbsensi
            .filter((a) => a.type === 'masuk')
            .map((a) => new Date(a.createdAt).toLocaleDateString('en-CA')),
        ),
      ].filter((dateStr) => new Date(dateStr).getDay() !== 0);

      const mappedKaryawan = listKaryawan.map((user) => {
        const userAbsen = listAbsensi.filter(
          (abs) => abs.user?._id === user._id && abs.type === 'masuk',
        );
        const totalMenit = userAbsen.reduce((sum, current) => sum + (current.lateMinutes || 0), 0);
        const userDates = userAbsen.map((a) => new Date(a.createdAt).toLocaleDateString('en-CA'));
        const alphaCount = masterWorkingDates.filter((date) => !userDates.includes(date)).length;

        return {
          ...user,
          totalLateMinutes: totalMenit,
          calculatedAlpha: alphaCount,
          workingDaysInMonth: masterWorkingDates.length,
        };
      });

      setKaryawan(mappedKaryawan);
    } catch (err) {
      console.error('Gagal load data gajian:', err);
    } finally {
      setLoading(false);
    }
  }, [periode]);

  useEffect(() => {
    fetchKaryawanDanDataAbsen();
  }, [fetchKaryawanDanDataAbsen]);

  const openManageModal = (user) => {
    setSelectedUser(user);
    setFormData({
      basicSalary: user.basicSalary || 0,
      bonus: 0,
      persenBPJS: 4,
      totalMenitTelat: user.totalLateMinutes || 0,
      hargaPerMenit: 1000,
      jumlahAlpha: user.calculatedAlpha,
      catatan: '',
    });
    setShowEditModal(true);
  };

  const calculateTHP = () => {
    const { basicSalary, bonus, totalMenitTelat, hargaPerMenit, persenBPJS, jumlahAlpha } =
      formData;
    const nominalDenda = Number(totalMenitTelat) * Number(hargaPerMenit);
    return (
      Number(basicSalary) +
      Number(bonus) -
      getNominalBPJS(persenBPJS, basicSalary) -
      nominalDenda -
      getNominalAlpha(jumlahAlpha, basicSalary)
    );
  };

  const handleProcessAndSave = async () => {
    try {
      setLoading(true);
      const nominalDendaFinal = Number(formData.totalMenitTelat) * Number(formData.hargaPerMenit);
      const finalAlphaNominal = getNominalAlpha(formData.jumlahAlpha, formData.basicSalary);
      const finalBPJSNominal = getNominalBPJS(formData.persenBPJS, formData.basicSalary);

      const resProses = await prosesPayrollApi(selectedUser._id, periode);
      const payrollId = resProses.data.data._id;

      await updatePayrollApi(payrollId, {
        ...formData,
        potonganTelat: nominalDendaFinal,
        potonganAlpha: finalAlphaNominal,
        potonganBPJS: finalBPJSNominal,
        status: 'Paid',
      });

      setShowEditModal(false);
      fetchKaryawanDanDataAbsen();
    } catch (err) {
      alert('Gagal simpan payroll, Bre!');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = karyawan.map((u) => {
      const dendaTelat = u.totalLateMinutes * 1000;
      const dendaAlpha = getNominalAlpha(u.calculatedAlpha, u.basicSalary);
      const potonganBPJS = getNominalBPJS(4, u.basicSalary);
      const thp = u.basicSalary - dendaTelat - dendaAlpha - potonganBPJS;

      return {
        'Nama Karyawan': u.name,
        Divisi: divisiToUppercase(u.role),
        Periode: periode,
        'Gaji Pokok': u.basicSalary,
        'Total Telat (Min)': u.totalLateMinutes,
        'Denda Telat': dendaTelat,
        'Jumlah Alpha': u.calculatedAlpha,
        'Denda Alpha': dendaAlpha,
        'Potongan BPJS': potonganBPJS,
        THP: thp,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payroll');
    XLSX.writeFile(workbook, `Payroll_Mapan_${periode}.xlsx`);
  };

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

  return (
    <>
      <Helmet>
        <title>Payroll | Mapan Admin</title>
      </Helmet>

      <div className="karyawan-container">
        <div className="action-bar">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Cari Nama..."
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
                background: 'transparent',
                outline: 'none',
                fontWeight: '600',
                cursor: 'pointer',
                color: 'var(--primary)',
              }}
            >
              <option style={{ color: 'var(--primary)' }} value="All">
                Semua Divisi
              </option>
              <option style={{ color: 'var(--primary)' }} value="cleaning_service">
                {divisiToUppercase('cleaning_service')}
              </option>
              <option style={{ color: 'var(--primary)' }} value="customer_service">
                {divisiToUppercase('customer_service')}
              </option>
              <option style={{ color: 'var(--primary)' }} value="gardener">
                {divisiToUppercase('gardener')}
              </option>
              <option style={{ color: 'var(--primary)' }} value="security">
                {divisiToUppercase('security')}
              </option>
              <option style={{ color: 'var(--primary)' }} value="karyawan">
                STAF LAIN
              </option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', color: 'var(--primary)' }}>
            <div className="period-picker">
              <Calendar size={18} color="var(--primary)" />
              <input
                style={{ color: 'var(--primary)' }}
                type="month"
                value={periode}
                onChange={(e) => setPeriode(e.target.value)}
              />
            </div>
            <button className="btn-export" onClick={handleExportExcel}>
              <FileSpreadsheet size={16} />
              <span>Export</span>
            </button>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="karyawan-table">
            <thead>
              <tr>
                <th>Karyawan</th>
                <th>Divisi</th>
                <th>Gaji Pokok</th>
                <th>Total Telat</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {karyawan
                .filter((u) => {
                  const matchSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchDivisi = divisi === 'All' ? true : u.role === divisi;
                  return matchSearch && matchDivisi;
                })
                .map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">{user.name.charAt(0)}</div>
                        <div className="user-name">{user.name}</div>
                      </div>
                    </td>
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
                    <td data-label="Gaji Pokok">
                      <strong style={{ color: '#10b981' }}>{formatRupiah(user.basicSalary)}</strong>
                    </td>
                    <td data-label="Total Telat">
                      <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
                        {user.totalLateMinutes} Mnt
                      </span>
                    </td>
                    <td data-label="Status">
                      <span
                        className={`status-pill ${user.calculatedAlpha === 0 ? 'active' : 'pending'}`}
                      >
                        {user.calculatedAlpha === 0 ? 'Full' : `${user.calculatedAlpha} Alpha`}
                      </span>
                    </td>
                    <td data-label="Aksi">
                      <button className="btn-primary" onClick={() => openManageModal(user)}>
                        <Calculator size={16} /> <span>Kelola</span>
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {showEditModal && selectedUser && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>💰 Kelola Gaji: {selectedUser.name}</h3>
                <button className="btn-close" onClick={() => setShowEditModal(false)}>
                  ×
                </button>
              </div>
              <div className="content-body">
                <div className="input-group" style={{ marginBottom: '15px' }}>
                  <label>Gaji Pokok (Rp)</label>
                  <input
                    type="number"
                    value={formData.basicSalary}
                    onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })}
                  />
                </div>

                <div
                  className="info-grid"
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}
                >
                  <div className="input-group">
                    <label>Bonus (Rp)</label>
                    <input
                      type="number"
                      value={formData.bonus}
                      onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label style={{ color: '#ef4444' }}>BPJS (%)</label>
                    <input
                      type="number"
                      value={formData.persenBPJS}
                      onChange={(e) => setFormData({ ...formData, persenBPJS: e.target.value })}
                    />
                    <small>
                      = Rp{' '}
                      {getNominalBPJS(formData.persenBPJS, formData.basicSalary).toLocaleString(
                        'id-ID',
                      )}
                    </small>
                  </div>
                </div>

                <div
                  className="info-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '15px',
                    marginTop: '10px',
                  }}
                >
                  <div className="input-group">
                    <label>Total Telat (Menit)</label>
                    <input
                      type="number"
                      value={formData.totalMenitTelat}
                      onChange={(e) =>
                        setFormData({ ...formData, totalMenitTelat: e.target.value })
                      }
                    />
                    <small style={{ color: '#ef4444' }}>
                      Denda: Rp{' '}
                      {(formData.totalMenitTelat * formData.hargaPerMenit).toLocaleString('id-ID')}
                    </small>
                  </div>
                  <div className="input-group">
                    <label>Alpha (Hari)</label>
                    <input
                      type="number"
                      value={formData.jumlahAlpha}
                      onChange={(e) => setFormData({ ...formData, jumlahAlpha: e.target.value })}
                    />
                    <small>
                      = Rp{' '}
                      {getNominalAlpha(formData.jumlahAlpha, formData.basicSalary).toLocaleString(
                        'id-ID',
                      )}
                    </small>
                  </div>
                </div>

                <div className="input-group" style={{ marginTop: '10px' }}>
                  <label>Catatan</label>
                  <textarea
                    value={formData.catatan}
                    onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                    style={{
                      height: '60px',
                      resize: 'none',
                      width: '100%',
                      padding: '8px',
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                    }}
                  />
                </div>

                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    padding: '15px',
                    borderRadius: '12px',
                    border: '1px dashed #10b981',
                    margin: '20px 0',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontWeight: '600' }}>Take Home Pay:</span>
                    <strong style={{ fontSize: '20px', color: '#10b981' }}>
                      Rp {calculateTHP().toLocaleString('id-ID')}
                    </strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="btn-danger"
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                    //   border: '1px solid #ddd',
                    //   background: '#fff',
                    }}
                    onClick={() => setShowEditModal(false)}
                  >
                    Batal
                  </button>
                  <button
                    className="btn-primary"
                    style={{
                      flex: 2,
                      justifyContent: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                    onClick={handleProcessAndSave}
                    disabled={loading}
                  >
                    {loading ? (
                      'Processing...'
                    ) : (
                      <>
                        <Save size={18} /> Simpan & Bayar
                      </>
                    )}
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

export default Payroll;
