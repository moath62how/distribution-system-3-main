import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export const AdjustmentModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [type, setType] = useState('addition');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const val = parseFloat(initialData.amount) || 0;
        setType(val >= 0 ? 'addition' : 'deduction');
        setAmount(String(Math.abs(val)));
        setReason(initialData.reason || '');
      } else {
        setType('addition');
        setAmount('');
        setReason('');
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      Swal.fire('خطأ', 'يرجى إدخال مبلغ صحيح أكبر من الصفر', 'warning');
      return;
    }
    if (!reason.trim()) {
      Swal.fire('خطأ', 'يرجى إدخال سبب التسوية', 'warning');
      return;
    }

    const calculatedAmount = type === 'addition' ? val : -val;
    onSubmit({
      amount: calculatedAmount,
      reason: reason.trim()
    });
  };

  return (
    <div className="modal-overlay-custom" onClick={onClose}>
      <div className="modal-content-custom" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-custom">
          <h2>{initialData ? 'تعديل التسوية' : 'إضافة تسوية جديدة'}</h2>
          <button onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleFormSubmit}>
          <div className="modal-body-custom">
            <div className="form-group">
              <label>نوع التسوية *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="form-select"
              >
                <option value="addition">إضافة (+) لصافي الحساب</option>
                <option value="deduction">خصم (-) من صافي الحساب</option>
              </select>
            </div>
            <div className="form-group">
              <label>القيمة *</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label>سبب التسوية *</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="form-input"
                required
              />
            </div>
          </div>
          <div className="modal-footer-custom">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              إلغاء
            </button>
            <button type="submit" className="btn btn-primary">
              حفظ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
