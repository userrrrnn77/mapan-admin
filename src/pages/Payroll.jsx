import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Calculator,
  CheckCircle,
  Calendar,
  Save,
  Clock,
  FileSpreadsheet,
} from 'lucide-react';
import { getPayrollListApi, prosesPayrollApi, getAbsebsiApi, updatePayrollApi } from '../api';
import { Helmet } from 'react-helmet-async';
import * as XLSX from 'xlsx';

const Payroll = () => {
  const [karyawan, setKaryawan] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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

      // SYARAT CLOP: Harus sama persis dengan Backend (Tanggal 1 s/d Akhir Bulan)
      //   const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      // Helper string YYYY-MM-DD yang benar
      const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
      const endStr = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

      //   console.log(`📅 Menarik Data Full Bulan ${periode}: ${startStr} s/d ${endStr}`);

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
      setShowSlip(true);
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
        Periode: periode,
        'Gaji Pokok': u.basicSalary,
        'Total Telat (Min)': u.totalLateMinutes,
        'Denda Telat': dendaTelat,
        'Jumlah Alpha': u.calculatedAlpha,
        'Denda Alpha': dendaAlpha,
        'Potongan BPJS': potonganBPJS,
        THP: thp,
        Status: u.calculatedAlpha === 0 ? 'Full Masuk' : 'Ada Bolos',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payroll');
    XLSX.writeFile(workbook, `Payroll_Mapan_${periode}.xlsx`);
  };

  return (
    <>
      <Helmet>
        <title>Payroll | Mapan Admin</title>
      </Helmet>

      <div className="karyawan-container">
        {/* --- HEADER --- */}
        <div className="action-bar">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Cari..."
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="custom-input-group">
            <button className="btn-export" onClick={handleExportExcel} title="Export ke Excel">
              <FileSpreadsheet size={16} />
              <span>Export Excel</span>
            </button>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div className="period-picker">
              <Calendar size={18} color="var(--primary)" />
              <input type="month" value={periode} onChange={(e) => setPeriode(e.target.value)} />
            </div>
          </div>
        </div>

        {/* --- TABEL UTAMA --- */}
        <div className="table-wrapper">
          <table className="karyawan-table">
            <thead>
              <tr>
                <th>Karyawan</th>
                <th>Gaji Pokok</th>
                <th>Total Telat</th>
                <th>Hari Kerja</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {karyawan
                .filter((u) => u.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((user) => (
                  <tr key={user._id}>
                    {/* data-label kosong biar avatar ditengah sesuai CSS lu */}
                    <td data-label="">
                      <div className="user-info">
                        <div className="user-avatar">{user.name.charAt(0)}</div>
                        <div className="user-name">{user.name}</div>
                      </div>
                    </td>

                    <td data-label="Gaji Pokok">
                      <strong style={{ color: '#10b981' }}>
                        Rp {user.basicSalary?.toLocaleString('id-ID')}
                      </strong>
                    </td>

                    {/* INI KUNCINYA BRE, HARUS ADA data-label="Total Telat" */}
                    <td data-label="Total Telat">
                      <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
                        {user.totalLateMinutes} Menit
                      </span>
                    </td>

                    <td data-label="Hari Kerja">{user.workingDaysInMonth} Hari</td>

                    <td data-label="Status">
                      <span
                        className={`status-pill ${user.calculatedAlpha === 0 ? 'active' : 'pending'}`}
                      >
                        {user.calculatedAlpha === 0
                          ? 'Full Masuk'
                          : `${user.calculatedAlpha} Bolos`}
                      </span>
                    </td>

                    <td data-label="Aksi">
                      <button className="btn-primary" onClick={() => openManageModal(user)}>
                        <Calculator size={16} /> <span>Kelola Gaji</span>
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* --- MODAL KELOLA GAJI --- */}
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
                <div className="input-group" style={{ marginBottom: 15 }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number"
                        value={formData.totalMenitTelat}
                        onChange={(e) =>
                          setFormData({ ...formData, totalMenitTelat: e.target.value })
                        }
                        style={{ flex: 1 }}
                      />
                      <span style={{ fontSize: '12px' }}>Mnt</span>
                    </div>
                    <small style={{ color: '#ef4444', fontWeight: 'bold' }}>
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
                    style={{ height: '60px', resize: 'none' }}
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
                    <span style={{ fontWeight: '600', fontSize: '12px' }}>Take Home Pay:</span>
                    <strong style={{ fontSize: '18px', color: '#10b981' }}>
                      Rp {calculateTHP().toLocaleString('id-ID')}
                    </strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="logout-icon-btn-payroll"
                    style={{ flex: 1 }}
                    onClick={() => setShowEditModal(false)}
                  >
                    Batal
                  </button>
                  <button
                    className="btn-primary"
                    style={{ flex: 2, justifyContent: 'center' }}
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
