import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPost } from '../utils/api';
import { formatCurrency, formatQuantity } from '../utils/formatters';
import { Loader } from '../components/Loader';
import Swal from 'sweetalert2';
import './NewEntry.css';

const initialFormState = {
  clientId: '',
  supplierType: 'crusher', // 'crusher' or 'supplier'
  crusherId: '',
  supplierId: '',
  material: '',
  voucher: '',
  contractorId: '',
  driverName: '',
  carHead: '',
  carTail: '',
  carVolume: '',
  discountType: 'no', // 'yes' or 'no'
  discountVolume: '',
  quantity: '',
  pricePerMeter: '',
  contractorCharge: '',
  supplierTransferPrice: ''
};

export const NewEntry = () => {
  const { token } = useAuth();

  // Dropdown lists
  const [clients, setClients] = useState([]);
  const [crushers, setCrushers] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Page level state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(initialFormState);

  // Load dropdown lists
  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [clientsRes, crushersRes, contractorsRes, suppliersRes] = await Promise.all([
        apiGet('/clients', token),
        apiGet('/crushers', token),
        apiGet('/contractors', token),
        apiGet('/suppliers', token)
      ]);

      setClients(clientsRes.clients || clientsRes.data || clientsRes || []);
      setCrushers(crushersRes.crushers || crushersRes.data || crushersRes || []);
      setContractors(contractorsRes.contractors || contractorsRes.data || contractorsRes || []);
      setSuppliers(suppliersRes.suppliers || suppliersRes.data || suppliersRes || []);
    } catch (err) {
      console.error(err);
      Swal.fire('خطأ', 'فشل تحميل القوائم الأساسية', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle simple input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Helper mapping for crusher material prices
  const crusherMaterialMap = {
    'رمل': 'sand_price',
    'سن 1': 'aggregate1_price',
    'سن 2': 'aggregate2_price',
    'سن 3': 'aggregate3_price',
    'سن 6 بودرة': 'aggregate6_powder_price'
  };

  // Memoized lists of materials depending on supplier type
  const materialOptions = useMemo(() => {
    if (formData.supplierType === 'crusher') {
      return ['رمل', 'سن 1', 'سن 2', 'سن 3', 'سن 6 بودرة'];
    }
    
    // For suppliers, extract materials dynamically from chosen supplier
    if (!formData.supplierId) return [];
    const selectedSupplier = suppliers.find(
      (s) => (s.id || s._id) === formData.supplierId
    );
    if (!selectedSupplier || !selectedSupplier.materials) return [];
    return selectedSupplier.materials.map((m) => m.name);
  }, [formData.supplierType, formData.supplierId, suppliers]);

  // Auto-reset material if it is no longer valid in the new options list
  useEffect(() => {
    if (formData.material && !materialOptions.includes(formData.material)) {
      setFormData((prev) => ({ ...prev, material: '' }));
    }
  }, [materialOptions, formData.material]);

  // Supplier type changes handler
  const handleSupplierTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      supplierType: type,
      crusherId: '',
      supplierId: '',
      material: '',
      contractorId: '',
      driverName: '',
      carHead: '',
      carTail: '',
      carVolume: '',
      discountType: 'no',
      discountVolume: '',
      contractorCharge: '',
      supplierTransferPrice: ''
    }));
  };

  // Calculate material cost per unit at time
  const materialCostPerUnit = useMemo(() => {
    if (!formData.material) return 0;

    if (formData.supplierType === 'crusher') {
      if (!formData.crusherId) return 0;
      const crusher = crushers.find((c) => (c.id || c._id) === formData.crusherId);
      if (!crusher) return 0;
      const field = crusherMaterialMap[formData.material];
      return crusher[field] || 0;
    } else {
      if (!formData.supplierId) return 0;
      const supplier = suppliers.find((s) => (s.id || s._id) === formData.supplierId);
      if (!supplier || !supplier.materials) return 0;
      const mat = supplier.materials.find((m) => m.name === formData.material);
      return mat ? (mat.price_per_unit || 0) : 0;
    }
  }, [formData.material, formData.supplierType, formData.crusherId, formData.supplierId, crushers, suppliers]);

  // Calculate total costs and profits
  const profitAnalysis = useMemo(() => {
    const clientPrice = parseFloat(formData.pricePerMeter) || 0;
    const quantity = parseFloat(formData.quantity) || 0;
    
    let transferCost = 0;
    if (formData.supplierType === 'crusher') {
      transferCost = parseFloat(formData.contractorCharge) || 0;
    } else {
      transferCost = parseFloat(formData.supplierTransferPrice) || 0;
    }

    const totalCostPerUnit = materialCostPerUnit + transferCost;
    const profitPerUnit = clientPrice - totalCostPerUnit;
    const profitMargin = totalCostPerUnit > 0 ? (profitPerUnit / totalCostPerUnit) * 100 : 0;

    const totalRevenue = clientPrice * quantity;
    const totalCost = totalCostPerUnit * quantity;
    const totalProfit = profitPerUnit * quantity;

    return {
      materialCostPerUnit,
      transferCost,
      totalCostPerUnit,
      profitPerUnit,
      profitMargin,
      totalRevenue,
      totalCost,
      totalProfit,
      isValid: clientPrice > 0 && quantity > 0 && totalCostPerUnit > 0
    };
  }, [formData.pricePerMeter, formData.quantity, formData.supplierType, formData.contractorCharge, formData.supplierTransferPrice, materialCostPerUnit]);

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check basic validations
    if (!formData.clientId) return Swal.fire('تنبيه', 'يرجى اختيار العميل', 'warning');
    if (!formData.material) return Swal.fire('تنبيه', 'يرجى اختيار نوع المادة', 'warning');
    if (!formData.voucher.trim()) return Swal.fire('تنبيه', 'يرجى إدخال رقم البون', 'warning');
    
    const qty = parseFloat(formData.quantity);
    if (isNaN(qty) || qty <= 0) return Swal.fire('تنبيه', 'يرجى إدخال كمية حمولة صحيحة أكبر من الصفر', 'warning');
    
    const price = parseFloat(formData.pricePerMeter);
    if (isNaN(price) || price <= 0) return Swal.fire('تنبيه', 'يرجى إدخال سعر صحيح أكبر من الصفر', 'warning');

    if (formData.supplierType === 'crusher') {
      if (!formData.crusherId) return Swal.fire('تنبيه', 'يرجى اختيار الكسارة', 'warning');
      if (!formData.contractorId) return Swal.fire('تنبيه', 'يرجى اختيار مقاول النقل', 'warning');
      if (!formData.driverName.trim()) return Swal.fire('تنبيه', 'يرجى إدخال اسم السائق', 'warning');
      if (!formData.carHead.trim()) return Swal.fire('تنبيه', 'يرجى إدخال رقم الرأس للسيارة', 'warning');
      if (!formData.carTail.trim()) return Swal.fire('تنبيه', 'يرجى إدخال رقم المقطورة للسيارة', 'warning');
      
      const vol = parseFloat(formData.carVolume);
      if (isNaN(vol) || vol <= 0) return Swal.fire('تنبيه', 'يرجى إدخال تكعيب السيارة بشكل صحيح', 'warning');

      if (formData.discountType === 'yes') {
        const disc = parseFloat(formData.discountVolume);
        if (isNaN(disc) || disc < 0) return Swal.fire('تنبيه', 'يرجى إدخال قيمة خصم صحيحة', 'warning');
      }
    } else {
      if (!formData.supplierId) return Swal.fire('تنبيه', 'يرجى اختيار المورد', 'warning');
    }

    if (!materialCostPerUnit || materialCostPerUnit <= 0) {
      const source = formData.supplierType === 'crusher' ? 'الكسارة' : 'المورد';
      return Swal.fire('تنبيه', `سعر المادة "${formData.material}" غير محدد في حسابات ${source}. يرجى تحديث أسعار ${source} أولاً.`, 'warning');
    }

    // Build API payload
    const payload = {
      client_id: formData.clientId,
      crusher_id: formData.supplierType === 'crusher' ? formData.crusherId : null,
      supplier_id: formData.supplierType === 'supplier' ? formData.supplierId : null,
      contractor_id: formData.supplierType === 'crusher' ? formData.contractorId : null,
      material: formData.material,
      voucher: formData.voucher.trim(),
      quantity: qty,
      discount_volume: formData.supplierType === 'crusher' && formData.discountType === 'yes' ? (parseFloat(formData.discountVolume) || 0) : 0,
      price_per_meter: price,
      material_price_at_time: materialCostPerUnit,
      driver_name: formData.supplierType === 'crusher' ? formData.driverName.trim() : null,
      car_head: formData.supplierType === 'crusher' ? formData.carHead.trim() : null,
      car_tail: formData.supplierType === 'crusher' ? formData.carTail.trim() : null,
      car_volume: formData.supplierType === 'crusher' ? (parseFloat(formData.carVolume) || null) : qty,
      contractor_charge_per_meter: formData.supplierType === 'crusher' ? (parseFloat(formData.contractorCharge) || 0) : (parseFloat(formData.supplierTransferPrice) || 0)
    };

    setSubmitting(true);
    try {
      await apiPost('/deliveries', payload, token);
      await Swal.fire('تم بنجاح', 'تم تسجيل عملية التسليم بنجاح', 'success');
      
      // Reset form
      setFormData(initialFormState);
    } catch (err) {
      Swal.fire('خطأ', err.message || 'فشل حفظ عملية التسليم', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader text="جاري تحميل البيانات الأساسية..." />;

  const isCrusher = formData.supplierType === 'crusher';

  return (
    <div className="new-entry-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span className="material-symbols-outlined align-middle ml-2">add_circle</span>
            إدخال تسليم جديد
          </h1>
          <p className="page-subtitle">تسجيل عملية تسليم وشحن وتوريد جديدة بالنظام</p>
        </div>
        <button className="btn btn-secondary" onClick={() => loadData(true)} disabled={refreshing}>
          <span className={`material-symbols-outlined ${refreshing ? 'spin-icon' : ''}`}>sync</span>
          تحديث البيانات
        </button>
      </div>

      <div className="new-entry-card">
        <div className="card-header">
          <h2 className="card-title">بيانات بون الشحنة والتوريد</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="card-body">
          <div className="form-grid">
            
            {/* Client Select */}
            <div className="form-group form-grid-full">
              <label>العميل <span className="required">*</span></label>
              <select
                name="clientId"
                value={formData.clientId}
                onChange={handleInputChange}
                className="form-select"
                required
              >
                <option value="">اختر العميل / المشروع</option>
                {clients.map((c) => (
                  <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Supplier Type Toggle */}
            <div className="form-group form-grid-full">
              <label>نوع التوريد <span className="required">*</span></label>
              <div className="radio-group">
                <label className={`radio-btn-label ${isCrusher ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="supplierType"
                    checked={isCrusher}
                    onChange={() => handleSupplierTypeChange('crusher')}
                  />
                  كسارة
                </label>
                <label className={`radio-btn-label ${!isCrusher ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="supplierType"
                    checked={!isCrusher}
                    onChange={() => handleSupplierTypeChange('supplier')}
                  />
                  مورد خارجي
                </label>
              </div>
            </div>

            {/* Crusher Group */}
            {isCrusher && (
              <div className="form-group form-grid-full">
                <label>الكسارة <span className="required">*</span></label>
                <select
                  name="crusherId"
                  value={formData.crusherId}
                  onChange={handleInputChange}
                  className="form-select"
                  required
                >
                  <option value="">اختر الكسارة</option>
                  {crushers.map((cr) => (
                    <option key={cr.id || cr._id} value={cr.id || cr._id}>{cr.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Supplier Group */}
            {!isCrusher && (
              <div className="form-group form-grid-full">
                <label>المورد الخارجي <span className="required">*</span></label>
                <select
                  name="supplierId"
                  value={formData.supplierId}
                  onChange={handleInputChange}
                  className="form-select"
                  required
                >
                  <option value="">اختر المورد</option>
                  {suppliers.map((s) => (
                    <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Material select */}
            <div className="form-group">
              <label>نوع المادة <span className="required">*</span></label>
              <select
                name="material"
                value={formData.material}
                onChange={handleInputChange}
                className="form-select"
                disabled={isCrusher ? false : !formData.supplierId}
                required
              >
                <option value="">اختر المادة</option>
                {materialOptions.map((mat) => (
                  <option key={mat} value={mat}>{mat}</option>
                ))}
              </select>
            </div>

            {/* Voucher/Ticket Number */}
            <div className="form-group">
              <label>رقم البون <span className="required">*</span></label>
              <input
                type="text"
                name="voucher"
                value={formData.voucher}
                onChange={handleInputChange}
                className="form-input"
                placeholder="أدخل رقم بون الشحن"
                required
              />
            </div>

            {/* Transport Contractor (Crusher Only) */}
            {isCrusher && (
              <div className="form-group form-grid-full">
                <label>مقاول النقل <span className="required">*</span></label>
                <select
                  name="contractorId"
                  value={formData.contractorId}
                  onChange={handleInputChange}
                  className="form-select"
                  required
                >
                  <option value="">اختر مقاول النقل</option>
                  {contractors.map((co) => (
                    <option key={co.id || co._id} value={co.id || co._id}>{co.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Driver name & Car info (Crusher Only) */}
            {isCrusher && (
              <div className="form-group form-grid-full">
                <div className="car-info-row">
                  <div>
                    <label>اسم السائق <span className="required">*</span></label>
                    <input
                      type="text"
                      name="driverName"
                      value={formData.driverName}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="اسم السائق"
                      required
                    />
                  </div>
                  <div>
                    <label>رقم الرأس <span className="required">*</span></label>
                    <input
                      type="text"
                      name="carHead"
                      value={formData.carHead}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="أرقام / حروف"
                      required
                    />
                  </div>
                  <div>
                    <label>رقم المقطورة <span className="required">*</span></label>
                    <input
                      type="text"
                      name="carTail"
                      value={formData.carTail}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="أرقام / حروف"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Car volume (Crusher Only) */}
            {isCrusher && (
              <div className="form-group">
                <label>تكعيب السيارة (م³) <span className="required">*</span></label>
                <input
                  type="number"
                  name="carVolume"
                  step="0.01"
                  min="0.01"
                  value={formData.carVolume}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="0.00"
                  required
                />
              </div>
            )}

            {/* Discount Option & deductAmount (Crusher Only) */}
            {isCrusher && (
              <div className="form-group">
                <label>الخصم من الحمولة</label>
                <div className="radio-group" style={{ marginBottom: '0.75rem' }}>
                  <label className={`radio-btn-label ${formData.discountType === 'yes' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="discountType"
                      checked={formData.discountType === 'yes'}
                      onChange={() => setFormData((prev) => ({ ...prev, discountType: 'yes' }))}
                    />
                    خصم
                  </label>
                  <label className={`radio-btn-label ${formData.discountType === 'no' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="discountType"
                      checked={formData.discountType === 'no'}
                      onChange={() => setFormData((prev) => ({ ...prev, discountType: 'no', discountVolume: '' }))}
                    />
                    بدون خصم
                  </label>
                </div>

                {formData.discountType === 'yes' && (
                  <div className="special-deduct-container">
                    <div className="special-deduct-header">
                      <span className="special-deduct-label">قيمة الخصم المطلوبة</span>
                      <span className="special-deduct-badge">خصم خاص</span>
                    </div>
                    <div className="special-deduct-input-wrapper">
                      <input
                        type="number"
                        name="discountVolume"
                        step="0.01"
                        min="0"
                        value={formData.discountVolume}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="0.00"
                        required
                      />
                      <span className="unit-label">م³</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quantity */}
            <div className="form-group">
              <label>
                كمية الحمولة ({isCrusher ? 'م³' : 'وحدة'}) <span className="required">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                step="0.01"
                min="0.01"
                value={formData.quantity}
                onChange={handleInputChange}
                className="form-input"
                placeholder="0.00"
                required
              />
            </div>

            {/* Client Unit Price */}
            <div className="form-group">
              <label>
                السعر للوحدة (للعميل) <span className="required">*</span>
              </label>
              <input
                type="number"
                name="pricePerMeter"
                step="0.01"
                min="0"
                value={formData.pricePerMeter}
                onChange={handleInputChange}
                className="form-input"
                placeholder="0.00"
                required
              />
            </div>

            {/* Static Material Price Lookups */}
            <div className="form-group form-grid-full">
              {materialCostPerUnit > 0 ? (
                <div className="price-lookup-card">
                  <span className="price-lookup-title">
                    سعر {isCrusher ? 'الكسارة' : 'المورد'} المسجل للمادة "{formData.material}":
                  </span>
                  <span className="price-lookup-value">{formatCurrency(materialCostPerUnit)}</span>
                  <span className="price-lookup-note">
                    سيتم حفظ هذا السعر تلقائياً مع الفاتورة لحفظ الأسعار التاريخية
                  </span>
                </div>
              ) : formData.material && (isCrusher ? formData.crusherId : formData.supplierId) ? (
                <div className="price-lookup-card" style={{ borderColor: 'var(--danger-200)', background: 'var(--danger-50)' }}>
                  <span className="price-lookup-title" style={{ color: 'var(--danger-600)' }}>
                    سعر {isCrusher ? 'الكسارة' : 'المورد'} للمادة "{formData.material}":
                  </span>
                  <span className="price-lookup-value" style={{ color: 'var(--danger-700)' }}>
                    غير محدد!
                  </span>
                  <span className="price-lookup-note" style={{ color: 'var(--danger-600)' }}>
                    يرجى مراجعة إعدادات الأسعار في صفحة {isCrusher ? 'الكسارة' : 'المورد'}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Contractor transport charge (Crusher Only) */}
            {isCrusher && (
              <div className="form-group form-grid-full">
                <label>مستحق مقاول النقل لكل م³ (ج.م)</label>
                <input
                  type="number"
                  name="contractorCharge"
                  step="0.01"
                  min="0"
                  value={formData.contractorCharge}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="0.00 (اختياري)"
                />
              </div>
            )}

            {/* Supplier transport charge (Supplier Only) */}
            {!isCrusher && (
              <div className="form-group form-grid-full">
                <label>سعر النقل من المورد لكل وحدة</label>
                <input
                  type="number"
                  name="supplierTransferPrice"
                  step="0.01"
                  min="0"
                  value={formData.supplierTransferPrice}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="0.00 (اختياري)"
                />
                <small style={{ color: 'var(--gray-500)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  تكلفة نقل المادة من المورد إلى الموقع (إن وجدت)
                </small>
              </div>
            )}

          </div>

          {/* Dynamic Profit & Loss Warning Card */}
          {profitAnalysis.isValid && (
            <div className={`profit-warning-card ${
              profitAnalysis.totalProfit < 0 
                ? 'loss' 
                : profitAnalysis.profitMargin < 15 
                  ? 'low' 
                  : 'good'
            }`}>
              <div className="profit-card-header">
                <span className="material-symbols-outlined">
                  {profitAnalysis.totalProfit < 0 
                    ? 'warning' 
                    : profitAnalysis.profitMargin < 15 
                      ? 'info' 
                      : 'check_circle'
                  }
                </span>
                <span>
                  {profitAnalysis.totalProfit < 0 
                    ? 'خسارة مالية تقديرية!' 
                    : profitAnalysis.profitMargin < 15 
                      ? `هامش ربح منخفض (${profitAnalysis.profitMargin.toFixed(1)}%)`
                      : `هامش ربح جيد جداً (${profitAnalysis.profitMargin.toFixed(1)}%)`
                  }
                </span>
              </div>
              
              <div className="profit-grid">
                <div className="profit-item">
                  <span className="profit-label">سعر البيع (للعميل):</span>
                  <span className="profit-val">{formatCurrency(parseFloat(formData.pricePerMeter))}</span>
                </div>
                <div className="profit-item">
                  <span className="profit-label">سعر التكلفة الإجمالي:</span>
                  <span className="profit-val">{formatCurrency(profitAnalysis.totalCostPerUnit)}</span>
                </div>
                <div className="profit-item">
                  <span className="profit-label">سعر المادة:</span>
                  <span className="profit-val">{formatCurrency(profitAnalysis.materialCostPerUnit)}</span>
                </div>
                <div className="profit-item">
                  <span className="profit-label">تكلفة النقل:</span>
                  <span className="profit-val">{formatCurrency(profitAnalysis.transferCost)}</span>
                </div>
                <div className="profit-item">
                  <span className="profit-label">صافي الربح للوحدة:</span>
                  <span className={`profit-val ${profitAnalysis.profitPerUnit < 0 ? 'text-danger' : 'text-success'}`}>
                    {formatCurrency(profitAnalysis.profitPerUnit)}
                  </span>
                </div>
                <div className="profit-item">
                  <span className="profit-label">الربح العام للحمولة:</span>
                  <span className={`profit-val ${profitAnalysis.totalProfit < 0 ? 'text-danger' : 'text-success'}`}>
                    {formatCurrency(profitAnalysis.totalProfit)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? 'جاري حفظ البيانات...' : 'حفظ تسليم الشحنة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
