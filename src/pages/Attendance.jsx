import React, { useState, useEffect, useCallback } from 'react';
import { getAbsebsiApi } from '../api';
import {
  Search,
  RefreshCw,
  MapPin,
  Clock,
  Calendar as CalendarIcon,
  ArrowRight,
  FileSpreadsheet,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Helmet } from 'react-helmet-async';

const Attendance = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null); // Data buat modal detail
  const [showPhotoZoom, setShowPhotoZoom] = useState(false); // Buat zoom foto
  const [searchTerm, setSearchTerm] = useState(''); // Buat filter di dalem dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // FIX: Ambil tanggal hari ini sesuai local timezone (Anti-kemarin Club)
  const getLocalToday = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now - offset).toISOString().split('T')[0];
  };

  const today = getLocalToday();
  const firstDay = '2024-01-01';

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(today);
  const [phone, setPhone] = useState('');

  const fetchAttendance = useCallback(async () => {
    const rawToken = localStorage.getItem('token');
    if (!rawToken || rawToken === 'null') return;

    setLoading(true);
    try {
      const res = await getAbsebsiApi(startDate, endDate, phone);
      setData(res.data.allAttendance || res.data.data || []);
    } catch (err) {
      console.error('ERROR:', err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, phone]);

  const uniqueUsers = Array.from(new Set(data.map((item) => item.user?.phone))) // Pake phone sbg key unik
    .map((phone) => {
      return data.find((item) => item.user?.phone === phone)?.user;
    })
    .filter(Boolean); // Buang yang undefined

  // 2. Filter list user buat tampilan di dropdown (berdasarkan ketikan search)
  const filteredUsers = uniqueUsers.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const exportToExcel = () => {
    if (data.length === 0) {
      alert('Kagak ada datanya Bre, apa yang mau di-export?');
      return;
    }

    // --- 1. DATA SHEET UTAMA (DETAIL) ---
    const excelData = data.map((item, index) => ({
      No: index + 1,
      'Nama Karyawan': item.user?.name || 'N/A',
      Tanggal: new Date(item.createdAt).toLocaleDateString('id-ID'),
      Jam: new Date(item.createdAt).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      Tipe: item.type?.toUpperCase(),
      'Terlambat (Menit)': item.lateMinutes || 0,
      'Penalty (IDR)': item.penalty || 0,
      Lokasi: item.workLocation === '69809101f786b25b5149e3d6' ? 'FEB Pleburan' : 'FEB Tembalang',
    }));

    const totalPenalty = data.reduce((sum, item) => sum + (item.penalty || 0), 0);
    const totalLate = data.reduce((sum, item) => sum + (item.lateMinutes || 0), 0);

    excelData.push({});
    excelData.push({
      No: 'TOTAL',
      'Nama Karyawan': `Total ${data.length} Data`,
      'Terlambat (Menit)': totalLate,
      'Penalty (IDR)': totalPenalty,
    });

    // --- 2. LOGIC REKAP (HADIR, SAKIT, ALPHA) ---
    const getDatesInRange = (start, end) => {
      const dates = [];
      let curr = new Date(start);
      const last = new Date(end);
      while (curr <= last) {
        if (curr.getDay() !== 0) dates.push(curr.toISOString().split('T')[0]);
        curr.setDate(curr.getDate() + 1);
      }
      return dates;
    };

    const workingDays = getDatesInRange(startDate, endDate);

    const rekapData = uniqueUsers.map((user, idx) => {
      const userAbsen = data.filter((a) => a.user?.phone === user.phone);
      let hadir = 0;
      let sakit = 0;
      let alpha = 0;

      workingDays.forEach((day) => {
        const recordsOnDay = userAbsen.find(
          (a) => new Date(a.createdAt).toISOString().split('T')[0] === day,
        );

        if (!recordsOnDay) {
          alpha++;
        } else if (recordsOnDay.type === 'sakit') {
          sakit++;
        } else if (recordsOnDay.type === 'masuk') {
          hadir++;
        }
      });

      return {
        No: idx + 1,
        'Nama Karyawan': user.name,
        Hadir: hadir,
        'Sakit/Izin': sakit,
        Alpha: alpha,
        'Total Penalty': userAbsen.reduce((sum, item) => sum + (item.penalty || 0), 0),
      };
    });

    // --- 3. PROSES PEMBUATAN WORKBOOK (2 SHEETS) ---
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Detail
    const wsDetail = XLSX.utils.json_to_sheet(excelData);
    wsDetail['!cols'] = [
      { wch: 5 },
      { wch: 25 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(workbook, wsDetail, 'Laporan Detail');

    // Sheet 2: Rekap
    const wsRekap = XLSX.utils.json_to_sheet(rekapData);
    wsRekap['!cols'] = [
      { wch: 5 },
      { wch: 25 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(workbook, wsRekap, 'Rekap Absensi');

    // 4. Download
    const fileName = `Laporan_Absensi_Mapan_${startDate}_to_${endDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <>
      {/* Absen bre */}
      {/* MODAL DETAIL ABSENSI */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-content detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detail Absensi</h3>
              <button className="btn-close" onClick={() => setSelectedItem(null)}>
                &times;
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-grid">
                {/* Bagian Foto */}
                <div className="photo-section">
                  <label>Bukti Foto</label>
                  <div className="attendance-photo-wrapper" onClick={() => setShowPhotoZoom(true)}>
                    <img
                      src={
                        selectedItem.photo || 'https://via.placeholder.com/300x400?text=No+Photo'
                      }
                      alt="Bukti Absen"
                    />
                    <div className="photo-overlay">Klik untuk Zoom</div>
                  </div>
                </div>

                {/* Bagian Info */}
                <div className="info-section">
                  <div className="info-card">
                    <label>Lokasi Presensi</label>
                    <p className="loc-text">
                      <MapPin size={14} />{' '}
                      {selectedItem.workLocation?.name || 'Lokasi Tidak Diketahui'}
                    </p>
                    <small className="coords">
                      {/* Sesuaikan dengan object location.lat di DB lu */}
                      {selectedItem.location?.lat}, {selectedItem.location?.lng}
                    </small>
                  </div>
                  <div className="info-row">
                    <div className="info-card">
                      <label>Tipe</label>
                      <span className={`badge-type ${selectedItem.type}`}>
                        {selectedItem.type?.toUpperCase()}
                      </span>
                    </div>
                    <div className="info-card">
                      <label>Waktu</label>
                      <p>{new Date(selectedItem.createdAt).toLocaleTimeString('id-ID')} WIB</p>
                    </div>
                  </div>
                  <div className="info-card">
                    <label>Lokasi Presensi</label>
                    <p className="loc-text">
                      <MapPin size={14} /> {selectedItem.workLocation?.name || 'FEB Pleburan'}
                    </p>
                    <small className="coords">
                      {selectedItem.latitude}, {selectedItem.longitude}
                    </small>
                  </div>
                  <div className="info-card">
                    <label>Status Keterlambatan</label>
                    <p>
                      {selectedItem.lateMinutes > 0
                        ? `${selectedItem.lateMinutes} Menit`
                        : 'Tepat Waktu'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ZOOM FOTO (LIGHTBOX) */}
      {showPhotoZoom && (
        <div className="photo-zoom-overlay" onClick={() => setShowPhotoZoom(false)}>
          <div className="zoom-container">
            <img src={selectedItem?.image} alt="Zoom" />
            <p>Klik di mana saja untuk tutup</p>
          </div>
        </div>
      )}
      <Helmet title="Absensi Karyawan" meta={{ name: 'description' }}>
        <title>Absensi Karyawan</title>
        <meta name="description" content="Daftar Absensi Karyawan" />
      </Helmet>
      <div className="attendance-container">
        {/* 1. Header & Filter Area */}
        <div className="attendance-header-card shadow-sm">
          <div className="filter-group">
            <div className="date-range-wrapper">
              <div className="custom-input-group">
                <label>Mulai Dari</label>
                <div className="input-with-icon calendar-box">
                  <CalendarIcon size={16} />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
              </div>

              <ArrowRight size={16} className="range-arrow" color="var(--text-muted)" />

              <div className="custom-input-group">
                <label>Sampai</label>
                <div className="input-with-icon calendar-box">
                  <CalendarIcon size={16} />
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="custom-input-group user-filter-container">
              <label>Filter Karyawan</label>
              <div className={`searchable-select ${isDropdownOpen ? 'active' : ''}`}>
                {/* Tombol Utama / Display yang dipilih */}
                <div className="select-display" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                  <Search size={14} />
                  <span>
                    {phone ? uniqueUsers.find((u) => u.phone === phone)?.name : 'Semua Karyawan'}
                  </span>
                </div>

                {/* Panel Dropdown yang muncul pas diklik */}
                {isDropdownOpen && (
                  <div className="select-dropdown-panel shadow-lg">
                    <div className="search-box-wrapper">
                      <input
                        type="text"
                        placeholder="Cari nama..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <ul className="user-list-options">
                      <li
                        onClick={() => {
                          setPhone('');
                          setIsDropdownOpen(false);
                          setSearchTerm('');
                        }}
                      >
                        Semua Karyawan
                      </li>
                      {filteredUsers.map((u) => (
                        <li
                          key={u._id}
                          onClick={() => {
                            setPhone(u.phone); // Pake phone sesuai kebutuhan API lu
                            setIsDropdownOpen(false);
                            setSearchTerm('');
                          }}
                        >
                          {u.name}
                        </li>
                      ))}
                      {filteredUsers.length === 0 && (
                        <li className="no-result">Karyawan gak ketemu...</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="custom-input-group">
              <label htmlFor="">Export</label>
              <button className="btn-export" onClick={exportToExcel} title="Export ke Excel">
                <FileSpreadsheet size={16} />
                <span>Export Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Table Area (Gue skip bagian dalem table-nya biar ga kepanjangan, isinya tetep sama kayak kemaren) */}
        <div className="table-card">
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Karyawan</th>
                  <th>Tanggal & Waktu</th>
                  <th>Tipe</th>
                  <th>Status</th>
                  <th>Penalty</th>
                  <th>Lokasi Kantor</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr
                    key={item._id}
                    onClick={() => {
                      setSelectedItem(item);
                      console.log(selectedItem.workLocation?.name);
                    }}
                    style={{ cursor: 'pointer' }}
                    className="clickable-row"
                  >
                    <td data-label="Karyawan" className="user-td">
                      <div className="avatar-small">{item.user?.name?.charAt(0) || 'T'}</div>
                      <span>{item.user?.name || 'Testing Pleburan'}</span>
                    </td>
                    <td data-label="Waktu">
                      <div className="td-datetime">
                        <span className="td-date">
                          {new Date(item.createdAt).toLocaleDateString('id-ID')}
                        </span>
                        <span className="td-time">
                          {new Date(item.createdAt).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </td>
                    <td data-label="Tipe">
                      <span className={`badge-type ${item.type}`}>{item.type?.toUpperCase()}</span>
                    </td>
                    <td data-label="Status">
                      {item.lateMinutes > 0 ? (
                        <span className="status-late">
                          <Clock size={12} /> {item.lateMinutes}m
                        </span>
                      ) : (
                        <span className="status-ontime">Tepat Waktu</span>
                      )}
                    </td>
                    <td data-label="Penalty" className="penalty-cell">
                      {item.penalty > 0 ? `Rp ${item.penalty.toLocaleString()}` : '-'}
                    </td>
                    <td data-label="Lokasi">
                      <div className="location-tag">
                        <MapPin size={12} />
                        {item.workLocation === '69809101f786b25b5149e3d6'
                          ? 'FEB Pleburan'
                          : 'FEB Tembalang'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="table-footer">
                <tr>
                  <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                    TOTAL:
                  </td>
                  <td>{data.length} Absensi</td>
                  <td
                    className="penalty-cell"
                    style={{ fontWeight: 'bold', color: 'var(--primary)' }}
                  >
                    Rp {data.reduce((sum, item) => sum + (item.penalty || 0), 0).toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default Attendance;
