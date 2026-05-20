import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api';
import { formatCurrency, formatDate, formatQuantity } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { Loader } from '../components/Loader';
import { useTableFilters } from '../hooks/useTableFilters';
import { PaymentModal } from '../components/modals/PaymentModal';
import { AdjustmentModal } from '../components/modals/AdjustmentModal';
import { CrusherDeliveryModal } from '../components/modals/CrusherDeliveryModal';
import Swal from 'sweetalert2';
import './CrusherDetails.css';

export const CrusherDetails = () => {
  const { id } = useParams();
  const { token } = useAuth();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('deliveries');

  // Modals state
  const [activeModal, setActiveModal] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  // Date filters for reports
  const [repFrom, setRepFrom] = useState('');
  const [repTo, setRepTo] = useState('');
  const [stmtFrom, setStmtFrom] = useState('');
  const [stmtTo, setStmtTo] = useState('');
  const [useStmtDates, setUseStmtDates] = useState(false);

  const loadDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiGet(`/crushers/${id}`, token);
      setData(res);
    } catch (err) {
      Swal.fire('خطأ', err.message || 'فشل تحميل تفاصيل الكسارة', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  // Hook-based filtering & sorting
  const deliveriesData = data?.deliveries || [];
  const paymentsData = data?.payments || [];
  const adjustmentsData = data?.adjustments || [];

  const delFilters = useTableFilters({
    data: deliveriesData,
    searchFields: ['material', 'voucher', 'contractor_name'],
    dateField: 'created_at',
    initialSort: 'date-desc',
    sortComparator: useCallback((a, b, sort) => {
      if (sort === 'date-asc') return new Date(a.created_at) - new Date(b.created_at);
      if (sort === 'date-desc') return new Date(b.created_at) - new Date(a.created_at);
      if (sort === 'qty-desc') return (b.car_volume - b.discount_volume) - (a.car_volume - a.discount_volume);
      if (sort === 'qty-asc') return (a.car_volume - a.discount_volume) - (b.car_volume - b.discount_volume);
      return 0;
    }, [])
  });

  const payFilters = useTableFilters({
    data: paymentsData,
    searchFields: ['method', 'note', 'details'],
    dateField: 'paid_at',
    initialSort: 'date-desc',
    sortComparator: useCallback((a, b, sort) => {
      if (sort === 'date-asc') return new Date(a.paid_at) - new Date(b.paid_at);
      if (sort === 'date-desc') return new Date(b.paid_at) - new Date(a.paid_at);
      if (sort === 'amount-desc') return b.amount - a.amount;
      if (sort === 'amount-asc') return a.amount - b.amount;
      return 0;
    }, [])
  });

  const adjFilters = useTableFilters({
    data: adjustmentsData,
    searchFields: ['reason'],
    dateField: 'created_at',
    initialSort: 'date-desc',
    sortComparator: useCallback((a, b, sort) => {
      if (sort === 'date-asc') return new Date(a.created_at) - new Date(b.created_at);
      if (sort === 'date-desc') return new Date(b.created_at) - new Date(a.created_at);
      if (sort === 'amount-desc') return b.amount - a.amount;
      if (sort === 'amount-asc') return a.amount - b.amount;
      return 0;
    }, [])
  });

  const handlePaymentSubmit = async (formData) => {
    const payload = {
      amount: formData.amount,
      paid_at: formData.paid_at,
      method: formData.method,
      details: formData.details || '',
      note: formData.note,
      payment_image_url: formData.image || undefined
    };

    try {
      if (selectedItem) {
        await apiPut(`/crushers/${id}/payments/${selectedItem.id || selectedItem._id}`, payload, token);
        Swal.fire('تم بنجاح', 'تم تحديث الدفعة بنجاح', 'success');
      } else {
        await apiPost(`/crushers/${id}/payments`, payload, token);
        Swal.fire('تم بنجاح', 'تم إضافة الدفعة بنجاح', 'success');
      }
      setActiveModal(null);
      setSelectedItem(null);
      loadDetails();
    } catch (err) {
      Swal.fire('خطأ', err.message || 'فشل حفظ العملية', 'error');
    }
  };

  const handleOpenEditPayment = (payment) => {
    setSelectedItem({
      id: payment.id || payment._id,
      amount: payment.amount,
      paid_at: payment.paid_at,
      method: payment.method,
      details: payment.details,
      note: payment.note,
      image: payment.payment_image_url
    });
    setActiveModal('payment');
  };

  const handleAdjustmentSubmit = async (formData) => {
    try {
      if (selectedItem) {
        await apiPut(`/crushers/${id}/adjustments/${selectedItem.id || selectedItem._id}`, formData, token);
        Swal.fire('تم بنجاح', 'تم تعديل التسوية بنجاح', 'success');
      } else {
        await apiPost(`/crushers/${id}/adjustments`, formData, token);
        Swal.fire('تم بنجاح', 'تم تسجيل التسوية بنجاح', 'success');
      }
      setActiveModal(null);
      setSelectedItem(null);
      loadDetails();
    } catch (err) {
      Swal.fire('خطأ', err.message || 'فشل حفظ التسوية', 'error');
    }
  };

  const handleOpenEditAdjustment = (adj) => {
    setSelectedItem({
      id: adj.id || adj._id,
      amount: adj.amount,
      reason: adj.reason
    });
    setActiveModal('adjustment');
  };

  const handleDeliverySubmit = async (formData) => {
    try {
      await apiPut(`/deliveries/${selectedItem.id || selectedItem._id}`, formData, token);
      Swal.fire('تم التحديث', 'تم تحديث تفاصيل التسليم بنجاح', 'success');
      setActiveModal(null);
      setSelectedItem(null);
      loadDetails();
    } catch (err) {
      Swal.fire('خطأ', err.message || 'فشل تحديث البيانات', 'error');
    }
  };

  const handleOpenEditDelivery = (del) => {
    setSelectedItem(del);
    setActiveModal('delivery');
  };

  const handleDeleteItem = async (type, itemId) => {
    const confirmationText = type === 'delivery'
      ? 'هل أنت متأكد من حذف هذه التسليمة؟ تحذير: هذا سيؤثر على الحسابات المحاسبية.'
      : `هل أنت متأكد من حذف هذه ${type === 'payment' ? 'الدفعة' : 'التسوية'}؟`;

    const result = await Swal.fire({
      title: 'تأكيد الحذف',
      text: confirmationText,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonText: 'إلغاء',
      confirmButtonText: 'نعم، احذف',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        if (type === 'delivery') {
          await apiDelete(`/deliveries/${itemId}`, token);
        } else if (type === 'payment') {
          await apiDelete(`/crushers/${id}/payments/${itemId}`, token);
        } else {
          await apiDelete(`/crushers/${id}/adjustments/${itemId}`, token);
        }
        Swal.fire('تم الحذف', 'تم حذف السجل بنجاح', 'success');
        loadDetails();
      } catch (err) {
        Swal.fire('خطأ', err.message || 'فشل حذف العملية', 'error');
      }
    }
  };

  const generateReport = (type) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    if (type === 'deliveries') {
      if (!repFrom || !repTo) {
        Swal.fire('تنبيه', 'يرجى تحديد فترة زمنية للتقرير', 'warning');
        return;
      }
      window.open(`${baseUrl}/crushers/${id}/reports/deliveries?from=${repFrom}&to=${repTo}`, '_blank');
    } else {
      let url = `${baseUrl}/crushers/${id}/reports/statement`;
      if (useStmtDates) {
        if (!stmtFrom || !stmtTo) {
          Swal.fire('تنبيه', 'يرجى تحديد فترة زمنية لكشف الحساب', 'warning');
          return;
        }
        url += `?from=${stmtFrom}&to=${stmtTo}`;
      }
      window.open(url, '_blank');
    }
  };

  const handleOpenReceipt = (imageUrl) => {
    Swal.fire({
      imageUrl: imageUrl,
      imageAlt: 'Receipt',
      confirmButtonText: 'إغلاق',
      imageMaxHeight: 500
    });
  };

  if (loading) return <Loader text="جاري تحميل تفاصيل الكسارة..." />;
  if (!data) return <div className="error-box">حدث خطأ في تحميل التفاصيل</div>;

  const { crusher, totals, materialTotals } = data;
  const balance = totals.net || totals.balance || 0;
  const balanceClass = balance > 0 ? 'text-danger' : balance < 0 ? 'text-success' : 'text-muted';
  const balanceLabel = balance > 0 ? '(مستحق للكسارة)' : balance < 0 ? '(مستحق لنا)' : '(متوازن)';

  // Calculate max quantity for progress bars
  const maxQuantity = materialTotals && materialTotals.length > 0
    ? Math.max(...materialTotals.map(m => m.total_quantity || 0))
    : 1;

  return (
    <div className="crusher-details-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{crusher.name}</h1>
          <p className="page-subtitle">دفتر الأستاذ والعمليات المالية للكسارة</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => { setSelectedItem(null); setActiveModal('payment'); }}>
            إضافة دفعة
          </button>
          <button className="btn btn-secondary" onClick={() => { setSelectedItem(null); setActiveModal('adjustment'); }}>
            تسجيل تسوية
          </button>
        </div>
      </div>

      {/* Summary Grid */}
      <div className="summary-grid">
        <div className="summary-card">
          <span className="summary-card-lbl">الرصيد الافتتاحي</span>
          <span className="summary-card-val">{formatCurrency(totals.openingBalance || 0)}</span>
        </div>
        <div className="summary-card text-danger">
          <span className="summary-card-lbl">المطلوب الأساسي</span>
          <span className="summary-card-val">{formatCurrency(totals.totalRequired || 0)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-card-lbl">التسويات</span>
          <span className={`summary-card-val ${(totals.totalAdjustments || 0) >= 0 ? 'text-danger' : 'text-success'}`}>
            {formatCurrency(Math.abs(totals.totalAdjustments || 0))}
          </span>
        </div>
        <div className="summary-card text-success">
          <span className="summary-card-lbl">المدفوع</span>
          <span className="summary-card-val">{formatCurrency(totals.totalPaid || 0)}</span>
        </div>
        <div className="summary-card featured">
          <span className="summary-card-lbl">الرصيد الصافي</span>
          <span className={`summary-card-val ${balanceClass}`}>
            {formatCurrency(Math.abs(balance))} <small>{balanceLabel}</small>
          </span>
        </div>
      </div>

      {/* Materials Progress Tracker */}
      {materialTotals && materialTotals.length > 0 && (
        <div className="materials-tracker">
          <h2 className="section-title">إجمالي المواد الموردة</h2>
          <div className="materials-grid">
            {materialTotals.map((mat, idx) => {
              const percentage = maxQuantity > 0 ? (mat.total_quantity / maxQuantity) * 100 : 0;
              return (
                <div className="material-card" key={idx}>
                  <div className="material-header">
                    <span className="material-name">{mat.material}</span>
                    <span className="material-quantity">{formatQuantity(mat.total_quantity)} م³</span>
                  </div>
                  <div className="material-value">{formatCurrency(mat.total_value || 0)}</div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reports Section */}
      <div className="reports-section">
        <div className="report-card">
          <h3>تقرير التوصيلات / المشاوير</h3>
          <div className="filter-row">
            <input type="date" value={repFrom} onChange={(e) => setRepFrom(e.target.value)} className="form-input" />
            <input type="date" value={repTo} onChange={(e) => setRepTo(e.target.value)} className="form-input" />
            <button className="btn btn-primary-sm" onClick={() => generateReport('deliveries')}>تحميل PDF</button>
          </div>
        </div>

        <div className="report-card">
          <h3>كشف الحساب العام</h3>
          <div className="filter-row">
            <label className="checkbox-label">
              <input type="checkbox" checked={useStmtDates} onChange={(e) => setUseStmtDates(e.target.checked)} />
              تحديد فترة مخصصة
            </label>
            {useStmtDates && (
              <>
                <input type="date" value={stmtFrom} onChange={(e) => setStmtFrom(e.target.value)} className="form-input" />
                <input type="date" value={stmtTo} onChange={(e) => setStmtTo(e.target.value)} className="form-input" />
              </>
            )}
            <button className="btn btn-secondary-sm" onClick={() => generateReport('statement')}>تحميل PDF</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button className={`tab-btn ${tab === 'deliveries' ? 'active' : ''}`} onClick={() => setTab('deliveries')}>التوصيلات</button>
        <button className={`tab-btn ${tab === 'payments' ? 'active' : ''}`} onClick={() => setTab('payments')}>المدفوعات</button>
        <button className={`tab-btn ${tab === 'adjustments' ? 'active' : ''}`} onClick={() => setTab('adjustments')}>التسويات</button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {tab === 'deliveries' && (
          <div>
            <div className="table-filters-container" style={{ marginBottom: '1rem', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="بحث في المقاول / المادة / رقم البون..."
                value={delFilters.search}
                onChange={(e) => delFilters.setSearch(e.target.value)}
                className="form-input"
                style={{ maxWidth: '300px', display: 'inline-block' }}
              />
              <input
                type="date"
                value={delFilters.dateFrom}
                onChange={(e) => delFilters.setDateFrom(e.target.value)}
                className="form-input"
                style={{ maxWidth: '150px', display: 'inline-block' }}
              />
              <input
                type="date"
                value={delFilters.dateTo}
                onChange={(e) => delFilters.setDateTo(e.target.value)}
                className="form-input"
                style={{ maxWidth: '150px', display: 'inline-block' }}
              />
            </div>

            {delFilters.filteredData.length === 0 ? (
              <div className="no-records-text" style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>لا توجد توصيلات مطابقة.</div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>التاريخ</th>
                      <th>المقاول</th>
                      <th>المادة</th>
                      <th>رقم البون</th>
                      <th>كعب السيارة</th>
                      <th>قيمة الخصم</th>
                      <th>الكمية الصافية</th>
                      <th>سعر المتر</th>
                      <th>الإجمالي</th>
                      <th>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {delFilters.filteredData.map(d => {
                      const carVolume = d.car_volume || 0;
                      const discountVolume = d.discount_volume || 0;
                      const netVolume = carVolume - discountVolume;
                      const pricePerMeter = d.crusher_price_per_meter || 0;
                      const total = netVolume * pricePerMeter;

                      return (
                        <tr key={d.id || d._id}>
                          <td>{formatDate(d.created_at)}</td>
                          <td>{d.contractor_name || '-'}</td>
                          <td>{d.material || '-'}</td>
                          <td>{d.voucher || '-'}</td>
                          <td>{formatQuantity(carVolume)} م³</td>
                          <td>{formatQuantity(discountVolume)} م³</td>
                          <td className="font-bold">{formatQuantity(netVolume)} م³</td>
                          <td>{formatCurrency(pricePerMeter)}</td>
                          <td className="font-bold">{formatCurrency(total)}</td>
                          <td>
                            <div className="row-actions">
                              <button className="edit-btn" onClick={() => handleOpenEditDelivery(d)}>
                                <span className="material-symbols-outlined">edit</span>
                              </button>
                              <button className="delete-btn" onClick={() => handleDeleteItem('delivery', d.id || d._id)}>
                                <span className="material-symbols-outlined">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'payments' && (
          <div>
            <div className="table-filters-container" style={{ marginBottom: '1rem', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="بحث في الطريقة / البيان..."
                value={payFilters.search}
                onChange={(e) => payFilters.setSearch(e.target.value)}
                className="form-input"
                style={{ maxWidth: '300px', display: 'inline-block' }}
              />
            </div>

            {payFilters.filteredData.length === 0 ? (
              <div className="no-records-text" style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>لا توجد مدفوعات مسجلة.</div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>التاريخ</th>
                      <th>المبلغ</th>
                      <th>طريقة الدفع</th>
                      <th>التفاصيل</th>
                      <th>ملاحظات</th>
                      <th>المستند</th>
                      <th>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payFilters.filteredData.map(p => (
                      <tr key={p.id || p._id}>
                        <td>{formatDate(p.paid_at)}</td>
                        <td className="text-success font-bold">{formatCurrency(p.amount)}</td>
                        <td>{p.method}</td>
                        <td>{p.details || '-'}</td>
                        <td>{p.note || '-'}</td>
                        <td>
                          {p.payment_image_url ? (
                            <button className="view-img-btn" onClick={() => handleOpenReceipt(p.payment_image_url)}>
                              عرض
                            </button>
                          ) : '-'}
                        </td>
                        <td>
                          <div className="row-actions">
                            <button className="edit-btn" onClick={() => handleOpenEditPayment(p)}>
                              <span className="material-symbols-outlined">edit</span>
                            </button>
                            <button className="delete-btn" onClick={() => handleDeleteItem('payment', p.id || p._id)}>
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'adjustments' && (
          <div>
            <div className="table-filters-container" style={{ marginBottom: '1rem', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="بحث في السبب..."
                value={adjFilters.search}
                onChange={(e) => adjFilters.setSearch(e.target.value)}
                className="form-input"
                style={{ maxWidth: '300px', display: 'inline-block' }}
              />
            </div>

            {adjFilters.filteredData.length === 0 ? (
              <div className="no-records-text" style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>لا توجد تسويات مسجلة.</div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>التاريخ</th>
                      <th>المبلغ</th>
                      <th>النوع</th>
                      <th>السبب</th>
                      <th>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adjFilters.filteredData.map(a => (
                      <tr key={a.id || a._id}>
                        <td>{formatDate(a.created_at)}</td>
                        <td className="font-bold">{formatCurrency(Math.abs(a.amount))}</td>
                        <td className={a.amount >= 0 ? 'text-danger' : 'text-success'}>
                          {a.amount >= 0 ? 'إضافة (مستحق للكسارة)' : 'خصم (مستحق لنا)'}
                        </td>
                        <td>{a.reason || '-'}</td>
                        <td>
                          <div className="row-actions">
                            <button className="edit-btn" onClick={() => handleOpenEditAdjustment(a)}>
                              <span className="material-symbols-outlined">edit</span>
                            </button>
                            <button className="delete-btn" onClick={() => handleDeleteItem('adjustment', a.id || a._id)}>
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <PaymentModal
        isOpen={activeModal === 'payment'}
        onClose={() => { setActiveModal(null); setSelectedItem(null); }}
        onSubmit={handlePaymentSubmit}
        initialData={selectedItem}
      />

      <AdjustmentModal
        isOpen={activeModal === 'adjustment'}
        onClose={() => { setActiveModal(null); setSelectedItem(null); }}
        onSubmit={handleAdjustmentSubmit}
        initialData={selectedItem}
      />

      <CrusherDeliveryModal
        isOpen={activeModal === 'delivery'}
        onClose={() => { setActiveModal(null); setSelectedItem(null); }}
        onSubmit={handleDeliverySubmit}
        initialData={selectedItem}
      />
    </div>
  );
};
