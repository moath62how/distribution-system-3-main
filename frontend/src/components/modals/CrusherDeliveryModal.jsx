import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export const CrusherDeliveryModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [form, setForm] = useState({
    material: '',
    voucher: '',
    car_volume: '',
    discount_volume: '',
    crusher_price_per_meter: ''
  });

  useEffect(() => {
    if (isOpen && initialData) {
      setForm({
        material: initialData.material || '',
        voucher: initialData.voucher || '',
        car_volume: initialData.car_volume || '',
        discount_volume: initialData.discount_volume || '0',
        crusher_price_per_meter: initialData.crusher_price_per_meter || ''
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
    if (!form.material || !form.voucher || !form.car_volume || !form.crusher_price_per_meter) {
      Swal.fire('خطأ', 'يرجى ملء الحقول الإلزامية', 'warning');
      return;
    }
    const carVolume = parseFloat(form.car_volume) || 0;
    const discountVolume = parseFloat(form.discount_volume) || 0;
    onSubmit({
      ...form,
      car_volume: carVolume,
      discount_volume: discountVolume,
      net_volume: carVolume - discountVolume,
      crusher_price_per_meter: parseFloat(form.crusher_price_per_meter)
    });
  };

  return (
    <div className="modal-overlay-custom" onClick={onClose}>
      <div className="modal-content-custom" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-custom">
          <h2>تعديل بيانات التوصيل للكسارة</h2>
          <button onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleFormSubmit}>
          <div className="modal-body-custom">
            <div className="form-group">
              <label>المادة *</label>
              <input
                type="text"
                name="material"
                value={form.material}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label>رقم البون *</label>
              <input
                type="text"
                name="voucher"
                value={form.voucher}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label>كعب السيارة (م³)*</label>
              <input
                type="number"
                step="0.01"
                name="car_volume"
                value={form.car_volume}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label>قيمة الخصم (م³)</label>
              <input
                type="number"
                step="0.01"
                name="discount_volume"
                value={form.discount_volume}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>سعر المتر للكسارة (ج.م) *</label>
              <input
                type="number"
                step="0.01"
                name="crusher_price_per_meter"
                value={form.crusher_price_per_meter}
                onChange={handleChange}
                className="form-input"
                required
              />
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
