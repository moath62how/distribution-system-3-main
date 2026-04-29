const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const UserSession = require('../models/UserSession');
const AuditLog = require('../models/AuditLog');

class AuthService {
  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
  }

  async login(identifier, password, req) {
    try {
      // Find user by username or phone
      const user = await User.findOne({
        $or: [
          { username: identifier },
          { phone: identifier }
        ],
        active: true
      });

      if (!user) {
        await this.logAuditEvent(null, 'failed_login', 'User', null, null, { identifier }, req);
        throw new Error('Invalid credentials');
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        await this.logAuditEvent(user._id, 'failed_login', 'User', user._id, null, { identifier }, req);
        throw new Error('Invalid credentials');
      }

      // Generate JWT token
      const token = this.generateToken(user);

      // Create session record
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours

      await UserSession.create({
        user_id: user._id,
        token_hash: tokenHash,
        expires_at: expiresAt,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      // Log successful login
      await this.logAuditEvent(user._id, 'login', 'User', user._id, null, { identifier }, req);

      return {
        token,
        user: {
          id: user._id,
          username: user.username,
          phone: user.phone,
          role: user.role
        }
      };
    } catch (error) {
      throw error;
    }
  }

  async logout(token, req) {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET);
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Deactivate session
      await UserSession.updateOne(
        { token_hash: tokenHash },
        { active: false }
      );

      // Log logout
      await this.logAuditEvent(decoded.sub, 'logout', 'User', decoded.sub, null, null, req);

      return { message: 'Logged out successfully' };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async validateToken(token) {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET);
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Check if session exists and is active
      const session = await UserSession.findOne({
        token_hash: tokenHash,
        active: true,
        expires_at: { $gt: new Date() }
      });

      if (!session) {
        throw new Error('Session expired or invalid');
      }

      // Get user details
      const user = await User.findById(decoded.sub);
      if (!user || !user.active) {
        throw new Error('User not found or inactive');
      }

      return {
        id: user._id,
        username: user.username,
        role: user.role
      };
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  generateToken(user) {
    return jwt.sign(
      {
        sub: user._id,
        username: user.username,
        role: user.role
      },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
  }

  async changePassword(userId, currentPassword, newPassword, req) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        await this.logAuditEvent(userId, 'blocked_attempt', 'User', userId, null, { action: 'change_password', reason: 'invalid_current_password' }, req);
        throw new Error('Current password is incorrect');
      }

      const oldValues = { password_changed: false };
      user.password = newPassword;
      await user.save();
      const newValues = { password_changed: true };

      await this.logAuditEvent(userId, 'update', 'User', userId, oldValues, newValues, req);

      return { message: 'Password changed successfully' };
    } catch (error) {
      throw error;
    }
  }

  async logAuditEvent(userId, actionType, entityType, entityId, oldValues, newValues, req, entityName = null) {
    try {
      // Safely get user info
      let user = null;
      if (userId) {
        try {
          user = await User.findById(userId);
        } catch (userError) {
          console.error('Failed to fetch user for audit log:', userError.message);
        }
      }

      // Generate description if entity name is provided
      let description = null;
      if (entityName) {
        const actionMap = {
          'create': 'إضافة',
          'update': 'تعديل',
          'delete': 'حذف'
        };

        const entityMap = {
          'Client': 'عميل',
          'Supplier': 'مورد',
          'Contractor': 'مقاول',
          'Crusher': 'كسارة',
          'Employee': 'موظف',
          'Administration': 'إدارة',
          'Project': 'مشروع',
          'Expense': 'مصروف',
          'Delivery': 'تسليمة',
          'Payment': 'دفعة',
          'Adjustment': 'تسوية',
          'Material': 'مادة',
          'Attendance': 'حضور'
        };

        const action = actionMap[actionType] || actionType;
        const entity = entityMap[entityType] || entityType;
        description = `${action} ${entity} "${entityName}"`;
      }

      // Create audit log entry
      await AuditLog.create({
        user_id: userId,
        user_role: user ? user.role : 'unknown',
        action_type: actionType,
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        description: description,
        old_values: oldValues,
        new_values: newValues,
        ip_address: req ? req.ip : null,
        user_agent: req ? req.get('User-Agent') : null
      });
    } catch (error) {
      // Log error but NEVER throw - audit logging should never break main operations
      console.error('❌ Audit logging failed:', error.message);
    }
  }

  async createDefaultUsers() {
    try {
      // Create Manager user
      const existingManager = await User.findOne({ role: 'manager' });
      if (!existingManager) {
        await User.create({
          username: 'المدير',
          password: 'manager123', // Will be hashed by pre-save hook
          role: 'manager',
          active: true
        });
        console.log('Manager user created: المدير');
      }

      // Create Accountant user
      const existingAccountant = await User.findOne({ role: 'accountant' });
      if (!existingAccountant) {
        await User.create({
          username: 'المحاسب',
          password: 'accountant123', // Will be hashed by pre-save hook
          role: 'accountant',
          active: true
        });
        console.log('Accountant user created: المحاسب');
      }

      // Create System Maintenance user
      const existingMaintenance = await User.findOne({ role: 'system_maintenance' });
      if (!existingMaintenance) {
        await User.create({
          username: 'صيانة_النظام',
          password: 'maintenance123', // Will be hashed by pre-save hook
          role: 'system_maintenance',
          active: true
        });
        console.log('System Maintenance user created: صيانة_النظام');
      }

      // Create Tech Support user
      const existingTechSupport = await User.findOne({ role: 'tech_support' });
      if (!existingTechSupport) {
        await User.create({
          username: 'الدعم_الفني',
          phone: '+201234567890',
          password: 'techsupport123', // Will be hashed by pre-save hook
          role: 'tech_support',
          active: true
        });
        console.log('Tech Support user created: الدعم_الفني');
        console.log('  Phone: +201234567890 (login with: 01234567890 or 1234567890 or +201234567890)');
      }

      console.log('All default users are ready');
      return true;
    } catch (error) {
      console.error('Failed to create default users:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();