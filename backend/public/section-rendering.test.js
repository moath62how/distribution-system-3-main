/**
 * Section Rendering Tests for Financial Dashboard Redesign
 * Task 8: Checkpoint - Ensure all section rendering tests pass
 * 
 * Tests for:
 * - Task 5.1: Profit Overview Section rendering
 * - Task 6.1: Final Financial Result Card rendering
 * - Task 7.1: Cost Breakdown Section rendering
 */

const fs = require('fs');
const path = require('path');

// Load the HTML file
const htmlPath = path.join(__dirname, 'index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

// Mock formatCurrency function
global.formatCurrency = (value) => {
    if (value === null || value === undefined) return '0.00';
    return value.toLocaleString('ar-EG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

// Extract functions from HTML
function extractFunction(functionName) {
    const regex = new RegExp(`function ${functionName}\\([^)]*\\)\\s*{[\\s\\S]*?^\\s{8}}`, 'm');
    const match = htmlContent.match(regex);
    if (!match) {
        throw new Error(`Could not find ${functionName} function in HTML`);
    }
    return match[0];
}

// Mock DOM elements
class MockElement {
    constructor(tagName = 'div') {
        this.tagName = tagName.toUpperCase();
        this.innerHTML = '';
        this.children = [];
        this.classList = new Set();
        this.attributes = {};
    }

    querySelector(selector) {
        // Simple mock implementation
        return this.children.find(child => {
            if (selector.startsWith('.')) {
                return child.classList.has(selector.slice(1));
            }
            if (selector.startsWith('#')) {
                return child.attributes.id === selector.slice(1);
            }
            return child.tagName === selector.toUpperCase();
        });
    }

    querySelectorAll(selector) {
        // Simple mock implementation
        const results = [];
        const checkElement = (element) => {
            if (selector.startsWith('.')) {
                if (element.classList.has(selector.slice(1))) {
                    results.push(element);
                }
            }
            element.children.forEach(checkElement);
        };
        checkElement(this);
        return results;
    }

    getAttribute(name) {
        return this.attributes[name];
    }

    setAttribute(name, value) {
        this.attributes[name] = value;
    }
}

// Mock document
const mockDocument = {
    getElementById: (id) => {
        const element = new MockElement();
        element.attributes.id = id;
        element.attributes.dir = 'rtl';
        return element;
    }
};

global.document = mockDocument;

describe('Task 5.1: Profit Overview Section Rendering', () => {
    test('renderProfitOverview function exists in HTML', () => {
        const functionCode = extractFunction('renderProfitOverview');
        expect(functionCode).toBeTruthy();
        expect(functionCode).toContain('function renderProfitOverview');
    });

    test('renderProfitOverview creates three profit cards', () => {
        const functionCode = extractFunction('renderProfitOverview');

        // Check for three profit-card divs
        const profitCardMatches = functionCode.match(/class="profit-card"/g);
        expect(profitCardMatches).toBeTruthy();
        expect(profitCardMatches.length).toBe(3);
    });

    test('renderProfitOverview uses calculation utility functions', () => {
        const functionCode = extractFunction('renderProfitOverview');

        expect(functionCode).toContain('calculateTotalRevenue');
        expect(functionCode).toContain('calculateTotalCosts');
        expect(functionCode).toContain('calculateNetProfit');
    });

    test('renderProfitOverview uses color coding utility', () => {
        const functionCode = extractFunction('renderProfitOverview');

        expect(functionCode).toContain('getNetProfitColorClass');
    });

    test('renderProfitOverview uses formatCurrency for all values', () => {
        const functionCode = extractFunction('renderProfitOverview');

        const formatCurrencyMatches = functionCode.match(/formatCurrency/g);
        expect(formatCurrencyMatches).toBeTruthy();
        expect(formatCurrencyMatches.length).toBeGreaterThanOrEqual(3);
    });

    test('renderProfitOverview has Arabic labels', () => {
        const functionCode = extractFunction('renderProfitOverview');

        expect(functionCode).toContain('إجمالي الإيرادات');
        expect(functionCode).toContain('إجمالي التكاليف');
        expect(functionCode).toContain('صافي الربح');
    });

    test('renderProfitOverview has icons', () => {
        const functionCode = extractFunction('renderProfitOverview');

        expect(functionCode).toContain('profit-icon');
    });
});

describe('Task 6.1: Final Financial Result Card Rendering', () => {
    test('renderFinalFinancialResult function exists in HTML', () => {
        const functionCode = extractFunction('renderFinalFinancialResult');
        expect(functionCode).toBeTruthy();
        expect(functionCode).toContain('function renderFinalFinancialResult');
    });

    test('renderFinalFinancialResult creates final result card with five metrics', () => {
        const functionCode = extractFunction('renderFinalFinancialResult');

        // Check for final-result-card
        expect(functionCode).toContain('final-result-card');

        // Check for five result rows
        const resultRowMatches = functionCode.match(/class="final-result-row/g);
        expect(resultRowMatches).toBeTruthy();
        expect(resultRowMatches.length).toBe(5);
    });

    test('renderFinalFinancialResult uses calculation utility functions', () => {
        const functionCode = extractFunction('renderFinalFinancialResult');

        expect(functionCode).toContain('calculateTotalRevenue');
        expect(functionCode).toContain('calculateNetOperatingResult');
        expect(functionCode).toContain('calculateNetProfitLoss');
        expect(functionCode).toContain('calculateTotalDue');
        expect(functionCode).toContain('calculateProfitBeforePayment');
    });

    test('renderFinalFinancialResult uses color coding utilities', () => {
        const functionCode = extractFunction('renderFinalFinancialResult');

        expect(functionCode).toContain('getNetProfitLossColorClass');
        expect(functionCode).toContain('getProfitBeforePaymentColorClass');
    });

    test('renderFinalFinancialResult uses formatCurrency for all values', () => {
        const functionCode = extractFunction('renderFinalFinancialResult');

        const formatCurrencyMatches = functionCode.match(/formatCurrency/g);
        expect(formatCurrencyMatches).toBeTruthy();
        expect(formatCurrencyMatches.length).toBeGreaterThanOrEqual(5);
    });

    test('renderFinalFinancialResult has Arabic labels', () => {
        const functionCode = extractFunction('renderFinalFinancialResult');

        expect(functionCode).toContain('النتيجة المالية النهائية');
        expect(functionCode).toContain('نتيجة التشغيل');
        expect(functionCode).toContain('المصروفات');
        expect(functionCode).toContain('صافي الربح / الخسارة');
        expect(functionCode).toContain('مستحقات العملاء');
        expect(functionCode).toContain('الربح قبل استلام المدفوعات');
    });

    test('renderFinalFinancialResult has visual dividers', () => {
        const functionCode = extractFunction('renderFinalFinancialResult');

        const dividerMatches = functionCode.match(/final-result-divider/g);
        expect(dividerMatches).toBeTruthy();
        expect(dividerMatches.length).toBe(2);
    });

    test('renderFinalFinancialResult has highlight rows', () => {
        const functionCode = extractFunction('renderFinalFinancialResult');

        const highlightMatches = functionCode.match(/final-result-row highlight/g);
        expect(highlightMatches).toBeTruthy();
        expect(highlightMatches.length).toBe(2);
    });
});

describe('Task 7.1: Cost Breakdown Section Rendering', () => {
    test('renderCostBreakdown function exists in HTML', () => {
        const functionCode = extractFunction('renderCostBreakdown');
        expect(functionCode).toBeTruthy();
        expect(functionCode).toContain('function renderCostBreakdown');
    });

    test('renderCostBreakdown creates cost breakdown grid with seven categories', () => {
        const functionCode = extractFunction('renderCostBreakdown');

        // Check for cost-breakdown-grid
        expect(functionCode).toContain('cost-breakdown-grid');

        // Check for seven cost categories in labels array
        expect(functionCode).toContain("labels: ['موظفين', 'مقاولين', 'كسارات', 'موردين', 'إدارية', 'مصروفات', 'خسائر']");
    });

    test('renderCostBreakdown has two-column layout (list and chart)', () => {
        const functionCode = extractFunction('renderCostBreakdown');

        expect(functionCode).toContain('cost-list');
        expect(functionCode).toContain('cost-chart-container');
    });

    test('renderCostBreakdown creates canvas for Chart.js', () => {
        const functionCode = extractFunction('renderCostBreakdown');

        expect(functionCode).toContain('costPieChart');
        expect(functionCode).toContain('<canvas');
    });

    test('renderCostBreakdown uses formatCurrency for cost amounts', () => {
        const functionCode = extractFunction('renderCostBreakdown');

        const formatCurrencyMatches = functionCode.match(/formatCurrency/g);
        expect(formatCurrencyMatches).toBeTruthy();
        expect(formatCurrencyMatches.length).toBeGreaterThanOrEqual(1);
    });

    test('renderCostBreakdown has Chart.js configuration with RTL support', () => {
        const functionCode = extractFunction('renderCostBreakdown');

        expect(functionCode).toContain('new Chart');
        expect(functionCode).toContain("type: 'pie'");
        expect(functionCode).toContain('rtl: true');
        expect(functionCode).toContain("textDirection: 'rtl'");
    });

    test('renderCostBreakdown has graceful degradation for Chart.js failure', () => {
        const functionCode = extractFunction('renderCostBreakdown');

        expect(functionCode).toContain('typeof Chart');
        expect(functionCode).toContain('catch');
        expect(functionCode).toContain('console.warn');
    });

    test('renderCostBreakdown has section title', () => {
        const functionCode = extractFunction('renderCostBreakdown');

        expect(functionCode).toContain('توزيع التكاليف');
        expect(functionCode).toContain('section-title');
    });
});

describe('Integration: All three sections', () => {
    test('all three rendering functions exist in HTML', () => {
        const profitFunction = extractFunction('renderProfitOverview');
        const finalResultFunction = extractFunction('renderFinalFinancialResult');
        const costFunction = extractFunction('renderCostBreakdown');

        expect(profitFunction).toBeTruthy();
        expect(finalResultFunction).toBeTruthy();
        expect(costFunction).toBeTruthy();
    });

    test('all three sections are called in loadDashboardData', () => {
        const loadFunction = extractFunction('loadDashboardData');

        expect(loadFunction).toContain('renderProfitOverview(metrics)');
        expect(loadFunction).toContain('renderFinalFinancialResult(metrics)');
        expect(loadFunction).toContain('renderCostBreakdown(metrics)');
    });

    test('HTML containers exist for all three sections', () => {
        expect(htmlContent).toContain('id="profitOverviewSection"');
        expect(htmlContent).toContain('id="finalResultSection"');
        expect(htmlContent).toContain('id="costBreakdownSection"');
    });

    test('sections have correct order in HTML', () => {
        const profitIndex = htmlContent.indexOf('id="profitOverviewSection"');
        const finalResultIndex = htmlContent.indexOf('id="finalResultSection"');
        const costIndex = htmlContent.indexOf('id="costBreakdownSection"');

        expect(profitIndex).toBeLessThan(finalResultIndex);
        expect(finalResultIndex).toBeLessThan(costIndex);
    });

    test('all sections have RTL dir attribute in HTML', () => {
        const profitSection = htmlContent.match(/<section[^>]*id="profitOverviewSection"[^>]*>/);
        const finalResultSection = htmlContent.match(/<section[^>]*id="finalResultSection"[^>]*>/);
        const costSection = htmlContent.match(/<section[^>]*id="costBreakdownSection"[^>]*>/);

        expect(profitSection[0]).toContain('dir="rtl"');
        expect(finalResultSection[0]).toContain('dir="rtl"');
        expect(costSection[0]).toContain('dir="rtl"');
    });
});
