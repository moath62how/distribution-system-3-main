export const validateRequired = (value, fieldName) => {
    if (!value || value.toString().trim() === '') {
        return `${fieldName} مطلوب`;
    }
    return null;
};

export const validatePhone = (phone) => {
    if (!phone) return null;
    const cleanPhone = phone.replace(/[\s\-()]/g, '');
    const phoneRegex = /^(01[0-2,5]{1}[0-9]{8}|02[0-9]{8}|03[0-9]{7}|04[0-9]{7}|05[0-9]{7}|06[0-9]{7}|08[0-9]{7}|09[0-9]{7})$/;
    if (!phoneRegex.test(cleanPhone)) {
        return 'رقم الهاتف غير صحيح';
    }
    return null;
};

export const validatePositiveNumber = (value, fieldName) => {
    if (value === '' || value === null || value === undefined) return null;
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
        return `${fieldName} يجب أن يكون رقم موجب`;
    }
    return null;
};
