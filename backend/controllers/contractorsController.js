const contractorService = require('../services/contractorService');
const PDFService = require('../services/pdfServiceUltraFast');

class ContractorsController {
    // Get all contractors
    async getAllContractors(req, res, next) {
        try {
            const result = await contractorService.getAllContractors();
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    // Get contractor by ID
    async getContractorById(req, res, next) {
        try {
            const contractor = await contractorService.getContractorById(req.params.id);

            if (!contractor) {
                return res.status(404).json({ message: 'المقاول غير موجود' });
            }

            res.json(contractor);
        } catch (err) {
            next(err);
        }
    }

    // Create new contractor
    async createContractor(req, res, next) {
        try {
            const { name, opening_balance, opening_balances } = req.body;

            if (!name || name.trim() === '') {
                return res.status(400).json({ message: 'اسم المقاول مطلوب' });
            }

            // Validate opening balances if provided
            if (opening_balances && Array.isArray(opening_balances)) {
                for (const balance of opening_balances) {
                    if (!balance.project_id) {
                        return res.status(400).json({ message: 'يجب تحديد المشروع لكل رصيد افتتاحي' });
                    }
                    if (balance.amount === undefined || balance.amount === null) {
                        return res.status(400).json({ message: 'يجب تحديد المبلغ لكل رصيد افتتاحي' });
                    }
                }
            }

            const contractor = await contractorService.createContractor({
                name: name.trim(),
                opening_balance: opening_balance || 0,
                opening_balances: opening_balances || []
            });

            res.status(201).json(contractor);
        } catch (err) {
            if (err.code === 11000) {
                return res.status(400).json({ message: 'اسم المقاول موجود بالفعل' });
            }
            next(err);
        }
    }

    // Update contractor
    async updateContractor(req, res, next) {
        try {
            const { name, opening_balance, opening_balances } = req.body;

            if (!name || name.trim() === '') {
                return res.status(400).json({ message: 'اسم المقاول مطلوب' });
            }

            // Validate opening balances if provided
            if (opening_balances && Array.isArray(opening_balances)) {
                for (const balance of opening_balances) {
                    if (!balance.project_id) {
                        return res.status(400).json({ message: 'يجب تحديد المشروع لكل رصيد افتتاحي' });
                    }
                    if (balance.amount === undefined || balance.amount === null) {
                        return res.status(400).json({ message: 'يجب تحديد المبلغ لكل رصيد افتتاحي' });
                    }
                }
            }

            const contractor = await contractorService.updateContractor(req.params.id, {
                name: name.trim(),
                opening_balance,
                opening_balances,
                // Pass user info for audit logging
                userId: req.user?.id,
                userRole: req.user?.role,
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            });

            if (!contractor) {
                return res.status(404).json({ message: 'المقاول غير موجود' });
            }

            res.json(contractor);
        } catch (err) {
            if (err.code === 11000) {
                return res.status(400).json({ message: 'اسم المقاول موجود بالفعل' });
            }
            next(err);
        }
    }

    // Delete contractor
    async deleteContractor(req, res, next) {
        try {
            const contractor = await contractorService.deleteContractor(req.params.id);

            if (!contractor) {
                return res.status(404).json({ message: 'المقاول غير موجود' });
            }

            res.json({ message: 'تم حذف المقاول بنجاح' });
        } catch (err) {
            next(err);
        }
    }

    // Get contractor payments
    async getContractorPayments(req, res, next) {
        try {
            const payments = await contractorService.getContractorPayments(req.params.id);
            res.json({ payments });
        } catch (err) {
            next(err);
        }
    }

    // Add contractor payment
    async addContractorPayment(req, res, next) {
        try {
            const { amount, method, details, note, paid_at, payment_image } = req.body;

            const payment = await contractorService.addContractorPayment(req.params.id, {
                amount,
                method: method?.trim() || '',
                details: details?.trim() || '',
                note: note?.trim() || '',
                paid_at: paid_at ? new Date(paid_at) : new Date(),
                payment_image
            });

            res.status(201).json(payment);
        } catch (err) {
            next(err);
        }
    }

    // Update contractor payment
    async updateContractorPayment(req, res, next) {
        try {
            const { amount, method, details, note, paid_at, payment_image } = req.body;

            const payment = await contractorService.updateContractorPayment(
                req.params.id,
                req.params.paymentId,
                {
                    amount,
                    method: method?.trim() || '',
                    details: details?.trim() || '',
                    note: note?.trim() || '',
                    paid_at: paid_at ? new Date(paid_at) : new Date(),
                    payment_image
                }
            );

            if (!payment) {
                return res.status(404).json({ message: 'الدفعة غير موجودة' });
            }

            res.json(payment);
        } catch (err) {
            next(err);
        }
    }

    // Delete contractor payment
    async deleteContractorPayment(req, res, next) {
        try {
            const payment = await contractorService.deleteContractorPayment(
                req.params.id,
                req.params.paymentId
            );

            if (!payment) {
                return res.status(404).json({ message: 'الدفعة غير موجودة' });
            }

            res.json({ message: 'تم حذف الدفعة بنجاح' });
        } catch (err) {
            next(err);
        }
    }

    // Get contractor adjustments
    async getContractorAdjustments(req, res, next) {
        try {
            const adjustments = await contractorService.getContractorAdjustments(req.params.id);
            res.json({ adjustments });
        } catch (err) {
            next(err);
        }
    }

    // Add contractor adjustment
    async addContractorAdjustment(req, res, next) {
        try {
            const { amount, reason } = req.body;

            const adjustment = await contractorService.addContractorAdjustment(req.params.id, {
                amount,
                reason: reason?.trim() || ''
            });

            res.status(201).json(adjustment);
        } catch (err) {
            next(err);
        }
    }

    // Update contractor adjustment
    async updateContractorAdjustment(req, res, next) {
        try {
            const { amount, reason } = req.body;

            const adjustment = await contractorService.updateContractorAdjustment(
                req.params.id,
                req.params.adjustmentId,
                {
                    amount,
                    reason: reason?.trim() || ''
                }
            );

            if (!adjustment) {
                return res.status(404).json({ message: 'التسوية غير موجودة' });
            }

            res.json(adjustment);
        } catch (err) {
            next(err);
        }
    }

    // Delete contractor adjustment
    async deleteContractorAdjustment(req, res, next) {
        try {
            const adjustment = await contractorService.deleteContractorAdjustment(
                req.params.id,
                req.params.adjustmentId
            );

            if (!adjustment) {
                return res.status(404).json({ message: 'التسوية غير موجودة' });
            }

            res.json({ message: 'تم حذف التسوية بنجاح' });
        } catch (err) {
            next(err);
        }
    }

    // Generate deliveries report
    async generateDeliveriesReport(req, res, next) {
        try {
            // Handle both GET and POST requests
            const { from, to } = req.method === 'POST' ? req.body : req.query;
            const contractorId = req.params.id;

            const reportData = await contractorService.generateDeliveriesReport(contractorId, from, to);

            // Generate HTML report
            const html = this.generateDeliveriesReportHTML(reportData);

            // Generate PDF using smart method for optimal performance
            const pdfBuffer = await PDFService.generatePDFSmart(html);

            // Create filename
            const filename = PDFService.formatFilename(
                'تقرير_المشاوير',
                reportData.contractor.name,
                from,
                to
            );

            // Set headers for PDF download
            const headers = PDFService.getDownloadHeaders(filename);
            Object.entries(headers).forEach(([key, value]) => {
                res.setHeader(key, value);
            });

            // Set content length
            res.setHeader('Content-Length', pdfBuffer.length);

            // Send the PDF buffer
            res.end(pdfBuffer, 'binary');
        } catch (err) {
            console.error('PDF generation error:', err);
            next(err);
        }
    }

    // Generate account statement
    async generateAccountStatement(req, res, next) {
        try {
            // Handle both GET and POST requests
            const { from, to } = req.method === 'POST' ? req.body : req.query;
            const contractorId = req.params.id;

            const reportData = await contractorService.generateAccountStatement(contractorId, from, to);

            // Generate HTML report
            const html = this.generateAccountStatementHTML(reportData);

            // Generate PDF using smart method for optimal performance
            const pdfBuffer = await PDFService.generatePDFSmart(html);

            // Create filename
            const filename = PDFService.formatFilename(
                'كشف_حساب',
                reportData.contractor.name,
                from,
                to
            );

            // Set headers for PDF download
            const headers = PDFService.getDownloadHeaders(filename);
            Object.entries(headers).forEach(([key, value]) => {
                res.setHeader(key, value);
            });

            // Set content length
            res.setHeader('Content-Length', pdfBuffer.length);

            // Send the PDF buffer
            res.end(pdfBuffer, 'binary');
        } catch (err) {
            console.error('PDF generation error:', err);
            next(err);
        }
    }
    generateDeliveriesReportHTML(data) {
        const formatCurrency = (amount) => {
            return Number(amount || 0).toLocaleString('ar-EG') + ' جنيه';
        };

        const formatDate = (dateStr) => {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            return date.toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        };

        const formatQuantity = (amount) => {
            return Number(amount || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 }) + ' م³';
        };

        const periodText = data.period.from && data.period.to
            ? `من ${formatDate(data.period.from)} إلى ${formatDate(data.period.to)}`
            : 'جميع الفترات';

        let deliveriesHTML = '';
        data.deliveries.forEach(delivery => {
            deliveriesHTML += `
                <tr>
                    <td>${formatDate(delivery.date)}</td>
                    <td>${delivery.client_name}</td>
                    <td>${delivery.crusher_name}</td>
                    <td>${delivery.material}</td>
                    <td>${formatQuantity(delivery.quantity)}</td>
                    <td>${formatCurrency(delivery.charge_per_meter)}</td>
                    <td class="balance-positive"><strong>${formatCurrency(delivery.total_charge)}</strong></td>
                    <td>${delivery.driver_name || '-'}</td>
                    <td>${delivery.voucher || '-'}</td>
                </tr>
            `;
        });

        return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>تقرير المشاوير - ${data.contractor.name}</title>
    <style>
        body { 
            font-family: 'Arial', sans-serif; 
            margin: 20px; 
            direction: rtl; 
            background: #f8f9fa;
            color: #333;
        }
        .print-button { 
            position: fixed; 
            top: 20px; 
            left: 20px; 
            background: #007bff; 
            color: white; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 5px; 
            cursor: pointer; 
            font-size: 14px;
            z-index: 1000;
        }
        .print-button:hover { background: #0056b3; }
        @media print {
            .print-button { display: none; }
            body { background: white; margin: 10px; }
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .contractor-name { 
            font-size: 28px; 
            font-weight: bold; 
            color: #2c3e50;
            margin-bottom: 10px;
        }
        .report-title { 
            font-size: 22px; 
            color: #8e44ad; 
            margin: 10px 0; 
        }
        .date-range { 
            font-size: 16px; 
            color: #7f8c8d;
            background: #ecf0f1;
            padding: 10px;
            border-radius: 5px;
            display: inline-block;
        }
        .summary { 
            background: rgb(142, 68, 173);
            color: white;
            padding: 25px; 
            border-radius: 10px; 
            margin: 20px 0;
            box-shadow: 0 4px 15px rgba(142, 68, 173, 0.3);
        }
        .summary h3 {
            margin: 0 0 20px 0;
            font-size: 20px;
            text-align: center;
        }
        .summary-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); 
            gap: 20px; 
        }
        .summary-item { 
            text-align: center;
            background: rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 8px;
        }
        .summary-value { 
            font-size: 20px; 
            font-weight: bold; 
            margin-bottom: 5px;
        }
        .summary-label { 
            font-size: 14px; 
            opacity: 0.9;
        }
        .balance-positive { color: #27ae60; }
        .balance-negative { color: #e74c3c; }
        .section { 
            background: white;
            margin: 20px 0;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .section-title { 
            font-size: 18px; 
            font-weight: bold; 
            padding: 20px;
            background: #34495e;
            color: white;
            margin: 0;
        }
        table { 
            width: 100%; 
            border-collapse: collapse;
        }
        th, td { 
            border: 1px solid #bdc3c7; 
            padding: 12px 8px; 
            text-align: center; 
        }
        th { 
            background-color: #ecf0f1; 
            font-weight: bold;
            color: #2c3e50;
        }
        tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        tr:hover {
            background-color: #e8f4fd;
        }
        .print-btn { 
            background: linear-gradient(135deg, #8e44ad, #9b59b6);
            color: white; 
            padding: 12px 25px; 
            border: none; 
            border-radius: 25px; 
            cursor: pointer; 
            margin: 10px;
            font-size: 16px;
            box-shadow: 0 4px 15px rgba(142, 68, 173, 0.3);
            transition: all 0.3s ease;
        }
        .print-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(142, 68, 173, 0.4);
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            background: white;
            border-radius: 10px;
            color: #7f8c8d;
            font-size: 14px;
        }
        .no-data {
            text-align: center;
            padding: 30px;
            color: #7f8c8d;
            font-style: italic;
        }
        @media print { 
            .print-btn { display: none; }
            body { background: white; }
            .section, .header, .summary { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="contractor-name">${data.contractor.name}</div>
        <div class="report-title">تقرير المشاوير المفصل</div>
        <div class="date-range">${periodText}</div>
    </div>
    
    <button class="print-btn" onclick="window.print()">🖨️ طباعة التقرير</button>
    
    <div class="summary">
        <h3>ملخص المشاوير</h3>
        <div class="summary-grid">
            <div class="summary-item">
                <div class="summary-value">${formatCurrency(data.summary.totalEarnings)}</div>
                <div class="summary-label">إجمالي الأرباح</div>
            </div>
            <div class="summary-item">
                <div class="summary-value">${data.summary.totalTrips}</div>
                <div class="summary-label">عدد المشاوير</div>
            </div>
            <div class="summary-item">
                <div class="summary-value">${data.summary.deliveriesCount}</div>
                <div class="summary-label">عدد التسليمات</div>
            </div>
        </div>
    </div>
    
    <div class="section">
        <h3 class="section-title">🚛 تفاصيل المشاوير</h3>
        ${data.deliveries.length > 0 ? `
        <table>
            <thead>
                <tr>
                    <th>التاريخ</th>
                    <th>العميل</th>
                    <th>الكسارة</th>
                    <th>المادة</th>
                    <th>الكمية</th>
                    <th>السعر/متر</th>
                    <th>الإجمالي</th>
                    <th>السائق</th>
                    <th>رقم البون</th>
                </tr>
            </thead>
            <tbody>
                ${deliveriesHTML}
            </tbody>
        </table>
        ` : '<div class="no-data">لا توجد مشاوير في هذه الفترة</div>'}
    </div>
    
    <div class="footer">
        <p><strong>تم إنشاء هذا التقرير في:</strong> ${formatDate(new Date())} - ${new Date().toLocaleTimeString('ar-EG')}</p>
        <p>نظام إدارة التوزيع - تقرير مشاوير معتمد</p>
    </div>
</body>
</html>
        `;
    }

    // Helper method to generate account statement HTML
    generateAccountStatementHTML(data) {
        const formatCurrency = (amount) => {
            return Number(amount || 0).toLocaleString('ar-EG') + ' جنيه';
        };

        const formatDate = (dateStr) => {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            return date.toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        };

        const formatQuantity = (amount) => {
            return Number(amount || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 }) + ' م³';
        };

        const periodText = data.period.isFullHistory
            ? 'جميع البيانات'
            : `من ${formatDate(data.period.from)} إلى ${formatDate(data.period.to)}`;

        // Extract deliveries, payments, and adjustments from transactions
        const deliveries = data.transactions.filter(t => t.type === 'delivery');
        const payments = data.transactions.filter(t => t.type === 'payment');
        const adjustments = data.transactions.filter(t => t.type === 'adjustment');

        return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>كشف حساب - ${data.contractor.name}</title>
    <style>
        body { 
            font-family: 'Arial', sans-serif; 
            margin: 20px; 
            direction: rtl; 
            background: #f8f9fa;
            color: #333;
        }
        .print-button { 
            position: fixed; 
            top: 20px; 
            left: 20px; 
            background: #007bff; 
            color: white; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 5px; 
            cursor: pointer; 
            font-size: 14px;
            z-index: 1000;
        }
        .print-button:hover { background: #0056b3; }
        @media print {
            .print-button { display: none; }
            body { background: white; margin: 10px; }
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .contractor-name { 
            font-size: 28px; 
            font-weight: bold; 
            color: #2c3e50;
            margin-bottom: 10px;
        }
        .report-title { 
            font-size: 22px; 
            color: #8e44ad; 
            margin: 10px 0; 
        }
        .date-range { 
            font-size: 16px; 
            color: #7f8c8d;
            background: #ecf0f1;
            padding: 10px;
            border-radius: 5px;
            display: inline-block;
        }
        .summary { 
            background: rgb(142, 68, 173);
            color: white;
            padding: 25px; 
            border-radius: 10px; 
            margin: 20px 0;
            box-shadow: 0 4px 15px rgba(142, 68, 173, 0.3);
        }
        .summary h3 {
            margin: 0 0 20px 0;
            font-size: 20px;
            text-align: center;
        }
        .summary-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); 
            gap: 20px; 
        }
        .summary-item { 
            text-align: center;
            background: rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 8px;
        }
        .summary-value { 
            font-size: 20px; 
            font-weight: bold; 
            margin-bottom: 5px;
        }
        .summary-label { 
            font-size: 14px; 
            opacity: 0.9;
        }
        .balance-positive { color: #27ae60; }
        .balance-negative { color: #e74c3c; }
        .section { 
            background: white;
            margin: 20px 0;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .section-title { 
            font-size: 18px; 
            font-weight: bold; 
            padding: 20px;
            background: #34495e;
            color: white;
            margin: 0;
        }
        table { 
            width: 100%; 
            border-collapse: collapse;
        }
        th, td { 
            border: 1px solid #bdc3c7; 
            padding: 12px 8px; 
            text-align: center; 
        }
        th { 
            background-color: #ecf0f1; 
            font-weight: bold;
            color: #2c3e50;
        }
        tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        tr:hover {
            background-color: #e8f4fd;
        }
        .print-btn { 
            background: linear-gradient(135deg, #8e44ad, #9b59b6);
            color: white; 
            padding: 12px 25px; 
            border: none; 
            border-radius: 25px; 
            cursor: pointer; 
            margin: 10px;
            font-size: 16px;
            box-shadow: 0 4px 15px rgba(142, 68, 173, 0.3);
            transition: all 0.3s ease;
        }
        .print-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(142, 68, 173, 0.4);
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            background: white;
            border-radius: 10px;
            color: #7f8c8d;
            font-size: 14px;
        }
        .no-data {
            text-align: center;
            padding: 30px;
            color: #7f8c8d;
            font-style: italic;
        }
        @media print { 
            .print-btn { display: none; }
            body { background: white; }
            .section, .header, .summary { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="contractor-name">${data.contractor.name}</div>
        <div class="report-title">كشف حساب شامل</div>
        <div class="date-range">${periodText}</div>
    </div>
    
    <button class="print-btn" onclick="window.print()">🖨️ طباعة كشف الحساب</button>
    
    <div class="summary">
        <h3>ملخص الحساب الإجمالي</h3>
        <div class="summary-grid">
            <div class="summary-item">
                <div class="summary-value ${(data.summary.openingBalance || 0) > 0 ? 'balance-positive' : (data.summary.openingBalance || 0) < 0 ? 'balance-negative' : ''}">${formatCurrency(Math.abs(data.summary.openingBalance || 0))}</div>
                <div class="summary-label">الرصيد الافتتاحي ${(data.summary.openingBalance || 0) > 0 ? '(له)' : (data.summary.openingBalance || 0) < 0 ? '(عليه)' : '(متوازن)'}</div>
            </div>
            <div class="summary-item">
                <div class="summary-value balance-positive">${formatCurrency(data.summary.totalEarnings || 0)}</div>
                <div class="summary-label">إجمالي الأرباح</div>
            </div>
            <div class="summary-item">
                <div class="summary-value balance-negative">${formatCurrency(data.summary.totalPayments || 0)}</div>
                <div class="summary-label">المدفوع للمقاول</div>
            </div>
            <div class="summary-item">
                <div class="summary-value ${(data.summary.totalAdjustments || 0) > 0 ? 'balance-positive' : (data.summary.totalAdjustments || 0) < 0 ? 'balance-negative' : ''}">${formatCurrency(Math.abs(data.summary.totalAdjustments || 0))}</div>
                <div class="summary-label">التسويات ${(data.summary.totalAdjustments || 0) > 0 ? '(له)' : (data.summary.totalAdjustments || 0) < 0 ? '(عليه)' : '(متوازنة)'}</div>
            </div>
            <div class="summary-item">
                <div class="summary-value ${(data.summary.balance || 0) > 0 ? 'balance-positive' : (data.summary.balance || 0) < 0 ? 'balance-negative' : ''}">${formatCurrency(Math.abs(data.summary.balance || 0))}</div>
                <div class="summary-label">الرصيد الصافي ${(data.summary.balance || 0) > 0 ? '(له)' : (data.summary.balance || 0) < 0 ? '(عليه)' : '(متوازن)'}</div>
            </div>
        </div>
    </div>
    
    <div class="section">
        <h3 class="section-title">🚛 المشاوير</h3>
        ${deliveries.length > 0 ? `
        <table>
            <thead>
                <tr>
                    <th>التاريخ</th>
                    <th>البيان</th>
                    <th>رقم البون</th>
                    <th>الكمية</th>
                    <th>السعر</th>
                    <th>الإجمالي</th>
                </tr>
            </thead>
            <tbody>
                ${deliveries.map(d => `
                    <tr>
                        <td>${formatDate(d.date)}</td>
                        <td>${d.description}</td>
                        <td>${d.voucher || '-'}</td>
                        <td>${d.quantity ? formatQuantity(d.quantity) : '-'}</td>
                        <td>${d.charge ? formatCurrency(d.charge) : '-'}</td>
                        <td class="balance-positive"><strong>${formatCurrency(d.debit || 0)}</strong></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        ` : '<div class="no-data">لا توجد مشاوير في هذه الفترة</div>'}
    </div>
    
    <div class="section">
        <h3 class="section-title">💰 المدفوعات</h3>
        ${payments.length > 0 ? `
        <table>
            <thead>
                <tr>
                    <th>التاريخ</th>
                    <th>المبلغ</th>
                    <th>التفاصيل</th>
                </tr>
            </thead>
            <tbody>
                ${payments.map(p => `
                    <tr>
                        <td>${formatDate(p.date)}</td>
                        <td class="balance-negative"><strong>${formatCurrency(p.credit || 0)}</strong></td>
                        <td>${p.description || '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        ` : '<div class="no-data">لا توجد مدفوعات في هذه الفترة</div>'}
    </div>
    
    ${adjustments.length > 0 ? `
    <div class="section">
        <h3 class="section-title">⚖️ التسويات والتعديلات</h3>
        <table>
            <thead>
                <tr>
                    <th>التاريخ</th>
                    <th>المبلغ</th>
                    <th>السبب</th>
                </tr>
            </thead>
            <tbody>
                ${adjustments.map(a => {
            const amount = a.debit - a.credit;
            const isPositive = amount > 0;
            return `
                        <tr>
                            <td>${formatDate(a.date)}</td>
                            <td class="${isPositive ? 'balance-positive' : 'balance-negative'}">
                                <strong>${formatCurrency(Math.abs(amount))}</strong>
                                <br><small style="font-size: 12px;">${isPositive ? '(له)' : '(عليه)'}</small>
                            </td>
                            <td>${a.description || '-'}</td>
                        </tr>
                    `;
        }).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}
    
    <div class="footer">
        <p><strong>تم إنشاء هذا الكشف في:</strong> ${formatDate(new Date())} - ${new Date().toLocaleTimeString('ar-EG')}</p>
        <p>نظام إدارة التوزيع - كشف حساب معتمد</p>
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #dee2e6;">
            <p style="margin: 0;"><strong>الرصيد النهائي:</strong> 
                <span class="${(data.summary.balance || 0) > 0 ? 'balance-positive' : (data.summary.balance || 0) < 0 ? 'balance-negative' : ''}" style="font-size: 18px;">
                    ${formatCurrency(Math.abs(data.summary.balance || 0))} - ${data.summary.balanceDescription}
                </span>
            </p>
        </div>
    </div>
</body>
</html>
        `;
    }

    // Get opening balances by project (for project analysis)
    async getOpeningBalancesByProject(req, res, next) {
        try {
            const { project_id } = req.query;

            if (!project_id) {
                return res.status(400).json({ message: 'معرف المشروع مطلوب' });
            }

            const ContractorOpeningBalance = require('../models/ContractorOpeningBalance');
            
            const openingBalances = await ContractorOpeningBalance.find({
                project_id,
                is_deleted: false
            }).populate('contractor_id', 'name').lean();

            res.json({ opening_balances: openingBalances });
        } catch (err) {
            console.error('❌ Error in getOpeningBalancesByProject (contractors):', err);
            res.status(500).json({ 
                message: 'خطأ في تحميل الأرصدة الافتتاحية',
                error: err.message,
                opening_balances: [] 
            });
        }
    }
}

module.exports = new ContractorsController();