const mongoose = require('mongoose');

const administrationPaymentSchema = new mongoose.Schema({
    administration_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Administration',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
        get: v => Math.round(v * 100) / 100,
        set: v => Math.round(v * 100) / 100
    },
    method: {
        type: String,
        maxlength: 100
    },
    details: {
        type: String
    },
    note: {
        type: String
    },
    payment_image_url: {
        type: String // Cloudinary URL
    },
    payment_image_public_id: {
        type: String // Cloudinary Public ID (for deletion)
    },
    payment_image_thumbnail: {
        type: String // Cloudinary Thumbnail URL
    },
    paid_at: {
        type: Date,
        required: true,
        default: Date.now
    },
    // Soft delete fields
    is_deleted: {
        type: Boolean,
        default: false
    },
    deleted_at: {
        type: Date,
        default: null
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { getters: true },
    toObject: { getters: true }
});

// Indexes for efficient queries
administrationPaymentSchema.index({ administration_id: 1 });
administrationPaymentSchema.index({ paid_at: -1 });

module.exports = mongoose.model('AdministrationPayment', administrationPaymentSchema);