require('dotenv').config({ path: './.env' });
const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const morgan = require('morgan');
const cors = require('cors');
const { ensureTables } = require('./db');
const {
  Client,
  Project,
  Crusher,
  Contractor,
  Delivery,
  Payment,
  ContractorPayment,
  CrusherPayment,
  Expense,
  Employee,
  EmployeePayment,
  Attendance,
  Administration,
  CapitalInjection,
  Withdrawal,
  AdministrationPayment,
  Supplier,
  SupplierPayment,
  SupplierOpeningBalance,
  Adjustment,
  User,
  AuditLog,
  UserSession
} = require('./models');

// Import authentication middleware and routes
const { authenticateToken, requireRole, auditLogger } = require('./middleware/auth');
const authRouter = require('./routes/auth');
const authService = require('./services/authService');
const ClientProjectSyncService = require('./services/clientProjectSyncService');

// Import API routes (consolidated - all methods in single files)
const clientsApiRouter = require('./routes/clients');
const projectsApiRouter = require('./routes/projects');
const crushersApiRouter = require('./routes/crushers');
const contractorsApiRouter = require('./routes/contractors');
const deliveriesApiRouter = require('./routes/deliveries');
const expensesApiRouter = require('./routes/expenses');
const employeesApiRouter = require('./routes/employees');
const administrationApiRouter = require('./routes/administration');
const suppliersApiRouter = require('./routes/suppliers');
const auditRouter = require('./routes/audit');
const recycleBinRouter = require('./routes/recycleBin');
const usersRouter = require('./routes/users');
const userController = require('./controllers/userController');
const publicReportsRouter = require('./routes/public-reports');



// Import Web routes (SSR)
// const webRouter = require('./routes/web');

async function bootstrap() {
  await ensureTables();

  // Create default users for all roles
  await authService.createDefaultUsers();

  // Sync all existing clients to projects
  try {
    console.log('Syncing existing clients to projects...');
    await ClientProjectSyncService.syncAllClientsToProjects();
  } catch (error) {
    console.warn('Warning: Failed to sync clients to projects:', error.message);
  }

  const app = express();

  app.use(morgan('dev'));

  // Enable CORS for all routes
  app.use(cors());

  // View engine setup
  app.set('view engine', 'pug');
  app.set('views', path.join(__dirname, 'views'));

  // Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Trust proxy for accurate IP addresses in audit logs
  app.set('trust proxy', true);

  // Session & Flash messages
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
  }));
  app.use(flash());

  // Make flash messages available to all views
  app.use((req, res, next) => {
    const successArr = req.flash('success');
    const errorArr = req.flash('error');

    res.locals.messages = {
      success: successArr.length ? successArr.join(' | ') : null,
      error: errorArr.length ? errorArr.join(' | ') : null
    };
    res.locals.activePage = ''; // Will be set in routes
    next();
  });

  // Serve static files (public access for login page and assets)
  app.use(express.static(path.join(__dirname, 'public')));

  // Authentication routes (public - no auth required)
  app.use('/api/auth', authRouter);

  // Public report routes (no auth required) - must be before global auth middleware
  app.use('/api', publicReportsRouter);

  // Apply authentication middleware to ALL other API routes
  app.use('/api', authenticateToken, auditLogger);

  // Web routes (SSR with Pug) - now protected
  //// app.use('/', webRouter);

  // Redirect root to login page
  app.get('/', (req, res) => {
    res.redirect('/login.html');
  });

  // API routes (consolidated - all methods in single files with MVC architecture)
  // All routes now require authentication due to middleware above

  // Clients - accountant can view and add payments, but manager can edit
  app.use('/api/clients', requireRole(['manager', 'accountant']), clientsApiRouter);

  // Projects - accountant can view, manager can edit
  app.use('/api/projects', requireRole(['manager', 'accountant']), projectsApiRouter);

  // Crushers - accountant can only view, manager can edit prices
  app.use('/api/crushers', requireRole(['manager', 'accountant']), crushersApiRouter);

  // Contractors - accountant can view and add payments, manager can edit
  app.use('/api/contractors', requireRole(['manager', 'accountant']), contractorsApiRouter);

  // Deliveries - accountant can add new, but only manager can edit/delete
  app.use('/api/deliveries', requireRole(['manager', 'accountant']), deliveriesApiRouter);

  // Expenses - accountant can add, manager can edit/delete
  app.use('/api/expenses', requireRole(['manager', 'accountant']), expensesApiRouter);

  // Employees - accountant can view and add payments, manager can edit
  app.use('/api/employees', requireRole(['manager', 'accountant']), employeesApiRouter);

  // Administration - accountant can view, manager can edit
  app.use('/api/administration', requireRole(['manager', 'accountant']), administrationApiRouter);

  // Suppliers - accountant can only view, manager can edit prices
  app.use('/api/suppliers', requireRole(['manager', 'accountant']), suppliersApiRouter);

  // API metrics endpoint - Updated for MongoDB (Manager + Accountant only)
  app.get('/api/metrics', requireRole(['manager', 'accountant']), async (req, res, next) => {
    try {
      const totalProjects = await Project.countDocuments({ is_deleted: { $ne: true } });
      const clientsCount = await Client.countDocuments({ is_deleted: { $ne: true } });
      const crushersCount = await Crusher.countDocuments({ is_deleted: { $ne: true } });
      const contractorsCount = await Contractor.countDocuments({ is_deleted: { $ne: true } });
      const employeesCount = await Employee.countDocuments({ is_deleted: { $ne: true } });
      const deliveriesCount = await Delivery.countDocuments({ is_deleted: { $ne: true } });

      // New sections counts
      const administrationCount = await Administration.countDocuments({ is_deleted: { $ne: true } });
      const suppliersCount = await Supplier.countDocuments({ is_deleted: { $ne: true } });

      // Get all non-deleted deliveries for proper calculations
      const deliveries = await Delivery.find({ is_deleted: { $ne: true } });

      // CORRECT FINANCIAL LOGIC (excluding soft-deleted records):

      // 1. Total Sales (Revenue from clients - what clients owe us)
      const totalSales = deliveries.reduce((sum, d) => sum + Number(d.total_value || 0), 0);

      // 2. Total Crusher Costs (what we owe crushers - using historical prices)
      const totalCrusherCosts = deliveries.reduce((sum, d) => {
        const netQuantity = Number(d.car_volume || 0) - Number(d.discount_volume || 0);
        const materialPrice = Number(d.material_price_at_time || 0); // Use historical price stored in delivery
        return sum + (netQuantity * materialPrice);
      }, 0);

      // 3. Total Contractor Costs (what we owe contractors)
      const totalContractorCosts = deliveries.reduce((sum, d) => sum + Number(d.contractor_total_charge || 0), 0);

      // 4. Operating expenses (excluding soft-deleted)
      const expenseAgg = await Expense.aggregate([
        { $match: { is_deleted: { $ne: true } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const operatingExpenses = expenseAgg.length > 0 ? expenseAgg[0].total : 0;

      // 5. Employee costs (earned salary - payments = net due to employees)
      // SAFETY GUARD: Use dashboard-safe totals only
      const PayrollService = require('./services/payrollService');
      const employeeDashboardTotals = await PayrollService.getDashboardSafeTotals();

      const totalEmployeePayments = employeeDashboardTotals.totalPayments;
      const totalEmployeeAdjustments = employeeDashboardTotals.totalAdjustments;
      const totalEarnedSalary = employeeDashboardTotals.totalEarnedSalary;
      const totalEmployeeCosts = employeeDashboardTotals.netEmployeeCosts;

      // 6. Administration costs (withdrawals and payments) - excluding soft-deleted
      const [administrationWithdrawalsAgg, administrationPaymentsAgg] = await Promise.all([
        Withdrawal.aggregate([
          { $match: { is_deleted: { $ne: true } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        AdministrationPayment.aggregate([
          { $match: { is_deleted: { $ne: true } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
      ]);

      const totalAdministrationWithdrawals = administrationWithdrawalsAgg.length > 0 ? administrationWithdrawalsAgg[0].total : 0;
      const totalAdministrationPayments = administrationPaymentsAgg.length > 0 ? administrationPaymentsAgg[0].total : 0;
      const totalAdministrationCosts = Number(totalAdministrationWithdrawals || 0) + Number(totalAdministrationPayments || 0);

      // 7. Total Capital Injected (excluding soft-deleted)
      const capitalInjectionsAgg = await CapitalInjection.aggregate([
        { $match: { is_deleted: { $ne: true } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const totalCapitalInjected = capitalInjectionsAgg.length > 0 ? capitalInjectionsAgg[0].total : 0;

      // 8. Total Expenses (all costs including employees and administration)
      const totalExpenses = totalCrusherCosts + totalContractorCosts + Number(operatingExpenses || 0) + Math.max(0, totalEmployeeCosts) + totalAdministrationCosts;

      // 9. Net Profit (sales - all expenses)
      const netProfit = totalSales - totalExpenses;

      // 10. Cash flow tracking (actual payments made/received) - excluding soft-deleted
      const [clientPaymentsAgg, contractorPaymentsAgg, crusherPaymentsAgg] = await Promise.all([
        Payment.aggregate([
          { $match: { is_deleted: { $ne: true } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        ContractorPayment.aggregate([
          { $match: { is_deleted: { $ne: true } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        CrusherPayment.aggregate([
          { $match: { is_deleted: { $ne: true } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
      ]);

      const clientPayments = clientPaymentsAgg.length > 0 ? clientPaymentsAgg[0].total : 0;
      const contractorPayments = contractorPaymentsAgg.length > 0 ? contractorPaymentsAgg[0].total : 0;
      const crusherPayments = crusherPaymentsAgg.length > 0 ? crusherPaymentsAgg[0].total : 0;

      const totalCashPayments = Number(clientPayments || 0) + Number(contractorPayments || 0) + Number(crusherPayments || 0) + Number(totalEmployeePayments || 0) + Number(totalAdministrationPayments || 0);

      // 11. Calculate outstanding balances (excluding soft-deleted)
      const clients = await Client.find({ is_deleted: { $ne: true } });
      const suppliers = await Supplier.find({ is_deleted: { $ne: true } });
      const crushers = await Crusher.find({ is_deleted: { $ne: true } });
      const contractors = await Contractor.find({ is_deleted: { $ne: true } });
      const employees = await Employee.find({ is_deleted: { $ne: true } });

      // Client balances (positive = they owe us, negative = we owe them)
      const totalClientBalancesPositive = clients
        .filter(c => (c.balance || 0) > 0)
        .reduce((sum, c) => sum + (c.balance || 0), 0);

      // Supplier balances (positive = we owe them)
      const totalSupplierBalances = suppliers
        .reduce((sum, s) => sum + Math.abs(s.balance || 0), 0);

      // Crusher balances (positive net = we owe them)
      const totalCrusherBalances = crushers
        .filter(c => (c.net || 0) > 0)
        .reduce((sum, c) => sum + (c.net || 0), 0);

      // Contractor balances (positive = we owe them)
      const totalContractorBalances = contractors
        .filter(c => (c.balance || 0) > 0)
        .reduce((sum, c) => sum + (c.balance || 0), 0);

      // Employee balances (negative = we owe them)
      const totalEmployeeBalancesNegative = employees
        .filter(e => (e.balance || 0) < 0)
        .reduce((sum, e) => sum + (e.balance || 0), 0);

      // 12. Calculate supplier costs and payments
      const supplierPaymentsAgg = await SupplierPayment.aggregate([
        { $match: { is_deleted: { $ne: true } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const totalSupplierPayments = supplierPaymentsAgg.length > 0 ? supplierPaymentsAgg[0].total : 0;

      // Calculate supplier costs from supplier opening balances
      const supplierOpeningBalancesAgg = await SupplierOpeningBalance.aggregate([
        { $match: { is_deleted: { $ne: true } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const totalSupplierCosts = supplierOpeningBalancesAgg.length > 0 ? supplierOpeningBalancesAgg[0].total : 0;

      // 13. Calculate adjustments and losses
      const adjustmentsAgg = await Adjustment.aggregate([
        { $match: { is_deleted: { $ne: true } } },
        {
          $group: {
            _id: null,
            positive: { $sum: { $cond: [{ $gt: ['$amount', 0] }, '$amount', 0] } },
            negative: { $sum: { $cond: [{ $lt: ['$amount', 0] }, { $abs: '$amount' }, 0] } }
          }
        }
      ]);
      const positiveClientAdjustments = adjustmentsAgg.length > 0 ? adjustmentsAgg[0].positive : 0;
      const totalLosses = adjustmentsAgg.length > 0 ? adjustmentsAgg[0].negative : 0;

      res.json({
        // Counts
        totalProjects: Number(totalProjects || 0),
        totalClients: Number(clientsCount || 0),
        totalCrushers: Number(crushersCount || 0),
        totalContractors: Number(contractorsCount || 0),
        totalEmployees: Number(employeesCount || 0),
        totalDeliveries: Number(deliveriesCount || 0),
        totalAdministration: Number(administrationCount || 0),
        totalSuppliers: Number(suppliersCount || 0),

        // Revenue & Costs
        totalSales: Number(totalSales || 0),
        totalCrusherCosts: Number(totalCrusherCosts || 0),
        totalContractorCosts: Number(totalContractorCosts || 0),
        operatingExpenses: Number(operatingExpenses || 0),
        totalEarnedSalary: Number(totalEarnedSalary || 0),
        totalEmployeeCosts: Number(Math.max(0, totalEmployeeCosts) || 0),
        totalAdministrationCosts: Number(totalAdministrationCosts || 0),
        totalCapitalInjected: Number(totalCapitalInjected || 0),
        totalExpenses: Number(totalExpenses || 0),
        netProfit: Number(netProfit || 0),

        // Cash Flow
        totalClientPayments: Number(clientPayments || 0),
        totalContractorPayments: Number(contractorPayments || 0),
        totalCrusherPayments: Number(crusherPayments || 0),
        totalEmployeePayments: Number(totalEmployeePayments || 0),
        totalAdministrationPayments: Number(totalAdministrationPayments || 0),
        totalCashPayments: Number(totalCashPayments || 0),

        // Outstanding Balances
        totalClientBalancesPositive: Number(totalClientBalancesPositive || 0),
        totalSupplierBalances: Number(totalSupplierBalances || 0),
        totalCrusherBalances: Number(totalCrusherBalances || 0),
        totalContractorBalances: Number(totalContractorBalances || 0),
        totalEmployeeBalancesNegative: Number(totalEmployeeBalancesNegative || 0),

        // Supplier Data
        totalSupplierCosts: Number(totalSupplierCosts || 0),
        totalSupplierPayments: Number(totalSupplierPayments || 0),

        // Adjustments and Losses
        positiveClientAdjustments: Number(positiveClientAdjustments || 0),
        totalLosses: Number(totalLosses || 0)
      });
    } catch (err) {
      next(err);
    }
  });

  // System management routes - MANAGER ONLY
  app.use('/api/audit', requireRole(['manager']), auditRouter);
  app.use('/api/recycle-bin', requireRole(['manager']), recycleBinRouter);

  // Manual sync endpoint for client-project synchronization
  app.post('/api/sync/clients-projects', requireRole(['manager']), async (req, res) => {
    try {
      const result = await ClientProjectSyncService.syncAllClientsToProjects();
      res.json({
        message: 'تم مزامنة العملاء مع المشاريع بنجاح',
        ...result
      });
    } catch (error) {
      console.error('Error syncing clients to projects:', error);
      res.status(500).json({ error: 'خطأ في مزامنة العملاء مع المشاريع' });
    }
  });

  // User management routes (system_maintenance only)
  app.get('/api/users', requireRole(['system_maintenance']), userController.getUsers);
  app.post('/api/users', requireRole(['system_maintenance']), userController.createUser);
  app.put('/api/users/:id', requireRole(['system_maintenance']), userController.updateUser);
  app.delete('/api/users/:id', requireRole(['system_maintenance']), userController.deleteUser);
  app.post('/api/users/:id/reset-password', requireRole(['system_maintenance']), userController.resetPassword);
  app.put('/api/users/:id/activate', requireRole(['system_maintenance']), userController.activateUser);
  app.put('/api/users/:id/deactivate', requireRole(['system_maintenance']), userController.deactivateUser);

  // 404 handler
  app.use((req, res) => {
    res.status(404).render('error', {
      title: 'خطأ 404',
      message: 'الصفحة غير موجودة'
    });
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error('Error:', err);

    // Check if this is an API request
    if (req.path.startsWith('/api/')) {
      return res.status(500).json({
        message: 'حدث خطأ في السيرفر',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
      });
    }

    // For web requests, render error page
    res.status(500).render('error', {
      title: 'خطأ',
      message: 'حدث خطأ في السيرفر'
    });
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
}

bootstrap().catch(err => {
  console.error('Failed to start server', err);
  process.exit(1);
});