import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

const API_BASE = 'http://localhost:8000/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      axios.defaults.headers.common['Authorization'] = `Token ${savedToken}`;
      fetchUser(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (authToken) => {
    try {
      const response = await axios.get(`${API_BASE}/auth/user/`, {
        headers: { Authorization: `Token ${authToken}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password, password2, first_name = '', last_name = '') => {
    try {
      const response = await axios.post(`${API_BASE}/auth/register/`, {
        username,
        email,
        password,
        password2,
        first_name,
        last_name,
      });
      
      const { token: authToken, user: userData } = response.data;
      localStorage.setItem('token', authToken);
      axios.defaults.headers.common['Authorization'] = `Token ${authToken}`;
      setToken(authToken);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || 'Registration failed' 
      };
    }
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API_BASE}/auth/login/`, {
        username,
        password,
      });
      
      const { token: authToken, user: userData } = response.data;
      localStorage.setItem('token', authToken);
      axios.defaults.headers.common['Authorization'] = `Token ${authToken}`;
      setToken(authToken);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || 'Login failed' 
      };
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_BASE}/auth/logout/`);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}