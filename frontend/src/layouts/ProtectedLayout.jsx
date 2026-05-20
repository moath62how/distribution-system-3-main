import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import './ProtectedLayout.css';

export const ProtectedLayout = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="protected-layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};
