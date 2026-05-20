import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

export const Sidebar = () => {
  const { user, logout, getRoleDisplayName, hasRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleSidebar = () => setIsOpen(!isOpen);

  if (!user) return null;

  return (
    <>
      <button className={`hamburger ${isOpen ? 'open' : ''}`} onClick={toggleSidebar} aria-label="القائمة الجانبية">
        <span className="material-symbols-outlined">{isOpen ? 'close' : 'menu'}</span>
      </button>

      {isOpen && <div className="sidebar-overlay active" onClick={() => setIsOpen(false)} />}

      <aside className={`sidebar-md ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header-md">
          <div className="sidebar-logo-md"><span className="material-symbols-outlined">corporate_fare</span></div>
          <div className="sidebar-brand-md">
            <h2 className="sidebar-brand-title">InfraFinance</h2>
            <p className="sidebar-brand-subtitle">إدارة المؤسسة الذكية</p>
          </div>
        </div>

        <nav className="sidebar-nav-md custom-scrollbar">
          <NavLink to="/" className={({ isActive }) => `sidebar-link-md ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
            <span className="material-symbols-outlined">dashboard</span>
            <span>لوحة التحكم</span>
          </NavLink>
          
          <NavLink to="/clients" className={({ isActive }) => `sidebar-link-md ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
            <span className="material-symbols-outlined">group</span>
            <span>العملاء</span>
          </NavLink>

          <NavLink to="/crushers" className={({ isActive }) => `sidebar-link-md ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
            <span className="material-symbols-outlined">factory</span>
            <span>الكسارات</span>
          </NavLink>

          <NavLink to="/suppliers" className={({ isActive }) => `sidebar-link-md ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
            <span className="material-symbols-outlined">inventory</span>
            <span>الموردون</span>
          </NavLink>

          <NavLink to="/contractors" className={({ isActive }) => `sidebar-link-md ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
            <span className="material-symbols-outlined">local_shipping</span>
            <span>مقاولون العجل</span>
          </NavLink>

          <NavLink to="/employees" className={({ isActive }) => `sidebar-link-md ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
            <span className="material-symbols-outlined">badge</span>
            <span>الموظفون</span>
          </NavLink>

          <NavLink to="/administration" className={({ isActive }) => `sidebar-link-md ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
            <span className="material-symbols-outlined">admin_panel_settings</span>
            <span>الإدارة</span>
          </NavLink>

          <NavLink to="/projects" className={({ isActive }) => `sidebar-link-md ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
            <span className="material-symbols-outlined">account_tree</span>
            <span>المشاريع</span>
          </NavLink>

          <NavLink to="/expenses" className={({ isActive }) => `sidebar-link-md ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
            <span className="material-symbols-outlined">payments</span>
            <span>المصروفات</span>
          </NavLink>

          <NavLink to="/new-entry" className={({ isActive }) => `sidebar-link-md ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
            <span className="material-symbols-outlined">add_circle</span>
            <span>تسليم جديد</span>
          </NavLink>

          {hasRole(['manager', 'system_maintenance']) && (
            <>
              <div className="section-divider">إدارة النظام</div>
              <NavLink to="/audit-logs" className={({ isActive }) => `sidebar-link-md ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
                <span className="material-symbols-outlined">history</span>
                <span>سجل العمليات</span>
              </NavLink>
            </>
          )}

          {hasRole(['manager', 'accountant']) && (
            <NavLink to="/recycle-bin" className={({ isActive }) => `sidebar-link-md ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
              <span className="material-symbols-outlined">delete</span>
              <span>سلة المحذوفات</span>
            </NavLink>
          )}

          {hasRole('system_maintenance') && (
            <NavLink to="/user-management" className={({ isActive }) => `sidebar-link-md ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
              <span className="material-symbols-outlined">manage_accounts</span>
              <span>إدارة المستخدمين</span>
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer-md">
          <div className="sidebar-user-md">
            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=0ea5e9&color=fff&size=128`} alt="Avatar" className="sidebar-user-avatar" />
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.username}</div>
              <div className="sidebar-user-role">{getRoleDisplayName(user.role)}</div>
            </div>
            <button className="btn-md-icon" onClick={handleLogout} title="تسجيل الخروج">
              <span className="material-symbols-outlined" style={{ color: 'var(--danger-600)' }}>logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
