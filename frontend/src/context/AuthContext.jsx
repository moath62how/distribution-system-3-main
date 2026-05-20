import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('userInfo');
    return saved ? JSON.parse(saved) : null;
  });

  const isAuthenticated = !!token && !!user;

  const login = (newToken, newUser) => {
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('userInfo', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userInfo');
      setToken(null);
      setUser(null);
    }
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      'manager': 'المدير',
      'accountant': 'المحاسب',
      'system_maintenance': 'صيانة النظام',
      'tech_support': 'الدعم الفني'
    };
    return roleNames[role] || role;
  };

  const hasRole = (roles) => {
    if (!user) return false;
    if (user.role === 'tech_support') return true;
    if (typeof roles === 'string') return user.role === roles;
    return roles.includes(user.role);
  };

  const permissions = {
    canEditPrices: () => hasRole(['manager', 'tech_support']),
    canDeleteRecords: () => hasRole(['manager', 'tech_support']),
    canAccessRecycleBin: () => hasRole(['manager', 'accountant', 'tech_support']),
    canRestoreRecords: () => hasRole(['manager', 'tech_support']),
    canManageUsers: () => hasRole(['system_maintenance', 'tech_support']),
    canAccessFinancialData: () => hasRole(['manager', 'accountant', 'tech_support'])
  };

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated, login, logout, hasRole, permissions, getRoleDisplayName }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
