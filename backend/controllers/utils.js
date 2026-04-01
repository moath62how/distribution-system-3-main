/**
 * Controller Utilities
 * Helper functions for controllers
 */

/**
 * Log audit event asynchronously without blocking the response
 * This ensures that audit logging failures don't cause 500 errors
 * 
 * @param {Object} params - Audit log parameters
 * @param {string} params.userId - User ID
 * @param {string} params.actionType - Action type (create, update, delete)
 * @param {string} params.entityType - Entity type (Client, Crusher, etc.)
 * @param {string} params.entityId - Entity ID
 * @param {Object} params.oldValues - Old values (for updates/deletes)
 * @param {Object} params.newValues - New values (for creates/updates)
 * @param {Object} params.req - Express request object
 * @param {string} params.entityName - Entity name for description
 */
function logAuditAsync(params) {
    const { userId, actionType, entityType, entityId, oldValues, newValues, req, entityName } = params;
    
    setImmediate(async () => {
        try {
            const authService = require('../services/authService');
            await authService.logAuditEvent(
                userId,
                actionType,
                entityType,
                entityId,
                oldValues,
                newValues,
                req,
                entityName
            );
        } catch (auditError) {
            console.error(`❌ Audit logging failed for ${entityType} ${actionType}:`, auditError.message);
        }
    });
}

module.exports = {
    logAuditAsync
};
