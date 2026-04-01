const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    client_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        get: v => Math.round(v * 100) / 100,
        set: v => Math.round(v * 100) / 100
    },
    method: {
        type: String,
        maxlength: 50
    },
    details: {
        type: String,
        maxlength: 255
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

module.exports = mongoose.model('Payment', paymentSchema);