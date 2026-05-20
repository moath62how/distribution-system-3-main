import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedLayout } from './layouts/ProtectedLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Clients } from './pages/Clients';
import { ClientDetails } from './pages/ClientDetails';
import { Crushers } from './pages/Crushers';
import { CrusherDetails } from './pages/CrusherDetails';
import { Contractors } from './pages/Contractors';
import { ContractorDetails } from './pages/ContractorDetails';
import { NewEntry } from './pages/NewEntry';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/:id" element={<ClientDetails />} />
            
            <Route path="/crushers" element={<Crushers />} />
            <Route path="/crushers/:id" element={<CrusherDetails />} />
            
            <Route path="/contractors" element={<Contractors />} />
            <Route path="/contractors/:id" element={<ContractorDetails />} />
            
            <Route path="/suppliers" element={<div style={{padding: '2rem'}}>صفحة الموردين (قريباً)</div>} />
            <Route path="/employees" element={<div style={{padding: '2rem'}}>صفحة الموظفين (قريباً)</div>} />
            <Route path="/administration" element={<div style={{padding: '2rem'}}>صفحة الإدارة (قريباً)</div>} />
            <Route path="/projects" element={<div style={{padding: '2rem'}}>صفحة المشاريع (قريباً)</div>} />
            <Route path="/expenses" element={<div style={{padding: '2rem'}}>صفحة المصروفات (قريباً)</div>} />
            <Route path="/new-entry" element={<NewEntry />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
