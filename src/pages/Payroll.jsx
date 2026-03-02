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
  Zap,
} from 'lucide-react';
import {
  getPayrollListApi,
  prosesPayrollApi,
  getAbsebsiApi,
  updatePayrollApi,
  prosesAllPayrollApi,
} from '../api';
import { Helmet } from 'react-helmet-async';
import * as XLSX from 'xlsx';
import { formatRupiah } from '../utils/formatCurrency';
import toast from 'react-hot-toast';

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
    payrollId: null, // PENTING: Pengunci buat update
    basicSalary: 0,
    bonus: 0,
    persenBPJS: 4,
    totalMenitTelat: 0,
    hargaPerMenit: 500, // Sesuai diskusi backend
    jumlahAlpha: 0,
    catatan: '',
  });

  const [showSlip, setShowSlip] = useState(false);

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
      payrollId: null, // Reset ID tiap buka modal
      basicSalary: user.basicSalary || 0,
      bonus: 0,
      persenBPJS: 4,
      totalMenitTelat: user.totalLateMinutes || 0,
      hargaPerMenit: 500,
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

  // LOGIC: STEP 1 - Tarik data dari Backend (Periode otomatis ditentukan Backend)
  const handleInitialProcess = async () => {
    try {
      setLoading(true);
      // Cuma kirim userId, periode dihapus
      const res = await prosesPayrollApi(selectedUser._id);
      const dataBackend = res.data.data;

      setFormData((prev) => ({
        ...prev,
        payrollId: dataBackend._id,
        // OTOMATIS ISI DARI HASIL HITUNGAN BACKEND
        totalMenitTelat: dataBackend.totalMenitTelat,
        jumlahAlpha: dataBackend.jumlahAlpha,
      }));

      alert('Data absen ditarik! Backend otomatis menghitung periode bulan lalu.');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Gagal proses, Bre!';
      alert(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  // LOGIC BARU: STEP 2 - Update & Bayar
  const handleFinalUpdate = async () => {
    if (!formData.payrollId) return alert('Kalkulasi dulu datanya, Bre!');

    try {
      setLoading(true);
      const nominalDendaFinal = Number(formData.totalMenitTelat) * Number(formData.hargaPerMenit);
      const finalAlphaNominal = getNominalAlpha(formData.jumlahAlpha, formData.basicSalary);
      const finalBPJSNominal = getNominalBPJS(formData.persenBPJS, formData.basicSalary);

      await updatePayrollApi(formData.payrollId, {
        ...formData,
        potonganTelat: nominalDendaFinal,
        potonganAlpha: finalAlphaNominal,
        potonganBPJS: finalBPJSNominal,
        status: 'Paid',
      });

      alert('Gaji Berhasil Dibayar!');
      setShowEditModal(false);
      fetchKaryawanDanDataAbsen();
    } catch (err) {
      alert(`Gagal Finalisasi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const [bulkLoading, setBulkLoading] = useState(false);

  // LOGIC: PROSES SEMUA KARYAWAN (SATSET)
  const handleProcessAll = async () => {
    if (!window.confirm('Yakin mau proses gaji semua karyawan untuk bulan lalu, Bre?')) return;

    setBulkLoading(true);

    try {
      const res = await prosesAllPayrollApi();

      if (res.data.success) {
        // 1. Kasih tau sukses dulu
        toast.success(res.data.message);

        // 2. Refresh data.
        // TIPS: Jangan kasih alert/toast error di dalam fetchPayrollList
        // kalau tujuannya cuma buat background refresh.
        await fetchKaryawanDanDataAbsen();
      }
    } catch (err) {
      // 3. Masuk ke sini CUMA kalau request prosesAll-nya yang gagal
      const msg = err.response?.data?.message || 'Gagal bulk process, Bre!';
      toast.error(`Error: ${msg}`);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = karyawan.map((u) => {
      const dendaTelat = u.totalLateMinutes * 500;
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
    XLSUtils.book_append_sheet(workbook, worksheet, 'Payroll');
    XLSX.writeFile(workbook, `Payroll_Mapan_${periode}.xlsx`);
  };

  const getRoleStyle = (role) => {
    switch (role) {
      case 'cleaning_service':
        return { bg: '#e0f2fe', text: '#0369a1' };
      case 'customer_service':
        return { bg: '#dcfce7', text: '#15803d' };
      case 'gardener':
        return { bg: '#fef9c3', text: '#a16207' };
      case 'security':
        return { bg: '#fee2e2', text: '#b91c1c' };
      default:
        return { bg: '#f3f4f6', text: '#374151' };
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
                background: '',
                outline: 'none',
                fontWeight: '600',
                cursor: 'pointer',
                color: 'var(--primary)',
              }}
            >
              <option
                style={{
                  color: 'var(--primary)',
                  background: 'var(--bg-main)',
                  border: 'none',
                  outline: 'none',
                }}
                value="All"
              >
                Semua Divisi
              </option>
              <option
                style={{
                  color: 'var(--primary)',
                  background: 'var(--bg-main)',
                  border: 'none',
                  outline: 'none',
                }}
                value="cleaning_service"
              >
                {divisiToUppercase('cleaning_service')}
              </option>
              <option
                style={{
                  color: 'var(--primary)',
                  background: 'var(--bg-main)',
                  border: 'none',
                  outline: 'none',
                }}
                value="customer_service"
              >
                {divisiToUppercase('customer_service')}
              </option>
              <option
                style={{
                  color: 'var(--primary)',
                  background: 'var(--bg-main)',
                  border: 'none',
                  outline: 'none',
                }}
                value="gardener"
              >
                {divisiToUppercase('gardener')}
              </option>
              <option
                style={{
                  color: 'var(--primary)',
                  background: 'var(--bg-main)',
                  border: 'none',
                  outline: 'none',
                }}
                value="security"
              >
                {divisiToUppercase('security')}
              </option>
              <option
                style={{
                  color: 'var(--primary)',
                  background: 'var(--bg-main)',
                  border: 'none',
                  outline: 'none',
                }}
                value="karyawan"
              >
                STAF LAIN
              </option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', color: 'var(--primary)' }}>
            <button className="btn-process-all" onClick={handleProcessAll} disabled={bulkLoading}>
              <Zap size={16} fill={bulkLoading ? 'none' : 'currentColor'} />
              <span>{bulkLoading ? 'Lagi Ngitung...' : 'Proses Semua Gaji'}</span>
            </button>
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
                <th>Gaji Bersih (THP)</th>
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
                .map((user) => {
                  // LOGIC HITUNG CEPAT BUAT TAMPILAN TABEL
                  const nominalAlpha = getNominalAlpha(user.calculatedAlpha, user.basicSalary);
                  const nominalTelat = (user.totalLateMinutes || 0) * 500;
                  const nominalBPJS = getNominalBPJS(4, user.basicSalary); // Asumsi standar 4%
                  const thpPreview =
                    Number(user.basicSalary) - nominalAlpha - nominalTelat - nominalBPJS;

                  return (
                    <tr key={user._id}>
                      <td>
                        <div className="user-info">
                          <div className="user-avatar">
                            {user.profilePhoto &&
                            typeof user.profilePhoto === 'string' &&
                            user.profilePhoto.length > 10 ? (
                              <img
                                src={user.profilePhoto} // Langsung hantam URL-nya
                                alt={user.name}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                  display: 'block', // Biar gak ada gap aneh
                                }}
                                // Kalau URL-nya terpotong atau 404, dia otomatis pindah ke inisial nama
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.parentElement.innerHTML = user.name
                                    .charAt(0)
                                    .toUpperCase();
                                }}
                              />
                            ) : (
                              user.name?.charAt(0).toUpperCase() || '?'
                            )}
                          </div>
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
                        <strong style={{ color: '#10b981' }}>
                          {formatRupiah(user.basicSalary)}
                        </strong>
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

                      {/* TAMPILAN TAKE HOME PAY (THP) */}
                      <td data-label="Gaji Bersih">
                        <div
                          style={{ display: 'flex', flexDirection: 'column', marginLeft: '10%' }}
                        >
                          <strong style={{ color: 'var(--primary)', fontSize: '14px' }}>
                            {formatRupiah(thpPreview)}
                          </strong>
                          <small style={{ fontSize: '10px', color: '#64748b' }}>
                            Estimasi bersih
                          </small>
                        </div>
                      </td>

                      <td data-label="Aksi">
                        <button className="btn-primary" onClick={() => openManageModal(user)}>
                          <Calculator size={16} /> <span>Kelola</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
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

                {/* MODIFIKASI TOMBOL CTA */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div
                    className="flexButton"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <button
                      className="btn-primary"
                      style={{
                        backgroundColor: '#f59e0b',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '12px',
                        width: '60%',
                      }}
                      onClick={handleInitialProcess}
                      disabled={loading}
                    >
                      {loading ? (
                        'Processing...'
                      ) : (
                        <>
                          <Calculator size={18} />
                          Kalkulasi Data
                        </>
                      )}
                    </button>

                    <button
                      className="btn-primary"
                      style={{
                        backgroundColor: !formData.payrollId ? '#94a3b8' : '#10b981',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: !formData.payrollId ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        width: '100%',
                      }}
                      onClick={handleFinalUpdate}
                      disabled={loading || !formData.payrollId}
                    >
                      <CheckCircle size={18} />
                      Simpan & Bayar (Paid)
                    </button>
                  </div>

                  <button
                    className="btn-danger"
                    onClick={() => setShowEditModal(false)}
                    style={{ marginTop: '5px' }}
                  >
                    Batal
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
