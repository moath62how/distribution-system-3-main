import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export const AddCrusherModal = ({ isOpen, onClose, onSubmit, submitting, clients }) => {
  const [crusherName, setCrusherName] = useState('');
  const [sandPrice, setSandPrice] = useState('');
  const [aggregate1Price, setAggregate1Price] = useState('');
  const [aggregate2Price, setAggregate2Price] = useState('');
  const [aggregate3Price, setAggregate3Price] = useState('');
  const [aggregate6PowderPrice, setAggregate6PowderPrice] = useState('');
  const [openingBalances, setOpeningBalances] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setCrusherName('');
      setSandPrice('');
      setAggregate1Price('');
      setAggregate2Price('');
      setAggregate3Price('');
      setAggregate6PowderPrice('');
      setOpeningBalances([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddOpeningBalanceRow = () => {
    if (clients.length === 0) {
      Swal.fire('تنبيه', 'لا توجد عملاء متاحين. يرجى إضافة عميل أولاً.', 'warning');
      return;
    }
    setOpeningBalances([
      ...openingBalances,
      { id: Date.now(), project_id: '', amount: '', description: '' }
    ]);
  };

  const handleRemoveOpeningBalanceRow = (id) => {
    setOpeningBalances(openingBalances.filter(row => row.id !== id));
  };

  const handleRowChange = (id, field, value) => {
    setOpeningBalances(
      openingBalances.map(row => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!crusherName.trim()) {
      Swal.fire('خطأ', 'يرجى إدخال اسم الكسارة', 'warning');
      return;
    }

    const projectIds = openingBalances
      .filter(row => row.project_id)
      .map(row => row.project_id);
    const uniqueProjectIds = new Set(projectIds);
    if (projectIds.length !== uniqueProjectIds.size) {
      Swal.fire('خطأ', 'لا يمكن تكرار نفس العميل/المشروع في الأرصدة الافتتاحية', 'error');
      return;
    }

    const formattedBalances = openingBalances
      .filter(row => row.project_id && row.amount)
      .map(row => ({
        project_id: row.project_id,
        amount: parseFloat(row.amount) || 0,
        description: row.description || ''
      }));

    onSubmit({
      name: crusherName.trim(),
      sand_price: parseFloat(sandPrice) || 0,
      aggregate1_price: parseFloat(aggregate1Price) || 0,
      aggregate2_price: parseFloat(aggregate2Price) || 0,
      aggregate3_price: parseFloat(aggregate3Price) || 0,
      aggregate6_powder_price: parseFloat(aggregate6PowderPrice) || 0,
      opening_balances: formattedBalances
    });
  };

  return (
    <div className="modal-overlay-custom" onClick={onClose}>
      <div className="modal-content-custom modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-custom">
          <h2>إضافة كسارة جديدة</h2>
          <button onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleFormSubmit}>
          <div className="modal-body-custom">
            <div className="form-group">
              <label htmlFor="crusherName">اسم الكسارة *</label>
              <input
                type="text"
                id="crusherName"
                value={crusherName}
                onChange={(e) => setCrusherName(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="prices-section">
              <h3 className="section-title">أسعار المواد الخام (اختياري)</h3>
              <div className="prices-grid">
                <div className="form-group">
                  <label htmlFor="sandPrice">رمل (ج.م / م³)</label>
                  <input
                    type="number"
                    id="sandPrice"
                    step="0.01"
                    value={sandPrice}
                    onChange={(e) => setSandPrice(e.target.value)}
                    placeholder="0.00"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="aggregate1Price">سن 1 (ج.م / م³)</label>
                  <input
                    type="number"
                    id="aggregate1Price"
                    step="0.01"
                    value={aggregate1Price}
                    onChange={(e) => setAggregate1Price(e.target.value)}
                    placeholder="0.00"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="aggregate2Price">سن 2 (ج.م / م³)</label>
                  <input
                    type="number"
                    id="aggregate2Price"
                    step="0.01"
                    value={aggregate2Price}
                    onChange={(e) => setAggregate2Price(e.target.value)}
                    placeholder="0.00"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="aggregate3Price">سن 3 (ج.م / م³)</label>
                  <input
                    type="number"
                    id="aggregate3Price"
                    step="0.01"
                    value={aggregate3Price}
                    onChange={(e) => setAggregate3Price(e.target.value)}
                    placeholder="0.00"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="aggregate6PowderPrice">سن 6 بودرة (ج.م / م³)</label>
                  <input
                    type="number"
                    id="aggregate6PowderPrice"
                    step="0.01"
                    value={aggregate6PowderPrice}
                    onChange={(e) => setAggregate6PowderPrice(e.target.value)}
                    placeholder="0.00"
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            <div className="balances-section">
              <div className="section-header">
                <h3>الأرصدة الافتتاحية للمشاريع (اختياري)</h3>
                <button type="button" className="btn btn-secondary-sm" onClick={handleAddOpeningBalanceRow}>
                  إضافة رصيد مشروع
                </button>
              </div>

              <div className="balances-list">
                {openingBalances.map(row => (
                  <div className="opening-balance-row" key={row.id}>
                    <div className="form-group-sm">
                      <label>العميل / المشروع</label>
                      <select
                        value={row.project_id}
                        onChange={(e) => handleRowChange(row.id, 'project_id', e.target.value)}
                        className="form-select"
                        required
                      >
                        <option value="">اختر العميل</option>
                        {clients.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group-sm">
                      <label>المبلغ</label>
                      <input
                        type="number"
                        step="0.01"
                        value={row.amount}
                        onChange={(e) => handleRowChange(row.id, 'amount', e.target.value)}
                        placeholder="0.00"
                        className="form-input"
                        required
                      />
                    </div>

                    <div className="form-group-sm col-span-2">
                      <label>الوصف</label>
                      <input
                        type="text"
                        value={row.description}
                        onChange={(e) => handleRowChange(row.id, 'description', e.target.value)}
                        placeholder="اختياري"
                        className="form-input"
                      />
                    </div>

                    <button
                      type="button"
                      className="btn btn-danger-sm remove-row-btn"
                      onClick={() => handleRemoveOpeningBalanceRow(row.id)}
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer-custom">
            <button type="button" className="btn btn-secondary" onClick={onClose}>إلغاء</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
