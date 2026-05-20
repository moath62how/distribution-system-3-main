import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api';
import { formatCurrency, formatDate, formatQuantity } from '../utils/formatters';
import { Loader } from '../components/Loader';
import { useTableFilters } from '../hooks/useTableFilters';
import { EditClientModal } from '../components/modals/EditClientModal';
import { PaymentModal } from '../components/modals/PaymentModal';
import { AdjustmentModal } from '../components/modals/AdjustmentModal';
import { ClientDeliveryModal } from '../components/modals/ClientDeliveryModal';
import Swal from 'sweetalert2';
import './ClientDetails.css';

export const ClientDetails = () => {
  const { id } = useParams();
  const { token } = useAuth();

  const [client, setClient] = useState(null);
  const [totals, setTotals] = useState(null);
  const [materialTotals, setMaterialTotals] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [payments, setPayments] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeModal, setActiveModal] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const [delReportDates, setDelReportDates] = useState({ from: '', to: '' });
  const [statementReport, setStatementReport] = useState({ useDates: false, from: '', to: '' });

  // Custom table filter hooks
  const delFilters = useTableFilters({
    data: deliveries,
    searchFields: ['material', 'voucher', 'driver_name'],
    dateField: 'created_at',
    initialSort: 'date-desc',
    sortComparator: useCallback((a, b, sort) => {
      if (sort === 'date-asc') return new Date(a.created_at) - new Date(b.created_at);
      if (sort === 'date-desc') return new Date(b.created_at) - new Date(a.created_at);
      if (sort === 'value-asc') return (a.total_value || 0) - (b.total_value || 0);
      if (sort === 'value-desc') return (b.total_value || 0) - (a.total_value || 0);
      return 0;
    }, [])
  });

  const payFilters = useTableFilters({
    data: payments,
    searchFields: ['method', 'note', 'details'],
    dateField: 'paid_at',
    initialSort: 'date-desc',
    sortComparator: useCallback((a, b, sort) => {
      if (sort === 'date-asc') return new Date(a.paid_at) - new Date(b.paid_at);
      if (sort === 'date-desc') return new Date(b.paid_at) - new Date(a.paid_at);
      if (sort === 'amount-asc') return a.amount - b.amount;
      if (sort === 'amount-desc') return b.amount - a.amount;
      return 0;
    }, [])
  });

  const adjFilters = useTableFilters({
    data: adjustments,
    searchFields: ['reason'],
    dateField: 'created_at',
    initialSort: 'date-desc',
    sortComparator: useCallback((a, b, sort) => {
      if (sort === 'date-asc') return new Date(a.created_at) - new Date(b.created_at);
      if (sort === 'date-desc') return new Date(b.created_at) - new Date(a.created_at);
      if (sort === 'amount-asc') return a.amount - b.amount;
      if (sort === 'amount-desc') return b.amount - a.amount;
      return 0;
    }, [])
  });

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await apiGet(`/clients/${id}`, token);
      setClient(data.client);
      setTotals(data.totals);
      setMaterialTotals(data.materialTotals || []);
      setDeliveries(data.deliveries || []);
      setPayments(data.payments || []);
      setAdjustments(data.adjustments || []);
    } catch (err) {
      console.error(err);
      Swal.fire('خطأ', 'فشل تحميل بيانات العميل التفصيلية', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    loadData();
    const today = new Date().toISOString().split('T')[0];
    const firstOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    
    setDelReportDates({ from: firstOfYear, to: today });
  }, [loadData]);

  const handleClientSubmit = async (formData) => {
    try {
      await apiPut(`/clients/${id}`, formData, token);
      Swal.fire('تم التعديل', 'تم تحديث بيانات العميل بنجاح', 'success');
      setActiveModal(null);
      loadData();
    } catch (err) {
      Swal.fire('خطأ', err.message, 'error');
    }
  };

  const handlePaymentSubmit = async (formData) => {
    try {
      const payload = {
        amount: formData.amount,
        paid_at: formData.paid_at,
        method: formData.method,
        note: formData.note,
        details: formData.details || undefined,
        payment_image: formData.image || undefined
      };

      if (selectedItem) {
        await apiPut(`/clients/${id}/payments/${selectedItem.id || selectedItem._id}`, payload, token);
        Swal.fire('تم بنجاح', 'تم تحديث الدفعة المالية بنجاح', 'success');
      } else {
        await apiPost(`/clients/${id}/payments`, payload, token);
        Swal.fire('تم بنجاح', 'تم إضافة الدفعة المالية بنجاح', 'success');
      }
      
      setActiveModal(null);
      setSelectedItem(null);
      loadData();
    } catch (err) {
      Swal.fire('خطأ', err.message, 'error');
    }
  };

  const handleEditPaymentOpen = (pay) => {
    setSelectedItem({
      id: pay.id || pay._id,
      amount: pay.amount,
      paid_at: pay.paid_at,
      method: pay.method,
      details: pay.details,
      note: pay.note,
      payment_image: pay.payment_image || pay.payment_image_url
    });
    setActiveModal('payment');
  };

  const handleDeletePayment = async (payId) => {
    const confirm = await Swal.fire({
      title: 'تأكيد الحذف',
      text: 'هل أنت متأكد من حذف هذه الدفعة المالية؟',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'احذف',
      cancelButtonText: 'إلغاء'
    });

    if (confirm.isConfirmed) {
      try {
        await apiDelete(`/clients/${id}/payments/${payId}`, token);
        Swal.fire('تم الحذف', 'تم حذف الدفعة بنجاح', 'success');
        loadData();
      } catch (err) {
        Swal.fire('خطأ', err.message, 'error');
      }
    }
  };

  const handleAdjustmentSubmit = async (formData) => {
    try {
      if (selectedItem) {
        await apiPut(`/clients/${id}/adjustments/${selectedItem.id || selectedItem._id}`, formData, token);
        Swal.fire('تم بنجاح', 'تم تحديث التسوية بنجاح', 'success');
      } else {
        await apiPost(`/clients/${id}/adjustments`, formData, token);
        Swal.fire('تم بنجاح', 'تم إضافة التسوية بنجاح', 'success');
      }
      
      setActiveModal(null);
      setSelectedItem(null);
      loadData();
    } catch (err) {
      Swal.fire('خطأ', err.message, 'error');
    }
  };

  const handleEditAdjustmentOpen = (adj) => {
    setSelectedItem({
      id: adj.id || adj._id,
      amount: adj.amount,
      reason: adj.reason
    });
    setActiveModal('adjustment');
  };

  const handleDeleteAdjustment = async (adjId) => {
    const confirm = await Swal.fire({
      title: 'تأكيد الحذف',
      text: 'هل أنت متأكد من حذف هذه التسوية؟',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'احذف',
      cancelButtonText: 'إلغاء'
    });

    if (confirm.isConfirmed) {
      try {
        await apiDelete(`/clients/${id}/adjustments/${adjId}`, token);
        Swal.fire('تم الحذف', 'تم حذف التسوية بنجاح', 'success');
        loadData();
      } catch (err) {
        Swal.fire('خطأ', err.message, 'error');
      }
    }
  };

  const handleDeliverySubmit = async (formData) => {
    try {
      const payload = {
        ...formData,
        crusher_id: selectedItem.crusher_id,
        supplier_id: selectedItem.supplier_id,
        contractor_id: selectedItem.contractor_id,
        client_id: selectedItem.client_id
      };
      await apiPut(`/deliveries/${selectedItem.id || selectedItem._id}`, payload, token);
      Swal.fire('تم التعديل', 'تم تحديث بيانات التوصيل بنجاح', 'success');
      setActiveModal(null);
      setSelectedItem(null);
      loadData();
    } catch (err) {
      Swal.fire('خطأ', err.message, 'error');
    }
  };

  const handleEditDeliveryOpen = (del) => {
    setSelectedItem(del);
    setActiveModal('delivery');
  };

  const handleDeleteDelivery = async (delId) => {
    const confirm = await Swal.fire({
      title: 'تأكيد الحذف',
      text: 'هل أنت متأكد من حذف هذا التوريد؟ سيتم حذف القيود المالية المصاحبة.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'احذف',
      cancelButtonText: 'إلغاء'
    });

    if (confirm.isConfirmed) {
      try {
        await apiDelete(`/deliveries/${delId}`, token);
        Swal.fire('تم الحذف', 'تم حذف التوريد بنجاح', 'success');
        loadData();
      } catch (err) {
        Swal.fire('خطأ', err.message, 'error');
      }
    }
  };

  const handleOpenReceipt = (imageUrl) => {
    if (!imageUrl) {
      Swal.fire('تنبيه', 'لا يوجد إيصال مرفق بهذه الدفعة', 'info');
      return;
    }
    let src = imageUrl;
    if (!imageUrl.startsWith('data:') && !imageUrl.startsWith('http')) {
      const format = imageUrl.startsWith('/9j') ? 'jpeg' : 'png';
      src = `data:image/${format};base64,${imageUrl}`;
    }
    Swal.fire({
      imageUrl: src,
      imageAlt: 'إيصال السداد',
      confirmButtonText: 'إغلاق',
      imageMaxHeight: 500
    });
  };

  const handleDownloadDeliveriesReport = () => {
    const { from, to } = delReportDates;
    if (!from || !to) {
      Swal.fire('تنبيه', 'يرجى تحديد تاريخ البداية والنهاية أولاً', 'warning');
      return;
    }
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    const reportUrl = `${apiBase}/clients/${id}/reports/deliveries?from=${from}&to=${to}`;
    window.open(reportUrl, '_blank');
  };

  const handleDownloadStatement = () => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    let reportUrl = `${apiBase}/clients/${id}/reports/statement`;
    if (statementReport.useDates) {
      if (!statementReport.from || !statementReport.to) {
        Swal.fire('تنبيه', 'يرجى تحديد فترة كشف الحساب المطلوبة', 'warning');
        return;
      }
      reportUrl += `?from=${statementReport.from}&to=${statementReport.to}`;
    }
    window.open(reportUrl, '_blank');
  };

  if (loading) return <Loader text="جاري تحميل تفاصيل حساب العميل..." />;
  if (!client) return <div className="error-box">حدث خطأ أثناء تحميل بيانات العميل</div>;

  const currentBalance = totals?.balance || 0;
  const openingBalanceVal = totals?.openingBalance || 0;
  const isBalanceOwed = currentBalance > 0;
  const isBalanceCredit = currentBalance < 0;

  return (
    <div className="client-details-container">
      {/* 1. Header Section */}
      <div className="flex-header">
        <div>
          <h2 className="title-text font-headline">
            <span className="material-symbols-outlined header-person-icon">person</span>
            تفاصيل العميل: {client.name}
          </h2>
          <p className="subtitle-text">
            الهاتف: {client.phone || 'غير مسجل'} • تاريخ التسجيل: {formatDate(client.created_at)}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setActiveModal('editClient')}>
          <span className="material-symbols-outlined">edit</span>
          تعديل البيانات
        </button>
      </div>

      {/* 2. Financial Summary */}
      <section className="dashboard-section">
        <h3 className="section-header-title font-headline">
          <span className="bullet-indicator bg-primary"></span>
          الملخص المالي العام
        </h3>
        <div className="financial-stats-grid">
          <div className="stat-box-modern">
            <div className="stat-val text-muted">{formatCurrency(Math.abs(openingBalanceVal))}</div>
            <div className="stat-lbl">الرصيد الافتتاحي {openingBalanceVal > 0 ? '(لنا)' : openingBalanceVal < 0 ? '(للعميل)' : ''}</div>
          </div>
          <div className="stat-box-modern">
            <div className="stat-val text-success">{formatCurrency(totals?.totalDeliveries || 0)}</div>
            <div className="stat-lbl">إجمالي التوريدات (الحسابات)</div>
          </div>
          <div className="stat-box-modern">
            <div className="stat-val text-danger">{formatCurrency(totals?.totalPayments || 0)}</div>
            <div className="stat-lbl">إجمالي المبالغ المدفوعة</div>
          </div>
          <div className="stat-box-modern">
            <div className="stat-val">{formatCurrency(totals?.totalAdjustments || 0)}</div>
            <div className="stat-lbl">إجمالي التسويات</div>
          </div>
          <div className={`stat-box-modern highlight-border ${isBalanceOwed ? 'border-owed' : isBalanceCredit ? 'border-credit' : ''}`}>
            <div className={`stat-val ${isBalanceOwed ? 'text-danger' : isBalanceCredit ? 'text-success' : 'text-muted'}`}>
              {formatCurrency(Math.abs(currentBalance))}
            </div>
            <div className="stat-lbl font-bold">
              صافي رصيد الحساب {isBalanceOwed ? '(مستحق لنا)' : isBalanceCredit ? '(مستحق للعميل)' : '(متوازن)'}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Materials Summary */}
      <section className="dashboard-section">
        <h3 className="section-header-title font-headline">
          <span className="bullet-indicator bg-success"></span>
          ملخص إحصائيات المواد الموردة
        </h3>
        {materialTotals.length === 0 ? (
          <div className="empty-subcard">لم يتم توريد أي كميات مواد لهذا العميل حتى الآن</div>
        ) : (
          <div className="materials-summary-cards">
            {materialTotals.map((mat, i) => (
              <div className="material-summary-card" key={i}>
                <div className="mat-card-header">
                  <span className="material-symbols-outlined mat-box-icon">category</span>
                  <span>{mat.material}</span>
                </div>
                <div className="mat-card-body">
                  <div className="mat-field">
                    <span>الكمية الكلية:</span>
                    <strong>{formatQuantity(mat.totalQty)} م³</strong>
                  </div>
                  <div className="mat-field">
                    <span>القيمة الكلية:</span>
                    <strong>{formatCurrency(mat.totalValue)}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Deliveries Table Section */}
      <section className="table-card-section">
        <div className="table-card-header">
          <h3 className="table-section-title">سجل عمليات التوريد والتسليم</h3>
          <div className="table-filters-container">
            <input
              type="text"
              placeholder="بحث في المواد / البون / السائق..."
              value={delFilters.search}
              onChange={(e) => delFilters.setSearch(e.target.value)}
              className="filter-input-small"
            />
            <input
              type="date"
              value={delFilters.dateFrom}
              onChange={(e) => delFilters.setDateFrom(e.target.value)}
              className="filter-input-small"
            />
            <input
              type="date"
              value={delFilters.dateTo}
              onChange={(e) => delFilters.setDateTo(e.target.value)}
              className="filter-input-small"
            />
            <select
              value={delFilters.sort}
              onChange={(e) => delFilters.setSort(e.target.value)}
              className="filter-input-small"
            >
              <option value="date-desc">التاريخ (الأحدث أولاً)</option>
              <option value="date-asc">التاريخ (الأقدم أولاً)</option>
              <option value="value-desc">القيمة (الأعلى أولاً)</option>
              <option value="value-asc">القيمة (الأقل أولاً)</option>
            </select>
          </div>
        </div>

        {delFilters.filteredData.length === 0 ? (
          <div className="no-records-text">لا توجد سجلات توريد تطابق الفلاتر المحددة.</div>
        ) : (
          <div className="responsive-table-wrapper">
            <table className="table-content-design">
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>رقم البون</th>
                  <th>الكسارة</th>
                  <th>المقاول</th>
                  <th>المادة</th>
                  <th>الكمية الكلية</th>
                  <th>سعر المتر</th>
                  <th>القيمة الكلية</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {delFilters.filteredData.map((d) => (
                  <tr key={d._id || d.id}>
                    <td>{formatDate(d.created_at)}</td>
                    <td>{d.voucher}</td>
                    <td>{d.crusher_name || '-'}</td>
                    <td>{d.contractor_name || '-'}</td>
                    <td>{d.material}</td>
                    <td>{formatQuantity(d.quantity)} م³</td>
                    <td>{formatCurrency(d.price_per_meter)}</td>
                    <td className="font-bold">{formatCurrency(d.total_value)}</td>
                    <td>
                      <div className="row-action-buttons">
                        <button
                          className="row-btn-icon edit"
                          onClick={() => handleEditDeliveryOpen(d)}
                          title="تعديل"
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button
                          className="row-btn-icon delete"
                          onClick={() => handleDeleteDelivery(d._id || d.id)}
                          title="حذف"
                        >
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
      </section>

      {/* 5. Payments & Adjustments Section */}
      <div className="bottom-sections-split">
        {/* Payments Column */}
        <div className="table-card-section split-col">
          <div className="table-card-header flex-spaced">
            <h3 className="table-section-title">دفاتر المدفوعات والتحصيلات</h3>
            <button className="btn btn-primary btn-sm-add" onClick={() => { setSelectedItem(null); setActiveModal('payment'); }}>
              <span className="material-symbols-outlined">add</span>
              إضافة دفعة
            </button>
          </div>
          <div className="table-filters-container split-filters">
            <input
              type="text"
              placeholder="بحث في الطريقة / البيان..."
              value={payFilters.search}
              onChange={(e) => payFilters.setSearch(e.target.value)}
              className="filter-input-small"
            />
            <input
              type="date"
              value={payFilters.dateFrom}
              onChange={(e) => payFilters.setDateFrom(e.target.value)}
              className="filter-input-small"
            />
            <input
              type="date"
              value={payFilters.dateTo}
              onChange={(e) => payFilters.setDateTo(e.target.value)}
              className="filter-input-small"
            />
          </div>

          {payFilters.filteredData.length === 0 ? (
            <div className="no-records-text">لا توجد دفعات مالية مسجلة.</div>
          ) : (
            <div className="responsive-table-wrapper">
              <table className="table-content-design">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>المبلغ</th>
                    <th>الطريقة</th>
                    <th>ملاحظات</th>
                    <th>المستند</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {payFilters.filteredData.map((p) => (
                    <tr key={p._id || p.id}>
                      <td>{formatDate(p.paid_at)}</td>
                      <td className="text-success font-bold">{formatCurrency(p.amount)}</td>
                      <td>{p.method}</td>
                      <td>{p.note || '-'}</td>
                      <td>
                        {p.payment_image || p.payment_image_url ? (
                          <button
                            className="row-btn-icon view"
                            onClick={() => handleOpenReceipt(p.payment_image || p.payment_image_url)}
                            title="عرض الإيصال"
                          >
                            <span className="material-symbols-outlined">visibility</span>
                          </button>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        <div className="row-action-buttons">
                          <button
                            className="row-btn-icon edit"
                            onClick={() => handleEditPaymentOpen(p)}
                            title="تعديل"
                          >
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <button
                            className="row-btn-icon delete"
                            onClick={() => handleDeletePayment(p._id || p.id)}
                            title="حذف"
                          >
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

        {/* Adjustments Column */}
        <div className="table-card-section split-col">
          <div className="table-card-header flex-spaced">
            <h3 className="table-section-title">التسويات المالية الاستثنائية</h3>
            <button className="btn btn-secondary btn-sm-add" onClick={() => { setSelectedItem(null); setActiveModal('adjustment'); }}>
              <span className="material-symbols-outlined">add</span>
              إضافة تسوية
            </button>
          </div>
          <div className="table-filters-container split-filters">
            <input
              type="text"
              placeholder="بحث في السبب..."
              value={adjFilters.search}
              onChange={(e) => adjFilters.setSearch(e.target.value)}
              className="filter-input-small"
            />
          </div>

          {adjFilters.filteredData.length === 0 ? (
            <div className="no-records-text">لا توجد تسويات مسجلة.</div>
          ) : (
            <div className="responsive-table-wrapper">
              <table className="table-content-design">
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
                  {adjFilters.filteredData.map((a) => (
                    <tr key={a._id || a.id}>
                      <td>{formatDate(a.created_at)}</td>
                      <td className="font-bold">{formatCurrency(Math.abs(a.amount))}</td>
                      <td className={a.amount >= 0 ? 'text-danger' : 'text-success'}>
                        {a.amount >= 0 ? 'إضافة (+)' : 'خصم (-)'}
                      </td>
                      <td>{a.reason}</td>
                      <td>
                        <div className="row-action-buttons">
                          <button
                            className="row-btn-icon edit"
                            onClick={() => handleEditAdjustmentOpen(a)}
                            title="تعديل"
                          >
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <button
                            className="row-btn-icon delete"
                            onClick={() => handleDeleteAdjustment(a._id || a.id)}
                            title="حذف"
                          >
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
      </div>

      {/* 6. Reports Section */}
      <div className="reports-section-grid">
        <div className="report-card bg-light-primary">
          <h4 className="report-title">
            <span className="material-symbols-outlined">picture_as_pdf</span>
            تقرير التوريدات التفصيلي (PDF)
          </h4>
          <p className="report-desc">تنزيل تقرير كامل بجميع بونات التوريد والتسليم المعتمدة للعميل خلال فترة محددة.</p>
          <div className="report-dates-row">
            <div>
              <label>من تاريخ</label>
              <input
                type="date"
                value={delReportDates.from}
                onChange={(e) => setDelReportDates(prev => ({ ...prev, from: e.target.value }))}
                className="filter-input-small"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label>إلى تاريخ</label>
              <input
                type="date"
                value={delReportDates.to}
                onChange={(e) => setDelReportDates(prev => ({ ...prev, to: e.target.value }))}
                className="filter-input-small"
                style={{ width: '100%' }}
              />
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleDownloadDeliveriesReport}
            style={{ width: '100%', marginTop: '1rem' }}
          >
            تحميل التقرير التفصيلي
          </button>
        </div>

        <div className="report-card bg-light-success">
          <h4 className="report-title">
            <span className="material-symbols-outlined">receipt_long</span>
            كشف حساب العميل الإجمالي
          </h4>
          <p className="report-desc">تصدير كشف حساب يوضح الرصيد الافتتاحي وتفاصيل التوريدات والمدفوعات والتسويات.</p>
          <div className="statement-checkbox-wrapper">
            <label className="flex-checkbox-label">
              <input
                type="checkbox"
                checked={statementReport.useDates}
                onChange={(e) => setStatementReport(prev => ({ ...prev, useDates: e.target.checked }))}
              />
              تحديد فترة مخصصة
            </label>
          </div>
          {statementReport.useDates && (
            <div className="report-dates-row">
              <div>
                <label>من تاريخ</label>
                <input
                  type="date"
                  value={statementReport.from}
                  onChange={(e) => setStatementReport(prev => ({ ...prev, from: e.target.value }))}
                  className="filter-input-small"
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label>إلى تاريخ</label>
                <input
                  type="date"
                  value={statementReport.to}
                  onChange={(e) => setStatementReport(prev => ({ ...prev, to: e.target.value }))}
                  className="filter-input-small"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          )}
          <button
            className="btn btn-secondary"
            onClick={handleDownloadStatement}
            style={{ width: '100%', marginTop: '1rem' }}
          >
            تحميل كشف الحساب
          </button>
        </div>
      </div>

      {/* 7. Modals */}
      <EditClientModal
        isOpen={activeModal === 'editClient'}
        onClose={() => setActiveModal(null)}
        onSubmit={handleClientSubmit}
        initialData={client}
      />

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

      <ClientDeliveryModal
        isOpen={activeModal === 'delivery'}
        onClose={() => { setActiveModal(null); setSelectedItem(null); }}
        onSubmit={handleDeliverySubmit}
        initialData={selectedItem}
      />
    </div>
  );
};
