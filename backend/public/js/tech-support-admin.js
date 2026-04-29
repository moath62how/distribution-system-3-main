// Tech Support Admin Page JavaScript

let currentPage = 1;
const logsPerPage = 20;

// Check authentication and role on page load
document.addEventListener('DOMContentLoaded', function () {
    // Check if user is authenticated
    if (!authManager.isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }

    // Check if user is tech support
    if (authManager.user.role !== 'tech_support') {
        Swal.fire({
            icon: 'error',
            title: 'غير مصرح',
            text: 'هذه الصفحة متاحة فقط للدعم الفني',
            confirmButtonText: 'حسناً'
        }).then(() => {
            window.location.href = '/index.html';
        });
        return;
    }

    // Load initial data
    loadUsers();
    loadAuditLogs();
});

// Tab switching
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Load data for the active tab
    if (tabName === 'users') {
        loadUsers();
    } else if (tabName === 'logs') {
        loadAuditLogs();
    }
}

// Create User Form Handler
document.getElementById('createUserForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = {
        username: document.getElementById('username').value.trim(),
        phone: document.getElementById('phone').value.trim() || undefined,
        password: document.getElementById('password').value,
        role: document.getElementById('role').value
    };

    // Validate phone number if provided
    if (formData.phone) {
        // Normalize phone number
        let phone = formData.phone.replace(/[^\d+]/g, '');

        if (phone.startsWith('01') && phone.length === 11) {
            phone = '+2' + phone;
        } else if (phone.startsWith('1') && phone.length === 10) {
            phone = '+20' + phone;
        } else if (phone.startsWith('201') && phone.length === 12) {
            phone = '+' + phone;
        } else if (!phone.startsWith('+')) {
            phone = '+20' + phone;
        }

        formData.phone = phone;
    }

    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authManager.token}`
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            Swal.fire({
                icon: 'success',
                title: 'نجح',
                text: data.message || 'تم إنشاء المستخدم بنجاح',
                confirmButtonText: 'حسناً'
            });

            // Reset form and reload users
            document.getElementById('createUserForm').reset();
            loadUsers();
        } else {
            Swal.fire({
                icon: 'error',
                title: 'خطأ',
                text: data.message || 'فشل إنشاء المستخدم',
                confirmButtonText: 'حسناً'
            });
        }
    } catch (error) {
        console.error('Error creating user:', error);
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'حدث خطأ في الاتصال',
            confirmButtonText: 'حسناً'
        });
    }
});

// Load Users
async function loadUsers() {
    try {
        const response = await fetch('/api/users', {
            headers: {
                'Authorization': `Bearer ${authManager.token}`
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            displayUsers(data.users);
        } else {
            throw new Error(data.message || 'فشل تحميل المستخدمين');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('usersTableBody').innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #dc2626;">
                    خطأ في تحميل المستخدمين: ${error.message}
                </td>
            </tr>
        `;
    }
}

// Display Users
function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');

    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center;">لا يوجد مستخدمون</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = users.map(user => {
        const roleClass = {
            'manager': 'badge-manager',
            'accountant': 'badge-accountant',
            'tech_support': 'badge-tech',
            'system_maintenance': 'badge-maintenance'
        }[user.role] || '';

        const roleName = {
            'manager': 'مدير',
            'accountant': 'محاسب',
            'tech_support': 'دعم فني',
            'system_maintenance': 'صيانة النظام'
        }[user.role] || user.role;

        const statusBadge = user.active
            ? '<span class="badge badge-active">نشط</span>'
            : '<span class="badge badge-inactive">غير نشط</span>';

        const createdDate = new Date(user.createdAt).toLocaleDateString('ar-EG');

        return `
            <tr>
                <td>${user.username}</td>
                <td>${user.phone || '-'}</td>
                <td><span class="badge ${roleClass}">${roleName}</span></td>
                <td>${statusBadge}</td>
                <td>${createdDate}</td>
                <td>
                    <button class="btn btn-primary" style="padding: 0.5rem 1rem; margin-left: 0.5rem;" onclick="resetUserPassword('${user._id}', '${user.username}')">
                        إعادة تعيين كلمة المرور
                    </button>
                    ${user.active
                ? `<button class="btn btn-danger" style="padding: 0.5rem 1rem;" onclick="toggleUserStatus('${user._id}', false)">تعطيل</button>`
                : `<button class="btn btn-success" style="padding: 0.5rem 1rem;" onclick="toggleUserStatus('${user._id}', true)">تفعيل</button>`
            }
                </td>
            </tr>
        `;
    }).join('');
}

// Reset User Password
async function resetUserPassword(userId, username) {
    const { value: newPassword } = await Swal.fire({
        title: `إعادة تعيين كلمة المرور لـ ${username}`,
        input: 'password',
        inputLabel: 'كلمة المرور الجديدة',
        inputPlaceholder: 'أدخل كلمة المرور الجديدة',
        inputAttributes: {
            minlength: 8,
            autocomplete: 'new-password'
        },
        showCancelButton: true,
        confirmButtonText: 'تأكيد',
        cancelButtonText: 'إلغاء',
        inputValidator: (value) => {
            if (!value) {
                return 'يرجى إدخال كلمة المرور';
            }
            if (value.length < 8) {
                return 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
            }
        }
    });

    if (newPassword) {
        try {
            const response = await fetch(`/api/users/${userId}/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authManager.token}`
                },
                body: JSON.stringify({ newPassword })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'نجح',
                    text: data.message || 'تم إعادة تعيين كلمة المرور بنجاح',
                    confirmButtonText: 'حسناً'
                });
            } else {
                throw new Error(data.message || 'فشل إعادة تعيين كلمة المرور');
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            Swal.fire({
                icon: 'error',
                title: 'خطأ',
                text: error.message,
                confirmButtonText: 'حسناً'
            });
        }
    }
}

// Toggle User Status
async function toggleUserStatus(userId, activate) {
    const action = activate ? 'تفعيل' : 'تعطيل';
    const endpoint = activate ? 'activate' : 'deactivate';

    const result = await Swal.fire({
        title: `هل أنت متأكد؟`,
        text: `سيتم ${action} هذا المستخدم`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'نعم',
        cancelButtonText: 'إلغاء'
    });

    if (result.isConfirmed) {
        try {
            const response = await fetch(`/api/users/${userId}/${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${authManager.token}`
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'نجح',
                    text: data.message,
                    confirmButtonText: 'حسناً'
                });
                loadUsers();
            } else {
                throw new Error(data.message || `فشل ${action} المستخدم`);
            }
        } catch (error) {
            console.error('Error toggling user status:', error);
            Swal.fire({
                icon: 'error',
                title: 'خطأ',
                text: error.message,
                confirmButtonText: 'حسناً'
            });
        }
    }
}

// Load Audit Logs
async function loadAuditLogs(page = 1) {
    currentPage = page;

    const filters = {
        page: page,
        limit: logsPerPage,
        action_type: document.getElementById('filterActionType').value,
        entity_type: document.getElementById('filterEntityType').value,
        date_from: document.getElementById('filterDateFrom').value,
        date_to: document.getElementById('filterDateTo').value
    };

    // Remove empty filters
    Object.keys(filters).forEach(key => {
        if (!filters[key]) delete filters[key];
    });

    const queryString = new URLSearchParams(filters).toString();

    try {
        const response = await fetch(`/api/audit?${queryString}`, {
            headers: {
                'Authorization': `Bearer ${authManager.token}`
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            displayAuditLogs(data.logs);
            displayPagination(data.pagination);
        } else {
            throw new Error(data.message || 'فشل تحميل السجلات');
        }
    } catch (error) {
        console.error('Error loading audit logs:', error);
        document.getElementById('logsTableBody').innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: #dc2626;">
                    خطأ في تحميل السجلات: ${error.message}
                </td>
            </tr>
        `;
    }
}

// Display Audit Logs
function displayAuditLogs(logs) {
    const tbody = document.getElementById('logsTableBody');

    if (logs.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center;">لا توجد سجلات</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = logs.map(log => {
        const timestamp = new Date(log.timestamp).toLocaleString('ar-EG');
        const username = log.user_id ? log.user_id.username : 'غير معروف';
        const roleName = {
            'manager': 'مدير',
            'accountant': 'محاسب',
            'tech_support': 'دعم فني',
            'system_maintenance': 'صيانة',
            'unknown': 'غير معروف'
        }[log.user_role] || log.user_role;

        const actionName = {
            'create': 'إنشاء',
            'update': 'تحديث',
            'delete': 'حذف',
            'login': 'تسجيل دخول',
            'logout': 'تسجيل خروج',
            'failed_login': 'فشل تسجيل دخول',
            'blocked_attempt': 'محاولة محظورة',
            'restore': 'استعادة',
            'permanent_delete': 'حذف نهائي'
        }[log.action_type] || log.action_type;

        return `
            <tr>
                <td>${timestamp}</td>
                <td>${username}</td>
                <td>${roleName}</td>
                <td>${actionName}</td>
                <td>${log.entity_type}</td>
                <td>${log.description || '-'}</td>
                <td>${log.ip_address || '-'}</td>
            </tr>
        `;
    }).join('');
}

// Display Pagination
function displayPagination(pagination) {
    const container = document.getElementById('logsPagination');

    if (pagination.pages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '';

    // Previous button
    html += `
        <button onclick="loadAuditLogs(${pagination.page - 1})" ${pagination.page === 1 ? 'disabled' : ''}>
            السابق
        </button>
    `;

    // Page numbers
    for (let i = 1; i <= pagination.pages; i++) {
        if (
            i === 1 ||
            i === pagination.pages ||
            (i >= pagination.page - 2 && i <= pagination.page + 2)
        ) {
            html += `
                <button 
                    onclick="loadAuditLogs(${i})" 
                    class="${i === pagination.page ? 'active' : ''}">
                    ${i}
                </button>
            `;
        } else if (i === pagination.page - 3 || i === pagination.page + 3) {
            html += '<span>...</span>';
        }
    }

    // Next button
    html += `
        <button onclick="loadAuditLogs(${pagination.page + 1})" ${pagination.page === pagination.pages ? 'disabled' : ''}>
            التالي
        </button>
    `;

    container.innerHTML = html;
}

// Export Logs
async function exportLogs() {
    const filters = {
        action_type: document.getElementById('filterActionType').value,
        entity_type: document.getElementById('filterEntityType').value,
        date_from: document.getElementById('filterDateFrom').value,
        date_to: document.getElementById('filterDateTo').value,
        format: 'csv'
    };

    // Remove empty filters
    Object.keys(filters).forEach(key => {
        if (!filters[key]) delete filters[key];
    });

    const queryString = new URLSearchParams(filters).toString();

    try {
        const response = await fetch(`/api/audit/export?${queryString}`, {
            headers: {
                'Authorization': `Bearer ${authManager.token}`
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            Swal.fire({
                icon: 'success',
                title: 'نجح',
                text: 'تم تصدير السجلات بنجاح',
                confirmButtonText: 'حسناً'
            });
        } else {
            throw new Error('فشل تصدير السجلات');
        }
    } catch (error) {
        console.error('Error exporting logs:', error);
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: error.message,
            confirmButtonText: 'حسناً'
        });
    }
}
