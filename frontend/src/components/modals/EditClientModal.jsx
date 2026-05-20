import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export const EditClientModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    opening_balance: 0
  });

  useEffect(() => {
    if (isOpen && initialData) {
      setForm({
        name: initialData.name || '',
        phone: initialData.phone || '',
        opening_balance: initialData.opening_balance || 0
      });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      Swal.fire('خطأ', 'اسم العميل مطلوب', 'warning');
      return;
    }
    onSubmit({
      ...form,
      opening_balance: parseFloat(form.opening_balance) || 0
    });
  };

  return (
    <div className="modal-overlay-custom" onClick={onClose}>
      <div className="modal-content-custom" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-custom">
          <h2>تعديل بيانات العميل</h2>
          <button onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleFormSubmit}>
          <div className="modal-body-custom">
            <div className="form-group">
              <label>الاسم *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label>رقم الهاتف</label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>الرصيد الافتتاحي (ج.م)</label>
              <input
                type="number"
                step="0.01"
                name="opening_balance"
                value={form.opening_balance}
                onChange={handleChange}
                className="form-input"
              />
              <small style={{ color: 'var(--gray-500)', fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>
                موجب = العميل مدين لنا، سالب = نحن مدينون للعميل
              </small>
            </div>
          </div>
          <div className="modal-footer-custom">
            <button type="button" className="btn btn-secondary" onClick={onClose}>إلغاء</button>
            <button type="submit" className="btn btn-primary">حفظ</button>
          </div>
        </form>
      </div>
    </div>
  );
};
