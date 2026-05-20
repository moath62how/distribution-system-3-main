import React, { useState, useEffect } from 'react';
import { compressImage } from '../../utils/imageCompressor';
import Swal from 'sweetalert2';

export const PaymentModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [amount, setAmount] = useState('');
  const [paidAt, setPaidAt] = useState('');
  const [method, setMethod] = useState('نقدي');
  const [details, setDetails] = useState('');
  const [note, setNote] = useState('');
  const [image, setImage] = useState(null);
  const [compressing, setCompressing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setAmount(initialData.amount || '');
        setPaidAt(initialData.paid_at ? initialData.paid_at.split('T')[0] : '');
        setMethod(initialData.method || 'نقدي');
        setDetails(initialData.details || '');
        setNote(initialData.note || '');
        setImage(initialData.payment_image || initialData.payment_image_url || null);
      } else {
        setAmount('');
        setPaidAt(new Date().toISOString().split('T')[0]);
        setMethod('نقدي');
        setDetails('');
        setNote('');
        setImage(null);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire('خطأ', 'حجم الصورة كبير جداً (الحد الأقصى 5 ميجابايت)', 'error');
      e.target.value = '';
      return;
    }

    setCompressing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      let base64 = event.target.result;
      if (base64.length > 1024 * 1024) {
        try {
          base64 = await compressImage(base64, 0.7);
        } catch (err) {
          console.warn('Compression failed, using original size', err);
        }
      }
      setImage(base64);
      setCompressing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      Swal.fire('خطأ', 'يرجى إدخال مبلغ صحيح', 'warning');
      return;
    }
    if (!paidAt) {
      Swal.fire('خطأ', 'يرجى تحديد تاريخ السداد', 'warning');
      return;
    }

    const needsDetails = ['بنكي', 'شيك', 'انستاباي', 'فودافون كاش'].includes(method);
    if (needsDetails && !details.trim()) {
      Swal.fire('خطأ', 'يرجى إدخال تفاصيل العملية أو رقم الشيك/التحويل', 'warning');
      return;
    }

    onSubmit({
      amount: parseFloat(amount),
      paid_at: paidAt,
      method,
      details: needsDetails ? details.trim() : '',
      note: note.trim(),
      image
    });
  };

  const isDetailsRequired = ['بنكي', 'شيك', 'انستاباي', 'فودافون كاش'].includes(method);

  return (
    <div className="modal-overlay-custom" onClick={onClose}>
      <div className="modal-content-custom" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-custom">
          <h2>{initialData ? 'تعديل الدفعة' : 'إضافة دفعة جديدة'}</h2>
          <button onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleFormSubmit}>
          <div className="modal-body-custom">
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
              <label>تاريخ السداد *</label>
              <input
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label>طريقة الدفع</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="form-select"
              >
                <option value="نقدي">نقدي</option>
                <option value="شيك">شيك</option>
                <option value="بنكي">حوالة بنكية</option>
                <option value="انستاباي">انستاباي (InstaPay)</option>
                <option value="فودافون كاش">فودافون كاش</option>
              </select>
            </div>

            {isDetailsRequired && (
              <div className="form-group animate-slide">
                <label>
                  {method === 'شيك'
                    ? 'رقم الشيك *'
                    : method === 'بنكي'
                    ? 'رقم التحويل *'
                    : 'رقم العملية *'}
                </label>
                <input
                  type="text"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>ملاحظات</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>إرفاق إيصال / شيك</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="form-input"
                disabled={compressing}
              />
              {compressing && <small style={{ color: 'var(--primary-500)' }}>جاري ضغط الصورة...</small>}
              {image && (
                <div style={{ marginTop: '0.5rem' }}>
                  <img 
                    src={image.startsWith('data:') || image.startsWith('http') ? image : `data:image/jpeg;base64,${image}`} 
                    alt="Receipt Preview" 
                    className="receipt-preview" 
                    style={{ maxWidth: '100%', maxHeight: '150px', objectFit: 'contain' }} 
                  />
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer-custom">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              إلغاء
            </button>
            <button type="submit" className="btn btn-primary" disabled={compressing}>
              حفظ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
