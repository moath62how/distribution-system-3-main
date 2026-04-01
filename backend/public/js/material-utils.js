/**
 * Material Design Utilities
 * Helper functions for Material Design components
 */

// Set active sidebar link based on current page
function setActiveSidebarLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const links = document.querySelectorAll('.sidebar-link-md');
    
    links.forEach(link => {
        const linkPage = link.getAttribute('data-page');
        if (currentPage.includes(linkPage) || (currentPage === '' && linkPage === 'index')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Initialize Material Design modals
function initMaterialModals() {
    // Close modal on backdrop click
    document.querySelectorAll('.modal-md').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeMaterialModal(modal.id);
            }
        });
    });
    
    // Close modal on close button click
    document.querySelectorAll('.modal-close-md').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal-md');
            if (modal) {
                closeMaterialModal(modal.id);
            }
        });
    });
    
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.modal-md.active');
            if (activeModal) {
                closeMaterialModal(activeModal.id);
            }
        }
    });
}

// Show Material Design modal
function showMaterialModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

// Close Material Design modal
function closeMaterialModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }, 200);
    }
}

// Show Material Design toast (using SweetAlert2)
function showMaterialToast(message, type = 'success') {
    const iconMap = {
        success: 'success',
        error: 'error',
        warning: 'warning',
        info: 'info'
    };
    
    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: iconMap[type] || 'info',
        title: message,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
    });
}

// Show Material Design confirm dialog
async function showMaterialConfirm(title, text, confirmText = 'تأكيد', cancelText = 'إلغاء') {
    const result = await Swal.fire({
        title: title,
        text: text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        reverseButtons: true,
    });
    
    return result.isConfirmed;
}

// Show Material Design alert
function showMaterialAlert(title, text, type = 'info') {
    return Swal.fire({
        title: title,
        text: text,
        icon: type,
        confirmButtonText: 'حسناً'
    });
}

// Initialize Material Design components on page load
document.addEventListener('DOMContentLoaded', () => {
    setActiveSidebarLink();
    initMaterialModals();
    
    // Mobile sidebar toggle
    const hamburger = document.getElementById('sidebarHamburger');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (hamburger && sidebar && overlay) {
        hamburger.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            overlay.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
        });
        
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.style.display = 'none';
        });
    }
});

// Export functions for global use
window.showMaterialModal = showMaterialModal;
window.closeMaterialModal = closeMaterialModal;
window.showMaterialToast = showMaterialToast;
window.showMaterialConfirm = showMaterialConfirm;
window.showMaterialAlert = showMaterialAlert;
