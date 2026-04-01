const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

class CloudinaryService {
    /**
     * Upload Base64 image to Cloudinary
     * @param {string} base64String - Base64 encoded image
     * @param {string} folder - Folder path in Cloudinary
     * @returns {Promise<Object>} - Upload result with URLs
     */
    static async uploadBase64Image(base64String, folder = 'payments') {
        try {
            // Validate input
            if (!base64String || base64String.trim() === '') {
                throw new Error('الصورة فارغة');
            }

            // Upload to Cloudinary with optimizations
            const result = await cloudinary.uploader.upload(base64String, {
                folder: folder,
                resource_type: 'image',
                transformation: [
                    { width: 1920, height: 1920, crop: 'limit' }, // Max size
                    { quality: 'auto:good' }, // Auto quality optimization
                    { fetch_format: 'auto' } // Auto format (WebP for modern browsers)
                ],
                // Add timeout to prevent hanging
                timeout: 60000
            });

            // Generate thumbnail URL
            const thumbnailUrl = cloudinary.url(result.public_id, {
                width: 200,
                height: 200,
                crop: 'fill',
                quality: 'auto:low',
                fetch_format: 'auto'
            });

            return {
                success: true,
                publicId: result.public_id,
                url: result.secure_url,
                thumbnailUrl: thumbnailUrl,
                format: result.format,
                size: result.bytes
            };
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            
            // Handle specific Cloudinary errors
            if (error.http_code === 420) {
                throw new Error('تم تجاوز حد الاستخدام المجاني لـ Cloudinary. يرجى الترقية أو الانتظار.');
            } else if (error.http_code === 401) {
                throw new Error('خطأ في مفاتيح Cloudinary. يرجى التحقق من الإعدادات.');
            } else if (error.message && error.message.includes('File size too large')) {
                throw new Error('حجم الصورة كبير جداً. الحد الأقصى 10 ميجابايت.');
            } else if (error.message && error.message.includes('Invalid image')) {
                throw new Error('الصورة غير صالحة. يرجى اختيار صورة صحيحة.');
            }
            
            throw new Error('فشل رفع الصورة: ' + (error.message || 'خطأ غير معروف'));
        }
    }

    /**
     * Delete image from Cloudinary
     * @param {string} publicId - Cloudinary public ID
     * @returns {Promise<boolean>} - Success status
     */
    static async deleteImage(publicId) {
        try {
            if (!publicId || publicId.trim() === '') {
                return false;
            }

            const result = await cloudinary.uploader.destroy(publicId);
            
            if (result.result === 'ok' || result.result === 'not found') {
                return true;
            }
            
            console.error('Cloudinary delete failed:', result);
            return false;
        } catch (error) {
            console.error('Cloudinary delete error:', error);
            return false;
        }
    }

    /**
     * Get optimized URL for an image
     * @param {string} publicId - Cloudinary public ID
     * @param {Object} options - Transformation options
     * @returns {string} - Optimized URL
     */
    static getOptimizedUrl(publicId, options = {}) {
        return cloudinary.url(publicId, {
            width: options.width || 800,
            height: options.height || 600,
            crop: options.crop || 'limit',
            quality: options.quality || 'auto:good',
            fetch_format: 'auto'
        });
    }

    /**
     * Get thumbnail URL
     * @param {string} publicId - Cloudinary public ID
     * @param {number} size - Thumbnail size
     * @returns {string} - Thumbnail URL
     */
    static getThumbnailUrl(publicId, size = 150) {
        return cloudinary.url(publicId, {
            width: size,
            height: size,
            crop: 'fill',
            quality: 'auto:low',
            fetch_format: 'auto'
        });
    }

    /**
     * Check if Cloudinary is configured correctly
     * @returns {boolean} - Configuration status
     */
    static isConfigured() {
        return !!(
            process.env.CLOUDINARY_CLOUD_NAME &&
            process.env.CLOUDINARY_API_KEY &&
            process.env.CLOUDINARY_API_SECRET
        );
    }

    /**
     * Get Cloudinary usage stats (for monitoring)
     * @returns {Promise<Object>} - Usage statistics
     */
    static async getUsageStats() {
        try {
            const result = await cloudinary.api.usage();
            return {
                success: true,
                storage: {
                    used: result.storage.usage,
                    limit: result.storage.limit,
                    percentage: (result.storage.usage / result.storage.limit * 100).toFixed(2)
                },
                bandwidth: {
                    used: result.bandwidth.usage,
                    limit: result.bandwidth.limit,
                    percentage: (result.bandwidth.usage / result.bandwidth.limit * 100).toFixed(2)
                }
            };
        } catch (error) {
            console.error('Failed to get Cloudinary usage:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = CloudinaryService;
