/**
 * Auto Form Protection
 * Automatically protects payment and adjustment forms from double submission
 * This script should be loaded AFTER the page-specific JS files
 */

(function() {
    'use strict';

    // Global flag to prevent multiple submissions
    window._formSubmitting = window._formSubmitting || {};

    // Wait for DOM to be ready and give time for other scripts to attach listeners
    setTimeout(() => {
        initAutoProtection();
    }, 100);

    function initAutoProtection() {
        console.log('[AutoProtect] Initializing form protection...');

        // Intercept payment forms
        interceptFormSubmission('paymentForm');

        // Intercept adjustment forms
        interceptFormSubmission('adjustmentForm');

        console.log('[AutoProtect] Form protection initialized');
    }

    function interceptFormSubmission(formId) {
        const form = document.getElementById(formId);
        if (!form) {
            console.log(`[AutoProtect] Form ${formId} not found, skipping`);
            return;
        }

        console.log(`[AutoProtect] Intercepting ${formId}`);

        // Add capturing event listener that runs BEFORE other listeners
        form.addEventListener('submit', function(e) {
            const formKey = formId;

            // Check if already submitting
            if (window._formSubmitting[formKey]) {
                console.log(`[AutoProtect] Blocked duplicate submission for ${formId}`);
                e.preventDefault();
                e.stopImmediatePropagation(); // Stop other listeners
                return false;
            }

            // Mark as submitting
            window._formSubmitting[formKey] = true;
            console.log(`[AutoProtect] Allowing submission for ${formId}`);

            // Disable submit button
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.dataset.originalText = submitButton.textContent;
                submitButton.textContent = 'جاري الحفظ...';
            }

            // Reset flag after a delay (in case of errors)
            setTimeout(() => {
                window._formSubmitting[formKey] = false;
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = submitButton.dataset.originalText || 'حفظ';
                }
                console.log(`[AutoProtect] Reset submission flag for ${formId}`);
            }, 5000); // 5 seconds timeout

        }, true); // Use capture phase to run before other listeners

        console.log(`[AutoProtect] ${formId} protected`);
    }

})();

