const { Administration, AdministrationPayment, CapitalInjection, Withdrawal } = require('../models');
const CloudinaryService = require('./cloudinaryService');

const toNumber = (v) => Number(v || 0);

class AdministrationService {
    static async getAllAdministration() {
        const administration = await Administration.find({ is_deleted: { $ne: true } }).sort({ name: 1 });

        // Calculate totals for each administration entity
        const result = await Promise.all(
            administration.map(async (admin) => {
                try {
                    // Get payments TO administration (money we paid them)
                    const payments = await AdministrationPayment.find({ 
                        administration_id: admin._id,
                        is_deleted: { $ne: true }
                    });
                    const totalPayments = payments.reduce((sum, p) => sum + toNumber(p.amount), 0);

                    // Get capital injections (money they put into projects - we owe them)
                    const capitalInjections = await CapitalInjection.find({ administration_id: admin._id });
                    const totalCapitalInjected = capitalInjections.reduce((sum, c) => sum + toNumber(c.amount), 0);

                    // Get withdrawals (money they took from projects - reduces what we owe)
                    const withdrawals = await Withdrawal.find({ administration_id: admin._id });
                    const totalWithdrawals = withdrawals.reduce((sum, w) => sum + toNumber(w.amount), 0);

                    // Calculate balance: Capital Injected - Withdrawals - Payments
                    // Positive = We owe them, Negative = They owe us
                    const balance = totalCapitalInjected - totalWithdrawals - totalPayments;

                    return {
                        id: admin._id,
                        name: admin.name,
                        type: admin.type,
                        phone_number: admin.phone_number,
                        notes: admin.notes,
                        status: admin.status,
                        created_at: admin.created_at,
                        // Financial calculations
                        balance: Math.round(balance * 100) / 100,
                        balance_status: balance > 0 ? 'we_owe_them' : balance < 0 ? 'they_owe_us' : 'balanced',
                        balance_description: balance > 0 ? 'مستحق للإدارة' : balance < 0 ? 'مستحق من الإدارة' : 'متوازن',
                        total_capital_injected: Math.round(totalCapitalInjected * 100) / 100,
                        total_withdrawals: Math.round(totalWithdrawals * 100) / 100,
                        total_payments: Math.round(totalPayments * 100) / 100
                    };
                } catch (error) {
                    return {
                        id: admin._id,
                        name: admin.name,
                        type: admin.type,
                        phone_number: admin.phone_number,
                        notes: admin.notes,
                        status: admin.status,
                        created_at: admin.created_at,
                        balance: 0,
                        balance_status: 'error',
                        balance_description: 'خطأ في الحساب',
                        total_capital_injected: 0,
                        total_withdrawals: 0,
                        total_payments: 0,
                        error: error.message
                    };
                }
            })
        );

        return { administration: result };
    }

    static async getAdministrationById(id) {
        const admin = await Administration.findById(id);

        if (!admin) {
            return null;
        }

        // Get related data
        const payments = await AdministrationPayment.find({ 
            administration_id: id,
            is_deleted: { $ne: true }
        }).sort({ paid_at: -1 });

        const capitalInjections = await CapitalInjection.find({ administration_id: id })
            .populate('project_id', 'name')
            .sort({ date: -1 });

        const withdrawals = await Withdrawal.find({ administration_id: id })
            .populate('project_id', 'name')
            .sort({ date: -1 });

        // Calculate totals
        const totalPayments = payments.reduce((sum, p) => sum + toNumber(p.amount), 0);
        const totalCapitalInjected = capitalInjections.reduce((sum, c) => sum + toNumber(c.amount), 0);
        const totalWithdrawals = withdrawals.reduce((sum, w) => sum + toNumber(w.amount), 0);
        
        // Balance = Capital Injected - Withdrawals - Payments
        // Positive = We owe them, Negative = They owe us
        const balance = totalCapitalInjected - totalWithdrawals - totalPayments;

        return {
            administration: {
                id: admin._id,
                name: admin.name,
                type: admin.type,
                phone_number: admin.phone_number,
                notes: admin.notes,
                status: admin.status,
                created_at: admin.created_at
            },
            payments: payments.map(p => ({
                id: p._id,
                amount: p.amount,
                method: p.method,
                details: p.details,
                note: p.note,
                payment_image_url: p.payment_image_url,
                payment_image_thumbnail: p.payment_image_thumbnail,
                paid_at: p.paid_at,
                created_at: p.created_at
            })),
            capital_injections: capitalInjections.map(c => ({
                id: c._id,
                amount: c.amount,
                project_name: c.project_id?.name || 'مشروع محذوف',
                project_id: c.project_id?._id,
                date: c.date,
                notes: c.notes,
                created_at: c.created_at
            })),
            withdrawals: withdrawals.map(w => ({
                id: w._id,
                amount: w.amount,
                project_name: w.project_id?.name || 'مشروع محذوف',
                project_id: w.project_id?._id,
                date: w.date,
                notes: w.notes,
                created_at: w.created_at
            })),
            totals: {
                balance: Math.round(balance * 100) / 100,
                balance_status: balance > 0 ? 'we_owe_them' : balance < 0 ? 'they_owe_us' : 'balanced',
                balance_description: balance > 0 ? 'مستحق للإدارة' : balance < 0 ? 'مستحق من الإدارة' : 'متوازن',
                total_capital_injected: Math.round(totalCapitalInjected * 100) / 100,
                total_withdrawals: Math.round(totalWithdrawals * 100) / 100,
                total_payments: Math.round(totalPayments * 100) / 100
            }
        };
    }

    static async createAdministration(data) {
        const admin = new Administration(data);
        await admin.save();
        return {
            id: admin._id,
            name: admin.name,
            type: admin.type,
            phone_number: admin.phone_number,
            notes: admin.notes,
            status: admin.status,
            created_at: admin.created_at
        };
    }

    static async updateAdministration(id, data) {
        const admin = await Administration.findByIdAndUpdate(id, data, { new: true });
        if (!admin) return null;

        return {
            id: admin._id,
            name: admin.name,
            type: admin.type,
            phone_number: admin.phone_number,
            notes: admin.notes,
            status: admin.status,
            created_at: admin.created_at
        };
    }

    static async deleteAdministration(id) {
        const admin = await Administration.findById(id);
        
        if (!admin) {
            return null;
        }

        // Soft delete
        admin.is_deleted = true;
        admin.deleted_at = new Date();
        await admin.save();

        return admin;
    }

    // Payment methods
    static async addAdministrationPayment(administrationId, paymentData) {
        const payment = new AdministrationPayment({
            administration_id: administrationId,
            amount: toNumber(paymentData.amount),
            method: paymentData.method,
            details: paymentData.details,
            note: paymentData.note,
            paid_at: paymentData.paid_at,
            payment_image_url: paymentData.payment_image_url,
            payment_image_public_id: paymentData.payment_image_public_id,
            payment_image_thumbnail: paymentData.payment_image_thumbnail
        });
        await payment.save();
        return payment;
    }

    static async getPaymentById(administrationId, paymentId) {
        return await AdministrationPayment.findOne({
            _id: paymentId,
            administration_id: administrationId
        });
    }

    static async updateAdministrationPayment(administrationId, paymentId, paymentData) {
        const updateData = {
            amount: toNumber(paymentData.amount),
            method: paymentData.method,
            details: paymentData.details,
            note: paymentData.note,
            paid_at: paymentData.paid_at
        };

        if (paymentData.payment_image_url) {
            updateData.payment_image_url = paymentData.payment_image_url;
            updateData.payment_image_public_id = paymentData.payment_image_public_id;
            updateData.payment_image_thumbnail = paymentData.payment_image_thumbnail;
        }

        const payment = await AdministrationPayment.findOneAndUpdate(
            { _id: paymentId, administration_id: administrationId },
            updateData,
            { new: true }
        );
        return payment;
    }

    static async deleteAdministrationPayment(administrationId, paymentId) {
        const payment = await AdministrationPayment.findOne({
            _id: paymentId,
            administration_id: administrationId,
            is_deleted: { $ne: true }
        });

        if (!payment) {
            return null;
        }

        // Soft delete
        payment.is_deleted = true;
        payment.deleted_at = new Date();
        await payment.save();

        return payment;
    }

    // Capital injection methods
    static async addCapitalInjection(administrationId, injectionData) {
        const injection = new CapitalInjection({
            administration_id: administrationId,
            ...injectionData
        });
        await injection.save();
        return injection;
    }

    static async updateCapitalInjection(administrationId, injectionId, injectionData) {
        const injection = await CapitalInjection.findOneAndUpdate(
            { _id: injectionId, administration_id: administrationId },
            injectionData,
            { new: true }
        );
        return injection;
    }

    static async deleteCapitalInjection(administrationId, injectionId) {
        const injection = await CapitalInjection.findOneAndDelete({
            _id: injectionId,
            administration_id: administrationId
        });
        return injection;
    }

    // Withdrawal methods
    static async addWithdrawal(administrationId, withdrawalData) {
        const withdrawal = new Withdrawal({
            administration_id: administrationId,
            ...withdrawalData
        });
        await withdrawal.save();
        return withdrawal;
    }

    static async updateWithdrawal(administrationId, withdrawalId, withdrawalData) {
        const withdrawal = await Withdrawal.findOneAndUpdate(
            { _id: withdrawalId, administration_id: administrationId },
            withdrawalData,
            { new: true }
        );
        return withdrawal;
    }

    static async deleteWithdrawal(administrationId, withdrawalId) {
        const withdrawal = await Withdrawal.findOneAndDelete({
            _id: withdrawalId,
            administration_id: administrationId
        });
        return withdrawal;
    }

    // Global methods to get all withdrawals and capital injections
    static async getAllWithdrawals() {
        const withdrawals = await Withdrawal.find()
            .populate('administration_id', 'name')
            .populate('project_id', 'name')
            .sort({ date: -1 });

        return withdrawals.map(w => ({
            id: w._id,
            amount: w.amount,
            administration_name: w.administration_id?.name || 'إدارة محذوفة',
            project_name: w.project_id?.name || 'مشروع محذوف',
            project_id: w.project_id?._id,
            date: w.date,
            notes: w.notes,
            created_at: w.created_at
        }));
    }

    static async getAllCapitalInjections() {
        const capitalInjections = await CapitalInjection.find()
            .populate('administration_id', 'name')
            .populate('project_id', 'name')
            .sort({ date: -1 });

        return capitalInjections.map(c => ({
            id: c._id,
            amount: c.amount,
            administration_name: c.administration_id?.name || 'إدارة محذوفة',
            project_name: c.project_id?.name || 'مشروع محذوف',
            project_id: c.project_id?._id ? String(c.project_id._id) : null,
            date: c.date,
            notes: c.notes,
            created_at: c.created_at
        }));
    }
}

module.exports = AdministrationService;