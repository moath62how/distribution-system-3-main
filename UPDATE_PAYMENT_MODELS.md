# تحديث Payment Models - إضافة Soft Delete

## المشكلة:
الدفعات (Payments) تُحذف نهائياً بدون:
- Soft delete (is_deleted, deleted_at)
- Audit logging
- إمكانية الاستعادة

## الحل:
إضافة حقول soft delete لكل payment models:
- Payment (دفعات العملاء)
- ContractorPayment
- CrusherPayment
- SupplierPayment
- EmployeePayment
- AdministrationPayment

## الحقول المطلوب إضافتها:
```javascript
is_deleted: {
    type: Boolean,
    default: false
},
deleted_at: {
    type: Date,
    default: null
}
```

## الملفات المطلوب تعديلها:
1. ✅ backend/models/Payment.js - تم
2. ⏳ backend/models/ContractorPayment.js
3. ⏳ backend/models/CrusherPayment.js
4. ⏳ backend/models/SupplierPayment.js
5. ⏳ backend/models/EmployeePayment.js
6. ⏳ backend/models/AdministrationPayment.js

## Services المطلوب تعديلها:
1. ⏳ backend/services/clientService.js - deleteClientPayment
2. ⏳ backend/services/contractorService.js - deleteContractorPayment
3. ⏳ backend/services/crusherService.js - deleteCrusherPayment
4. ⏳ backend/services/supplierService.js - deleteSupplierPayment
5. ⏳ backend/services/employeeService.js - deleteEmployeePayment
6. ⏳ backend/services/administrationService.js - deleteAdministrationPayment

## Controllers المطلوب تعديلها:
1. ⏳ backend/controllers/clientsController.js - deleteClientPayment
2. ⏳ backend/controllers/contractorsController.js - deleteContractorPayment
3. ⏳ backend/controllers/crushersController.js - deleteCrusherPayment
4. ⏳ backend/controllers/supplierController.js - deleteSupplierPayment
5. ⏳ backend/controllers/employeesController.js - deleteEmployeePayment
6. ⏳ backend/controllers/administrationController.js - deleteAdministrationPayment

## RecycleBin Controller:
⏳ إضافة payment models للـ recycle bin

## التغييرات المطلوبة:

### في الـ Service:
```javascript
// قبل (Hard Delete):
return await Payment.findOneAndDelete({ _id: paymentId });

// بعد (Soft Delete):
const payment = await Payment.findOne({ _id: paymentId });
payment.is_deleted = true;
payment.deleted_at = new Date();
await payment.save();
return payment;
```

### في الـ Controller:
```javascript
// إضافة audit logging:
const oldValues = payment.toJSON();
await authService.logAuditEvent(
    req.user.id,
    'delete',
    'Payment',
    paymentId,
    oldValues,
    null,
    req
);
```

### في الـ Queries:
```javascript
// إضافة فلتر is_deleted في كل الـ queries:
Payment.find({ client_id: clientId, is_deleted: { $ne: true } })
```
