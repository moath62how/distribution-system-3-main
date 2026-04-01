/**
 * Material Design Render Functions for Contractors Page
 * These functions override the default render functions with Material Design styling
 */

// Override createContractorCard function
function createContractorCard(contractor) {
    const card = document.createElement('div');
    card.className = 'card-md card-md-hover';
    card.style.position = 'relative';
    card.style.overflow = 'hidden';

    const balance = contractor.balance || 0;
    const balanceClass = balance > 0 ? 'error' : balance < 0 ? 'tertiary' : 'neutral';
    const balanceLabel = balance > 0 ? '(نحن مدينون لهم)' : balance < 0 ? '(هم مدينون لنا)' : '';

    // Accent bar based on balance (reversed for contractors)
    const accentColor = balance > 0 ? 'var(--md-error)' : balance < 0 ? 'var(--md-tertiary)' : 'var(--md-outline)';

    card.innerHTML = `
        <!-- Accent Bar -->
        <div style="position: absolute; top: 0; right: 0; width: 4px; height: 100%; background: ${accentColor};"></div>
        
        <!-- Card Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--md-outline-variant);">
            <div style="flex: 1;">
                <h3 class="font-headline" style="font-size: 1.125rem; font-weight: 700; color: var(--md-on-surface); margin-bottom: 0.25rem;">
                    ${contractor.name}
                </h3>
                <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--md-on-surface-variant); font-size: 0.875rem;">
                    <span class="material-symbols-outlined" style="font-size: 1rem;">badge</span>
                    <span>مقاول عجل</span>
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button class="btn-md-icon crud-btn" data-action="view" data-type="contractor" data-id="${contractor.id}" title="عرض التفاصيل">
                    <span class="material-symbols-outlined" style="font-size: 1.25rem; color: var(--md-primary);">visibility</span>
                </button>
                <button class="btn-md-icon crud-btn" data-action="edit" data-type="contractor" data-id="${contractor.id}" title="تعديل">
                    <span class="material-symbols-outlined" style="font-size: 1.25rem; color: var(--md-secondary);">edit</span>
                </button>
                <button class="btn-md-icon crud-btn" data-action="delete" data-type="contractor" data-id="${contractor.id}" title="حذف">
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
                <span style="font-size: 0.875rem; color: var(--md-on-surface-variant);">إجمالي المشاوير</span>
                <span style="font-size: 0.9375rem; font-weight: 700; color: var(--md-error);">
                    ${formatCurrency(contractor.total_deliveries || 0)} د.ل
                </span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.875rem; color: var(--md-on-surface-variant);">إجمالي المدفوعات</span>
                <span style="font-size: 0.9375rem; font-weight: 700; color: var(--md-tertiary);">
                    ${formatCurrency(contractor.total_payments || 0)} د.ل
                </span>
            </div>
        </div>

        <!-- Stats Grid -->
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem;">
            <div style="background: white; padding: 0.75rem; border-radius: var(--md-radius-lg); border: 1px solid var(--md-outline-variant);">
                <span style="display: block; font-size: 0.75rem; color: var(--md-on-surface-variant); margin-bottom: 0.25rem; font-weight: 600;">عدد المشاوير</span>
                <span style="display: block; font-size: 0.9375rem; font-weight: 700; color: var(--md-on-surface);">
                    ${contractor.delivery_count || 0}
                </span>
            </div>
            <div style="background: white; padding: 0.75rem; border-radius: var(--md-radius-lg); border: 1px solid var(--md-outline-variant);">
                <span style="display: block; font-size: 0.75rem; color: var(--md-on-surface-variant); margin-bottom: 0.25rem; font-weight: 600;">عدد الدفعات</span>
                <span style="display: block; font-size: 0.9375rem; font-weight: 700; color: var(--md-on-surface);">
                    ${contractor.payment_count || 0}
                </span>
            </div>
        </div>

        <!-- Projects List (if available) -->
        ${contractor.projects && contractor.projects.length > 0 ? `
            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--md-outline-variant);">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <span class="material-symbols-outlined" style="font-size: 1rem; color: var(--md-on-surface-variant);">folder</span>
                    <span style="font-size: 0.75rem; font-weight: 600; color: var(--md-on-surface-variant);">المشاريع:</span>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                    ${contractor.projects.map(project => `
                        <span class="badge-md badge-md-primary">${project.project_name || project.client_name}</span>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;

    return card;
}

// Override renderContractors function
function renderContractors(contractors) {
    const container = document.getElementById('contractorsContainer');

    if (!contractors || contractors.length === 0) {
        container.innerHTML = `
            <div class="empty-state-md" style="grid-column: 1 / -1;">
                <span class="material-symbols-outlined">engineering</span>
                <h3>لا يوجد مقاولين</h3>
                <p>لم يتم إضافة أي مقاولين بعد. ابدأ بإضافة مقاول جديد.</p>
                <button class="btn-md btn-md-primary" onclick="document.getElementById('addContractorBtn').click()">
                    <span class="material-symbols-outlined">add</span>
                    إضافة مقاول جديد
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    contractors.forEach(contractor => {
        const card = createContractorCard(contractor);
        container.appendChild(card);
    });
}

// Override addContractorOpeningBalanceRow to use Material Design
function addContractorOpeningBalanceRow(existingData = null) {
    const container = document.getElementById('contractorOpeningBalancesContainer');
    const rowIndex = container.children.length;

    const row = document.createElement('div');
    row.className = 'opening-balance-row';
    row.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr auto; gap: 0.75rem; align-items: end; padding: 1rem; background: var(--md-surface-container-low); border-radius: var(--md-radius-lg);';

    row.innerHTML = `
        <div class="form-group-md" style="margin-bottom: 0;">
            <label class="form-label-md" for="project_${rowIndex}">المشروع/العميل *</label>
            <select class="form-select-md project-select" id="project_${rowIndex}" required>
                <option value="">اختر المشروع/العميل</option>
            </select>
        </div>
        <div class="form-group-md" style="margin-bottom: 0;">
            <label class="form-label-md" for="balance_${rowIndex}">الرصيد الافتتاحي (د.ل)</label>
            <input 
                type="number" 
                class="form-input-md balance-input" 
                id="balance_${rowIndex}" 
                step="0.01" 
                value="${existingData ? existingData.opening_balance : '0'}" 
                placeholder="0.00"
            />
        </div>
        <button 
            type="button" 
            class="btn-md-icon" 
            onclick="this.closest('.opening-balance-row').remove()" 
            title="حذف"
            style="margin-bottom: 0;"
        >
            <span class="material-symbols-outlined" style="color: var(--md-error);">delete</span>
        </button>
    `;

    container.appendChild(row);

    // Load projects for this select
    loadContractorProjectsList().then(projects => {
        const select = row.querySelector('.project-select');
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            if (existingData && existingData.project_id === project.id) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    });
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

console.log('Material Design render functions loaded for contractors page');
