# إصلاح استعلامات الدفعات - منع ظهور الدفعات المحذوفة في الواجهة

## المشكلة
الدفعات المحذوفة (soft deleted) كانت لسه بتظهر في الواجهة لأن الـ queries في الـ services مش كانت بتفلتر `is_deleted: { $ne: true }`.

## الحل المطبق

### 1. تعديل ContractorService (backend/services/contractorService.js)
- ✅ `getContractorById()` - فلترة الدفعات المحذوفة
- ✅ `getContractorPayments()` - فلترة الدفعات المحذوفة
- ✅ `computeContractorTotals()` - فلترة الدفعات المحذوفة في الحسابات
- ✅ `generateAccountStatement()` - فلترة الدفعات المحذوفة في كشف الحساب
- ✅ `deleteContractor()` - التحقق من الدفعات غير المحذوفة فقط

### 2. تعديل CrusherService (backend/services/crusherService.js)
- ✅ `getCrusherById()` - فلترة الدفعات المحذوفة
- ✅ `getCrusherPayments()` - فلترة الدفعات المحذوفة
- ✅ `computeCrusherTotals()` - فلترة الدفعات المحذوفة في الحسابات
- ✅ `deleteCrusher()` - التحقق من الدفعات غير المحذوفة فقط

### 3. تعديل EmployeeService (backend/services/employeeService.js)
- ✅ `getEmployeeById()` - فلترة الدفعات المحذوفة
- ✅ `deleteEmployee()` - التحقق من الدفعات غير المحذوفة فقط

### 4. تعديل AdministrationService (backend/services/administrationService.js)
- ✅ `getAllAdministration()` - فلترة الدفعات المحذوفة في الحسابات
- ✅ `getAdministrationById()` - فلترة الدفعات المحذوفة
- ✅ `deleteAdministration()` - التحقق من الدفعات غير المحذوفة فقط

### 5. تعديل PayrollService (backend/services/payrollService.js)
- ✅ `calculateEmployeeBalance()` - فلترة الدفعات المحذوفة في حسابات الرواتب

## الاستعلامات المعدلة

### قبل التعديل:
```javascript
const payments = await ContractorPayment.find({ contractor_id: id });
```

### بعد التعديل:
```javascript
const payments = await ContractorPayment.find({ 
    contractor_id: id,
    is_deleted: { $ne: true }
});
```

## النتيجة المتوقعة
- ✅ الدفعات المحذوفة لن تظهر في صفحات العملاء/المقاولين/الكسارات/الموردين/الموظفين/الإدارة
- ✅ الحسابات المالية ستكون دقيقة (لا تشمل الدفعات المحذوفة)
- ✅ كشوف الحساب لن تشمل الدفعات المحذوفة
- ✅ الدفعات المحذوفة موجودة فقط في سلة المحذوفات
- ✅ يمكن استعادة الدفعات من سلة المحذوفات

## ملاحظات مهمة
- الـ soft delete يحافظ على البيانات في قاعدة البيانات
- الدفعات المحذوفة لها `is_deleted: true` و `deleted_at: Date`
- الاستعادة من سلة المحذوفات تعيد `is_deleted: false`
- الحذف النهائي يمسح البيانات تماماً من قاعدة البيانات

## التاريخ
- تم التعديل: 26 مارس 2026
- الحالة: مكتمل ✅
