const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');

// Get audit logs with filtering and pagination
router.get('/', auditController.getAuditLogs);

// Export audit logs
router.get('/export', auditController.exportAuditLogs);

// Get audit logs for specific user
router.get('/user/:userId', auditController.getAuditLogsByUser);

// Get audit logs for specific entity
router.get('/entity/:entityType/:entityId', auditController.getAuditLogsByEntity);

module.exports = router;