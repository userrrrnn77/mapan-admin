import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  AlertOctagon,
  Search,
  Eye,
  Image as ImageIcon,
  X,
  Clock,
  User,
  CircleUserRound,
  FileDown,
} from 'lucide-react';
import { getAllWorkLocationApi, getSemuaAktivitasApi, getSemuaLaporanApi } from '../api';
import { Helmet } from 'react-helmet-async';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from 'docx';
import { saveAs } from 'file-saver';

const Reports = () => {
  const [dataRaw, setDataRaw] = useState([]);
  const [dataFilter, setDataFilter] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tabAktif, setTabAktif] = useState('laporan');
  const [searchTerm, setSearchTerm] = useState('');
  const [getWorkLocation, setGetWorkLocation] = useState([]);

  // State Modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  // Tambahin di barisan state atas
  const [filterDivisi, setFilterDivisi] = useState('');
  const [filterLocation, setFilterLocation] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resAct, resRep] = await Promise.all([getSemuaAktivitasApi(), getSemuaLaporanApi()]);

      // 1. Mapping Aktivitas (Documentation: [{photo, caption}])
      const actData = (resAct.data?.data || []).map((i) => ({
        ...i,
        type: 'aktivitas',
        // Kita ratain biar modal tinggal pake .photos
        photos: i.documentation?.map((doc) => doc.photo) || [],
        // Simpan caption-nya juga biar bisa dipanggil di modal
        captions: i.documentation?.map((doc) => doc.caption) || [],
        displayDescription: i.title || 'Kegiatan Lapangan',
        time: i.activityTime || i.createdAt,
      }));

      // 2. Mapping Laporan (Photos: [String])
      const repData = (resRep.data?.data || []).map((i) => ({
        ...i,
        type: 'laporan',
        displayDescription: i.description,
        time: i.reportTime || i.createdAt,
      }));

      // Gabungin & Sortir Terbaru
      const gabungan = [...actData, ...repData].sort((a, b) => new Date(b.time) - new Date(a.time));

      setDataRaw(gabungan);
    } catch (err) {
      console.error('Gagal tarik data log:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDataLocation = async () => {
    try {
      const res = await getAllWorkLocationApi();
      setGetWorkLocation(res.data.data);
    } catch (error) {
      toast.error('Gagal Ambil Data Master Lokasi');
      console.log(error.message, 'Gagal Ambil Data Master Lokasi');
    }
  };

  useEffect(() => {
    fetchData();
    fetchDataLocation();
  }, []);

  // Logic filter data yang udah digabungin (dataRaw)
  useEffect(() => {
    let filtered = dataRaw.filter((item) => item.type === tabAktif);

    if (filterDivisi) {
      filtered = filtered.filter((item) => item.user?.division === filterDivisi);
    }

    if (filterLocation) {
      filtered = filtered.filter((item) => item.user?.workLocation === filterLocation);
    }

    setDataFilter(filtered);
  }, [tabAktif, dataRaw, filterDivisi, filterLocation]);

  // Reset index gambar tiap ganti item modal
  useEffect(() => {
    setCurrentImgIndex(0);
  }, [showModal, selectedItem]);

  useEffect(() => {
    let filtered = dataRaw.filter((item) => item.type === tabAktif);
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.displayDescription?.toLowerCase().includes(searchLower) ||
          item.user?.name?.toLowerCase().includes(searchLower) ||
          item.address?.toLowerCase().includes(searchLower),
      );
    }
    setDataFilter(filtered);
  }, [tabAktif, dataRaw, searchTerm]);

  const getIcon = (type) => {
    return type === 'laporan' ? (
      <AlertOctagon size={18} color="#ef4444" />
    ) : (
      <ClipboardList size={18} color="#10b981" />
    );
  };

  const openImageZoom = (img) => {
    setSelectedImage(img);
    setShowImageModal(true);
  };

  const handleExportMassal = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPos = 35;

    // Header Laporan
    pdf.setFontSize(16);
    pdf.text('LAPORAN KEGIATAN LENGKAP', pageWidth / 2, 15, { align: 'center' });
    pdf.setFontSize(10);
    pdf.text(
      `Filter: ${filterDivisi || 'Semua'} - ${filterLocation || 'Semua'}`,
      pageWidth / 2,
      22,
      { align: 'center' },
    );
    pdf.line(10, 25, pageWidth - 10, 25);

    for (let i = 0; i < dataFilter.length; i++) {
      const item = dataFilter[i];

      // Cek space halaman (biar gak kepotong)
      if (yPos > 240) {
        pdf.addPage();
        yPos = 20;
      }

      // Judul & Info Kegiatan
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(10);
      pdf.text(`${i + 1}. ${item.displayDescription}`, 10, yPos);
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(8);
      pdf.text(
        `User: ${item.user?.name || 'N/A'} | Tgl: ${new Date(item.time).toLocaleDateString()}`,
        10,
        yPos + 5,
      );

      yPos += 10;

      // LOOPING SEMUA FOTO DALAM SATU KEGIATAN
      let xPos = 10;
      const imgWidth = 45;
      const imgHeight = 35;

      // ... (di dalam loop item, setelah xPos & yPos di-set)

      if (item.photos && item.photos.length > 0) {
        for (let p = 0; p < item.photos.length; p++) {
          // Cek mentok kanan (Width: 45mm + Gap: 5mm)
          if (xPos + 45 > pageWidth - 10) {
            xPos = 10;
            yPos += 45; // Turun lebih banyak karena ada space buat teks
          }

          // Cek mentok bawah (Halaman baru)
          if (yPos > 240) {
            pdf.addPage();
            yPos = 20;
          }

          try {
            // 1. Gambar Fotonya
            const img = await loadImage(item.photos[p]);
            pdf.addImage(img, 'JPEG', xPos, yPos, 45, 35);

            // 2. Tambah Caption (Kalo ada)
            if (item.captions && item.captions[p]) {
              pdf.setFontSize(7);
              pdf.setFont(undefined, 'italic');
              // Kasih limit karakter biar gak nabrak foto sebelah
              const shortCapt = item.captions[p].substring(0, 30);
              pdf.text(shortCapt, xPos, yPos + 39); // Posisi y+39 (4mm di bawah foto)
              pdf.setFont(undefined, 'normal');
            }
          } catch (e) {
            pdf.rect(xPos, yPos, 45, 35);
            pdf.text('Gagal Load', xPos + 2, yPos + 5);
          }

          xPos += 50; // Jarak horizontal ke foto berikutnya
        }
        yPos += 50; // Jarak vertical ke kegiatan berikutnya
      }

      pdf.line(10, yPos - 5, pageWidth - 10, yPos - 5); // Garis pemisah antar kegiatan
      yPos += 5;
    }

    pdf.save(`Laporan_Lengkap_${new Date().getTime()}.pdf`);
  };

  const handleExportWord = async () => {
    const loadingToast = toast.loading('Memproses Word... Tunggu bentar Bre!');

    try {
      const children = [
        new Paragraph({
          alignment: 'center',
          children: [new TextRun({ text: 'LAPORAN KEGIATAN', bold: true, size: 32 })],
        }),
        new Paragraph({ text: '' }),
      ];

      // Pake for...of biar dia nungguin satu-satu (Gak bikin browser pusing)
      for (const [index, item] of dataFilter.entries()) {
        children.push(
          new Paragraph({
            spacing: { before: 200 },
            children: [
              new TextRun({
                text: `${index + 1}. ${item.displayDescription}`,
                bold: true,
                size: 22,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `User: ${item.user?.name || 'N/A'} | ${new Date(item.time).toLocaleString('id-ID')}`,
                size: 18,
                color: '666666',
              }),
            ],
          }),
        );

        if (item.photos && item.photos.length > 0) {
          const rowCells = [];

          for (const photoUrl of item.photos) {
            try {
              // INI KUNCI SAKTINYA: Ambil sebagai Blob
              const response = await fetch(photoUrl);
              if (!response.ok) throw new Error('Fetch gagal');
              const blob = await response.blob();
              const buffer = await blob.arrayBuffer();

              rowCells.push(
                new TableCell({
                  width: { size: 33, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      children: [
                        new ImageRun({
                          data: buffer,
                          transformation: { width: 160, height: 120 },
                        }),
                      ],
                    }),
                  ],
                  borders: {
                    top: { style: BorderStyle.NONE },
                    bottom: { style: BorderStyle.NONE },
                    left: { style: BorderStyle.NONE },
                    right: { style: BorderStyle.NONE },
                  },
                }),
              );
            } catch (imgErr) {
              console.error('Skip foto bermasalah:', imgErr);
            }
          }

          // Bikin Grid (maksimal 3 foto sejajar)
          if (rowCells.length > 0) {
            const rows = [];
            for (let i = 0; i < rowCells.length; i += 3) {
              rows.push(new TableRow({ children: rowCells.slice(i, i + 3) }));
            }
            children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }));
          }
        }

        children.push(
          new Paragraph({
            text: '__________________________________________________',
            color: 'E0E0E0',
          }),
        );
      }

      const doc = new Document({ sections: [{ children }] });
      // Coba ganti Packer.toBuffer jadi Packer.toBlob kalo masih error
      const blobDoc = await Packer.toBlob(doc);
      saveAs(blobDoc, `Laporan_${Date.now()}.docx`);

      toast.success('Word Berhasil! PDF lewat!', { id: loadingToast });
    } catch (error) {
      console.error('Detail Error:', error);
      toast.error('Masih gagal Bre, cek console F12!', { id: loadingToast });
    }
  };

  // Helper buat bypass CORS canvas
  const loadImage = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = reject;
    });
  };

  const toUpperCase = (role) => {
    if (!role) return '';
    return role.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <>
      <Helmet>
        <title>Reports</title>
        <meta name="description" content="Laporan Karyawan" />
      </Helmet>
      <div className="content-body">
        {/* Header */}
        <div className="navbar" style={{ marginBottom: '20px', alignItems: 'center' }}>
          <h2 className="page-title">Log Aktivitas & Laporan</h2>

          <div
            className="filter-container"
            // style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}
          >
            {/* Filter Divisi */}
            <select
              value={filterDivisi}
              onChange={(e) => setFilterDivisi(e.target.value)}
              style={{
                padding: '14px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
              }}
            >
              <option style={{ padding: '10px' }} value="">
                Semua Divisi
              </option>
              {[...new Set(getWorkLocation.map((item) => item.role))].map((roleUnik) => (
                <option key={roleUnik} value={roleUnik}>
                  {toUpperCase(roleUnik)}
                </option>
              ))}
            </select>

            {/* Filter Lokasi */}
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              style={{
                padding: '14px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
              }}
            >
              <option value="">Semua Lokasi</option>
              {getWorkLocation.map((loc) => (
                <option key={loc._id} value={loc.code}>
                  {loc.name}
                </option>
              ))}
            </select>

            {/* Tombol Export Massal */}
            {/* jika tab aktivitas maka ada export kalo tab laporan gada bre */}

            <button
              className="btn-primary"
              onClick={handleExportWord}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}
            >
              <FileDown size={18} /> Export WORD
            </button>
            <button
              className="btn-danger"
              onClick={handleExportMassal}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}
            >
              <FileDown size={18} /> Export PDF
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          {['aktivitas', 'laporan'].map((t) => (
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
                <th>Informasi</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '50px' }}>
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
                        {new Date(item.time).toLocaleDateString('id-ID')}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {new Date(item.time).toLocaleTimeString('id-ID')} WIB
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
                          {item.displayDescription}
                        </span>
                      </div>
                    </td>
                    <td>
                      <button className="nav-icon-btn">
                        <Eye size={16} style={{ color: 'white' }} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="4"
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
              {/* Preview Foto */}
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
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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

              {/* Thumbnails */}
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
                        alt="Thumb"
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
                      {selectedItem.type === 'aktivitas' ? 'Detail Kegiatan' : 'Detail Laporan'}
                    </h3>
                    <span className="loc-badge" style={{ fontSize: '10px' }}>
                      {selectedItem.type.toUpperCase()} ({selectedItem.photos?.length || 0} Foto)
                    </span>
                  </div>
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
                      <Clock size={14} /> {new Date(selectedItem.time).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '15px',
                  }}
                >
                  {selectedItem.type === 'aktivitas' ? (
                    <>
                      <h4 style={{ margin: '0 0 10px 0', color: 'var(--primary)' }}>
                        {selectedItem.title}
                      </h4>
                      <p style={{ fontSize: '14px', margin: '0 0 10px 0', fontWeight: 'bold' }}>
                        Caption Foto:{' '}
                        <span style={{ color: 'var(--text-main)', fontWeight: 'normal' }}>
                          {selectedItem.captions?.[currentImgIndex] || 'Tidak ada keterangan'}
                        </span>
                      </p>
                    </>
                  ) : (
                    <p style={{ fontSize: '14px', lineHeight: '1.5', margin: '0 0 10px 0' }}>
                      {selectedItem.description}
                    </p>
                  )}
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      borderTop: '1px solid var(--border-color)',
                      paddingTop: '10px',
                    }}
                  >
                    <strong>Lokasi:</strong> {selectedItem.address}
                  </div>
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

        {/* --- LIGHTBOX --- */}
        {showImageModal && (
          <div
            className="modal-overlay"
            onClick={() => setShowImageModal(false)}
            style={{ zIndex: 2000, background: 'rgba(0,0,0,0.85)' }}
          >
            <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
              <img
                src={selectedImage}
                style={{ width: 'auto', maxHeight: '90dvh', borderRadius: '8px' }}
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
