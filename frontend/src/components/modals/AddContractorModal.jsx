import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export const AddContractorModal = ({ isOpen, onClose, onSubmit, submitting, clients }) => {
  const [name, setName] = useState('');
  const [openingBalances, setOpeningBalances] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setName('');
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
    if (!name.trim()) {
      Swal.fire('خطأ', 'يرجى إدخال اسم المقاول', 'warning');
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
      name: name.trim(),
      opening_balances: formattedBalances
    });
  };

  return (
    <div className="modal-overlay-custom" onClick={onClose}>
      <div className="modal-content-custom" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-custom">
          <h2>إضافة مقاول جديد</h2>
          <button onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleFormSubmit}>
          <div className="modal-body-custom">
            <div className="form-group">
              <label htmlFor="contractorName">اسم المقاول *</label>
              <input
                type="text"
                id="contractorName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                required
              />
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
