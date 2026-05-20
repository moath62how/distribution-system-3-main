export const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString('ar-EG', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }) + ' ج.م';
};

export const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG');
};

export const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString('ar-EG');
};

export const formatQuantity = (qty) => {
    return Number(qty || 0).toLocaleString('ar-EG', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    });
};

export const formatNumber = (num, decimals = 0) => {
    return Number(num || 0).toLocaleString('ar-EG', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

export const parseArabicDate = (arabicDate) => {
    if (!arabicDate || arabicDate === '—') return '';
    if (arabicDate.match(/^\d{4}-\d{2}-\d{2}/)) {
        return arabicDate.split('T')[0];
    }
    try {
        const englishDate = arabicDate
            .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
            .replace(/[‏]/g, '');
        const parts = englishDate.split('/');
        if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            return `${year}-${month}-${day}`;
        }
    } catch (e) {
        console.warn('Could not parse Arabic date:', arabicDate);
    }
    return '';
};
