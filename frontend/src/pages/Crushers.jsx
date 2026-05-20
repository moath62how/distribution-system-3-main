import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api';
import { formatCurrency } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { useTableFilters } from '../hooks/useTableFilters';
import { AddCrusherModal } from '../components/modals/AddCrusherModal';
import { EditCrusherPricesModal } from '../components/modals/EditCrusherPricesModal';
import { Loader } from '../components/Loader';
import Swal from 'sweetalert2';
import './Crushers.css';

export const Crushers = () => {
  const { token } = useAuth();
  const [crushers, setCrushers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditPricesModalOpen, setIsEditPricesModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edit Prices state
  const [selectedCrusher, setSelectedCrusher] = useState(null);

  const loadCrushers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiGet('/crushers', token);
      setCrushers(data.crushers || data);
    } catch (err) {
      Swal.fire('خطأ', err.message || 'تعذر تحميل بيانات الكسارات', 'error');
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
    loadCrushers();
    loadClients();
  }, [loadCrushers, loadClients]);

  // Hook-based filtering & sorting
  const table = useTableFilters({
    data: crushers,
    searchFields: ['name'],
    initialSort: 'none'
  });

  const handleAddCrusherSubmit = async (formData) => {
    setSubmitting(true);
    try {
      await apiPost('/crushers', formData, token);
      Swal.fire('تم بنجاح', 'تم إضافة الكسارة بنجاح', 'success');
      setIsAddModalOpen(false);
      loadCrushers();
    } catch (err) {
      Swal.fire('خطأ', err.message || 'فشل إضافة الكسارة', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditPrices = (crusher) => {
    setSelectedCrusher(crusher);
    setIsEditPricesModalOpen(true);
  };

  const handleUpdatePricesSubmit = async (formData) => {
    setSubmitting(true);
    try {
      const crusherId = selectedCrusher.id || selectedCrusher._id;
      await apiPut(`/crushers/${crusherId}/prices`, formData, token);
      Swal.fire('تم بنجاح', 'تم تحديث الأسعار بنجاح', 'success');
      setIsEditPricesModalOpen(false);
      setSelectedCrusher(null);
      loadCrushers();
    } catch (err) {
      Swal.fire('خطأ', err.message || 'فشل تحديث الأسعار', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCrusher = async (id, crusherName) => {
    const result = await Swal.fire({
      title: 'تأكيد الحذف',
      text: `هل أنت متأكد من حذف الكسارة "${crusherName}"؟`,
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
        await apiDelete(`/crushers/${id}`, token);
        Swal.fire('تم الحذف', 'تم حذف الكسارة بنجاح', 'success');
        loadCrushers();
      } catch (err) {
        Swal.fire('خطأ في الحذف', err.message, 'error');
      }
    }
  };

  const formatPrice = (price) => {
    if (!price || price === 0) {
      return <span className="price-not-set">غير محدد</span>;
    }
    return formatCurrency(price);
  };

  return (
    <div className="crushers-page">
      {/* Page Header Actions */}
      <div className="page-header-actions">
        <div>
          <h1 className="page-title">الكسارات</h1>
          <p className="page-subtitle">إدارة أسعار المواد الخام وسجلات التوريد</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <span className="material-symbols-outlined">add</span> إضافة كسارة جديدة
        </button>
      </div>

      {/* Search Filter Section */}
      <div className="search-filter-section">
        <div className="input-with-icon">
          <span className="material-symbols-outlined input-icon">search</span>
          <input
            type="text"
            placeholder="البحث عن كسارة..."
            value={table.search}
            onChange={(e) => table.setSearch(e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <Loader text="جاري تحميل الكسارات..." />
      ) : table.filteredData.length === 0 ? (
        <div className="empty-state">
          <span className="material-symbols-outlined empty-icon">factory</span>
          <h3>لا توجد كسارات مسجلة</h3>
        </div>
      ) : (
        <div className="crushers-grid">
          {table.filteredData.map(c => {
            const balance = c.balance || 0;
            const balanceClass = balance > 0 ? 'text-danger' : balance < 0 ? 'text-success' : 'text-muted';
            const balanceLabel = balance > 0 ? '(مستحق للكسارة)' : balance < 0 ? '(مستحق لنا)' : '(متوازن)';
            
            return (
              <div className="crusher-card" key={c.id}>
                <div className="card-header">
                  <h3>{c.name}</h3>
                  <div className="card-actions">
                    <button 
                      className="action-btn update" 
                      onClick={() => handleOpenEditPrices(c)}
                      title="تحديث الأسعار"
                    >
                      <span className="material-symbols-outlined">payments</span>
                    </button>
                    <Link to={`/crushers/${c.id}`} className="action-btn view" title="عرض التفاصيل">
                      <span className="material-symbols-outlined">show_chart</span>
                    </Link>
                    <button 
                      className="action-btn danger" 
                      onClick={() => handleDeleteCrusher(c.id, c.name)} 
                      title="حذف"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>

                <div className="materials-prices">
                  <h4 className="section-subtitle">أسعار المواد الخام</h4>
                  <div className="price-list">
                    <div className="price-item">
                      <span className="material-name">رمل</span>
                      <span className="material-price">{formatPrice(c.sand_price)}</span>
                    </div>
                    <div className="price-item">
                      <span className="material-name">سن 1</span>
                      <span className="material-price">{formatPrice(c.aggregate1_price)}</span>
                    </div>
                    <div className="price-item">
                      <span className="material-name">سن 2</span>
                      <span className="material-price">{formatPrice(c.aggregate2_price)}</span>
                    </div>
                    <div className="price-item">
                      <span className="material-name">سن 3</span>
                      <span className="material-price">{formatPrice(c.aggregate3_price)}</span>
                    </div>
                    <div className="price-item">
                      <span className="material-name">سن 6 بودرة</span>
                      <span className="material-price">{formatPrice(c.aggregate6_powder_price)}</span>
                    </div>
                  </div>
                </div>

                <div className="card-footer-stats">
                  <div className="stat-row">
                    <span className="stat-label">عدد التوصيلات:</span>
                    <span className="stat-value">{c.deliveriesCount || 0}</span>
                  </div>
                  <div className="stat-row balance-row">
                    <span className="stat-label">الرصيد الحالي:</span>
                    <div className={`stat-value ${balanceClass}`}>
                      {formatCurrency(Math.abs(balance))}
                      <span className="balance-status-label">{balanceLabel}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Crusher Modal */}
      <AddCrusherModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddCrusherSubmit}
        submitting={submitting}
        clients={clients}
      />

      {/* Edit Crusher Prices Modal */}
      <EditCrusherPricesModal
        isOpen={isEditPricesModalOpen}
        onClose={() => { setIsEditPricesModalOpen(false); setSelectedCrusher(null); }}
        onSubmit={handleUpdatePricesSubmit}
        submitting={submitting}
        crusher={selectedCrusher}
      />
    </div>
  );
};
