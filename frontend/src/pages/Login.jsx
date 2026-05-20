import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiPost } from '../utils/api';
import './Login.css';

export const Login = () => {
  const { isAuthenticated, login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('manager');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/[^\d+]/g, '');
    if (value.indexOf('+') > 0) value = value.replace(/\+/g, '');
    if (value.length > 13) value = value.substring(0, 13);
    setPhone(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!phone || !password) {
      setError('يرجى إدخال رقم الهاتف وكلمة المرور');
      return;
    }

    setLoading(true);

    try {
      let normalizedPhone = phone.trim();
      if (normalizedPhone.startsWith('01') && normalizedPhone.length === 11) {
        normalizedPhone = '+2' + normalizedPhone;
      } else if (normalizedPhone.startsWith('1') && normalizedPhone.length === 10) {
        normalizedPhone = '+20' + normalizedPhone;
      } else if (normalizedPhone.startsWith('201') && normalizedPhone.length === 12) {
        normalizedPhone = '+' + normalizedPhone;
      } else if (!normalizedPhone.startsWith('+')) {
        normalizedPhone = '+20' + normalizedPhone;
      }

      const response = await apiPost('/auth/login', {
        phone: normalizedPhone,
        password,
        role
      });

      if (response && response.success) {
        login(response.data.token, response.data.user);
        navigate('/');
      } else {
        setError(response?.message || 'فشل تسجيل الدخول. يرجى التحقق من بياناتك');
      }
    } catch (err) {
      setError(err.message || 'حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card-wrapper">
        <div className="login-brand">
          <h1 className="brand-logo">InfraFinance</h1>
          <h2 className="login-title">تسجيل الدخول</h2>
          <p className="login-subtitle">الوصول إلى لوحة القيادة المالية الخاصة بك</p>
        </div>

        <div className="login-card">
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="phone">رقم الهاتف</label>
              <div className="input-with-icon">
                <span className="material-symbols-outlined input-icon">phone</span>
                <input type="tel" id="phone" value={phone} onChange={handlePhoneChange} placeholder="01xxxxxxxxx أو +201xxxxxxxxx" className="form-input text-left" dir="ltr" required />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">كلمة المرور</label>
              <div className="input-with-icon">
                <span className="material-symbols-outlined input-icon">lock</span>
                <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="form-input text-left" dir="ltr" required />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="role">اختر الدور</label>
              <div className="input-with-icon">
                <span className="material-symbols-outlined input-icon">badge</span>
                <select id="role" value={role} onChange={(e) => setRole(e.target.value)} className="form-select">
                  <option value="manager">مدير</option>
                  <option value="accountant">محاسب</option>
                  <option value="tech_support">دعم فني</option>
                </select>
              </div>
            </div>

            {error && <div className="login-error-message">{error}</div>}

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
