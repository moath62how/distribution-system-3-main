import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPost, apiDelete } from '../utils/api';
import { formatCurrency } from '../utils/formatters';
import { Loader } from '../components/Loader';
import { AddClientModal } from '../components/modals/AddClientModal';
import Swal from 'sweetalert2';
import './Clients.css';

export const Clients = () => {
  const { token } = useAuth();
  
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchClients = useCallback(async (page = 1, searchQuery = '') => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page,
        limit: 25,
        ...(searchQuery ? { search: searchQuery } : {})
      });
      const result = await apiGet(`/clients?${query}`, token);
      setClients(result.clients || result.data || []);
      if (result.pagination) {
        setPagination({
          page: result.pagination.page,
          pages: result.pagination.pages
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire('خطأ', 'فشل تحميل بيانات العملاء', 'error');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchClients(1, search);
  }, [fetchClients]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchClients(1, search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search, fetchClients]);

  const handleDelete = async (clientId, clientName) => {
    const confirmResult = await Swal.fire({
      title: 'تأكيد الحذف',
      text: `هل أنت متأكد من حذف العميل "${clientName}"؟`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء',
      reverseButtons: true
    });

    if (!confirmResult.isConfirmed) return;

    try {
      Swal.showLoading();
      await apiDelete(`/clients/${clientId}`, token);
      Swal.fire('تم بنجاح', 'تم حذف العميل وحساباته بنجاح', 'success');
      fetchClients(pagination.page, search);
    } catch (err) {
      Swal.fire('خطأ', err.message || 'فشل حذف العميل', 'error');
    }
  };

  const handleAddClient = async (formData) => {
    setSubmitting(true);
    try {
      await apiPost('/clients', formData, token);
      Swal.fire('تم بنجاح', 'تم إضافة العميل بنجاح', 'success');
      setIsModalOpen(false);
      fetchClients(1, search);
    } catch (err) {
      Swal.fire('خطأ', err.message || 'فشل إضافة العميل', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="clients-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span className="material-symbols-outlined align-middle ml-2">group</span>
            إدارة العملاء
          </h1>
          <p className="page-subtitle">عرض وإدارة جميع العملاء المسجلين والحسابات</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <span className="material-symbols-outlined align-middle ml-1">add</span>
          إضافة عميل جديد
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-bar-wrapper">
        <div className="search-input-container">
          <span className="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            className="form-input search-input"
            placeholder="ابحث عن العميل بالاسم أو الهاتف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search-btn" onClick={() => setSearch('')}>
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <Loader text="جاري تحميل العملاء..." />
      ) : clients.length === 0 ? (
        <div className="empty-state-card">
          <span className="material-symbols-outlined empty-icon">group</span>
          <p className="empty-title">لا توجد سجلات مطابقة</p>
          <p className="empty-subtitle">يرجى إضافة عميل أو التحقق من كلمة البحث</p>
        </div>
      ) : (
        <>
          <div className="clients-grid">
            {clients.map(client => {
              const balance = client.balance || 0;
              const isOwed = balance > 0;
              const isCredit = balance < 0;
              return (
                <div className="client-card" key={client.id || client._id}>
                  <div className="client-header">
                    <h3 className="client-name">{client.name}</h3>
                    <div className="client-actions">
                      <Link to={`/clients/${client.id || client._id}`} className="btn-action view" title="عرض التفاصيل">
                        <span className="material-symbols-outlined">trending_flat</span>
                      </Link>
                      <button className="btn-action danger" onClick={() => handleDelete(client.id || client._id, client.name)} title="حذف العميل">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>

                  <div className="client-body">
                    {client.phone && (
                      <div className="info-row">
                        <span className="material-symbols-outlined">phone_android</span>
                        <span>{client.phone}</span>
                      </div>
                    )}
                    
                    <div className="balance-summary-card">
                      <div className="balance-label">الرصيد الحالي</div>
                      <div className={`balance-value ${isOwed ? 'text-danger' : isCredit ? 'text-success' : 'text-muted'}`}>
                        {formatCurrency(Math.abs(balance))}
                        <span className="balance-status-text">
                          {isOwed ? ' (مدين لنا)' : isCredit ? ' (دائن لدينا)' : ' (متوازن)'}
                        </span>
                      </div>
                    </div>

                    <div className="totals-subgrid">
                      <div className="subgrid-item">
                        <span className="subgrid-label">إجمالي التوريدات</span>
                        <span className="subgrid-value text-success">{formatCurrency(client.totalDeliveries || 0)}</span>
                      </div>
                      <div className="subgrid-item">
                        <span className="subgrid-label">إجمالي المدفوعات</span>
                        <span className="subgrid-value text-danger">{formatCurrency(client.totalPayments || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {pagination.pages > 1 && (
            <div className="pagination-wrapper">
              <button 
                disabled={pagination.page <= 1} 
                onClick={() => fetchClients(pagination.page - 1, search)}
                className="btn btn-secondary"
              >
                السابق
              </button>
              <span className="pagination-text">صفحة {pagination.page} من {pagination.pages}</span>
              <button 
                disabled={pagination.page >= pagination.pages} 
                onClick={() => fetchClients(pagination.page + 1, search)}
                className="btn btn-secondary"
              >
                التالي
              </button>
            </div>
          )}
        </>
      )}

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddClient}
        submitting={submitting}
      />
    </div>
  );
};
