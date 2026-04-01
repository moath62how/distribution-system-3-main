const crusherService = require('../services/crusherService');
const reportService = require('../services/reportService');
const PDFService = require('../services/pdfServiceUltraFast');
const CloudinaryService = require('../services/cloudinaryService');

class CrushersController {
    // Get all crushers
    async getAllCrushers(req, res, next) {
        try {
            const result = await crusherService.getAllCrushers();
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    // Get crusher by ID
    async getCrusherById(req, res, next) {
        try {
            const crusher = await crusherService.getCrusherById(req.params.id);

            if (!crusher) {
                return res.status(404).json({ message: 'الكسارة غير موجودة' });
            }

            res.json(crusher);
        } catch (err) {
            next(err);
        }
    }

    // Create new crusher
    async createCrusher(req, res, next) {
        try {
            const { name, sand_price, aggregate1_price, aggregate2_price, aggregate3_price, aggregate6_powder_price, opening_balances } = req.body;

            if (!name || name.trim() === '') {
                return res.status(400).json({ message: 'اسم الكسارة مطلوب' });
            }

            const crusher = await crusherService.createCrusher({
                name: name.trim(),
                sand_price,
                aggregate1_price,
                aggregate2_price,
                aggregate3_price,
                aggregate6_powder_price,
                opening_balances
            });

            // Send success response immediately
            res.status(201).json({ crusher });

            // Log audit event asynchronously (non-blocking)
            setImmediate(async () => {
                try {
                    const authService = require('../services/authService');
                    await authService.logAuditEvent(
                        req.user?.id,
                        'create',
                        'Crusher',
                        crusher.id || crusher._id,
                        null,
                        crusher,
                        req,
                        name.trim()
                    );
                } catch (auditError) {
                    console.error('❌ Audit logging failed for crusher creation:', auditError.message);
                }
            });

        } catch (err) {
            console.error('❌ Error in createCrusher:', err);
            if (err.code === 11000) {
                return res.status(400).json({ message: 'اسم الكسارة موجود بالفعل' });
            }
            next(err);
        }
    }

    // Update crusher
    async updateCrusher(req, res, next) {
        try {
            const { name, sand_price, aggregate1_price, aggregate2_price, aggregate3_price, aggregate6_powder_price, opening_balances } = req.body;

            if (!name || name.trim() === '') {
                return res.status(400).json({ message: 'اسم الكسارة مطلوب' });
            }

            const crusher = await crusherService.updateCrusher(req.params.id, {
                name: name.trim(),
                sand_price,
                aggregate1_price,
                aggregate2_price,
                aggregate3_price,
                aggregate6_powder_price,
                opening_balances,
                // Pass user info for audit logging
                userId: req.user?.id,
                userRole: req.user?.role,
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            });

            if (!crusher) {
                return res.status(404).json({ message: 'الكسارة غير موجودة' });
            }

            // Send success response FIRST
            res.json(crusher);

            // Log audit event asynchronously
            setImmediate(async () => {
                try {
                    const authService = require('../services/authService');
                    await authService.logAuditEvent(
                        req.user.id,
                        'update',
                        'Crusher',
                        req.params.id,
                        null,
                        crusher.crusher,
                        req,
                        name.trim()
                    );
                } catch (auditError) {
                    console.error('❌ Audit logging failed for crusher update:', auditError.message);
                }
            });

        } catch (err) {
            if (err.code === 11000) {
                return res.status(400).json({ message: 'اسم الكسارة موجود بالفعل' });
            }
            next(err);
        }
    }

    // Update crusher prices only
    async updateCrusherPrices(req, res, next) {
        try {
            const { sand_price, aggregate1_price, aggregate2_price, aggregate3_price, aggregate6_powder_price } = req.body;

            // Get current crusher data to preserve the name
            const currentCrusher = await crusherService.getCrusherById(req.params.id);
            if (!currentCrusher) {
                return res.status(404).json({ message: 'الكسارة غير موجودة' });
            }

            const crusher = await crusherService.updateCrusher(req.params.id, {
                name: currentCrusher.crusher.name, // Preserve existing name
                sand_price,
                aggregate1_price,
                aggregate2_price,
                aggregate3_price,
                aggregate6_powder_price
            });

            res.json(crusher);
        } catch (err) {
            next(err);
        }
    }

    // Delete crusher
    async deleteCrusher(req, res, next) {
        try {
            const crusher = await crusherService.deleteCrusher(req.params.id);

            if (!crusher) {
                return res.status(404).json({ message: 'الكسارة غير موجودة' });
            }

            res.json({ message: 'تم حذف الكسارة بنجاح' });

            // Log audit event asynchronously
            setImmediate(async () => {
                try {
                    const authService = require('../services/authService');
                    await authService.logAuditEvent(
                        req.user?.id,
                        'delete',
                        'Crusher',
                        req.params.id,
                        crusher,
                        null,
                        req,
                        crusher.name
                    );
                } catch (auditError) {
                    console.error('❌ Audit logging failed for crusher deletion:', auditError.message);
                }
            });
        } catch (err) {
            next(err);
        }
    }

    // Get crusher payments
    async getCrusherPayments(req, res, next) {
        try {
            const payments = await crusherService.getCrusherPayments(req.params.id);
            res.json({ payments });
        } catch (err) {
            next(err);
        }
    }

    // Add crusher payment
    async addCrusherPayment(req, res, next) {
        try {
            const { amount, method, details, note, paid_at, payment_image } = req.body;

            let imageData = null;
            
            if (payment_image) {
                try {
                    imageData = await CloudinaryService.uploadBase64Image(
                        payment_image,
                        `crushers/${req.params.id}/payments`
                    );
                } catch (error) {
                    console.error('Image upload failed:', error);
                    return res.status(400).json({ 
                        message: 'فشل رفع الصورة: ' + error.message 
                    });
                }
            }

            const payment = await crusherService.addCrusherPayment(req.params.id, {
                amount,
                method: method?.trim() || '',
                details: details?.trim() || '',
                note: note?.trim() || '',
                paid_at: paid_at ? new Date(paid_at) : new Date(),
                payment_image_url: imageData?.url,
                payment_image_public_id: imageData?.publicId,
                payment_image_thumbnail: imageData?.thumbnailUrl
            });

            res.status(201).json(payment);

            // Log audit event asynchronously
            setImmediate(async () => {
                try {
                    // Get crusher name for audit log
                    const crusher = await crusherService.getCrusherById(req.params.id);
                    const crusherName = crusher && crusher.crusher ? crusher.crusher.name : 'كسارة';

                    const authService = require('../services/authService');
                    await authService.logAuditEvent(
                        req.user.id,
                        'create',
                        'CrusherPayment',
                        payment.id || payment._id,
                        null,
                        payment,
                        req,
                        `دفعة من ${crusherName}`
                    );
                } catch (auditError) {
                    console.error('❌ Audit logging failed for crusher payment:', auditError.message);
                }
            });
        } catch (err) {
            next(err);
        }
    }

    // Update crusher payment
    async updateCrusherPayment(req, res, next) {
        try {
            const { amount, method, details, note, paid_at, payment_image } = req.body;

            let imageData = null;
            
            if (payment_image) {
                try {
                    const oldPayment = await crusherService.getPaymentById(req.params.id, req.params.paymentId);
                    
                    imageData = await CloudinaryService.uploadBase64Image(
                        payment_image,
                        `crushers/${req.params.id}/payments`
                    );
                    
                    if (oldPayment && oldPayment.payment_image_public_id) {
                        await CloudinaryService.deleteImage(oldPayment.payment_image_public_id);
                    }
                } catch (error) {
                    console.error('Image upload failed:', error);
                    return res.status(400).json({ 
                        message: 'فشل رفع الصورة: ' + error.message 
                    });
                }
            }

            const updateData = {
                amount,
                method: method?.trim() || '',
                details: details?.trim() || '',
                note: note?.trim() || '',
                paid_at: paid_at ? new Date(paid_at) : new Date()
            };

            if (imageData) {
                updateData.payment_image_url = imageData.url;
                updateData.payment_image_public_id = imageData.publicId;
                updateData.payment_image_thumbnail = imageData.thumbnailUrl;
            }

            const payment = await crusherService.updateCrusherPayment(
                req.params.id,
                req.params.paymentId,
                updateData
            );

            if (!payment) {
                return res.status(404).json({ message: 'الدفعة غير موجودة' });
            }

            res.json(payment);

            // Log audit event asynchronously
            setImmediate(async () => {
                try {
                    // Get crusher name for audit log
                    const crusher = await crusherService.getCrusherById(req.params.id);
                    const crusherName = crusher && crusher.crusher ? crusher.crusher.name : 'كسارة';

                    const authService = require('../services/authService');
                    await authService.logAuditEvent(
                        req.user.id,
                        'update',
                        'CrusherPayment',
                        req.params.paymentId,
                        null,
                        payment,
                        req,
                        `دفعة من ${crusherName}`
                    );
                } catch (auditError) {
                    console.error('❌ Audit logging failed for crusher payment update:', auditError.message);
                }
            });
        } catch (err) {
            next(err);
        }
    }

    // Delete crusher payment
    async deleteCrusherPayment(req, res, next) {
        try {
            const payment = await crusherService.deleteCrusherPayment(
                req.params.id,
                req.params.paymentId
            );

            if (!payment) {
                return res.status(404).json({ message: 'الدفعة غير موجودة' });
            }

            res.json({ message: 'تم حذف الدفعة بنجاح' });

            // Log audit event asynchronously
            setImmediate(async () => {
                try {
                    // Get crusher name for audit log
                    const crusher = await crusherService.getCrusherById(req.params.id);
                    const crusherName = crusher && crusher.crusher ? crusher.crusher.name : 'كسارة';

                    const authService = require('../services/authService');
                    await authService.logAuditEvent(
                        req.user.id,
                        'delete',
                        'CrusherPayment',
                        req.params.paymentId,
                        payment.toJSON(),
                        null,
                        req,
                        `دفعة من ${crusherName}`
                    );
                } catch (auditError) {
                    console.error('❌ Audit logging failed for crusher payment deletion:', auditError.message);
                }
            });
        } catch (err) {
            next(err);
        }
    }

    // Get crusher adjustments
    async getCrusherAdjustments(req, res, next) {
        try {
            const adjustments = await crusherService.getCrusherAdjustments(req.params.id);
            res.json({ adjustments });
        } catch (err) {
            next(err);
        }
    }

    // Add crusher adjustment
    async addCrusherAdjustment(req, res, next) {
        try {
            const { amount, method, details, reason } = req.body;

            const adjustment = await crusherService.addCrusherAdjustment(req.params.id, {
                amount,
                method: method?.trim() || '',
                details: details?.trim() || '',
                reason: reason?.trim() || ''
            });

            res.status(201).json(adjustment);

            // Log audit event asynchronously
            setImmediate(async () => {
                try {
                    // Get crusher name for audit log
                    const crusher = await crusherService.getCrusherById(req.params.id);
                    const crusherName = crusher && crusher.crusher ? crusher.crusher.name : 'كسارة';

                    const authService = require('../services/authService');
                    await authService.logAuditEvent(
                        req.user.id,
                        'create',
                        'Adjustment',
                        adjustment.id || adjustment._id,
                        null,
                        adjustment,
                        req,
                        `تسوية من ${crusherName}`
                    );
                } catch (auditError) {
                    console.error('❌ Audit logging failed for crusher adjustment:', auditError.message);
                }
            });
        } catch (err) {
            next(err);
        }
    }

    // Update crusher adjustment
    async updateCrusherAdjustment(req, res, next) {
        try {
            const { amount, method, details, reason } = req.body;

            const adjustment = await crusherService.updateCrusherAdjustment(
                req.params.id,
                req.params.adjustmentId,
                {
                    amount,
                    method: method?.trim() || '',
                    details: details?.trim() || '',
                    reason: reason?.trim() || ''
                }
            );

            if (!adjustment) {
                return res.status(404).json({ message: 'التسوية غير موجودة' });
            }

            res.json(adjustment);

            // Log audit event asynchronously
            setImmediate(async () => {
                try {
                    // Get crusher name for audit log
                    const crusher = await crusherService.getCrusherById(req.params.id);
                    const crusherName = crusher && crusher.crusher ? crusher.crusher.name : 'كسارة';

                    const authService = require('../services/authService');
                    await authService.logAuditEvent(
                        req.user.id,
                        'update',
                        'Adjustment',
                        req.params.adjustmentId,
                        null,
                        adjustment,
                        req,
                        `تسوية من ${crusherName}`
                    );
                } catch (auditError) {
                    console.error('❌ Audit logging failed for crusher adjustment update:', auditError.message);
                }
            });
        } catch (err) {
            next(err);
        }
    }

    // Delete crusher adjustment
    async deleteCrusherAdjustment(req, res, next) {
        try {
            const adjustment = await crusherService.deleteCrusherAdjustment(
                req.params.id,
                req.params.adjustmentId
            );

            if (!adjustment) {
                return res.status(404).json({ message: 'التسوية غير موجودة' });
            }

            res.json({ message: 'تم حذف التسوية بنجاح' });

            // Log audit event asynchronously
            setImmediate(async () => {
                try {
                    // Get crusher name for audit log
                    const crusher = await crusherService.getCrusherById(req.params.id);
                    const crusherName = crusher && crusher.crusher ? crusher.crusher.name : 'كسارة';

                    const authService = require('../services/authService');
                    await authService.logAuditEvent(
                        req.user.id,
                        'delete',
                        'Adjustment',
                        req.params.adjustmentId,
                        adjustment,
                        null,
                        req,
                        `تسوية من ${crusherName}`
                    );
                } catch (auditError) {
                    console.error('❌ Audit logging failed for crusher adjustment deletion:', auditError.message);
                }
            });
        } catch (err) {
            next(err);
        }
    }

    // Get crusher deliveries report with date filtering
    async getCrusherDeliveriesReport(req, res, next) {
        try {
            const { from, to } = req.query;

            if (!from || !to) {
                return res.status(400).json({ message: 'تاريخ البداية والنهاية مطلوبان' });
            }

            const reportData = await reportService.getCrusherDeliveriesReportData(req.params.id, from, to);
            const html = reportService.generateCrusherDeliveriesReportHTML(reportData);

            // Generate PDF using smart method for optimal performance
            const pdfBuffer = await PDFService.generatePDFSmart(html);

            // Create filename
            const filename = PDFService.formatFilename(
                'تقرير_التوريدات',
                reportData.crusher.name,
                from,
                to
            );

            // Set headers for PDF download
            const headers = PDFService.getDownloadHeaders(filename);
            Object.entries(headers).forEach(([key, value]) => {
                res.setHeader(key, value);
            });

            // Set content length
            res.setHeader('Content-Length', pdfBuffer.length);

            // Send the PDF buffer
            res.end(pdfBuffer, 'binary');
        } catch (err) {
            console.error('PDF generation error:', err);
            if (err.message === 'الكسارة غير موجودة') {
                return res.status(404).json({ message: err.message });
            }
            next(err);
        }
    }

    // Get crusher account statement
    async getCrusherAccountStatement(req, res, next) {
        try {
            const { from, to } = req.query;

            const reportData = await reportService.getCrusherAccountStatementData(req.params.id, from, to);
            const html = reportService.generateCrusherAccountStatementHTML(reportData);

            // Generate PDF using smart method for optimal performance
            const pdfBuffer = await PDFService.generatePDFSmart(html);

            // Create filename
            const filename = PDFService.formatFilename(
                'كشف_حساب',
                reportData.crusher.name,
                from,
                to
            );

            // Set headers for PDF download
            const headers = PDFService.getDownloadHeaders(filename);
            Object.entries(headers).forEach(([key, value]) => {
                res.setHeader(key, value);
            });

            // Set content length
            res.setHeader('Content-Length', pdfBuffer.length);

            // Send the PDF buffer
            res.end(pdfBuffer, 'binary');
        } catch (err) {
            console.error('PDF generation error:', err);
            if (err.message === 'الكسارة غير موجودة') {
                return res.status(404).json({ message: err.message });
            }
            next(err);
        }
    }

    // Get opening balances by project (for project analysis)
    async getOpeningBalancesByProject(req, res, next) {
        try {
            const { project_id } = req.query;

            if (!project_id) {
                return res.status(400).json({ message: 'معرف المشروع مطلوب' });
            }

            const CrusherOpeningBalance = require('../models/CrusherOpeningBalance');
            
            const openingBalances = await CrusherOpeningBalance.find({
                project_id,
                is_deleted: false
            }).populate('crusher_id', 'name').lean();

            res.json({ opening_balances: openingBalances });
        } catch (err) {
            console.error('❌ Error in getOpeningBalancesByProject (crushers):', err);
            res.status(500).json({ 
                message: 'خطأ في تحميل الأرصدة الافتتاحية',
                error: err.message,
                opening_balances: [] 
            });
        }
    }
}

module.exports = new CrushersController();