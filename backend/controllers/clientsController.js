const clientService = require('../services/clientService');
const reportService = require('../services/reportService');
const PDFService = require('../services/pdfServiceUltraFast');
const CloudinaryService = require('../services/cloudinaryService');

class ClientsController {
    // Get all clients with balances, supporting search, filter, sort, pagination
    async getAllClients(req, res, next) {
        try {
            const {
                search,
                sort = 'name',
                order = 'asc',
                page = 1,
                limit = 25
            } = req.query;

            const result = await clientService.getAllClients({
                search,
                sort,
                order,
                page: parseInt(page),
                limit: parseInt(limit)
            });

            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    // Get client by ID with balance details
    async getClientById(req, res, next) {
        try {
            const client = await clientService.getClientById(req.params.id);

            if (!client) {
                return res.status(404).json({ message: 'العميل غير موجود' });
            }

            res.json(client);
        } catch (err) {
            next(err);
        }
    }

    // Create new client
    async createClient(req, res, next) {
        try {
            const { name, phone, opening_balance } = req.body;

            if (!name || name.trim() === '') {
                return res.status(400).json({ message: 'اسم العميل مطلوب' });
            }

            const client = await clientService.createClient({
                name: name.trim(),
                phone: phone?.trim() || '',
                opening_balance
            });

            // Send success response immediately
            res.status(201).json(client);

            // Log audit event asynchronously
            setImmediate(async () => {
                try {
                    const authService = require('../services/authService');
                    await authService.logAuditEvent(
                        req.user.id,
                        'create',
                        'Client',
                        client.id,
                        null,
                        client,
                        req,
                        client.name
                    );
                } catch (auditError) {
                    console.error('❌ Audit logging failed for client creation:', auditError.message);
                }
            });
        } catch (err) {
            if (err.code === 11000) {
                return res.status(400).json({ message: 'اسم العميل موجود بالفعل' });
            }
            next(err);
        }
    }

    // Update client
    async updateClient(req, res, next) {
        try {
            const { name, phone, opening_balance } = req.body;

            if (!name || name.trim() === '') {
                return res.status(400).json({ message: 'اسم العميل مطلوب' });
            }

            const client = await clientService.updateClient(req.params.id, {
                name: name.trim(),
                phone: phone?.trim() || '',
                opening_balance
            });

            if (!client) {
                return res.status(404).json({ message: 'العميل غير موجود' });
            }

            // Log audit event
            const authService = require('../services/authService');
            await authService.logAuditEvent(
                req.user.id,
                'update',
                'Client',
                client.id,
                null,
                client,
                req,
                client.name
            );

            res.json(client);
        } catch (err) {
            if (err.code === 11000) {
                return res.status(400).json({ message: 'اسم العميل موجود بالفعل' });
            }
            next(err);
        }
    }

    // Delete client
    async deleteClient(req, res, next) {
        try {
            const client = await clientService.deleteClient(req.params.id);

            if (!client) {
                return res.status(404).json({ message: 'العميل غير موجود' });
            }

            res.json({ message: 'تم حذف العميل بنجاح' });

            // Log audit event asynchronously
            setImmediate(async () => {
                try {
                    const authService = require('../services/authService');
                    await authService.logAuditEvent(
                        req.user?.id,
                        'delete',
                        'Client',
                        req.params.id,
                        client,
                        null,
                        req,
                        client.name
                    );
                } catch (auditError) {
                    console.error('❌ Audit logging failed for client deletion:', auditError.message);
                }
            });
        } catch (err) {
            next(err);
        }
    }

    // Get client payments
    async getClientPayments(req, res, next) {
        try {
            const payments = await clientService.getClientPayments(req.params.id);
            res.json({ payments });
        } catch (err) {
            next(err);
        }
    }

    // Add client payment
    async addClientPayment(req, res, next) {
        try {
            const { amount, method, details, note, paid_at, payment_image } = req.body;

            console.log('=== Add Client Payment ===');
            console.log('Client ID:', req.params.id);
            console.log('Has payment_image:', !!payment_image);
            if (payment_image) {
                console.log('Image data length:', payment_image.length);
                console.log('Image data preview:', payment_image.substring(0, 50));
            }

            let imageData = null;
            
            // Upload image to Cloudinary if provided
            if (payment_image) {
                try {
                    console.log('Starting Cloudinary upload...');
                    imageData = await CloudinaryService.uploadBase64Image(
                        payment_image,
                        `clients/${req.params.id}/payments`
                    );
                    console.log('Cloudinary upload success:', {
                        url: imageData.url,
                        publicId: imageData.publicId,
                        size: imageData.size
                    });
                } catch (error) {
                    console.error('Image upload failed:', error);
                    return res.status(400).json({ 
                        message: 'فشل رفع الصورة: ' + error.message,
                        error: error.message
                    });
                }
            }

            const paymentData = {
                amount,
                method: method?.trim() || '',
                details: details?.trim() || '',
                note: note?.trim() || '',
                paid_at: paid_at ? new Date(paid_at) : new Date(),
                payment_image_url: imageData?.url,
                payment_image_public_id: imageData?.publicId,
                payment_image_thumbnail: imageData?.thumbnailUrl
            };

            console.log('Payment data to save:', {
                ...paymentData,
                payment_image_url: paymentData.payment_image_url ? 'EXISTS' : 'NULL'
            });

            const payment = await clientService.addClientPayment(req.params.id, paymentData);

            console.log('Payment saved successfully:', {
                id: payment.id || payment._id,
                has_image: !!payment.payment_image_url
            });

            // Get client name for audit log
            const client = await clientService.getClientById(req.params.id);
            const clientName = client && client.client ? client.client.name : 'عميل';

            // Log audit event
            const authService = require('../services/authService');
            await authService.logAuditEvent(
                req.user.id,
                'create',
                'Payment',
                payment.id || payment._id,
                null,
                payment,
                req,
                `دفعة من ${clientName}`
            );

            res.status(201).json(payment);
        } catch (err) {
            console.error('Add payment error:', err);
            next(err);
        }
    }

    // Update client payment
    async updateClientPayment(req, res, next) {
        try {
            const { amount, method, details, note, paid_at, payment_image } = req.body;

            let imageData = null;
            
            // Upload new image to Cloudinary if provided
            if (payment_image) {
                try {
                    // Get old payment to delete old image
                    const oldPayment = await clientService.getPaymentById(req.params.id, req.params.paymentId);
                    
                    // Upload new image
                    imageData = await CloudinaryService.uploadBase64Image(
                        payment_image,
                        `clients/${req.params.id}/payments`
                    );
                    
                    // Delete old image if exists
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

            // Add image data if uploaded
            if (imageData) {
                updateData.payment_image_url = imageData.url;
                updateData.payment_image_public_id = imageData.publicId;
                updateData.payment_image_thumbnail = imageData.thumbnailUrl;
            }

            const payment = await clientService.updateClientPayment(
                req.params.id,
                req.params.paymentId,
                updateData
            );

            if (!payment) {
                return res.status(404).json({ message: 'الدفعة غير موجودة' });
            }

            // Get client name for audit log
            const client = await clientService.getClientById(req.params.id);
            const clientName = client && client.client ? client.client.name : 'عميل';

            // Log audit event
            const authService = require('../services/authService');
            await authService.logAuditEvent(
                req.user.id,
                'update',
                'Payment',
                req.params.paymentId,
                null,
                payment,
                req,
                `دفعة من ${clientName}`
            );

            res.json(payment);
        } catch (err) {
            next(err);
        }
    }

    // Delete client payment
    async deleteClientPayment(req, res, next) {
        try {
            const payment = await clientService.deleteClientPayment(
                req.params.id,
                req.params.paymentId
            );

            if (!payment) {
                return res.status(404).json({ message: 'الدفعة غير موجودة' });
            }

            // Get client name for audit log
            const client = await clientService.getClientById(req.params.id);
            const clientName = client && client.client ? client.client.name : 'عميل';

            // Log audit event
            const authService = require('../services/authService');
            await authService.logAuditEvent(
                req.user.id,
                'delete',
                'Payment',
                req.params.paymentId,
                payment.toJSON(),
                null,
                req,
                `دفعة من ${clientName}`
            );

            res.json({ message: 'تم حذف الدفعة بنجاح' });
        } catch (err) {
            next(err);
        }
    }

    // Get client adjustments
    async getClientAdjustments(req, res, next) {
        try {
            const adjustments = await clientService.getClientAdjustments(req.params.id);
            res.json({ adjustments });
        } catch (err) {
            next(err);
        }
    }

    // Add client adjustment
    async addClientAdjustment(req, res, next) {
        try {
            const { amount, reason } = req.body;

            const adjustment = await clientService.addClientAdjustment(req.params.id, {
                amount,
                reason: reason?.trim() || ''
            });

            // Get client name for audit log
            const client = await clientService.getClientById(req.params.id);
            const clientName = client && client.client ? client.client.name : 'عميل';

            // Log audit event
            const authService = require('../services/authService');
            await authService.logAuditEvent(
                req.user.id,
                'create',
                'Adjustment',
                adjustment.id || adjustment._id,
                null,
                adjustment,
                req,
                `تسوية من ${clientName}`
            );

            res.status(201).json(adjustment);
        } catch (err) {
            next(err);
        }
    }

    // Update client adjustment
    async updateClientAdjustment(req, res, next) {
        try {
            const { amount, reason } = req.body;

            const adjustment = await clientService.updateClientAdjustment(
                req.params.id,
                req.params.adjustmentId,
                {
                    amount,
                    reason: reason?.trim() || ''
                }
            );

            if (!adjustment) {
                return res.status(404).json({ message: 'التسوية غير موجودة' });
            }

            // Get client name for audit log
            const client = await clientService.getClientById(req.params.id);
            const clientName = client && client.client ? client.client.name : 'عميل';

            // Log audit event
            const authService = require('../services/authService');
            await authService.logAuditEvent(
                req.user.id,
                'update',
                'Adjustment',
                req.params.adjustmentId,
                null,
                adjustment,
                req,
                `تسوية من ${clientName}`
            );

            res.json(adjustment);
        } catch (err) {
            next(err);
        }
    }

    // Delete client adjustment
    async deleteClientAdjustment(req, res, next) {
        try {
            const adjustment = await clientService.deleteClientAdjustment(
                req.params.id,
                req.params.adjustmentId
            );

            if (!adjustment) {
                return res.status(404).json({ message: 'التسوية غير موجودة' });
            }

            // Get client name for audit log
            const client = await clientService.getClientById(req.params.id);
            const clientName = client && client.client ? client.client.name : 'عميل';

            // Log audit event
            const authService = require('../services/authService');
            await authService.logAuditEvent(
                req.user.id,
                'delete',
                'Adjustment',
                req.params.adjustmentId,
                adjustment,
                null,
                req,
                `تسوية من ${clientName}`
            );

            res.json({ message: 'تم حذف التسوية بنجاح' });
        } catch (err) {
            next(err);
        }
    }

    // Get client deliveries report with date filtering
    async getClientDeliveriesReport(req, res, next) {
        try {
            const { from, to } = req.query;

            if (!from || !to) {
                return res.status(400).json({ message: 'تاريخ البداية والنهاية مطلوبان' });
            }

            const reportData = await reportService.getDeliveriesReportData(req.params.id, from, to);
            const html = reportService.generateDeliveriesReportHTML(reportData);

            // Generate PDF using smart method for optimal performance
            const pdfBuffer = await PDFService.generatePDFSmart(html);

            // Create filename
            const filename = PDFService.formatFilename(
                'تقرير_التسليمات',
                reportData.client.name,
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
            if (err.message === 'العميل غير موجود') {
                return res.status(404).json({ message: err.message });
            }
            next(err);
        }
    }

    // Get client account statement
    async getClientAccountStatement(req, res, next) {
        try {
            const { from, to } = req.query;

            const reportData = await reportService.getAccountStatementData(req.params.id, from, to);
            const html = reportService.generateAccountStatementHTML(reportData);

            // Generate PDF using smart method for optimal performance
            const pdfBuffer = await PDFService.generatePDFSmart(html);

            // Create filename
            const filename = PDFService.formatFilename(
                'كشف_حساب',
                reportData.client.name,
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
            if (err.message === 'العميل غير موجود') {
                return res.status(404).json({ message: err.message });
            }
            next(err);
        }
    }
}

module.exports = new ClientsController();