# ✅ إضافة مربعات الديون في الداشبورد

## 📊 التعديلات المنفذة:

### 1. Backend - `/api/metrics` في `server.js`:

تم إضافة الحسابات التالية:

#### أ) الديون اللي ليك (Total Receivables):
```javascript
const totalReceivables = 
  totalClientBalancesPositive +      // العملاء المديونين (balance > 0)
  crushersNegativeNet +               // الكسارات المديونة (net < 0)
  contractorsNegativeBalance +        // المقاولين المديونين (balance < 0)
  suppliersNegativeBalance +          // الموردين المديونين (balance < 0)
  employeesPositiveBalance;           // الموظفين المديونين (balance > 0)
```

#### ب) الديون اللي عليك (Total Payables):
```javascript
const totalPayables = 
  totalSupplierBalances +                    // الموردين (balance > 0)
  totalCrusherBalances +                     // الكسارات (net > 0)
  totalContractorBalances +                  // المقاولين (balance > 0)
  Math.abs(totalEmployeeBalancesNegative) +  // الموظفين (balance < 0)
  clientsNegativeBalance;                    // العملاء اللي انت مديون ليهم (balance < 0)
```

### 2. Frontend - `index.html`:

تم إضافة مربعين جديدين في الداشبورد:

1. **إجمالي الديون اللي ليا** (success card - أخضر)
   - Icon: `fa-hand-holding-usd`
   - يعرض: `totalReceivables`

2. **إجمالي الديون اللي عليا** (danger card - أحمر)
   - Icon: `fa-credit-card`
   - يعرض: `totalPayables`

---

## 🎯 الحقول الجديدة في `/api/metrics`:

```json
{
  "totalReceivables": 150000,
  "totalPayables": 80000,
  "clientsNegativeBalance": 5000,
  "crushersNegativeNet": 10000,
  "contractorsNegativeBalance": 3000,
  "suppliersNegativeBalance": 2000,
  "employeesPositiveBalance": 1000
}
```

---

## ⚡ الأداء:

- **لا توجد queries جديدة** - استخدام البيانات الموجودة
- **حسابات سريعة** - عمليات JavaScript في الـ memory
- **لا يوجد تأثير على الأداء** - نفس الـ queries الموجودة

---

## 📝 ملاحظات:

1. الحسابات تتم على البيانات الموجودة أصلاً في `/api/metrics`
2. لا يوجد تعديل على الـ Schema أو الـ Models
3. المربعات الجديدة تظهر في نهاية الـ stats grid
4. الألوان: أخضر للديون اللي ليك، أحمر للديون اللي عليك

---

## ✅ تم التنفيذ بنجاح!

التاريخ: 2026-03-27
