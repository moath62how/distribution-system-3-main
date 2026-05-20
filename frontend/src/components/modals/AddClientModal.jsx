import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export const AddClientModal = ({ isOpen, onClose, onSubmit, submitting, error }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setPhone('');
      setOpeningBalance('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      Swal.fire('خطأ', 'اسم العميل مطلوب', 'warning');
      return;
    }
    onSubmit({
      name: name.trim(),
      phone: phone.trim() || null,
      opening_balance: parseFloat(openingBalance) || 0
    });
  };

  return (
    <div className="modal-overlay-custom" onClick={onClose}>
      <div className="modal-content-custom" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-custom">
          <h2>إضافة عميل جديد</h2>
          <button onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleFormSubmit}>
          <div className="modal-body-custom">
            {error && <div className="alert alert-error">{error}</div>}
            
            <div className="form-group-modern">
              <label className="form-label-modern" htmlFor="modalName">اسم العميل *</label>
              <input
                type="text"
                id="modalName"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="أدخل الاسم الرباعي"
                required
              />
            </div>

            <div className="form-group-modern">
              <label className="form-label-modern" htmlFor="modalPhone">رقم الهاتف</label>
              <input
                type="tel"
                id="modalPhone"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="اختياري"
              />
            </div>

            <div className="form-group-modern">
              <label className="form-label-modern" htmlFor="modalOpeningBalance">الرصيد الافتتاحي (جنيه)</label>
              <input
                type="number"
                id="modalOpeningBalance"
                className="form-input"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                step="0.01"
                placeholder="0.00"
              />
              <small style={{ color: 'var(--gray-500)', fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>
                موجب = العميل مدين لنا، سالب = نحن مدينون للعميل
              </small>
            </div>
          </div>
          <div className="modal-footer-custom">
            <button type="button" className="btn btn-secondary" onClick={onClose}>إلغاء</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'جاري الحفظ...' : 'إضافة العميل'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
