/**
 * CRUD Buttons Utility
 * Handles click events for CRUD buttons with proper icon support
 */

/**
 * Initialize CRUD button event delegation
 * This ensures clicks on icons inside buttons work properly
 */
function initializeCRUDButtons() {
    // Use event delegation on document to catch all CRUD button clicks
    document.addEventListener('click', function(event) {
        // Find the closest button (in case user clicked on icon)
        const button = event.target.closest('.crud-btn, [data-action]');
        
        if (!button) return;
        
        // Prevent default and stop propagation
        event.preventDefault();
        event.stopPropagation();
        
        const action = button.dataset.action;
        const type = button.dataset.type;
        const id = button.dataset.id;
        
        if (!action || !type || !id) {
            console.warn('CRUD button missing required data attributes:', { action, type, id });
            return;
        }
        
        // Call the appropriate function based on action and type
        const functionName = `${action}${capitalizeFirst(type)}`;
        
        if (typeof window[functionName] === 'function') {
            window[functionName](id);
        } else {
            console.warn(`Function ${functionName} not found for CRUD action`);
        }
    });
}

/**
 * Capitalize first letter of string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Create CRUD action buttons HTML
 * @param {string} type - Entity type (payment, adjustment, delivery, etc.)
 * @param {string} id - Entity ID
 * @param {Object} options - Optional configuration
 * @param {boolean} options.showView - Show view button (default: true)
 * @param {boolean} options.showEdit - Show edit button (default: true)
 * @param {boolean} options.showDelete - Show delete button (default: true)
 * @returns {string} HTML string for action buttons
 */
function createCRUDButtons(type, id, options = {}) {
    const {
        showView = true,
        showEdit = true,
        showDelete = true
    } = options;
    
    let html = '';
    
    if (showView) {
        html += `<button class="btn btn-sm btn-secondary crud-btn" data-action="view" data-type="${type}" data-id="${id}" title="عرض التفاصيل">
            <i class="fas fa-eye"></i>
        </button>`;
    }
    
    if (showEdit) {
        html += `<button class="btn btn-sm btn-secondary crud-btn" data-action="edit" data-type="${type}" data-id="${id}" title="تعديل">
            <i class="fas fa-edit"></i>
        </button>`;
    }
    
    if (showDelete) {
        html += `<button class="btn btn-sm btn-danger crud-btn" data-action="delete" data-type="${type}" data-id="${id}" title="حذف">
            <i class="fas fa-trash"></i>
        </button>`;
    }
    
    return html;
}

// Auto-initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCRUDButtons);
} else {
    initializeCRUDButtons();
}

// Export functions for global use
window.initializeCRUDButtons = initializeCRUDButtons;
window.createCRUDButtons = createCRUDButtons;
