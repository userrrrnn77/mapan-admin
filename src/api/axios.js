import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json', // WAJIB ADA BRE
  },
});

// src/api/axios.js
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    // VALIDASI KETAT:
    // Hanya pasang Header kalau token ada, bukan string "null"/"undefined",
    // dan panjangnya masuk akal buat sebuah JWT (biasanya > 100 karakter)
    if (token && token !== 'null' && token !== 'undefined' && token.length > 20) {
      const cleanToken = token.replace(/"/g, '').trim();
      config.headers.Authorization = `Bearer ${cleanToken}`;
    } else {
      // Kalau token sampah, mending hapus sekalian headernya biar gak "malformed"
      delete config.headers.Authorization;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.clear();
    }
    return Promise.reject(error);
  },
);

export default api;
