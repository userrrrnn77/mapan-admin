import { createRoot } from 'react-dom/client';
import './assets/css/index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';

const currentTheme = localStorage.getItem('theme') || 'dark';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <HelmetProvider>
      <Toaster
        position="top-right"
        reverseOrder={false}
      />
      <App />
    </HelmetProvider>
  </BrowserRouter>,
);
