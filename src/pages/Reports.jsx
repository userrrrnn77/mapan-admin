import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  AlertOctagon,
  ShoppingCart,
  Search,
  Eye,
  Image as ImageIcon,
  X,
  Clock,
  User,
  Maximize2,
  CircleUserRound,
} from 'lucide-react';
import { getSemuaAktivitasApi, getSemuaLaporanApi, getSemuaKebutuhanApi } from '../api';
import { Helmet } from 'react-helmet-async';

const Reports = () => {
  const [dataRaw, setDataRaw] = useState([]);
  const [dataFilter, setDataFilter] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tabAktif, setTabAktif] = useState('laporan');
  const [searchTerm, setSearchTerm] = useState('');

  // State Modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resAct, resRep, resNeed] = await Promise.all([
        getSemuaAktivitasApi(),
        getSemuaLaporanApi(),
        getSemuaKebutuhanApi(),
      ]);

      // Gabungin semua data & kasih tag 'type'
      const gabungan = [
        ...(resAct.data?.data || []).map((i) => ({ ...i, type: 'aktivitas' })),
        ...(resRep.data?.data || []).map((i) => ({ ...i, type: 'laporan' })),
        ...(resNeed.data?.data || []).map((i) => ({ ...i, type: 'kebutuhan' })),
      ];

      // Sortir berdasarkan waktu terbaru
      const sorted = gabungan.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.requestTime);
        const dateB = new Date(b.createdAt || b.requestTime);
        return dateB - dateA;
      });

      setDataRaw(sorted);
    } catch (err) {
      console.error('Gagal tarik data log:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentImgIndex(0);
  }, [selectedImage]);

  useEffect(() => {
    let filtered = dataRaw.filter((item) => item.type === tabAktif);
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (Array.isArray(item.items) &&
            item.items.join(' ').toLowerCase().includes(searchTerm.toLowerCase())),
      );
    }
    setDataFilter(filtered);
  }, [tabAktif, dataRaw, searchTerm]);

  const getIcon = (type) => {
    switch (type) {
      case 'laporan':
        return <AlertOctagon size={18} color="#ef4444" />;
      case 'kebutuhan':
        return <ShoppingCart size={18} color="var(--primary)" />;
      default:
        return <ClipboardList size={18} color="#10b981" />;
    }
  };

  const openImageZoom = (img) => {
    setSelectedImage(img);
    setShowImageModal(true);
  };

  return (
    <>
      {/* reports bre */}
      <Helmet>
        <title>Reports</title>
        <meta name="description" content="Laporan Karyawan" />
      </Helmet>
      <div className="content-body">
        {/* Header */}
        <div className="navbar" style={{ marginBottom: '20px' }}>
          <div>
            <div className="breadcrumb">Monitoring Lapangan</div>
            <h2 className="page-title">Log Aktivitas & Laporan</h2>
          </div>
          <div className="search-box" style={{ maxWidth: '300px' }}>
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Cari user atau barang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          {['aktivitas', 'laporan', 'kebutuhan'].map((t) => (
            <button
              key={t}
              onClick={() => setTabAktif(t)}
              className="btn-primary"
              style={{
                background: tabAktif === t ? 'var(--primary)' : 'var(--bg-card)',
                color: tabAktif === t ? 'white' : 'var(--text-main)',
                border: '1px solid var(--border-color)',
                textTransform: 'capitalize',
                padding: '10px 25px',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="table-wrapper">
          <table className="karyawan-table">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>User</th>
                <th>Informasi / Barang</th>

                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '50px' }}>
                    Loading data...
                  </td>
                </tr>
              ) : dataFilter.length > 0 ? (
                dataFilter.map((item) => (
                  <tr
                    onClick={() => {
                      setSelectedItem(item);
                      setShowModal(true);
                    }}
                    key={item._id}
                    className="clickable-row"
                  >
                    <td>
                      <div style={{ fontWeight: '600' }}>
                        {new Date(item.createdAt || item.requestTime).toLocaleDateString('id-ID')}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {new Date(item.createdAt || item.requestTime).toLocaleTimeString('id-ID')}{' '}
                        WIB
                      </div>
                    </td>
                    <td>
                      <div className="user-info">
                        <div
                          className="user-avatar"
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            background: 'var(--bg-main)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {item.user?.profilePhoto ? (
                            <img
                              src={item.user.profilePhoto}
                              alt="User"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <CircleUserRound size={20} color="var(--text-muted)" />
                          )}
                        </div>
                        <span style={{ fontWeight: '500' }}>{item.user?.name || 'Karyawan'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {getIcon(item.type)}
                        <span className="truncate" style={{ maxWidth: '250px' }}>
                          {item.type === 'kebutuhan'
                            ? item.items
                                ?.map((it, idx) => `${it} (${item.quantity?.[idx] || '?'})`)
                                .join(', ')
                            : item.description}
                        </span>
                      </div>
                    </td>
                    {/* <td>
                      <span
                        className="loc-badge"
                        style={{ color: item.type === 'laporan' ? '#ef4444' : 'var(--primary)' }}
                      >
                        {item.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </td> */}
                    <td>
                      <button
                        className="nav-icon-btn"
                        onClick={() => {
                          setSelectedItem(item);
                          setShowModal(true);
                        }}
                      >
                        <Eye size={16} style={{ color: 'white' }} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}
                  >
                    Tidak ada data ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- MODAL DETAIL --- */}
        {showModal && selectedItem && (
          <div className="modal-overlay" style={{ zIndex: 1000 }}>
            <div
              className="modal-content"
              style={{ width: '500px', padding: '0', overflow: 'hidden' }}
            >
              {/* Preview Foto Utama */}
              <div
                className="modal-image-header"
                onClick={() =>
                  selectedItem.photos?.[currentImgIndex] &&
                  openImageZoom(selectedItem.photos[currentImgIndex])
                }
                style={{
                  height: '250px',
                  background: '#f0f0f0',
                  position: 'relative',
                  cursor: selectedItem.photos?.[currentImgIndex] ? 'zoom-in' : 'default',
                }}
              >
                {selectedItem.photos && selectedItem.photos.length > 0 ? (
                  <img
                    src={selectedItem.photos[currentImgIndex]}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: '0.3s',
                    }}
                    alt="Bukti"
                  />
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: '#999',
                    }}
                  >
                    <ImageIcon size={40} />
                    <p style={{ fontSize: '12px' }}>Tidak ada lampiran foto</p>
                  </div>
                )}

                {/* Tombol Close Modal di Pojok Gambar */}
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    position: 'absolute',
                    top: '15px',
                    right: '15px',
                    background: 'rgba(0,0,0,0.5)',
                    border: 'none',
                    borderRadius: '50%',
                    color: 'white',
                    padding: '5px',
                    cursor: 'pointer',
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* LIST THUMBNAIL (Kalau foto > 1) */}
              {selectedItem.photos && selectedItem.photos.length > 1 && (
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    padding: '10px 20px',
                    background: 'var(--bg-card)',
                    borderBottom: '1px solid var(--border-color)',
                    overflowX: 'auto',
                  }}
                >
                  {selectedItem.photos.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setCurrentImgIndex(idx)}
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border:
                          currentImgIndex === idx
                            ? '2px solid var(--primary)'
                            : '2px solid transparent',
                        flexShrink: 0,
                        opacity: currentImgIndex === idx ? 1 : 0.6,
                      }}
                    >
                      <img
                        src={img}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        alt={`Thumb ${idx}`}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div style={{ padding: '20px' }}>
                <div style={{ marginBottom: '15px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <h3 style={{ margin: 0 }}>
                      {selectedItem.type === 'kebutuhan' ? 'Rincian Kebutuhan' : 'Detail Laporan'}
                    </h3>
                    <span className="loc-badge" style={{ fontSize: '10px' }}>
                      {selectedItem.type.toUpperCase()} ({selectedItem.photos?.length || 0} Foto)
                    </span>
                  </div>
                  {/* ... Info User & Waktu tetap sama ... */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '10px',
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      marginTop: '5px',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <User size={14} /> {selectedItem.user?.name || 'Karyawan'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} />{' '}
                      {new Date(selectedItem.createdAt || selectedItem.requestTime).toLocaleString(
                        'id-ID',
                      )}
                    </span>
                  </div>
                </div>

                {/* Box Deskripsi / Item Tetap Sama */}
                <div
                  style={{
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '15px',
                  }}
                >
                  {/* ... (Logika render item kebutuhan atau deskripsi) ... */}
                  {selectedItem.type === 'kebutuhan' ? (
                    selectedItem.items?.map((it, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          background: '#111c44',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          marginBottom: '5px',
                        }}
                      >
                        <span>{it}</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                          {selectedItem.quantity?.[idx]}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: '14px', lineHeight: '1.5' }}>
                      {selectedItem.description}
                    </p>
                  )}
                </div>

                <button
                  className="btn-primary"
                  style={{ width: '100%', marginTop: '20px', justifyContent: 'center' }}
                  onClick={() => setShowModal(false)}
                >
                  Tutup Detail
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- LIGHTBOX IMAGE --- */}
        {showImageModal && (
          <div
            className="modal-overlay"
            onClick={() => setShowImageModal(false)}
            style={{ zIndex: 2000, background: 'rgba(0,0,0,0.85)' }}
          >
            <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
              <img
                src={selectedImage}
                style={{ width: 'auto', height: '90dvh', borderRadius: '8px' }}
                alt="Zoom"
              />
              <button
                style={{
                  position: 'absolute',
                  top: '-40px',
                  right: 0,
                  color: 'white',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <X size={30} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Reports;
