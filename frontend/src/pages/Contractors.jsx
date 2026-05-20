import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, apiPost, apiDelete } from '../utils/api';
import { formatCurrency } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { useTableFilters } from '../hooks/useTableFilters';
import { AddContractorModal } from '../components/modals/AddContractorModal';
import { Loader } from '../components/Loader';
import Swal from 'sweetalert2';
import './Contractors.css';

export const Contractors = () => {
  const { token } = useAuth();
  const [contractors, setContractors] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadContractors = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiGet('/contractors', token);
      setContractors(data.contractors || data);
    } catch (err) {
      Swal.fire('خطأ', err.message || 'تعذر تحميل بيانات المقاولين', 'error');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadClients = useCallback(async () => {
    try {
      const data = await apiGet('/clients', token);
      setClients(data.clients || data);
    } catch (err) {
      console.error('Error loading clients:', err);
    }
  }, [token]);

  useEffect(() => {
    loadContractors();
    loadClients();
  }, [loadContractors, loadClients]);

  // Hook-based filtering & sorting
  const table = useTableFilters({
    data: contractors,
    searchFields: ['name'],
    initialSort: 'none'
  });

  const handleAddContractorSubmit = async (formData) => {
    setSubmitting(true);
    try {
      await apiPost('/contractors', formData, token);
      Swal.fire('تم بنجاح', 'تم إضافة المقاول بنجاح', 'success');
      setIsModalOpen(false);
      loadContractors();
    } catch (err) {
      Swal.fire('خطأ', err.message || 'فشل إضافة المقاول', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteContractor = async (id, contractorName) => {
    const result = await Swal.fire({
      title: 'تأكيد الحذف',
      text: `هل أنت متأكد من حذف المقاول "${contractorName}"؟`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        await apiDelete(`/contractors/${id}`, token);
        Swal.fire('تم الحذف', 'تم حذف المقاول بنجاح', 'success');
        loadContractors();
      } catch (err) {
        Swal.fire('خطأ في الحذف', err.message, 'error');
      }
    }
  };

  return (
    <div className="contractors-page">
      {/* Page Header Actions */}
      <div className="page-header-actions">
        <div>
          <h1 className="page-title">مقاولون النقل</h1>
          <p className="page-subtitle">إدارة حسابات ومستحقات مقاولي النقل</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <span className="material-symbols-outlined">add</span> إضافة مقاول جديد
        </button>
      </div>

      {/* Search Filter */}
      <div className="search-filter-section">
        <div className="input-with-icon">
          <span className="material-symbols-outlined input-icon">search</span>
          <input
            type="text"
            placeholder="البحث عن مقاول..."
            value={table.search}
            onChange={(e) => table.setSearch(e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <Loader text="جاري تحميل المقاولين..." />
      ) : table.filteredData.length === 0 ? (
        <div className="empty-state">
          <span className="material-symbols-outlined empty-icon">local_shipping</span>
          <h3>لا توجد مقاولين مسجلين</h3>
        </div>
      ) : (
        <div className="contractors-grid">
          {table.filteredData.map(c => {
            const balance = c.balance || 0;
            const balanceClass = balance > 0 ? 'text-danger' : balance < 0 ? 'text-success' : 'text-muted';
            const balanceLabel = balance > 0 ? '(مستحق للمقاول)' : balance < 0 ? '(مستحق لنا)' : '(متوازن)';
            
            return (
              <div className="contractor-card" key={c.id}>
                <div className="card-header">
                  <h3>{c.name}</h3>
                  <div className="card-actions">
                    <Link to={`/contractors/${c.id}`} className="action-btn view" title="التفاصيل">
                      <span className="material-symbols-outlined">chart_line</span>
                    </Link>
                    <button className="action-btn danger" onClick={() => handleDeleteContractor(c.id, c.name)} title="حذف">
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>

                <div className="balance-box">
                  <span className="balance-title">الرصيد الحالي:</span>
                  <div className={`balance-value ${balanceClass}`}>
                    {formatCurrency(Math.abs(balance))}
                    <span className="balance-status-label">{balanceLabel}</span>
                  </div>
                </div>

                <div className="card-stats">
                  <div className="stat-col">
                    <span className="stat-lbl">عدد المشاوير</span>
                    <span className="stat-val">{c.deliveriesCount || 0}</span>
                  </div>
                  <div className="stat-col">
                    <span className="stat-lbl">إجمالي المستحق</span>
                    <span className="stat-val">{formatCurrency(c.totalTrips || c.totalEarnings || 0)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Contractor Modal */}
      <AddContractorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddContractorSubmit}
        submitting={submitting}
        clients={clients}
      />
    </div>
  );
};
