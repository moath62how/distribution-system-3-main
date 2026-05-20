import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiGet } from '../utils/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Loader } from '../components/Loader';
import './Dashboard.css';

export const Dashboard = () => {
  const { token } = useAuth();
  
  const [metrics, setMetrics] = useState(null);
  const [recentClients, setRecentClients] = useState([]);
  const [recentContractors, setRecentContractors] = useState([]);
  const [recentCrushers, setRecentCrushers] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');
  const [error, setError] = useState('');

  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const [metricsData, clientsRes, contractorsRes, crushersRes] = await Promise.all([
        apiGet('/metrics', token),
        apiGet('/clients?limit=5', token),
        apiGet('/contractors?limit=5', token),
        apiGet('/crushers?limit=5', token)
      ]);

      setMetrics(metricsData);
      setRecentClients(clientsRes.clients || clientsRes.data || []);
      setRecentContractors(contractorsRes.contractors || contractorsRes.data || []);
      setRecentCrushers(crushersRes.crushers || crushersRes.data || []);
      setLastUpdate(new Date().toLocaleString('ar-EG'));
    } catch (err) {
      setError('خطأ في تحميل بيانات لوحة التحكم');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <Loader text="جاري تحميل إحصائيات لوحة التحكم..." />;

  const receivables = metrics?.totalClientBalancesPositive || 0;
  const payables = metrics?.totalPayables || 0;
  const totalExpenses = metrics?.totalExpenses || 0;
  const totalSales = metrics?.totalSales || 0;
  const netProfit = metrics?.netProfit || 0;
  const isLoss = netProfit < 0;

  const recentActivities = [
    ...recentClients.slice(0, 3).map(c => ({
      id: `client-${c._id || c.id}`,
      link: `/clients/${c._id || c.id}`,
      icon: 'person',
      iconBg: (c.balance || 0) > 0 ? 'var(--danger-500)' : 'var(--success-500)',
      title: `عميل جديد: ${c.name}`,
      description: `الرصيد: ${formatCurrency(Math.abs(c.balance || 0))}`,
      date: c.created_at
    })),
    ...recentContractors.slice(0, 2).map(c => ({
      id: `contractor-${c._id || c.id}`,
      link: `/contractors/${c._id || c.id}`,
      icon: 'local_shipping',
      iconBg: 'var(--warning-500)',
      title: `مقاول جديد: ${c.name}`,
      description: `الرصيد: ${formatCurrency(Math.abs(c.balance || 0))}`,
      date: c.created_at
    })),
    ...recentCrushers.slice(0, 2).map(c => ({
      id: `crusher-${c._id || c.id}`,
      link: `/crushers/${c._id || c.id}`,
      icon: 'factory',
      iconBg: 'var(--primary-500)',
      title: `كسارة جديدة: ${c.name}`,
      description: `الصافي: ${formatCurrency(Math.abs(c.net || 0))}`,
      date: c.created_at
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">نظرة عامة</h1>
          <p className="page-subtitle">البيانات محدثة تلقائياً</p>
        </div>
        <div className="header-actions">
          <button onClick={() => loadData(true)} disabled={refreshing} className="btn btn-secondary">
            <span className={`material-symbols-outlined ${refreshing ? 'spin-icon' : ''}`}>sync</span>
            تحديث
          </button>
          <div id="lastUpdate">
            <span className="material-symbols-outlined text-[16px] align-middle ml-1">schedule</span>
            آخر تحديث: {lastUpdate}
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error mb-6">{error}</div>}

      <div className="dashboard-content">
        <div className="debts-payables-grid">
          <div className="debt-card receivables">
            <div className="debt-icon"><span className="material-symbols-outlined">payments</span></div>
            <div className="debt-content">
              <div className="debt-value">{formatCurrency(receivables)}</div>
              <div className="debt-label">إجمالي الديون</div>
              <div className="debt-sublabel">مستحقات لنا</div>
            </div>
          </div>
          <div className="debt-card payables">
            <div className="debt-icon"><span className="material-symbols-outlined">credit_card</span></div>
            <div className="debt-content">
              <div className="debt-value">{formatCurrency(payables)}</div>
              <div className="debt-label">إجمالي المستحقات</div>
              <div className="debt-sublabel">مستحقات علينا</div>
            </div>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">إجمالي التكاليف</div>
            <div className="stat-value text-success">{formatCurrency(totalExpenses)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">إجمالي المبيعات</div>
            <div className="stat-value text-danger">{formatCurrency(totalSales)}</div>
          </div>
          <div className={`stat-card ${isLoss ? 'loss-card' : ''}`}>
            {isLoss && <div className="loss-badge">خسارة حالية</div>}
            <div className="stat-label">صافي الربح التقديري</div>
            <div className={`stat-value ${isLoss ? 'text-danger' : ''}`}>{formatCurrency(netProfit)}</div>
          </div>
        </div>

        <div className="small-stats-grid">
          <Link to="/clients" className="small-stat-item hover-scale">
            <span className="material-symbols-outlined item-icon">group</span>
            <div className="item-content">
              <div className="item-value">{metrics?.totalClients || 0}</div>
              <div className="item-label">العملاء</div>
            </div>
          </Link>
          <Link to="/contractors" className="small-stat-item hover-scale">
            <span className="material-symbols-outlined item-icon">local_shipping</span>
            <div className="item-content">
              <div className="item-value">{metrics?.totalContractors || 0}</div>
              <div className="item-label">المقاولين</div>
            </div>
          </Link>
          <Link to="/crushers" className="small-stat-item hover-scale">
            <span className="material-symbols-outlined item-icon">factory</span>
            <div className="item-content">
              <div className="item-value">{metrics?.totalCrushers || 0}</div>
              <div className="item-label">الكسارات</div>
            </div>
          </Link>
          <Link to="/employees" className="small-stat-item hover-scale">
            <span className="material-symbols-outlined item-icon">badge</span>
            <div className="item-content">
              <div className="item-value">{metrics?.totalEmployees || 0}</div>
              <div className="item-label">الموظفين</div>
            </div>
          </Link>
        </div>

        <div className="main-bottom-wrapper">
          <div className="left-column">
            <h2 className="section-title">مركز العمليات</h2>
            <div className="quick-actions">
              <Link to="/clients" className="action-card">
                <div className="action-icon"><span className="material-symbols-outlined">group</span></div>
                <div className="action-content">
                  <div className="action-title">إدارة العملاء</div>
                  <div className="action-description">عرض حسابات العملاء والمدفوعات</div>
                </div>
              </Link>
              <Link to="/new-entry" className="action-card">
                <div className="action-icon"><span className="material-symbols-outlined">add_circle</span></div>
                <div className="action-content">
                  <div className="action-title">تسليم جديد</div>
                  <div className="action-description">إضافة عملية تسليم جديدة</div>
                </div>
              </Link>
            </div>
          </div>

          <div className="right-column">
            <div className="recent-activity">
              <div className="card-header-feed">
                <span className="material-symbols-outlined">history</span>
                <h3 className="card-title-feed">آخر النشاطات</h3>
              </div>
              <div className="activity-list">
                {recentActivities.map(act => (
                  <Link to={act.link} key={act.id} className="activity-item-link" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="activity-item">
                      <div className="activity-icon" style={{ backgroundColor: act.iconBg }}>
                        <span className="material-symbols-outlined text-[18px] text-white">{act.icon}</span>
                      </div>
                      <div className="activity-content">
                        <div className="activity-title">{act.title}</div>
                        <div className="activity-time">{act.description} • {formatDate(act.date)}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
