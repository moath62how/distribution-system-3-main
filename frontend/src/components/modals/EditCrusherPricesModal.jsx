import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export const EditCrusherPricesModal = ({ isOpen, onClose, onSubmit, submitting, initialData }) => {
  const [sandPrice, setSandPrice] = useState('');
  const [aggregate1Price, setAggregate1Price] = useState('');
  const [aggregate2Price, setAggregate2Price] = useState('');
  const [aggregate3Price, setAggregate3Price] = useState('');
  const [aggregate6PowderPrice, setAggregate6PowderPrice] = useState('');

  useEffect(() => {
    if (isOpen && initialData) {
      setSandPrice(initialData.sand_price || '0');
      setAggregate1Price(initialData.aggregate1_price || '0');
      setAggregate2Price(initialData.aggregate2_price || '0');
      setAggregate3Price(initialData.aggregate3_price || '0');
      setAggregate6PowderPrice(initialData.aggregate6_powder_price || '0');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      sand_price: parseFloat(sandPrice) || 0,
      aggregate1_price: parseFloat(aggregate1Price) || 0,
      aggregate2_price: parseFloat(aggregate2Price) || 0,
      aggregate3_price: parseFloat(aggregate3Price) || 0,
      aggregate6_powder_price: parseFloat(aggregate6PowderPrice) || 0
    });
  };

  return (
    <div className="modal-overlay-custom" onClick={onClose}>
      <div className="modal-content-custom" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-custom">
          <h2>تعديل أسعار المواد الخام - {initialData?.name}</h2>
          <button onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleFormSubmit}>
          <div className="modal-body-custom">
            <div className="form-group">
              <label htmlFor="modalSandPrice">سعر الرمل (ج.م / م³)</label>
              <input
                type="number"
                step="0.01"
                id="modalSandPrice"
                value={sandPrice}
                onChange={(e) => setSandPrice(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="modalAggregate1Price">سعر سن 1 (ج.م / م³)</label>
              <input
                type="number"
                step="0.01"
                id="modalAggregate1Price"
                value={aggregate1Price}
                onChange={(e) => setAggregate1Price(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="modalAggregate2Price">سعر سن 2 (ج.م / م³)</label>
              <input
                type="number"
                step="0.01"
                id="modalAggregate2Price"
                value={aggregate2Price}
                onChange={(e) => setAggregate2Price(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="modalAggregate3Price">سعر سن 3 (ج.م / م³)</label>
              <input
                type="number"
                step="0.01"
                id="modalAggregate3Price"
                value={aggregate3Price}
                onChange={(e) => setAggregate3Price(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="modalAggregate6PowderPrice">سعر سن 6 بودرة (ج.م / م³)</label>
              <input
                type="number"
                step="0.01"
                id="modalAggregate6PowderPrice"
                value={aggregate6PowderPrice}
                onChange={(e) => setAggregate6PowderPrice(e.target.value)}
                className="form-input"
                required
              />
            </div>
          </div>
          <div className="modal-footer-custom">
            <button type="button" className="btn btn-secondary" onClick={onClose}>إلغاء</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'جاري التحديث...' : 'تحديث الأسعار'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
