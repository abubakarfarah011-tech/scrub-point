import { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import { AuthContext } from './AuthContextObject';


export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('scrubpoint_admin_token');
    const email = localStorage.getItem('scrubpoint_admin_email');
    const role = localStorage.getItem('scrubpoint_admin_role');

    if (token && email && role) {
      setAdmin({ email, role, token });
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await ApiService.auth.login({ email, password });

      if (response.success && response.data) {
        const { token, role, email: userEmail } = response.data;

        localStorage.setItem('scrubpoint_admin_token', token);
        localStorage.setItem('scrubpoint_admin_email', userEmail);
        localStorage.setItem('scrubpoint_admin_role', role);

        setAdmin({ email: userEmail, role, token });
        return { success: true, role };
      }
      return { success: false, message: response.message || 'Authentication error.' };
    } catch (error) {
      return { success: false, message: error.message || 'Server connection failed.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('scrubpoint_admin_token');
    localStorage.removeItem('scrubpoint_admin_email');
    localStorage.removeItem('scrubpoint_admin_role');
    setAdmin(null);
    window.location.href = '/admin';
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
