import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export const ClientDeliveryModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [form, setForm] = useState({
    material: '',
    voucher: '',
    quantity: '',
    price_per_meter: '',
    driver_name: '',
    car_head: '',
    car_tail: ''
  });

  useEffect(() => {
    if (isOpen && initialData) {
      setForm({
        material: initialData.material || '',
        voucher: initialData.voucher || '',
        quantity: initialData.quantity || '',
        price_per_meter: initialData.price_per_meter || '',
        driver_name: initialData.driver_name || '',
        car_head: initialData.car_head || '',
        car_tail: initialData.car_tail || ''
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
    if (!form.material || !form.voucher || !form.quantity || !form.price_per_meter) {
      Swal.fire('خطأ', 'يرجى ملء الحقول الإلزامية', 'warning');
      return;
    }
    onSubmit({
      ...form,
      quantity: parseFloat(form.quantity),
      price_per_meter: parseFloat(form.price_per_meter)
    });
  };

  return (
    <div className="modal-overlay-custom" onClick={onClose}>
      <div className="modal-content-custom" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-custom">
          <h2>تعديل بيانات المشوار / التوصيل</h2>
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
              <label>الكمية (م³)*</label>
              <input
                type="number"
                step="0.01"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label>سعر المتر للعميل (ج.م) *</label>
              <input
                type="number"
                step="0.01"
                name="price_per_meter"
                value={form.price_per_meter}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label>اسم السائق</label>
              <input
                type="text"
                name="driver_name"
                value={form.driver_name}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>رقم السيارة (رأس)</label>
              <input
                type="text"
                name="car_head"
                value={form.car_head}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>رقم السيارة (مقطورة)</label>
              <input
                type="text"
                name="car_tail"
                value={form.car_tail}
                onChange={handleChange}
                className="form-input"
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
