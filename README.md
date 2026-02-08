# 🏢 Admin Mapan - Management System

Sistem manajemen administrasi modern berbasis dashboard untuk pengelolaan data karyawan, presensi, dan payroll secara real-time. Dibangun dengan fokus pada kecepatan performa dan antarmuka yang responsif.

## 🚀 Fitur Utama

- **Dashboard Analytics**: Visualisasi statistik data secara cepat.
- **Manajemen Karyawan**: CRUD data karyawan dengan sistem role (Owner, Admin, Karyawan).
- **Sistem Presensi**: Monitoring kehadiran lengkap dengan foto, lokasi (Geo-location), dan status keterlambatan.
- **Work Location Setup**: Pengaturan radius lokasi kantor yang dinamis.
- **Payroll System**: Perhitungan gaji otomatis dengan ekspor data ke Excel.
- **Dark Mode Support**: Antarmuka adaptif yang nyaman di mata.
- **Fully Responsive**: Tampilan optimal dari desktop hingga smartphone.

## 🛠️ Tech Stack

### Core

- **React 19** - Library UI terbaru.
- **Vite 7** - Build tool generasi terbaru yang super cepat.
- **React Router 7** - Manajemen navigasi aplikasi.

### State & Data Management

- **TanStack Query v5** - Sinkronisasi data server & caching yang powerfull.
- **Axios** - HTTP Client untuk komunikasi API.

### UI & Styling

- **Lucide React** - Icon set yang clean dan konsisten.
- **CSS3 (Modern Variables)** - Custom styling dengan sistem tema (Light/Dark).
- **SweetAlert2 & React Hot Toast** - Notifikasi interaktif yang user-friendly.

### Utilities

- **XLSX & File-Saver** - Untuk kebutuhan ekspor data laporan.

## 📦 Cara Instalasi

1.  **Clone Repositori**

    ```bash
    git clone [https://github.com/username/admin-mapan.git](https://github.com/username/admin-mapan.git)
    cd admin-mapan
    ```

2.  **Install Dependensi**

    ```bash
    npm install
    ```

3.  **Konfigurasi Environment**
    Buat file `.env` di root folder dan sesuaikan:

    ```env
    VITE_API_URL=[https://api.lu.com](https://api.lu.com)
    ```

4.  **Jalankan Mode Development**

    ```bash
    npm run dev
    ```

5.  **Build untuk Produksi**
    ```bash
    npm run build
    ```

## 📂 Struktur Folder

- `src/context` - State management (Auth Context).
- `src/hooks` - Custom hooks (Theme switcher, dll).
- `src/pages` - Halaman utama aplikasi.
- `src/components` - Komponen UI yang reusable.
- `src/assets` - File CSS dan gambar statis.

---

Made with 🔥 by Admin Mapan Team
