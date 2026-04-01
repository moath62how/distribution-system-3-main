// --- Helpers ---

/**
 * Creates a single contractor card DOM node using unified CSS classes
 * @param {object} contractor - object (id, name, balance, ...future fields)
 * @returns {HTMLElement}
 */
function createContractorCard(contractor) {
    const card = document.createElement('div');
    card.className = 'modern-card';
    card.style.cssText = 'padding: 1.5rem; transition: all 0.3s; cursor: pointer; position: relative; overflow: hidden;';
    
    // Gradient accent bar
    const accentBar = document.createElement('div');
    accentBar.style.cssText = 'position: absolute; top: 0; right: 0; left: 0; height: 4px; background: linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%);';
    card.appendChild(accentBar);

    // Header with name
    const header = document.createElement('div');
    header.style.cssText = 'margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #f8fafc;';

    const name = document.createElement('h3');
    name.style.cssText = 'font-size: 1.25rem; font-weight: 700; color: var(--on-surface); margin: 0; display: flex; align-items: center; gap: 0.5rem;';
    name.innerHTML = `<i class="fas fa-user-tie" style="color: var(--primary);"></i> ${contractor.name || "—"}`;

    header.appendChild(name);
    card.appendChild(header);

    // Balance section with gradient background
    const balance = contractor.balance || 0;
    const balanceSection = document.createElement('div');
    balanceSection.style.cssText = `
        background: linear-gradient(135deg, ${balance > 0 ? 'var(--tertiary)' : balance < 0 ? 'var(--error)' : 'var(--on-surface-variant)'} 0%, ${balance > 0 ? 'var(--tertiary-dim)' : balance < 0 ? '#dc2626' : '#475569'} 100%);
        color: white;
        padding: 1.25rem;
        border-radius: 0.75rem;
        margin-bottom: 1.5rem;
        text-align: center;
    `;

    const balanceLabel = document.createElement('div');
    balanceLabel.style.cssText = 'font-size: 0.75rem; opacity: 0.9; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;';
    balanceLabel.textContent = 'الرصيد الحالي';

    const balanceValue = document.createElement('div');
    balanceValue.style.cssText = 'font-size: 1.75rem; font-weight: 800; margin-bottom: 0.25rem;';
    balanceValue.textContent = formatCurrency(Math.abs(balance));

    const balanceStatus = document.createElement('div');
    balanceStatus.style.cssText = 'font-size: 0.75rem; opacity: 0.9;';
    balanceStatus.textContent = balance > 0 ? '(مستحق للمقاول)' : balance < 0 ? '(مستحق لنا)' : '(متوازن)';

    balanceSection.appendChild(balanceLabel);
    balanceSection.appendChild(balanceValue);
    balanceSection.appendChild(balanceStatus);
    card.appendChild(balanceSection);

    // Stats grid
    const stats = document.createElement('div');
    stats.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;';

    const statsItems = [
        { icon: 'fa-truck-loading', label: 'عدد التسليمات', value: contractor.deliveriesCount || 0, color: 'var(--info)' },
        { icon: 'fa-coins', label: 'إجمالي المستحق', value: formatCurrency(contractor.totalTrips || contractor.totalEarnings || 0), color: 'var(--warning)' }
    ];

    statsItems.forEach(stat => {
        const statItem = document.createElement('div');
        statItem.style.cssText = 'background: #f8fafc; padding: 1rem; border-radius: 0.75rem; text-align: center; transition: all 0.2s;';
        statItem.onmouseenter = () => statItem.style.background = '#f1f5f9';
        statItem.onmouseleave = () => statItem.style.background = '#f8fafc';

        const statIcon = document.createElement('i');
        statIcon.className = `fas ${stat.icon}`;
        statIcon.style.cssText = `color: ${stat.color}; font-size: 1.25rem; margin-bottom: 0.5rem; display: block;`;

        const statValue = document.createElement('div');
        statValue.style.cssText = 'font-size: 1.125rem; font-weight: 700; color: var(--on-surface); margin-bottom: 0.25rem;';
        statValue.textContent = stat.value;

        const statLabel = document.createElement('div');
        statLabel.style.cssText = 'font-size: 0.75rem; color: var(--on-surface-variant);';
        statLabel.textContent = stat.label;

        statItem.appendChild(statIcon);
        statItem.appendChild(statValue);
        statItem.appendChild(statLabel);
        stats.appendChild(statItem);
    });

    card.appendChild(stats);

    // Actions
    const actions = document.createElement('div');
    actions.style.cssText = 'display: flex; gap: 0.75rem;';

    const detailsBtn = document.createElement('button');
    detailsBtn.className = 'btn-modern btn-primary-modern';
    detailsBtn.style.cssText = 'flex: 1; font-size: 0.875rem; padding: 0.625rem 1rem;';
    detailsBtn.innerHTML = '<i class="fas fa-chart-line"></i> التفاصيل';
    detailsBtn.onclick = (e) => {
        e.stopPropagation();
        window.location.href = `contractor-details.html?id=${contractor.id}`;
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-modern btn-danger-modern';
    deleteBtn.style.cssText = 'padding: 0.625rem 1rem; font-size: 0.875rem;';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteContractor(contractor.id, contractor.name);
    };

    actions.appendChild(detailsBtn);
    actions.appendChild(deleteBtn);
    card.appendChild(actions);

    // Card hover effect
    card.onmouseenter = () => {
        card.style.transform = 'translateY(-4px)';
        card.style.boxShadow = 'var(--shadow-lg)';
    };
    card.onmouseleave = () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = 'var(--shadow-soft)';
    };

    // Click to view details
    card.onclick = () => window.location.href = `contractor-details.html?id=${contractor.id}`;

    return card;
}

function renderContractors(contractors) {
    const container = document.getElementById('contractorsContainer');
    if (!container) return;

    container.innerHTML = '';

    if (!contractors || contractors.length === 0) {
        container.innerHTML = `
            <div class="empty-state-modern" style="grid-column: 1 / -1;">
                <i class="fas fa-user-tie"></i>
                <h3>لا توجد مقاولين مسجلين</h3>
                <p>ابدأ بإضافة مقاول جديد لإدارة المشاوير والمستحقات</p>
                <button class="btn-modern btn-primary-modern" onclick="document.getElementById('addContractorBtn').click()">
                    <i class="fas fa-plus"></i> إضافة مقاول جديد
                </button>
            </div>
        `;
        return;
    }

    contractors.forEach(contractor => {
        container.appendChild(createContractorCard(contractor));
    });
}

async function fetchContractors() {
    const resp = await authManager.makeAuthenticatedRequest(`${API_BASE}/contractors`);
    if (!resp.ok) throw new Error('تعذر تحميل المقاولين');
    const data = await resp.json();
    // Handle both old format (direct array) and new format (object with contractors property)
    return data.contractors || data;
}

// Delete contractor function
async function deleteContractor(contractorId, contractorName) {
    try {
        // Show confirmation dialog
        const result = await Swal.fire({
            title: 'تأكيد الحذف',
            text: `هل أنت متأكد من حذف المقاول "${contractorName}"؟`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'نعم، احذف',
            cancelButtonText: 'إلغاء',
            reverseButtons: true
        });

        if (!result.isConfirmed) {
            return;
        }

        // Show loading
        Swal.fire({
            title: 'جاري الحذف...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const response = await authManager.makeAuthenticatedRequest(`${API_BASE}/contractors/${contractorId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'فشل في حذف المقاول');
        }

        // Show success message
        await Swal.fire({
            title: 'تم الحذف بنجاح',
            text: data.message,
            icon: 'success',
            confirmButtonText: 'موافق'
        });

        // Reload contractors list
        location.reload();

    } catch (error) {
        console.error('Delete contractor error:', error);

        // Show error message
        Swal.fire({
            title: 'خطأ في الحذف',
            text: error.message,
            icon: 'error',
            confirmButtonText: 'موافق'
        });
    }
}

// --- Initialization on DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', function () {
    // Check authentication first
    if (authManager.checkAuth()) {
        showInlineLoader('contractorsContainer', 'جاري تحميل المقاولين...');
        fetchContractors()
            .then(renderContractors)
            .catch(err => {
                console.error(err);
                const container = document.getElementById('contractorsContainer');
                if (container) {
                    container.innerHTML = `
                        <div class="error-state">
                            <div class="error-icon"><i class="fas fa-times-circle"></i></div>
                            <div class="error-text">خطأ في تحميل بيانات المقاولين</div>
                            <div class="error-details">${err.message}</div>
                            <button class="btn btn-primary" onclick="location.reload()">إعادة المحاولة</button>
                        </div>
                    `;
                }
            });
    }
});

// Make functions available globally
window.deleteContractor = deleteContractor;

// Opening balances management
let openingBalanceCounter = 0;
let projectsList = [];

// Load projects for dropdown
async function loadProjects() {
    try {
        const resp = await authManager.makeAuthenticatedRequest(`${API_BASE}/projects`);
        if (!resp.ok) throw new Error('Failed to load projects');
        const data = await resp.json();
        projectsList = data.projects || data;
    } catch (error) {
        console.error('Error loading projects:', error);
        projectsList = [];
    }
}

// Add opening balance row
function addOpeningBalanceRow() {
    const container = document.getElementById('contractorOpeningBalancesContainer');
    const rowId = `openingBalance_${openingBalanceCounter++}`;

    const row = document.createElement('div');
    row.className = 'opening-balance-row';
    row.id = rowId;
    row.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr 2fr auto; gap: 10px; margin-bottom: 10px; align-items: start; padding: 15px; background: var(--gray-50); border-radius: var(--radius); border: 1px solid var(--gray-200);';

    // Project dropdown
    const projectCol = document.createElement('div');
    const projectLabel = document.createElement('label');
    projectLabel.textContent = 'المشروع';
    projectLabel.style.cssText = 'display: block; margin-bottom: 5px; font-size: 0.9rem; font-weight: 500;';
    const projectSelect = document.createElement('select');
    projectSelect.className = 'form-input opening-balance-project';
    projectSelect.required = true;
    projectSelect.innerHTML = '<option value="">اختر المشروع</option>';
    projectsList.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.name;
        projectSelect.appendChild(option);
    });
    projectCol.appendChild(projectLabel);
    projectCol.appendChild(projectSelect);

    // Amount input
    const amountCol = document.createElement('div');
    const amountLabel = document.createElement('label');
    amountLabel.textContent = 'المبلغ';
    amountLabel.style.cssText = 'display: block; margin-bottom: 5px; font-size: 0.9rem; font-weight: 500;';
    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.className = 'form-input opening-balance-amount';
    amountInput.step = '0.01';
    amountInput.required = true;
    amountInput.placeholder = '0.00';
    amountCol.appendChild(amountLabel);
    amountCol.appendChild(amountInput);

    // Description input
    const descCol = document.createElement('div');
    const descLabel = document.createElement('label');
    descLabel.textContent = 'الوصف';
    descLabel.style.cssText = 'display: block; margin-bottom: 5px; font-size: 0.9rem; font-weight: 500;';
    const descInput = document.createElement('input');
    descInput.type = 'text';
    descInput.className = 'form-input opening-balance-description';
    descInput.placeholder = 'وصف اختياري';
    descInput.maxLength = 500;
    descCol.appendChild(descLabel);
    descCol.appendChild(descInput);

    // Remove button
    const removeCol = document.createElement('div');
    removeCol.style.cssText = 'padding-top: 28px;';
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-sm btn-danger';
    removeBtn.innerHTML = '<i class="fas fa-trash"></i>';
    removeBtn.onclick = () => document.getElementById(rowId).remove();
    removeCol.appendChild(removeBtn);

    row.appendChild(projectCol);
    row.appendChild(amountCol);
    row.appendChild(descCol);
    row.appendChild(removeCol);

    container.appendChild(row);
}

// Get opening balances from form
function getOpeningBalances() {
    const container = document.getElementById('contractorOpeningBalancesContainer');
    const rows = container.querySelectorAll('.opening-balance-row');
    const balances = [];

    rows.forEach(row => {
        const project = row.querySelector('.opening-balance-project').value;
        const amount = parseFloat(row.querySelector('.opening-balance-amount').value);
        const description = row.querySelector('.opening-balance-description').value;

        if (project && amount) {
            balances.push({
                project_id: project,
                amount: amount,
                description: description || ''
            });
        }
    });

    return balances;
}

// Show add contractor modal
function showAddContractorModal() {
    document.getElementById('addContractorModal').style.display = 'flex';
    document.getElementById('contractorName').focus();
}

// Close add contractor modal
function closeAddContractorModal() {
    document.getElementById('addContractorModal').style.display = 'none';
    document.getElementById('addContractorForm').reset();
    document.getElementById('contractorOpeningBalancesContainer').innerHTML = '';
    document.getElementById('addContractorMessage').innerHTML = '';
    openingBalanceCounter = 0;
}

// Handle add contractor form submission
let isSubmittingContractor = false;

async function handleAddContractor(e) {
    e.preventDefault();

    // Prevent double submission
    if (isSubmittingContractor) {
        console.log('Already submitting, please wait...');
        return;
    }

    const name = document.getElementById('contractorName').value.trim();
    const openingBalances = getOpeningBalances();

    if (!name) {
        await Swal.fire({
            title: 'خطأ',
            text: 'يرجى إدخال اسم المقاول',
            icon: 'error',
            confirmButtonText: 'موافق'
        });
        return;
    }

    isSubmittingContractor = true;
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton ? submitButton.textContent : 'حفظ';
    
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'جاري الإضافة...';
    }

    try {
        const response = await authManager.makeAuthenticatedRequest(`${API_BASE}/contractors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name,
                opening_balances: openingBalances
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'فشل في إضافة المقاول');
        }

        await Swal.fire({
            icon: 'success',
            title: 'تم الحفظ',
            text: 'تم إضافة المقاول بنجاح',
            confirmButtonText: 'موافق',
            timer: 2000
        });

        closeAddContractorModal();
        location.reload();

    } catch (error) {
        console.error('Error adding contractor:', error);
        
        await Swal.fire({
            title: 'خطأ',
            text: error.message || 'فشل في إضافة المقاول',
            icon: 'error',
            confirmButtonText: 'موافق'
        });
    } finally {
        // Always reset the flag and button state
        isSubmittingContractor = false;
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    }
}

// Initialize modal handlers
document.addEventListener('DOMContentLoaded', async function () {
    // Load projects first
    await loadProjects();

    // Add contractor button
    document.getElementById('addContractorBtn').addEventListener('click', showAddContractorModal);

    // Add opening balance button
    document.getElementById('addContractorOpeningBalanceBtn').addEventListener('click', addOpeningBalanceRow);

    // Form submission
    document.getElementById('addContractorForm').addEventListener('submit', handleAddContractor);
});

// Make functions globally available
window.closeAddContractorModal = closeAddContractorModal;


// ============================================================================
// OPENING BALANCE MANAGEMENT (Project-Based) - ADD & EDIT FORMS
// ============================================================================

let contractorOpeningBalanceCounter = 0;
let contractorProjectsList = [];
let editContractorOpeningBalanceCounter = 0;

async function loadContractorProjectsList() {
    try {
        const response = await authManager.makeAuthenticatedRequest(`${API_BASE}/projects`);
        const data = await response.json();
        contractorProjectsList = data.projects || [];
    } catch (error) {
        console.error('Error loading projects:', error);
        contractorProjectsList = [];
    }
}

function addContractorOpeningBalanceRow(existingData = null) {
    const container = document.getElementById('contractorOpeningBalancesContainer');
    const rowId = contractorOpeningBalanceCounter++;
    
    const row = document.createElement('div');
    row.className = 'opening-balance-row';
    row.id = `contractorOpeningBalance_${rowId}`;
    row.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr 2fr auto; gap: 10px; margin-bottom: 10px; align-items: start; padding: 15px; background: var(--gray-50); border-radius: var(--radius); border: 1px solid var(--gray-200);';
    
    // Project column
    const projectCol = document.createElement('div');
    const projectLabel = document.createElement('label');
    projectLabel.style.cssText = 'display: block; margin-bottom: 5px; font-size: 0.9rem; font-weight: 500;';
    projectLabel.textContent = 'المشروع';
    const projectSelect = document.createElement('select');
    projectSelect.className = 'form-input contractor-opening-balance-project';
    projectSelect.required = true;
    projectSelect.innerHTML = '<option value="">اختر المشروع</option>';
    contractorProjectsList.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.name;
        if (existingData && existingData.project_id === project.id) {
            option.selected = true;
        }
        projectSelect.appendChild(option);
    });
    projectCol.appendChild(projectLabel);
    projectCol.appendChild(projectSelect);
    
    // Amount column
    const amountCol = document.createElement('div');
    const amountLabel = document.createElement('label');
    amountLabel.style.cssText = 'display: block; margin-bottom: 5px; font-size: 0.9rem; font-weight: 500;';
    amountLabel.textContent = 'المبلغ';
    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.className = 'form-input contractor-opening-balance-amount';
    amountInput.placeholder = '0.00';
    amountInput.step = '0.01';
    amountInput.required = true;
    if (existingData) {
        amountInput.value = existingData.amount || 0;
    }
    amountCol.appendChild(amountLabel);
    amountCol.appendChild(amountInput);
    
    // Description column
    const descCol = document.createElement('div');
    const descLabel = document.createElement('label');
    descLabel.style.cssText = 'display: block; margin-bottom: 5px; font-size: 0.9rem; font-weight: 500;';
    descLabel.textContent = 'الوصف';
    const descInput = document.createElement('input');
    descInput.type = 'text';
    descInput.className = 'form-input contractor-opening-balance-description';
    descInput.placeholder = 'وصف اختياري';
    descInput.maxLength = 500;
    if (existingData && existingData.description) {
        descInput.value = existingData.description;
    }
    descCol.appendChild(descLabel);
    descCol.appendChild(descInput);
    
    // Delete button column
    const deleteCol = document.createElement('div');
    deleteCol.style.paddingTop = '28px';
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn-sm btn-danger';
    deleteBtn.textContent = '<i class="fas fa-trash"></i>';
    deleteBtn.onclick = () => row.remove();
    deleteCol.appendChild(deleteBtn);
    
    row.appendChild(projectCol);
    row.appendChild(amountCol);
    row.appendChild(descCol);
    row.appendChild(deleteCol);
    
    container.appendChild(row);
}

function getContractorOpeningBalances() {
    const container = document.getElementById('contractorOpeningBalancesContainer');
    const rows = container.querySelectorAll('.opening-balance-row');
    const balances = [];
    
    rows.forEach(row => {
        const projectSelect = row.querySelector('.contractor-opening-balance-project');
        const amountInput = row.querySelector('.contractor-opening-balance-amount');
        const descInput = row.querySelector('.contractor-opening-balance-description');
        
        if (projectSelect.value && amountInput.value) {
            balances.push({
                project_id: projectSelect.value,
                amount: parseFloat(amountInput.value) || 0,
                description: descInput.value || ''
            });
        }
    });
    
    return balances;
}

// Edit contractor opening balances
function addEditContractorOpeningBalanceRow(existingData = null) {
    const container = document.getElementById('editContractorOpeningBalancesContainer');
    const rowId = editContractorOpeningBalanceCounter++;
    
    const row = document.createElement('div');
    row.className = 'opening-balance-row';
    row.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr 2fr auto; gap: 10px; margin-bottom: 10px; align-items: start; padding: 15px; background: var(--gray-50); border-radius: var(--radius); border: 1px solid var(--gray-200);';
    row.dataset.rowId = rowId;
    if (existingData && existingData.id) {
        row.dataset.balanceId = existingData.id;
    }
    
    // Project column
    const projectCol = document.createElement('div');
    const projectLabel = document.createElement('label');
    projectLabel.style.cssText = 'display: block; margin-bottom: 5px; font-size: 0.9rem; font-weight: 500;';
    projectLabel.textContent = 'المشروع';
    const projectSelect = document.createElement('select');
    projectSelect.className = 'form-input contractor-opening-balance-project';
    projectSelect.required = true;
    projectSelect.innerHTML = '<option value="">اختر المشروع</option>';
    contractorProjectsList.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.name;
        if (existingData && existingData.project_id === project.id) {
            option.selected = true;
        }
        projectSelect.appendChild(option);
    });
    projectCol.appendChild(projectLabel);
    projectCol.appendChild(projectSelect);
    
    // Amount column
    const amountCol = document.createElement('div');
    const amountLabel = document.createElement('label');
    amountLabel.style.cssText = 'display: block; margin-bottom: 5px; font-size: 0.9rem; font-weight: 500;';
    amountLabel.textContent = 'المبلغ';
    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.className = 'form-input contractor-opening-balance-amount';
    amountInput.placeholder = '0.00';
    amountInput.step = '0.01';
    amountInput.required = true;
    if (existingData) {
        amountInput.value = existingData.amount || 0;
    }
    amountCol.appendChild(amountLabel);
    amountCol.appendChild(amountInput);
    
    // Description column
    const descCol = document.createElement('div');
    const descLabel = document.createElement('label');
    descLabel.style.cssText = 'display: block; margin-bottom: 5px; font-size: 0.9rem; font-weight: 500;';
    descLabel.textContent = 'الوصف';
    const descInput = document.createElement('input');
    descInput.type = 'text';
    descInput.className = 'form-input contractor-opening-balance-description';
    descInput.placeholder = 'وصف اختياري';
    descInput.maxLength = 500;
    if (existingData && existingData.description) {
        descInput.value = existingData.description;
    }
    descCol.appendChild(descLabel);
    descCol.appendChild(descInput);
    
    // Delete button column
    const deleteCol = document.createElement('div');
    deleteCol.style.paddingTop = '28px';
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn-sm btn-danger';
    deleteBtn.textContent = '<i class="fas fa-trash"></i>';
    deleteBtn.onclick = () => row.remove();
    deleteCol.appendChild(deleteBtn);
    
    row.appendChild(projectCol);
    row.appendChild(amountCol);
    row.appendChild(descCol);
    row.appendChild(deleteCol);
    
    container.appendChild(row);
}

function getEditContractorOpeningBalances() {
    const container = document.getElementById('editContractorOpeningBalancesContainer');
    const rows = container.querySelectorAll('.opening-balance-row');
    const balances = [];
    
    rows.forEach(row => {
        const projectSelect = row.querySelector('.contractor-opening-balance-project');
        const amountInput = row.querySelector('.contractor-opening-balance-amount');
        const descInput = row.querySelector('.contractor-opening-balance-description');
        const balanceId = row.dataset.balanceId;
        
        if (projectSelect.value && amountInput.value) {
            const balance = {
                project_id: projectSelect.value,
                amount: parseFloat(amountInput.value) || 0,
                description: descInput.value || ''
            };
            
            if (balanceId) {
                balance.id = balanceId;
            }
            
            balances.push(balance);
        }
    });
    
    return balances;
}

// Add event listeners
document.getElementById('addContractorOpeningBalanceBtn')?.addEventListener('click', () => {
    addContractorOpeningBalanceRow();
});

document.getElementById('addEditContractorOpeningBalanceBtn')?.addEventListener('click', () => {
    addEditContractorOpeningBalanceRow();
});

// Load projects when add contractor button is clicked
document.getElementById('addContractorBtn')?.addEventListener('click', async () => {
    await loadContractorProjectsList();
    showModal('addContractorModal');
});
