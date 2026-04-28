const { Client, Delivery, Payment, Adjustment, Crusher, CrusherPayment } = require('../models');

class ReportService {
    // Helper functions
    static formatCurrency(amount) {
        return Number(amount || 0).toLocaleString('ar-EG') + ' جنيه';
    }

    static formatQuantity(amount) {
        return Number(amount || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 }) + ' م³';
    }

    static formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Generate deliveries report data
    static async getDeliveriesReportData(clientId, fromDate, toDate) {
        const client = await Client.findById(clientId);
        if (!client) {
            throw new Error('العميل غير موجود');
        }

        // Build date filter
        const dateFilter = {};
        if (fromDate && toDate) {
            const startDate = new Date(fromDate + 'T00:00:00.000Z');
            const endDate = new Date(toDate + 'T23:59:59.999Z');
            dateFilter.created_at = { $gte: startDate, $lte: endDate };
        }

        const deliveries = await Delivery.find({
            client_id: clientId,
            ...dateFilter
        })
            .populate('crusher_id', 'name')
            .populate('contractor_id', 'name')
            .sort({ created_at: -1 });

        // Group by material with normalized names
        const materialTotals = {};
        deliveries.forEach(d => {
            let normalizedMaterial = (d.material || 'غير محدد').toString().trim();

            // Normalize material names
            switch (normalizedMaterial) {
                case 'سن1':
                    normalizedMaterial = 'سن 1';
                    break;
                case 'سن2':
                    normalizedMaterial = 'سن 2';
                    break;
                case 'سن3':
                    normalizedMaterial = 'سن 3';
                    break;
            }

            if (!materialTotals[normalizedMaterial]) {
                materialTotals[normalizedMaterial] = { quantity: 0, value: 0, count: 0 };
            }

            materialTotals[normalizedMaterial].quantity += Number(d.quantity || 0);
            materialTotals[normalizedMaterial].value += Number(d.total_value || 0);
            materialTotals[normalizedMaterial].count += 1;
        });

        return {
            client: {
                name: client.name,
                id: client._id
            },
            deliveries: deliveries.map(d => ({
                created_at: d.created_at,
                material: d.material,
                quantity: d.quantity,
                price_per_meter: d.price_per_meter,
                total_value: d.total_value,
                voucher: d.voucher,
                contractor_name: d.contractor_id?.name || '-'
            })),
            materialTotals,
            fromDate,
            toDate
        };
    }

    // Generate crusher deliveries report data
    static async getCrusherDeliveriesReportData(crusherId, fromDate, toDate) {
        const crusher = await Crusher.findById(crusherId);
        if (!crusher) {
            throw new Error('الكسارة غير موجودة');
        }

        // Build date filter
        const dateFilter = {};
        if (fromDate && toDate) {
            const startDate = new Date(fromDate + 'T00:00:00.000Z');
            const endDate = new Date(toDate + 'T23:59:59.999Z');
            dateFilter.created_at = { $gte: startDate, $lte: endDate };
        }

        const deliveries = await Delivery.find({
            crusher_id: crusherId,
            ...dateFilter
        })
            .populate('client_id', 'name')
            .populate('contractor_id', 'name')
            .sort({ created_at: -1 });

        // Group by material with normalized names
        const materialTotals = {};
        deliveries.forEach(d => {
            let normalizedMaterial = (d.material || 'غير محدد').toString().trim();

            // Normalize material names
            switch (normalizedMaterial) {
                case 'سن1':
                    normalizedMaterial = 'سن 1';
                    break;
                case 'سن2':
                    normalizedMaterial = 'سن 2';
                    break;
                case 'سن3':
                    normalizedMaterial = 'سن 3';
                    break;
            }

            if (!materialTotals[normalizedMaterial]) {
                materialTotals[normalizedMaterial] = { quantity: 0, value: 0, count: 0 };
            }

            materialTotals[normalizedMaterial].quantity += Number(d.car_volume || 0) - Number(d.discount_volume || 0);
            materialTotals[normalizedMaterial].value += Number(d.crusher_total_cost || 0);
            materialTotals[normalizedMaterial].count += 1;
        });

        return {
            crusher: {
                name: crusher.name,
                id: crusher._id
            },
            deliveries: deliveries.map(d => ({
                created_at: d.created_at,
                material: d.material,
                car_volume: d.car_volume,
                discount_volume: d.discount_volume,
                net_quantity: (Number(d.car_volume || 0) - Number(d.discount_volume || 0)),
                material_price_at_time: d.material_price_at_time,
                crusher_total_cost: d.crusher_total_cost,
                voucher: d.voucher,
                client_name: d.client_id?.name || '-',
                contractor_name: d.contractor_id?.name || '-'
            })),
            materialTotals,
            fromDate,
            toDate
        };
    }

    // Generate crusher account statement data
    static async getCrusherAccountStatementData(crusherId, fromDate, toDate) {
        const crusher = await Crusher.findById(crusherId);
        if (!crusher) {
            throw new Error('الكسارة غير موجودة');
        }

        // Build date filter
        const dateFilter = {};
        if (fromDate && toDate) {
            const startDate = new Date(fromDate + 'T00:00:00.000Z');
            const endDate = new Date(toDate + 'T23:59:59.999Z');
            dateFilter.created_at = { $gte: startDate, $lte: endDate };
        }

        // Get deliveries
        const deliveries = await Delivery.find({
            crusher_id: crusherId,
            ...dateFilter
        })
            .sort({ created_at: 1 });

        // Get payments
        const payments = await CrusherPayment.find({
            crusher_id: crusherId,
            ...(fromDate && toDate ? {
                paid_at: { $gte: new Date(fromDate + 'T00:00:00.000Z'), $lte: new Date(toDate + 'T23:59:59.999Z') }
            } : {})
        }).sort({ paid_at: 1 });

        // Get adjustments
        const adjustments = await Adjustment.find({
            entity_type: 'crusher',
            entity_id: crusherId,
            ...dateFilter
        }).sort({ created_at: 1 });

        // Calculate totals
        const totalRequired = deliveries.reduce((sum, d) => sum + Number(d.crusher_total_cost || 0), 0);
        const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
        const totalAdjustments = adjustments.reduce((sum, a) => sum + Number(a.amount || 0), 0);
        const balance = totalRequired + totalAdjustments - totalPaid;

        // Determine date range text
        let dateRangeText = '';
        if (fromDate && toDate) {
            dateRangeText = `من ${this.formatDate(fromDate)} إلى ${this.formatDate(toDate)}`;
        } else {
            const allDates = [
                ...deliveries.map(d => d.created_at),
                ...payments.map(p => p.paid_at),
                ...adjustments.map(a => a.created_at)
            ].filter(Boolean).sort();

            if (allDates.length > 0) {
                const firstDate = allDates[0];
                const lastDate = allDates[allDates.length - 1];
                dateRangeText = `من ${this.formatDate(firstDate)} إلى ${this.formatDate(lastDate)}`;
            } else {
                dateRangeText = 'جميع البيانات';
            }
        }

        return {
            crusher: {
                name: crusher.name,
                id: crusher._id
            },
            deliveries: deliveries.map(d => ({
                created_at: d.created_at,
                material: d.material,
                car_volume: d.car_volume,
                discount_volume: d.discount_volume,
                net_quantity: (Number(d.car_volume || 0) - Number(d.discount_volume || 0)),
                material_price_at_time: d.material_price_at_time,
                crusher_total_cost: d.crusher_total_cost,
                voucher: d.voucher
            })),
            payments: payments.map(p => ({
                paid_at: p.paid_at,
                amount: p.amount,
                payment_method: p.payment_method,
                method: p.method,
                details: p.details,
                note: p.note
            })),
            adjustments: adjustments.map(a => ({
                created_at: a.created_at,
                amount: a.amount,
                method: a.method,
                reason: a.reason
            })),
            totals: {
                totalRequired,
                totalPaid,
                totalAdjustments,
                balance
            },
            dateRangeText
        };
    }
    static async getAccountStatementData(clientId, fromDate, toDate) {
        const client = await Client.findById(clientId);
        if (!client) {
            throw new Error('العميل غير موجود');
        }

        // Build date filter
        const dateFilter = {};
        if (fromDate && toDate) {
            const startDate = new Date(fromDate + 'T00:00:00.000Z');
            const endDate = new Date(toDate + 'T23:59:59.999Z');
            dateFilter.created_at = { $gte: startDate, $lte: endDate };
        }

        // Get deliveries
        const deliveries = await Delivery.find({
            client_id: clientId,
            ...dateFilter
        })
            .populate('crusher_id', 'name')
            .sort({ created_at: 1 });

        // Get payments
        const payments = await Payment.find({
            client_id: clientId,
            ...(fromDate && toDate ? {
                paid_at: { $gte: new Date(fromDate + 'T00:00:00.000Z'), $lte: new Date(toDate + 'T23:59:59.999Z') }
            } : {})
        }).sort({ paid_at: 1 });

        // Get adjustments
        const adjustments = await Adjustment.find({
            entity_type: 'client',
            entity_id: clientId,
            ...dateFilter
        }).sort({ created_at: 1 });

        // Calculate totals
        const totalDeliveries = deliveries.reduce((sum, d) => sum + Number(d.total_value || 0), 0);
        const totalPayments = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
        const totalAdjustments = adjustments.reduce((sum, a) => sum + Number(a.amount || 0), 0);
        const openingBalance = Number(client.opening_balance || 0);
        const balance = openingBalance + totalDeliveries - totalPayments + totalAdjustments;

        // Determine date range text
        let dateRangeText = '';
        if (fromDate && toDate) {
            dateRangeText = `من ${this.formatDate(fromDate)} إلى ${this.formatDate(toDate)}`;
        } else {
            const allDates = [
                ...deliveries.map(d => d.created_at),
                ...payments.map(p => p.paid_at),
                ...adjustments.map(a => a.created_at)
            ].filter(Boolean).sort();

            if (allDates.length > 0) {
                const firstDate = allDates[0];
                const lastDate = allDates[allDates.length - 1];
                dateRangeText = `من ${this.formatDate(firstDate)} إلى ${this.formatDate(lastDate)}`;
            } else {
                dateRangeText = 'جميع البيانات';
            }
        }

        return {
            client: {
                name: client.name,
                id: client._id
            },
            deliveries: deliveries.map(d => ({
                created_at: d.created_at,
                material: d.material,
                quantity: d.quantity,
                price_per_meter: d.price_per_meter,
                total_value: d.total_value,
                voucher: d.voucher
            })),
            payments: payments.map(p => ({
                paid_at: p.paid_at,
                amount: p.amount,
                payment_method: p.payment_method,
                method: p.method,
                details: p.details,
                note: p.note
            })),
            adjustments: adjustments.map(a => ({
                created_at: a.created_at,
                amount: a.amount,
                method: a.method,
                reason: a.reason
            })),
            totals: {
                openingBalance,
                totalDeliveries,
                totalPayments,
                totalAdjustments,
                balance
            },
            dateRangeText
        };
    }

    // Generate deliveries report HTML
    static generateDeliveriesReportHTML(data) {
        const { client, deliveries, materialTotals, fromDate, toDate } = data;

        return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>تقرير التوريدات - ${client.name}</title>
    <style>
        body { font-family: 'Arial', sans-serif; margin: 20px; direction: rtl; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .client-name { font-size: 24px; font-weight: bold; color: #333; }
        .report-title { font-size: 20px; color: #666; margin: 10px 0; }
        .date-range { font-size: 16px; color: #888; }
        .summary { margin: 20px 0; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .summary-card { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #dee2e6; }
        .summary-value { font-size: 18px; font-weight: bold; color: #007bff; }
        .summary-label { font-size: 14px; color: #666; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
        th { background-color: #f8f9fa; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <div class="client-name">${client.name}</div>
        <div class="report-title">تقرير التوريدات المفصل</div>
        <div class="date-range">من ${this.formatDate(fromDate)} إلى ${this.formatDate(toDate)}</div>
    </div>
    
    <div class="summary">
        <h3>ملخص المواد</h3>
        <div class="summary-grid">
            ${Object.keys(materialTotals).map(material => `
                <div class="summary-card">
                    <div class="summary-value">${this.formatQuantity(materialTotals[material].quantity)}</div>
                    <div class="summary-label">${material}</div>
                    <div style="font-size: 12px; color: #888; margin-top: 5px;">
                        ${materialTotals[material].count} تسليمة - ${this.formatCurrency(materialTotals[material].value)}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
    
    <h3>تفاصيل التسليمات</h3>
    <table>
        <thead>
            <tr>
                <th>التاريخ</th>
                <th>نوع المادة</th>
                <th>الكمية</th>
                <th>السعر</th>
                <th>الإجمالي</th>
                <th>رقم البون</th>
                <th>المقاول</th>
            </tr>
        </thead>
        <tbody>
            ${deliveries.map(d => `
                <tr>
                    <td>${this.formatDate(d.created_at)}</td>
                    <td>${d.material || '-'}</td>
                    <td>${this.formatQuantity(d.quantity)}</td>
                    <td>${this.formatCurrency(d.price_per_meter)}</td>
                    <td>${this.formatCurrency(d.total_value || 0)}</td>
                    <td>${d.voucher || '-'}</td>
                    <td>${d.contractor_name || '-'}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
        تم إنشاء هذا التقرير في ${new Date().toLocaleDateString('ar-EG')} - نظام إدارة التوزيع
    </div>
</body>
</html>`;
    }

    // Generate crusher deliveries report HTML
    static generateCrusherDeliveriesReportHTML(data) {
        const { crusher, deliveries, materialTotals, fromDate, toDate } = data;

        return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>تقرير التوريدات - ${crusher.name}</title>
    <style>
        body { font-family: 'Arial', sans-serif; margin: 20px; direction: rtl; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .crusher-name { font-size: 24px; font-weight: bold; color: #333; }
        .report-title { font-size: 20px; color: #666; margin: 10px 0; }
        .date-range { font-size: 16px; color: #888; }
        .summary { margin: 20px 0; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .summary-card { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #dee2e6; }
        .summary-value { font-size: 18px; font-weight: bold; color: #007bff; }
        .summary-label { font-size: 14px; color: #666; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
        th { background-color: #f8f9fa; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <div class="crusher-name">${crusher.name}</div>
        <div class="report-title">تقرير التوريدات المفصل</div>
        <div class="date-range">من ${this.formatDate(fromDate)} إلى ${this.formatDate(toDate)}</div>
    </div>
    
    <div class="summary">
        <h3>ملخص المواد</h3>
        <div class="summary-grid">
            ${Object.keys(materialTotals).map(material => `
                <div class="summary-card">
                    <div class="summary-value">${this.formatQuantity(materialTotals[material].quantity)}</div>
                    <div class="summary-label">${material}</div>
                    <div style="font-size: 12px; color: #888; margin-top: 5px;">
                        ${materialTotals[material].count} تسليمة - ${this.formatCurrency(materialTotals[material].value)}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
    
    <h3>تفاصيل التسليمات</h3>
    <table>
        <thead>
            <tr>
                <th>التاريخ</th>
                <th>نوع المادة</th>
                <th>تكعيب السيارة</th>
                <th>الخصم</th>
                <th>الكمية الصافية</th>
                <th>سعر المتر</th>
                <th>الإجمالي</th>
                <th>رقم البون</th>
                <th>المقاول</th>
            </tr>
        </thead>
        <tbody>
            ${deliveries.map(d => `
                <tr>
                    <td>${this.formatDate(d.created_at)}</td>
                    <td>${d.material || '-'}</td>
                    <td>${this.formatQuantity(d.car_volume)}</td>
                    <td>${this.formatQuantity(d.discount_volume)}</td>
                    <td>${this.formatQuantity(d.net_quantity)}</td>
                    <td>${this.formatCurrency(d.material_price_at_time)}</td>
                    <td>${this.formatCurrency(d.crusher_total_cost || 0)}</td>
                    <td>${d.voucher || '-'}</td>
                    <td>${d.contractor_name || '-'}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
        تم إنشاء هذا التقرير في ${new Date().toLocaleDateString('ar-EG')} - نظام إدارة التوزيع
    </div>
</body>
</html>`;
    }

    // Generate crusher account statement HTML
    static generateCrusherAccountStatementHTML(data) {
        const { crusher, deliveries, payments, adjustments, totals, dateRangeText } = data;

        return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>كشف حساب - ${crusher.name}</title>
    <style>
        body { 
            font-family: 'Arial', sans-serif; 
            margin: 20px; 
            direction: rtl; 
            background: #f8f9fa;
            color: #333;
        }
        @media print {
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
        .crusher-name { 
            font-size: 28px; 
            font-weight: bold; 
            color: #2c3e50;
            margin-bottom: 10px;
        }
        .report-title { 
            font-size: 22px; 
            color: #e67e22; 
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
            background: rgb(149, 100, 6);
            color: white;
            padding: 25px; 
            border-radius: 10px; 
            margin: 20px 0;
            box-shadow: 0 4px 15px rgba(230, 126, 34, 0.3);
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
            body { background: white; }
            .section, .header, .summary { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="crusher-name">${crusher.name}</div>
        <div class="report-title">كشف حساب شامل</div>
        <div class="date-range">${dateRangeText}</div>
    </div>
    
    <div class="summary">
        <h3>ملخص الحساب الإجمالي</h3>
        <div class="summary-grid">
            <div class="summary-item">
                <div class="summary-value balance-negative">${this.formatCurrency(totals.totalRequired || 0)}</div>
                <div class="summary-label">إجمالي المطلوب</div>
            </div>
            <div class="summary-item">
                <div class="summary-value balance-positive">${this.formatCurrency(totals.totalPaid || 0)}</div>
                <div class="summary-label">المدفوع للكسارة</div>
            </div>
            <div class="summary-item">
                <div class="summary-value ${(totals.totalAdjustments || 0) > 0 ? 'balance-negative' : (totals.totalAdjustments || 0) < 0 ? 'balance-positive' : ''}">${this.formatCurrency(Math.abs(totals.totalAdjustments || 0))}</div>
                <div class="summary-label">التسويات ${(totals.totalAdjustments || 0) > 0 ? '(مستحق للكسارة)' : (totals.totalAdjustments || 0) < 0 ? '(مستحق لنا)' : '(متوازنة)'}</div>
            </div>
            <div class="summary-item">
                <div class="summary-value ${(totals.balance || 0) > 0 ? 'balance-negative' : (totals.balance || 0) < 0 ? 'balance-positive' : ''}">${this.formatCurrency(Math.abs(totals.balance || 0))}</div>
                <div class="summary-label">الرصيد الصافي ${(totals.balance || 0) > 0 ? '(مستحق للكسارة)' : (totals.balance || 0) < 0 ? '(مستحق لنا)' : '(متوازن)'}</div>
            </div>
        </div>
    </div>
    
    <div class="section">
        <h3 class="section-title">📦 التوريدات</h3>
        ${deliveries.length > 0 ? `
        <table>
            <thead>
                <tr>
                    <th>التاريخ</th>
                    <th>نوع المادة</th>
                    <th>الكمية الصافية</th>
                    <th>السعر</th>
                    <th>الإجمالي</th>
                    <th>رقم البون</th>
                </tr>
            </thead>
            <tbody>
                ${deliveries.map(d => `
                    <tr>
                        <td>${this.formatDate(d.created_at)}</td>
                        <td>${d.material || '-'}</td>
                        <td>${this.formatQuantity(d.net_quantity)} م³</td>
                        <td>${this.formatCurrency(d.material_price_at_time)}</td>
                        <td class="balance-negative"><strong>${this.formatCurrency(d.crusher_total_cost || 0)}</strong></td>
                        <td>${d.voucher || '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        ` : '<div class="no-data">لا توجد توريدات في هذه الفترة</div>'}
    </div>
    
    <div class="section">
        <h3 class="section-title">💰 المدفوعات</h3>
        ${payments.length > 0 ? `
        <table>
            <thead>
                <tr>
                    <th>التاريخ</th>
                    <th>المبلغ</th>
                    <th>طريقة الدفع</th>
                    <th>التفاصيل</th>
                    <th>ملاحظات</th>
                </tr>
            </thead>
            <tbody>
                ${payments.map(p => `
                    <tr>
                        <td>${this.formatDate(p.paid_at)}</td>
                        <td class="balance-positive"><strong>${this.formatCurrency(p.amount)}</strong></td>
                        <td>${p.payment_method || p.method || '-'}</td>
                        <td>${p.details || '-'}</td>
                        <td>${p.note || '-'}</td>
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
                    <th>النوع</th>
                    <th>السبب</th>
                </tr>
            </thead>
            <tbody>
                ${adjustments.map(a => {
            const amount = Number(a.amount || 0);
            const isPositive = amount > 0;
            return `
                        <tr>
                            <td>${this.formatDate(a.created_at)}</td>
                            <td class="${isPositive ? 'balance-negative' : 'balance-positive'}">
                                <strong>${this.formatCurrency(Math.abs(amount))}</strong>
                                <br><small style="font-size: 12px;">${isPositive ? '(مستحق للكسارة)' : '(مستحق لنا)'}</small>
                            </td>
                            <td>${a.method || 'تعديل حسابي'}</td>
                            <td>${a.reason || '-'}</td>
                        </tr>
                    `;
        }).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}
    
    <div class="footer">
        <p><strong>تم إنشاء هذا الكشف في:</strong> ${new Date().toLocaleDateString('ar-EG')} - ${new Date().toLocaleTimeString('ar-EG')}</p>
        <p>نظام إدارة التوزيع - كشف حساب معتمد</p>
    </div>
</body>
</html>`;
    }
    static generateAccountStatementHTML(data) {
        const { client, deliveries, payments, adjustments, totals, dateRangeText } = data;

        return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>كشف حساب - ${client.name}</title>
    <style>
        body { 
            font-family: 'Arial', sans-serif; 
            margin: 20px; 
            direction: rtl; 
            background: #f8f9fa;
            color: #333;
        }
        @media print {
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
        .client-name { 
            font-size: 28px; 
            font-weight: bold; 
            color: #2c3e50;
            margin-bottom: 10px;
        }
        .report-title { 
            font-size: 22px; 
            color: #27ae60; 
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
            background: rgb(6, 100, 149);
            color: white;
            padding: 25px; 
            border-radius: 10px; 
            margin: 20px 0;
            box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
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
        .balance-positive { color: #e74c3c; }
        .balance-negative { color: #27ae60; }
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
            body { background: white; }
            .section, .header, .summary { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="client-name">${client.name}</div>
        <div class="report-title">كشف حساب شامل</div>
        <div class="date-range">${dateRangeText}</div>
    </div>
    
    <div class="summary">
        <h3>ملخص الحساب الإجمالي</h3>
        <div class="summary-grid">
            <div class="summary-item">
                <div class="summary-value ${(totals.openingBalance || 0) > 0 ? 'balance-negative' : (totals.openingBalance || 0) < 0 ? 'balance-positive' : ''}">${this.formatCurrency(Math.abs(totals.openingBalance || 0))}</div>
                <div class="summary-label">الرصيد الافتتاحي ${(totals.openingBalance || 0) > 0 ? '(عليه)' : (totals.openingBalance || 0) < 0 ? '(له)' : '(متوازن)'}</div>
            </div>
            <div class="summary-item">
                <div class="summary-value balance-negative">${this.formatCurrency(totals.totalDeliveries || 0)}</div>
                <div class="summary-label">إجمالي التوريدات</div>
            </div>
            <div class="summary-item">
                <div class="summary-value balance-positive">${this.formatCurrency(totals.totalPayments || 0)}</div>
                <div class="summary-label">المدفوع من العميل</div>
            </div>
            <div class="summary-item">
                <div class="summary-value ${(totals.totalAdjustments || 0) > 0 ? 'balance-negative' : (totals.totalAdjustments || 0) < 0 ? 'balance-positive' : ''}">${this.formatCurrency(Math.abs(totals.totalAdjustments || 0))}</div>
                <div class="summary-label">التسويات ${(totals.totalAdjustments || 0) > 0 ? '(عليه)' : (totals.totalAdjustments || 0) < 0 ? '(له)' : '(متوازنة)'}</div>
            </div>
            <div class="summary-item">
                <div class="summary-value ${(totals.balance || 0) > 0 ? 'balance-negative' : (totals.balance || 0) < 0 ? 'balance-positive' : ''}">${this.formatCurrency(Math.abs(totals.balance || 0))}</div>
                <div class="summary-label">الرصيد الصافي ${(totals.balance || 0) > 0 ? '(عليه)' : (totals.balance || 0) < 0 ? '(له)' : '(متوازن)'}</div>
            </div>
        </div>
    </div>
    
    <div class="section">
        <h3 class="section-title">📦 التوريدات</h3>
        ${deliveries.length > 0 ? `
        <table>
            <thead>
                <tr>
                    <th>التاريخ</th>
                    <th>نوع المادة</th>
                    <th>الكمية</th>
                    <th>السعر</th>
                    <th>الإجمالي</th>
                    <th>رقم البون</th>
                </tr>
            </thead>
            <tbody>
                ${deliveries.map(d => `
                    <tr>
                        <td>${this.formatDate(d.created_at)}</td>
                        <td>${d.material || '-'}</td>
                        <td>${this.formatQuantity(d.quantity)} م³</td>
                        <td>${this.formatCurrency(d.price_per_meter)}</td>
                        <td class="balance-negative"><strong>${this.formatCurrency(d.total_value || 0)}</strong></td>
                        <td>${d.voucher || '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        ` : '<div class="no-data">لا توجد توريدات في هذه الفترة</div>'}
    </div>
    
    <div class="section">
        <h3 class="section-title">💰 المدفوعات</h3>
        ${payments.length > 0 ? `
        <table>
            <thead>
                <tr>
                    <th>التاريخ</th>
                    <th>المبلغ</th>
                    <th>طريقة الدفع</th>
                    <th>التفاصيل</th>
                    <th>ملاحظات</th>
                </tr>
            </thead>
            <tbody>
                ${payments.map(p => `
                    <tr>
                        <td>${this.formatDate(p.paid_at)}</td>
                        <td class="balance-positive"><strong>${this.formatCurrency(p.amount)}</strong></td>
                        <td>${p.payment_method || p.method || '-'}</td>
                        <td>${p.details || '-'}</td>
                        <td>${p.note || '-'}</td>
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
                    <th>النوع</th>
                    <th>السبب</th>
                </tr>
            </thead>
            <tbody>
                ${adjustments.map(a => {
            const amount = Number(a.amount || 0);
            const isPositive = amount > 0;
            return `
                        <tr>
                            <td>${this.formatDate(a.created_at)}</td>
                            <td class="${isPositive ? 'balance-negative' : 'balance-positive'}">
                                <strong>${this.formatCurrency(Math.abs(amount))}</strong>
                                <br><small style="font-size: 12px;">${isPositive ? '(عليه)' : '(له)'}</small>
                            </td>
                            <td>${a.method || 'تعديل حسابي'}</td>
                            <td>${a.reason || '-'}</td>
                        </tr>
                    `;
        }).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}
    
    <div class="footer">
        <p><strong>تم إنشاء هذا الكشف في:</strong> ${new Date().toLocaleDateString('ar-EG')} - ${new Date().toLocaleTimeString('ar-EG')}</p>
        <p>نظام إدارة التوزيع - كشف حساب معتمد</p>
    </div>
</body>
</html>`;
    }

    // ============================================================================
    // EMPLOYEE ACCOUNT STATEMENT
    // ============================================================================

    static async getEmployeeAccountStatementData(employeeId, fromDate, toDate) {
        const { Employee, EmployeePayment, Adjustment, Attendance } = require('../models');
        const payrollService = require('./payrollService');

        // Get employee
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            throw new Error('الموظف غير موجود');
        }

        // Build date filter for MongoDB
        const dateFilter = {};
        if (fromDate && toDate) {
            const startDate = new Date(fromDate + 'T00:00:00.000Z');
            const endDate = new Date(toDate + 'T23:59:59.999Z');
            dateFilter.$gte = startDate;
            dateFilter.$lte = endDate;
        } else if (fromDate) {
            dateFilter.$gte = new Date(fromDate + 'T00:00:00.000Z');
        } else if (toDate) {
            dateFilter.$lte = new Date(toDate + 'T23:59:59.999Z');
        }

        // Get attendance records
        const attendanceQuery = { employee_id: employeeId };
        if (Object.keys(dateFilter).length > 0) {
            attendanceQuery.period_start = dateFilter;
        }
        const attendance = await Attendance.find(attendanceQuery).sort({ period_start: 1 });

        // Get payments
        const paymentsQuery = { employee_id: employeeId };
        if (Object.keys(dateFilter).length > 0) {
            paymentsQuery.paid_at = dateFilter;
        }
        const payments = await EmployeePayment.find(paymentsQuery).sort({ paid_at: 1 });

        // Get adjustments
        const adjustmentsQuery = {
            entity_type: 'employee',
            entity_id: employeeId
        };
        if (Object.keys(dateFilter).length > 0) {
            adjustmentsQuery.created_at = dateFilter;
        }
        const adjustments = await Adjustment.find(adjustmentsQuery).sort({ created_at: 1 });

        // Calculate balance - pass the employee object, not just the ID
        const balanceData = await payrollService.calculateEmployeeBalance(employee);

        // Format date range text
        let dateRangeText = 'جميع الفترات';
        if (fromDate && toDate) {
            dateRangeText = `من ${new Date(fromDate).toLocaleDateString('ar-EG')} إلى ${new Date(toDate).toLocaleDateString('ar-EG')}`;
        } else if (fromDate) {
            dateRangeText = `من ${new Date(fromDate).toLocaleDateString('ar-EG')}`;
        } else if (toDate) {
            dateRangeText = `حتى ${new Date(toDate).toLocaleDateString('ar-EG')}`;
        }

        return {
            employee: employee.toObject ? employee.toObject() : employee,
            attendance,
            payments,
            adjustments,
            totals: balanceData,
            dateRangeText
        };
    }

    static generateEmployeeAccountStatementHTML(data) {
        const { employee, attendance, payments, adjustments, totals, dateRangeText } = data;

        return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>كشف حساب موظف - ${employee.name}</title>
    <style>
        body { 
            font-family: 'Arial', sans-serif; 
            margin: 20px; 
            direction: rtl; 
            background: #f8f9fa;
            color: #333;
        }
        @media print {
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
        .employee-name { 
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
            background: linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%);
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
        .balance-positive { color: #f39c12; }
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
        .amount-positive { color: #27ae60; font-weight: bold; }
        .amount-negative { color: #e74c3c; font-weight: bold; }
        @media print { 
            body { background: white; }
            .section, .header, .summary { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="employee-name">${employee.name}</div>
        <div class="report-title">كشف حساب موظف شامل</div>
        <div class="date-range">${dateRangeText}</div>
    </div>

    <div class="summary">
        <h3>الملخص المالي</h3>
        <div class="summary-grid">
            <div class="summary-item">
                <div class="summary-value ${totals.balance > 0 ? 'balance-positive' : totals.balance < 0 ? 'balance-negative' : ''}">
                    ${Math.abs(totals.balance || 0).toLocaleString('ar-EG')} ج.م
                </div>
                <div class="summary-label">${totals.balance > 0 ? 'مدفوع زائد' : totals.balance < 0 ? 'مستحق للموظف' : 'متوازن'}</div>
            </div>
            <div class="summary-item">
                <div class="summary-value">${(totals.total_earned_salary || 0).toLocaleString('ar-EG')} ج.م</div>
                <div class="summary-label">إجمالي الراتب المستحق</div>
            </div>
            <div class="summary-item">
                <div class="summary-value">${(totals.total_payments || 0).toLocaleString('ar-EG')} ج.م</div>
                <div class="summary-label">إجمالي المدفوعات</div>
            </div>
            <div class="summary-item">
                <div class="summary-value">${(totals.total_adjustments || 0).toLocaleString('ar-EG')} ج.م</div>
                <div class="summary-label">إجمالي التسويات</div>
            </div>
        </div>
    </div>

    ${attendance && attendance.length > 0 ? `
    <div class="section">
        <h3 class="section-title">سجلات الحضور</h3>
        <table>
            <thead>
                <tr>
                    <th>الفترة</th>
                    <th>أيام الشهر</th>
                    <th>أيام العمل</th>
                    <th>أيام الغياب</th>
                    <th>نوع التسجيل</th>
                    <th>ملاحظات</th>
                </tr>
            </thead>
            <tbody>
                ${attendance.map(record => `
                    <tr>
                        <td>${new Date(record.period_start).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}</td>
                        <td>${record.period_days || 0}</td>
                        <td>${record.worked_days || 0}</td>
                        <td>${(record.period_days || 0) - (record.worked_days || 0)}</td>
                        <td>${record.record_type === 'attendance' ? 'حضور' : 'غياب'}</td>
                        <td>${record.notes || '—'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    ${payments && payments.length > 0 ? `
    <div class="section">
        <h3 class="section-title">المدفوعات</h3>
        <table>
            <thead>
                <tr>
                    <th>التاريخ</th>
                    <th>المبلغ</th>
                    <th>طريقة الدفع</th>
                    <th>التفاصيل</th>
                    <th>ملاحظات</th>
                </tr>
            </thead>
            <tbody>
                ${payments.map(payment => `
                    <tr>
                        <td>${new Date(payment.paid_at).toLocaleDateString('ar-EG')}</td>
                        <td>${(payment.amount || 0).toLocaleString('ar-EG')} ج.م</td>
                        <td>${payment.method || '—'}</td>
                        <td>${payment.details || '—'}</td>
                        <td>${payment.note || '—'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    ${adjustments && adjustments.length > 0 ? `
    <div class="section">
        <h3 class="section-title">التسويات</h3>
        <table>
            <thead>
                <tr>
                    <th>التاريخ</th>
                    <th>المبلغ</th>
                    <th>النوع</th>
                    <th>التفاصيل</th>
                    <th>السبب</th>
                </tr>
            </thead>
            <tbody>
                ${adjustments.map(adj => {
            const amount = parseFloat(adj.amount) || 0;
            const isPositive = amount >= 0;
            return `
                    <tr>
                        <td>${new Date(adj.created_at).toLocaleDateString('ar-EG')}</td>
                        <td class="${isPositive ? 'amount-positive' : 'amount-negative'}">
                            ${Math.abs(amount).toLocaleString('ar-EG')} ج.م
                            ${isPositive ? '(إضافة)' : '(خصم)'}
                        </td>
                        <td>${adj.method || '—'}</td>
                        <td>${adj.details || '—'}</td>
                        <td>${adj.reason || '—'}</td>
                    </tr>
                `}).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    <div class="footer">
        تم إنشاء هذا التقرير في ${new Date().toLocaleString('ar-EG')}
    </div>
</body>
</html>`;
    }
}

module.exports = ReportService;