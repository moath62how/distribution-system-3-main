/**
 * Material Design Render Functions for Contractor Details
 * These functions override the default render functions with Material Design styling
 */

// Override renderSummary
function renderSummary(totals) {
    const container = document.getElementById('summaryGrid');
    const balance = totals.balance || 0;
    const openingBalance = totals.openingBalance || 0;

    // Balance logic for contractors: Positive = we owe them (نحن مدينون لهم), Negative = they owe us (هم مدينون لنا)
    const balanceClass = balance > 0 ? 'error' : balance < 0 ? 'tertiary' : 'neutral';
    const balanceLabel = balance > 0 ? '(نحن مدينون لهم)' : balance < 0 ? '(هم مدينون لنا)' : '';

    // Opening balance logic
    const openingClass = openingBalance > 0 ? 'error' : openingBalance < 0 ? 'tertiary' : 'neutral';
    const openingLabel = openingBalance > 0 ? '(نحن مدينون لهم)' : openingBalance < 0 ? '(هم مدينون لنا)' : '';

    container.innerHTML = `
        <div class="stat-card-md ${openingClass}">
            <p class="stat-label-md">الرصيد الافتتاحي</p>
            <p class="stat-value-md ${openingClass}">
                ${formatCurrency(Math.abs(openingBalance))}
                <span style="font-size: 0.75rem; font-weight: 400; color: var(--md-on-surface-variant);">د.ل</span>
            </p>
            ${openingLabel ? `<p style="font-size: 0.75rem; color: var(--md-on-surface-variant); margin-top: 0.25rem;">${openingLabel}</p>` : ''}
        </div>
        <div class="stat-card-md error">
            <p class="stat-label-md">إجمالي المشاوير</p>
            <p class="stat-value-md error">
                ${formatCurrency(totals.totalDeliveries || 0)}
                <span style="font-size: 0.75rem; font-weight: 400; color: var(--md-on-surface-variant);">د.ل</span>
            </p>
        </div>
        <div class="stat-card-md tertiary">
            <p class="stat-label-md">إجمالي المدفوعات</p>
            <p class="stat-value-md tertiary">
                ${formatCurrency(totals.totalPayments || 0)}
                <span style="font-size: 0.75rem; font-weight: 400; color: var(--md-on-surface-variant);">د.ل</span>
            </p>
        </div>
        <div class="stat-card-md ${totals.totalAdjustments > 0 ? 'error' : totals.totalAdjustments < 0 ? 'tertiary' : 'neutral'}">
            <p class="stat-label-md">إجمالي التعديلات</p>
            <p class="stat-value-md ${totals.totalAdjustments > 0 ? 'error' : totals.totalAdjustments < 0 ? 'tertiary' : ''}">
                ${formatCurrency(Math.abs(totals.totalAdjustments || 0))}
                <span style="font-size: 0.75rem; font-weight: 400; color: var(--md-on-surface-variant);">د.ل</span>
            </p>
            ${totals.totalAdjustments !== 0 ? `<p style="font-size: 0.75rem; color: var(--md-on-surface-variant); margin-top: 0.25rem;">${totals.totalAdjustments > 0 ? '(نحن مدينون لهم)' : '(هم مدينون لنا)'}</p>` : ''}
        </div>
        <div class="stat-card-md primary">
            <p class="stat-label-md">الرصيد الصافي</p>
            <p class="stat-value-md ${balanceClass}">
                ${formatCurrency(Math.abs(balance))}
                <span style="font-size: 0.75rem; font-weight: 400; color: var(--md-on-surface-variant);">د.ل</span>
            </p>
            ${balanceLabel ? `<p style="font-size: 0.75rem; color: var(--md-on-surface-variant); margin-top: 0.25rem;">${balanceLabel}</p>` : ''}
        </div>
    `;
}

// Override renderDeliveries
function renderDeliveries(deliveries) {
    const container = document.getElementById('deliveriesContainer');

    if (!deliveries || deliveries.length === 0) {
        container.innerHTML = `
            <div class="empty-state-md">
                <span class="material-symbols-outlined">local_shipping</span>
                <h3>لا توجد مشاوير مسجلة</h3>
                <p>لم يتم تسجيل أي مشاوير لهذا المقاول بعد</p>
            </div>
        `;
        return;
    }

    const table = document.createElement('table');
    table.className = 'table-md';

    // Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = [
        'التاريخ', 'المشروع/العميل', 'الكسارة', 'المادة', 'رقم البون',
        'كمية الحمولة (م³)', 'أجرة المتر', 'الإجمالي', 'إجراءات'
    ];

    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');
    deliveries.forEach(delivery => {
        const row = document.createElement('tr');

        const cells = [
            formatDate(delivery.created_at),
            delivery.project_name || delivery.client_name || '-',
            delivery.crusher_name || '-',
            delivery.material || '-',
            delivery.voucher || '-',
            formatQuantity(delivery.quantity) + ' م³',
            formatCurrency(delivery.contractor_charge_per_meter || 0),
            formatCurrency(delivery.contractor_total_charge || 0)
        ];

        cells.forEach((cellText, index) => {
            const td = document.createElement('td');
            if (index === 3) { // Material column
                td.innerHTML = `<span class="badge-md badge-md-primary">${cellText}</span>`;
            } else if (index === 7) { // Total column
                td.innerHTML = `<span class="font-bold text-error">${cellText}</span>`;
            } else {
                td.textContent = cellText;
            }
            row.appendChild(td);
        });

        // Actions cell
        const actionsCell = document.createElement('td');
        actionsCell.innerHTML = `
            <div style="display: flex; gap: 0.5rem;">
                <button class="table-action-btn crud-btn" data-action="edit" data-type="delivery" data-id="${delivery.id}" title="تعديل">
                    <span class="material-symbols-outlined" style="font-size: 1rem;">edit</span>
                </button>
                <button class="table-action-btn error crud-btn" data-action="delete" data-type="delivery" data-id="${delivery.id}" title="حذف">
                    <span class="material-symbols-outlined" style="font-size: 1rem;">delete</span>
                </button>
            </div>
        `;
        row.appendChild(actionsCell);

        tbody.appendChild(row);
    });
    table.appendChild(tbody);

    container.innerHTML = '';
    container.appendChild(table);
}

// Override renderPayments
function renderPayments(payments) {
    const container = document.getElementById('paymentsContainer');

    if (!payments || payments.length === 0) {
        container.innerHTML = `
            <div class="empty-state-md">
                <span class="material-symbols-outlined">payments</span>
                <h3>لا توجد مدفوعات مسجلة</h3>
                <p>لم يتم تسجيل أي مدفوعات لهذا المقاول بعد</p>
            </div>
        `;
        return;
    }

    const table = document.createElement('table');
    table.className = 'table-md';
    table.style.fontSize = '0.75rem';

    // Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = ['التاريخ', 'المشروع/العميل', 'القيمة', 'الطريقة', 'التفاصيل', 'وصل'];

    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');
    payments.forEach(payment => {
        const row = document.createElement('tr');

        const cells = [
            formatDate(payment.paid_at),
            payment.project_name || payment.client_name || '-',
            formatCurrency(payment.amount),
            payment.method || '-',
            payment.details || payment.note || 'دفعة للمقاول'
        ];

        cells.forEach((cellText, index) => {
            const td = document.createElement('td');
            if (index === 2) { // Amount column
                td.innerHTML = `<span class="font-bold text-tertiary">${cellText}</span>`;
            } else {
                td.textContent = cellText;
            }
            row.appendChild(td);
        });

        // Image cell
        const imageCell = document.createElement('td');
        if (payment.payment_image_url) {
            imageCell.innerHTML = `
                <span class="material-symbols-outlined text-primary" style="cursor: pointer; font-size: 1.25rem;" onclick="showImageModal('${payment.payment_image_url}')" title="عرض الصورة">
                    image
                </span>
            `;
        } else {
            imageCell.textContent = '-';
        }
        row.appendChild(imageCell);

        tbody.appendChild(row);
    });
    table.appendChild(tbody);

    container.innerHTML = '';
    container.appendChild(table);
}

// Override renderAdjustments
function renderAdjustments(adjustments) {
    const container = document.getElementById('adjustmentsContainer');

    if (!adjustments || adjustments.length === 0) {
        container.innerHTML = `
            <div class="empty-state-md">
                <span class="material-symbols-outlined">tune</span>
                <h3>لا توجد تسويات مسجلة</h3>
                <p>لم يتم تسجيل أي تسويات لهذا المقاول بعد</p>
            </div>
        `;
        return;
    }

    const table = document.createElement('table');
    table.className = 'table-md';
    table.style.fontSize = '0.75rem';

    // Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = ['التاريخ', 'المشروع/العميل', 'القيمة', 'الطريقة', 'السبب'];

    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');
    adjustments.forEach(adjustment => {
        const row = document.createElement('tr');

        const amount = adjustment.amount || 0;
        const amountClass = amount > 0 ? 'text-error' : 'text-tertiary';
        const amountLabel = amount > 0 ? '+ ' : '- ';

        const cells = [
            formatDate(adjustment.created_at),
            adjustment.project_name || adjustment.client_name || '-',
            `${amountLabel}${formatCurrency(Math.abs(amount))}`,
            adjustment.method || 'تسوية',
            adjustment.reason || '-'
        ];

        cells.forEach((cellText, index) => {
            const td = document.createElement('td');
            if (index === 2) { // Amount column
                td.innerHTML = `<span class="font-bold ${amountClass}">${cellText}</span>`;
            } else {
                td.textContent = cellText;
            }
            row.appendChild(td);
        });

        tbody.appendChild(row);
    });
    table.appendChild(tbody);

    container.innerHTML = '';
    container.appendChild(table);
}

// Update modal functions to use Material Design
const originalShowModal = window.showModal;
window.showModal = function(modalId) {
    showMaterialModal(modalId);
};

const originalCloseModal = window.closeModal;
window.closeModal = function(modalId) {
    closeMaterialModal(modalId);
};

// Update alert functions
const originalShowAlert = window.showAlert;
window.showAlert = function(message, type = 'info') {
    showMaterialToast(message, type);
};

const originalShowConfirmDialog = window.showConfirmDialog;
window.showConfirmDialog = async function(title, text, confirmText, cancelText) {
    return await showMaterialConfirm(title, text, confirmText, cancelText);
};

console.log('Material Design render functions loaded for contractor details');
