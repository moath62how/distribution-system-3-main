/**
 * Form Protection Utility
 * Prevents double submission and provides consistent error handling
 */

/**
 * Protect a form from double submission
 * @param {string} formId - The form element ID
 * @param {Function} submitHandler - Async function that handles the actual submission
 * @param {Object} options - Configuration options
 * @param {string} options.loadingText - Text to show while submitting (default: 'جاري المعالجة...')
 * @param {string} options.successMessage - Success message to show (optional, if not provided no message shown)
 * @param {string} options.messageElementId - Element ID to show inline messages (optional)
 * @param {Function} options.onSuccess - Callback after successful submission
 * @param {boolean} options.reloadOnSuccess - Whether to reload page on success (default: false)
 * @param {string} options.closeModal - Modal ID to close on success
 * @param {boolean} options.resetForm - Whether to reset form after success (default: true)
 * @param {number} options.successDelay - Delay before executing onSuccess callback (default: 1000ms)
 */
function protectForm(formId, submitHandler, options = {}) {
    const form = document.getElementById(formId);
    if (!form) {
        console.error(`Form with ID "${formId}" not found`);
        return;
    }

    const {
        loadingText = 'جاري المعالجة...',
        successMessage = null,
        messageElementId = null,
        onSuccess = null,
        reloadOnSuccess = false,
        closeModal = null,
        resetForm = true,
        successDelay = 1000
    } = options;

    let isSubmitting = false;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Prevent double submission
        if (isSubmitting) {
            console.log('Already submitting, please wait...');
            return;
        }

        isSubmitting = true;
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton ? submitButton.textContent : 'حفظ';

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = loadingText;
        }

        try {
            // Call the actual submit handler
            await submitHandler(e, form);

            // Show success message if provided
            if (successMessage && messageElementId) {
                const messageElement = document.getElementById(messageElementId);
                if (messageElement) {
                    messageElement.innerHTML = `<div class="alert alert-success">${successMessage}</div>`;
                    setTimeout(() => {
                        messageElement.innerHTML = '';
                    }, 3000);
                }
            }

            // Reset form if specified
            if (resetForm) {
                form.reset();
                // Clear edit mode if exists
                delete form.dataset.editId;
            }

            // Execute success callback after delay
            setTimeout(() => {
                // Close modal if specified
                if (closeModal && typeof window.closeModal === 'function') {
                    window.closeModal(closeModal);
                }

                // Call success callback if provided
                if (onSuccess && typeof onSuccess === 'function') {
                    onSuccess();
                }

                // Reload page if specified
                if (reloadOnSuccess) {
                    location.reload();
                }
            }, successDelay);

        } catch (error) {
            console.error('Form submission error:', error);

            // Show error message
            if (messageElementId) {
                const messageElement = document.getElementById(messageElementId);
                if (messageElement) {
                    messageElement.innerHTML = `<div class="alert alert-error">${error.message || 'حدث خطأ أثناء العملية'}</div>`;
                }
            } else {
                // Fallback to alert if no message element specified
                if (typeof showAlert === 'function') {
                    showAlert(error.message || 'حدث خطأ أثناء العملية');
                } else {
                    alert(error.message || 'حدث خطأ أثناء العملية');
                }
            }
        } finally {
            // Always reset the flag and button state
            isSubmitting = false;
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        }
    });
}

// Export for global use
window.protectForm = protectForm;
