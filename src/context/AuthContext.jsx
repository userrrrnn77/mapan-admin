import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);

  const login = (token, user) => {
    if (!token) return console.error('Token kagak ada Bre!'); // Validasi tipis-tipis

    setUserToken(token);
    setUserData(user);
    localStorage.setItem('token', token); // STANDARKAN NAMA KEY
    localStorage.setItem('userData', JSON.stringify(user));
  };

  const logout = () => {
    setUserToken(null);
    setUserData(null);
    localStorage.clear();
    navigate('/login');
  };

  const isLoggedIn = () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token'); // Pake localStorage buat web
      const data = localStorage.getItem('userData');

      // VALIDASI KETAT: Cek null, cek string "undefined", cek string "null"
      if (
        token &&
        token !== 'undefined' &&
        token !== 'null' &&
        data &&
        data !== 'undefined' &&
        data !== 'null'
      ) {
        setUserToken(token);
        setUserData(JSON.parse(data));
      } else {
        // Kalau isinya ampas, mending bersihin sekalian biar gak error terus
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
      }
    } catch (e) {
      console.log('Error parse data, bersihin storage...', e);
      localStorage.clear();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  return (
    <AuthContext.Provider
      value={{ login, logout, isLoading, userToken, userData, isAuthenticated: !!userToken }}
    >
      {children}
    </AuthContext.Provider>
  );
};
