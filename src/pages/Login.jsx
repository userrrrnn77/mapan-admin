import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { loginAdmin } from '../api';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import backgroundLogin from '../assets/bg_login.jpg';

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginAdmin({ phone: phoneNumber, password });
      const token = res.data?.token || res.data?.data?.token || res.data?.accessToken;
      const user = res.data?.user || res.data?.data?.user;

      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('userData', JSON.stringify(user));
        login(token, user);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login Gagal:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Login | MAPAN</title>
      </Helmet>

      {/* Gunakan wrapper utama sebagai "panggung" */}
      <div
        className="login-page-wrapper"
        style={{
          position: 'relative',
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f4f7fe', // Warna dasar fallback
          overflow: 'hidden',
        }}
      >
        {/* BACKGROUND LAYER: Pakai position FIXED biar dia gak ganggu flow klik */}
        <div
          style={{
            position: 'absolute', // Absolute nempel ke page-wrapper
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1, // Layer paling bawah
          }}
        >
          <img
            src={backgroundLogin}
            onLoad={() => console.log('Gambar Berhasil Load!')} // Cek di console log browser
            onError={() => console.error('Gambar Gagal Load, Cek Path Bre!')}
            alt="bg"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.3,
              filter: 'blur(4px) brightness(0.8)',
              transform: 'scale(1.05)', // Sedikit zoom biar pinggiran blur gak kepotong
            }}
          />
        </div>

        {/* FORM LAYER: Harus punya z-index lebih tinggi dan position relative/fixed */}
        <div
          className="login-container"
          style={{
            position: 'relative',
            zIndex: 2, // Pastikan lebih tinggi dari background
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div className="login-card">
            <div className="login-header">
              <h1>MAPAN</h1>
              <p>Admin Control Panel</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="input-group">
                <label>Nomor HP Admin</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="08xxxxxxxx"
                  required
                />
              </div>

              <div className="input-group">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  required
                />
              </div>

              <Button type="submit" loading={loading} className="btn-login">
                MASUK SEKARANG
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
