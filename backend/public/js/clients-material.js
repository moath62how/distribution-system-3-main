/**
 * Material Design Render Functions for Clients Page
 * These functions override the default render functions with Material Design styling
 */

// Override createClientCard function
function createClientCard(client) {
    const card = document.createElement('div');
    card.className = 'card-md card-md-hover';
    card.style.position = 'relative';
    card.style.overflow = 'hidden';

    const balance = client.balance || 0;
    const balanceClass = balance > 0 ? 'tertiary' : balance < 0 ? 'error' : 'neutral';
    const balanceLabel = balance > 0 ? '(مستحق لنا)' : balance < 0 ? '(مستحق للعميل)' : '';

    // Accent bar based on balance
    const accentColor = balance > 0 ? 'var(--md-tertiary)' : balance < 0 ? 'var(--md-error)' : 'var(--md-outline)';

    card.innerHTML = `
        <!-- Accent Bar -->
        <div style="position: absolute; top: 0; right: 0; width: 4px; height: 100%; background: ${accentColor};"></div>
        
        <!-- Card Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--md-outline-variant);">
            <div style="flex: 1;">
                <h3 class="font-headline" style="font-size: 1.125rem; font-weight: 700; color: var(--md-on-surface); margin-bottom: 0.25rem;">
                    ${client.name}
                </h3>
                ${client.phone ? `
                    <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--md-on-surface-variant); font-size: 0.875rem;">
                        <span class="material-symbols-outlined" style="font-size: 1rem;">phone</span>
                        <span>${client.phone}</span>
                    </div>
                ` : ''}
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button class="btn-md-icon crud-btn" data-action="view" data-type="client" data-id="${client.id}" title="عرض التفاصيل">
                    <span class="material-symbols-outlined" style="font-size: 1.25rem; color: var(--md-primary);">visibility</span>
                </button>
                <button class="btn-md-icon crud-btn" data-action="edit" data-type="client" data-id="${client.id}" title="تعديل">
                    <span class="material-symbols-outlined" style="font-size: 1.25rem; color: var(--md-secondary);">edit</span>
                </button>
                <button class="btn-md-icon crud-btn" data-action="delete" data-type="client" data-id="${client.id}" title="حذف">
                    <span class="material-symbols-outlined" style="font-size: 1.25rem; color: var(--md-error);">delete</span>
                </button>
            </div>
        </div>

        <!-- Financial Summary -->
        <div style="background: var(--md-surface-container-low); border-radius: var(--md-radius-xl); padding: 1rem; margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                <span style="font-size: 0.875rem; font-weight: 600; color: var(--md-on-surface-variant);">الرصيد الصافي</span>
                <div style="text-align: left;">
                    <span class="font-headline" style="font-size: 1.25rem; font-weight: 800; color: var(--md-${balanceClass});">
                        ${formatCurrency(Math.abs(balance))}
                    </span>
                    <span style="font-size: 0.75rem; color: var(--md-on-surface-variant); margin-right: 0.25rem;">د.ل</span>
                    ${balanceLabel ? `<div style="font-size: 0.75rem; color: var(--md-on-surface-variant); margin-top: 0.125rem;">${balanceLabel}</div>` : ''}
                </div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <span style="font-size: 0.875rem; color: var(--md-on-surface-variant);">إجمالي التوريدات</span>
                <span style="font-size: 0.9375rem; font-weight: 700; color: var(--md-tertiary);">
                    ${formatCurrency(client.total_deliveries || 0)} د.ل
                </span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.875rem; color: var(--md-on-surface-variant);">إجمالي المدفوعات</span>
                <span style="font-size: 0.9375rem; font-weight: 700; color: var(--md-error);">
                    ${formatCurrency(client.total_payments || 0)} د.ل
                </span>
            </div>
        </div>

        <!-- Stats Grid -->
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem;">
            <div style="background: white; padding: 0.75rem; border-radius: var(--md-radius-lg); border: 1px solid var(--md-outline-variant);">
                <span style="display: block; font-size: 0.75rem; color: var(--md-on-surface-variant); margin-bottom: 0.25rem; font-weight: 600;">عدد التوريدات</span>
                <span style="display: block; font-size: 0.9375rem; font-weight: 700; color: var(--md-on-surface);">
                    ${client.delivery_count || 0}
                </span>
            </div>
            <div style="background: white; padding: 0.75rem; border-radius: var(--md-radius-lg); border: 1px solid var(--md-outline-variant);">
                <span style="display: block; font-size: 0.75rem; color: var(--md-on-surface-variant); margin-bottom: 0.25rem; font-weight: 600;">عدد الدفعات</span>
                <span style="display: block; font-size: 0.9375rem; font-weight: 700; color: var(--md-on-surface);">
                    ${client.payment_count || 0}
                </span>
            </div>
        </div>
    `;

    return card;
}

// Override renderClients function
function renderClients(clients) {
    const container = document.getElementById('clientsContainer');

    if (!clients || clients.length === 0) {
        container.innerHTML = `
            <div class="empty-state-md" style="grid-column: 1 / -1;">
                <span class="material-symbols-outlined">group_off</span>
                <h3>لا يوجد عملاء</h3>
                <p>لم يتم إضافة أي عملاء بعد. ابدأ بإضافة عميل جديد.</p>
                <button class="btn-md btn-md-primary" onclick="document.getElementById('addClientBtn').click()">
                    <span class="material-symbols-outlined">add</span>
                    إضافة عميل جديد
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    clients.forEach(client => {
        const card = createClientCard(client);
        container.appendChild(card);
    });
}

// Override renderPagination function
function renderPagination(pagination) {
    const container = document.getElementById('paginationContainer');

    if (!pagination || pagination.totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    const { currentPage, totalPages, totalClients } = pagination;

    let paginationHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 2rem 0;">
            <span style="font-size: 0.875rem; color: var(--md-on-surface-variant); font-weight: 600;">
                عرض ${totalClients} عميل - صفحة ${currentPage} من ${totalPages}
            </span>
            <div style="display: flex; gap: 0.5rem;">
    `;

    // Previous button
    if (currentPage > 1) {
        paginationHTML += `
            <button class="btn-md btn-md-sm btn-md-outline" onclick="loadClients(${currentPage - 1})">
                <span class="material-symbols-outlined" style="font-size: 1rem;">chevron_right</span>
                السابق
            </button>
        `;
    }

    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            paginationHTML += `
                <button class="btn-md btn-md-sm btn-md-primary" disabled>
                    ${i}
                </button>
            `;
        } else {
            paginationHTML += `
                <button class="btn-md btn-md-sm btn-md-outline" onclick="loadClients(${i})">
                    ${i}
                </button>
            `;
        }
    }

    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `
            <button class="btn-md btn-md-sm btn-md-outline" onclick="loadClients(${currentPage + 1})">
                التالي
                <span class="material-symbols-outlined" style="font-size: 1rem;">chevron_left</span>
            </button>
        `;
    }

    paginationHTML += `
            </div>
        </div>
    `;

    container.innerHTML = paginationHTML;
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

console.log('Material Design render functions loaded for clients page');
