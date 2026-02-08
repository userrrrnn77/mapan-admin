    import './styles/dashboard.css';
    import React, { useState, useEffect } from 'react';
    import { getDashboardStatsApi } from '../api';
    import {
    Users,
    AlertOctagon,
    ShoppingCart,
    UserCog,
    ClipboardList,
    CalendarCheck,
    BarChart3,
    Database,
    ClipboardCheck,
    } from 'lucide-react';
    import { useAuth } from '../hooks/useAuth';
    import { useNavigate } from 'react-router-dom';
    import { Helmet } from 'react-helmet-async';

    const Dashboard = () => {
    const { userToken, isLoading } = useAuth();
    const [stats, setStats] = useState({
        totalKaryawan: 0,
        laporanMasalah: 0,
        kebutuhanBaru: 0,
        absensiHariIni: 0, // State baru
    });
    const [laporanTerbaru, setLaporanTerbaru] = useState([]);
    const [localLoading, setLocalLoading] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
        if (isLoading || !userToken) return;
        try {
            const res = await getDashboardStatsApi();
            if (res.data.success) {
            // Sesuaikan dengan struktur res.data.counts dari API lu
            const dataStats = res.data.data || res.data.counts;
            setStats({
                totalKaryawan: dataStats?.totalEmployees || dataStats?.users || 0,
                laporanMasalah: dataStats?.totalReports || dataStats?.reports || 0,
                kebutuhanBaru: dataStats?.totalNeeds || dataStats?.needs || 0,
                absensiHariIni: dataStats?.todayAttendance || 0,
            });
            // Ambil data terbaru dari res.data.recentReports atau res.data.activities
            setLaporanTerbaru(res.data.recentReports || res.data.activities || []);
            }
        } catch (err) {
            console.error('Gagal ambil data admin:', err);
        } finally {
            setLocalLoading(false);
        }
        };
        fetchData();
    }, [userToken, isLoading]);

    if (isLoading || localLoading)
        return (
        <div className="p-10 text-center" style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>
            Memuat Data Admin Mapan...
        </div>
        );

    return (
        <>
        {/* dashboard bre */}
        <Helmet>
            <title>Dashboard | MAPAN ADMIN</title>
            <meta name="description" content="Dashboard Admin MAPAN" />
        </Helmet>
        <div className="dashboard-wrapper">
            {/* 1. Ringkasan Statistik - Sekarang 4 Kolom */}
            <div className="stats-grid-web">
            <StatBox
                label="Total Karyawan"
                value={stats.totalKaryawan}
                icon={Users}
                color="#4318FF"
            />
            <StatBox
                label="Laporan Masalah"
                value={stats.laporanMasalah}
                icon={AlertOctagon}
                color="#EE5D50"
            />
            <StatBox
                label="Kebutuhan Baru"
                value={stats.kebutuhanBaru}
                icon={ShoppingCart}
                color="#FFB547"
            />
            <StatBox
                label="Absensi Hari Ini"
                value={stats.absensiHariIni}
                icon={ClipboardCheck}
                color="#05CD99"
            />
            </div>

            <div className="content-row">
            {/* 2. Menu Navigasi (Kiri) */}
            <div className="menu-section">
                <h3 className="section-title">Manajemen Data</h3>
                <div className="menu-grid-web">
                <MenuBtn to={'/karyawan'} label="Kelola Karyawan" icon={UserCog} color="#4318FF" />
                <MenuBtn to={'/reports'} label="Semua Log" icon={ClipboardList} color="#39B8FF" />
                <MenuBtn to={'/absensi'} label="List Absensi" icon={CalendarCheck} color="#FFB547" />
                <MenuBtn to={'/payroll'} label="Pay-Roll" icon={BarChart3} color="#EE5D50" />
                </div>
            </div>

            {/* 3. Log Aktivitas (Kanan) */}
            <div className="feed-section">
                <div className="feed-header">
                <h3 className="section-title">Log Aktivitas Terbaru</h3>
                <button onClick={() => navigate('/reports')} className="text-btn">
                    Lihat Semua
                </button>
                </div>

                <div className="feed-list">
                {laporanTerbaru.length > 0 ? (
                    laporanTerbaru.map((item) => (
                    <div key={item._id} className="feed-card">
                        <div className="feed-card-header">
                        <span className="user-name">{item.user?.name || 'User'}</span>
                        <span className="category-badge">
                            {item.status || item.type || 'Aktivitas'}
                        </span>
                        </div>
                        <p className="feed-time">{new Date(item.createdAt).toLocaleString('id-ID')}</p>
                        <p className="feed-desc">
                        {item.description || item.notes || 'Melakukan aktivitas harian.'}
                        </p>
                    </div>
                    ))
                ) : (
                    <div className="empty-state">
                    <Database size={40} color="var(--text-muted)" />
                    <p>Belum ada aktivitas masuk.</p>
                    </div>
                )}
                </div>
            </div>
            </div>
        </div>
        </>
    );
    };

    // Sub-komponen biar rapi
    const StatBox = ({ label, value, icon: Icon, color }) => (
    <div
        style={{
        background: 'var(--bg-card)',
        padding: '24px',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        gap: '18px',
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--border-color)',
        }}
    >
        <div style={{ background: `${color}15`, padding: '12px', borderRadius: '12px' }}>
        <Icon color={color} size={28} />
        </div>
        <div>
        <h2 style={{ color: 'var(--text-main)', margin: 0, fontSize: '24px', fontWeight: '800' }}>
            {value}
        </h2>
        <p
            style={{
            color: 'var(--text-muted)',
            margin: 0,
            fontSize: '12px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            }}
        >
            {label}
        </p>
        </div>
    </div>
    );

    const MenuBtn = ({ label, icon: Icon, color, to }) => {
    const navigate = useNavigate();

    return (
        <button onClick={() => navigate(to)} className="menu-item-web">
        <Icon color={color} size={32} />
        <span style={{ fontWeight: '700', fontSize: '14px' }}>{label}</span>
        </button>
    );
    };

    export default Dashboard;
