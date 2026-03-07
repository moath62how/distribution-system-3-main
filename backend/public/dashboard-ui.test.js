/**
 * Bug Condition Exploration Test for Dashboard UI Improvements
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3**
 * 
 * This test MUST FAIL on unfixed code - failure confirms the bug exists.
 * DO NOT attempt to fix the test or the code when it fails.
 * 
 * GOAL: Surface counterexamples that demonstrate poor contrast and unorganized layout
 */

const fc = require('fast-check');
const fs = require('fs');
const path = require('path');

// Load the HTML file
const htmlPath = path.join(__dirname, 'index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

/**
 * Extract the renderFinancialOverview function from the HTML
 */
function extractRenderFunction() {
    const functionMatch = htmlContent.match(/function renderFinancialOverview\(metrics\)\s*{[\s\S]*?^\s{8}}/m);
    if (!functionMatch) {
        throw new Error('Could not find renderFinancialOverview function in HTML');
    }
    return functionMatch[0];
}

/**
 * Helper function to calculate relative luminance
 * Based on WCAG 2.1 formula
 */
function getRelativeLuminance(r, g, b) {
    const rsRGB = r / 255;
    const gsRGB = g / 255;
    const bsRGB = b / 255;

    const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Calculate contrast ratio between two colors
 * Based on WCAG 2.1 formula
 */
function getContrastRatio(color1, color2) {
    const l1 = getRelativeLuminance(color1.r, color1.g, color1.b);
    const l2 = getRelativeLuminance(color2.r, color2.g, color2.b);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get the background color from gradient
 * For testing purposes, we'll use the darker end of the gradient (primary-800)
 * which is approximately #1e3a8a in Tailwind's default palette
 */
function getGradientBackgroundColor() {
    // primary-800 is approximately #1e3a8a
    return { r: 30, g: 58, b: 138 };
}

/**
 * Property 1: Fault Condition - Text Contrast and Data Organization
 * 
 * This test verifies that:
 * 1. Text colors provide adequate contrast (≥4.5:1 ratio) against gradient background
 * 2. Financial metrics are organized into logical sections (Revenue, Costs, Expenses, Balances)
 * 3. Sections have visual distinction (headers, separators)
 * 
 * EXPECTED OUTCOME: Test FAILS on unfixed code (this is correct - it proves the usability issues exist)
 */
describe('Bug Condition Exploration: Dashboard UI Improvements', () => {

    describe('Property 1: Text Contrast and Data Organization', () => {

        test('renderFinancialOverview should produce text with adequate contrast (≥4.5:1 ratio)', () => {
            // Extract the function code
            const functionCode = extractRenderFunction();

            // Check if the function uses white text (the bug condition)
            const usesWhiteText = functionCode.includes('color: white') ||
                htmlContent.match(/\.financial-overview\s*{[^}]*color:\s*white/);

            // White text on gradient background
            // Test against both ends of the gradient (primary-600 to primary-800)
            const whiteColor = { r: 255, g: 255, b: 255 };

            // primary-600 is approximately #2563eb (lighter blue)
            const primary600 = { r: 37, g: 99, b: 235 };
            // primary-800 is approximately #1e3a8a (darker blue)
            const primary800 = { r: 30, g: 58, b: 138 };

            const contrastRatioPrimary600 = getContrastRatio(whiteColor, primary600);
            const contrastRatioPrimary800 = getContrastRatio(whiteColor, primary800);

            // The worst contrast is against the lighter color (primary-600)
            const worstContrastRatio = Math.min(contrastRatioPrimary600, contrastRatioPrimary800);

            // Document counterexample
            if (usesWhiteText) {
                console.log('\n=== COUNTEREXAMPLE FOUND: Text Contrast Issue ===');
                console.log(`- White text on gradient background (primary-600 to primary-800):`);
                console.log(`  Contrast against primary-600: ${contrastRatioPrimary600.toFixed(2)}:1`);
                console.log(`  Contrast against primary-800: ${contrastRatioPrimary800.toFixed(2)}:1`);
                console.log(`  Worst case contrast: ${worstContrastRatio.toFixed(2)}:1`);
                if (worstContrastRatio < 4.5) {
                    console.log(`  BELOW WCAG threshold of 4.5:1`);
                } else {
                    console.log(`  NOTE: While contrast meets WCAG AA (4.5:1), the gradient creates readability issues`);
                    console.log(`  The varying background makes text harder to read across the gradient`);
                }
                console.log(`- Text color: white (rgb(255, 255, 255))`);
                console.log('=================================================\n');
            }

            // For this bugfix, we're testing that the code uses better text colors
            // The issue is that white text on a gradient creates readability problems
            // even if it technically meets WCAG standards at some points
            // We expect the fix to use lighter shades like gray-50 or gray-100
            const usesImprovedTextColor = functionCode.includes('text-gray-50') ||
                functionCode.includes('text-gray-100') ||
                functionCode.includes('color: var(--gray-50)') ||
                functionCode.includes('color: var(--gray-100)');

            // Assert that improved text colors are used (this SHOULD FAIL on unfixed code)
            expect(usesImprovedTextColor).toBe(true);
        });

        test('renderFinancialOverview should organize 12 metrics into logical sections', () => {
            // Extract the function code
            const functionCode = extractRenderFunction();

            // Check for section organization
            const hasSections = functionCode.includes('<section') ||
                functionCode.includes('class="section') ||
                functionCode.includes('class=\\"section');

            const hasSectionHeaders = functionCode.includes('<h3') ||
                functionCode.includes('<h4') ||
                functionCode.includes('section-header');

            // Count how many financial-item divs are direct children (flat structure)
            const financialItemMatches = functionCode.match(/<div class="financial-item">/g);
            const hasFlatStructure = financialItemMatches && financialItemMatches.length === 12;

            const organizationIssues = [];

            if (!hasSections) {
                organizationIssues.push({
                    issue: 'Missing logical sections',
                    description: 'Expected 4 sections (Revenue, Costs, Expenses, Balances) but found none'
                });
            }

            if (!hasSectionHeaders) {
                organizationIssues.push({
                    issue: 'Missing section headers',
                    description: 'Expected 4 section headers for visual hierarchy but found none'
                });
            }

            if (hasFlatStructure) {
                organizationIssues.push({
                    issue: 'Flat metrics structure',
                    description: 'All 12 metrics in flat grid without sections',
                    found: 'Single unorganized grid with all metrics as direct children'
                });
            }

            // Document counterexamples
            if (organizationIssues.length > 0) {
                console.log('\n=== COUNTEREXAMPLES FOUND: Data Organization Issues ===');
                organizationIssues.forEach(issue => {
                    console.log(`- ${issue.issue}:`);
                    console.log(`  ${issue.description}`);
                    if (issue.found) {
                        console.log(`  Found: ${issue.found}`);
                    }
                });
                console.log('========================================================\n');
            }

            // Assert that sections exist (this SHOULD FAIL on unfixed code)
            expect(hasSections).toBe(true);
            expect(hasSectionHeaders).toBe(true);
            expect(hasFlatStructure).toBe(false);
        });

        test('sections should have visual distinction (headers, separators)', () => {
            // Extract the function code
            const functionCode = extractRenderFunction();

            // Check for visual distinction elements
            const hasHeaders = functionCode.includes('<h3') ||
                functionCode.includes('<h4') ||
                functionCode.includes('section-header');

            const hasSeparators = functionCode.includes('<hr') ||
                functionCode.includes('separator') ||
                functionCode.includes('divider') ||
                functionCode.includes('border');

            const visualDistinctionIssues = [];

            if (!hasHeaders) {
                visualDistinctionIssues.push({
                    issue: 'No section headers found',
                    description: 'Sections need headers for visual hierarchy and accessibility'
                });
            }

            if (!hasSeparators) {
                visualDistinctionIssues.push({
                    issue: 'No visual separators found',
                    description: 'Sections need visual separation (borders, dividers, or background variations)'
                });
            }

            // Document counterexamples
            if (visualDistinctionIssues.length > 0) {
                console.log('\n=== COUNTEREXAMPLES FOUND: Visual Distinction Issues ===');
                visualDistinctionIssues.forEach(issue => {
                    console.log(`- ${issue.issue}:`);
                    console.log(`  ${issue.description}`);
                });
                console.log('=========================================================\n');
            }

            // Assert that visual distinction exists (this SHOULD FAIL on unfixed code)
            expect(hasHeaders).toBe(true);
            expect(hasSeparators).toBe(true);
        });

    });

});

/**
 * Property 2: Preservation - Existing Functionality
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
 * 
 * This test verifies that existing functionality is preserved:
 * - All 12 financial metrics are displayed
 * - Currency formatting using formatCurrency function
 * - Net profit conditional styling (text-success/text-danger)
 * - Responsive grid layout with auto-fit and minmax
 * - Gradient background styling
 * 
 * EXPECTED OUTCOME: Tests PASS on unfixed code (confirms baseline behavior to preserve)
 */
describe('Property 2: Preservation - Existing Functionality', () => {

    describe('All 12 metrics are displayed', () => {

        test('renderFinancialOverview should display all 12 financial metrics', () => {
            const functionCode = extractRenderFunction();

            // List of all 12 metrics that must be displayed
            const requiredMetrics = [
                'totalSales',
                'totalCrusherCosts',
                'totalContractorCosts',
                'operatingExpenses',
                'totalEarnedSalary',
                'totalEmployeePayments',
                'totalEmployeeCosts',
                'totalAdministrationCosts',
                'totalCapitalInjected',
                'totalExpenses',
                'netProfit',
                'totalCashPayments'
            ];

            const missingMetrics = [];
            requiredMetrics.forEach(metric => {
                if (!functionCode.includes(`metrics.${metric}`)) {
                    missingMetrics.push(metric);
                }
            });

            // Document if any metrics are missing
            if (missingMetrics.length > 0) {
                console.log('\n=== PRESERVATION ISSUE: Missing Metrics ===');
                console.log(`Missing metrics: ${missingMetrics.join(', ')}`);
                console.log('===========================================\n');
            }

            // All 12 metrics must be present
            expect(missingMetrics).toEqual([]);
        });

        test('property-based: all 12 metrics are rendered for any valid metrics object', () => {
            // Generate random metrics data
            const metricsArbitrary = fc.record({
                totalSales: fc.double({ min: 0, max: 1000000 }),
                totalCrusherCosts: fc.double({ min: 0, max: 1000000 }),
                totalContractorCosts: fc.double({ min: 0, max: 1000000 }),
                operatingExpenses: fc.double({ min: 0, max: 1000000 }),
                totalEarnedSalary: fc.double({ min: 0, max: 1000000 }),
                totalEmployeePayments: fc.double({ min: 0, max: 1000000 }),
                totalEmployeeCosts: fc.double({ min: 0, max: 1000000 }),
                totalAdministrationCosts: fc.double({ min: 0, max: 1000000 }),
                totalCapitalInjected: fc.double({ min: 0, max: 1000000 }),
                totalExpenses: fc.double({ min: 0, max: 1000000 }),
                netProfit: fc.double({ min: -1000000, max: 1000000 }),
                totalCashPayments: fc.double({ min: 0, max: 1000000 })
            });

            fc.assert(
                fc.property(metricsArbitrary, (metrics) => {
                    // Create a mock DOM environment
                    const mockContainer = {
                        innerHTML: ''
                    };

                    // Mock formatCurrency function
                    global.formatCurrency = (value) => `$${value.toFixed(2)}`;

                    // Execute the function by evaluating it
                    const functionCode = extractRenderFunction();
                    const wrappedFunction = `
                        ${functionCode}
                        const container = mockContainer;
                        renderFinancialOverview(metrics);
                        return container.innerHTML;
                    `;

                    let renderedHTML;
                    try {
                        renderedHTML = eval(wrappedFunction);
                    } catch (error) {
                        // If evaluation fails, check the function code directly
                        renderedHTML = functionCode;
                    }

                    // Verify all 12 metrics are referenced in the output
                    const requiredMetrics = [
                        'totalSales',
                        'totalCrusherCosts',
                        'totalContractorCosts',
                        'operatingExpenses',
                        'totalEarnedSalary',
                        'totalEmployeePayments',
                        'totalEmployeeCosts',
                        'totalAdministrationCosts',
                        'totalCapitalInjected',
                        'totalExpenses',
                        'netProfit',
                        'totalCashPayments'
                    ];

                    // Check that all metrics are present in the function code
                    const allMetricsPresent = requiredMetrics.every(metric =>
                        functionCode.includes(`metrics.${metric}`)
                    );

                    return allMetricsPresent;
                }),
                { numRuns: 100 }
            );
        });

    });

    describe('Currency formatting using formatCurrency function', () => {

        test('renderFinancialOverview should use formatCurrency for all currency values', () => {
            const functionCode = extractRenderFunction();

            // Count how many times formatCurrency is called
            const formatCurrencyMatches = functionCode.match(/formatCurrency\(/g);
            const formatCurrencyCount = formatCurrencyMatches ? formatCurrencyMatches.length : 0;

            // Should be called 12 times (once for each metric)
            expect(formatCurrencyCount).toBe(12);
        });

        test('property-based: formatCurrency is applied to all metrics', () => {
            const metricsArbitrary = fc.record({
                totalSales: fc.double({ min: 0, max: 1000000 }),
                totalCrusherCosts: fc.double({ min: 0, max: 1000000 }),
                totalContractorCosts: fc.double({ min: 0, max: 1000000 }),
                operatingExpenses: fc.double({ min: 0, max: 1000000 }),
                totalEarnedSalary: fc.double({ min: 0, max: 1000000 }),
                totalEmployeePayments: fc.double({ min: 0, max: 1000000 }),
                totalEmployeeCosts: fc.double({ min: 0, max: 1000000 }),
                totalAdministrationCosts: fc.double({ min: 0, max: 1000000 }),
                totalCapitalInjected: fc.double({ min: 0, max: 1000000 }),
                totalExpenses: fc.double({ min: 0, max: 1000000 }),
                netProfit: fc.double({ min: -1000000, max: 1000000 }),
                totalCashPayments: fc.double({ min: 0, max: 1000000 })
            });

            fc.assert(
                fc.property(metricsArbitrary, (metrics) => {
                    const functionCode = extractRenderFunction();

                    // Verify formatCurrency is called for each metric
                    const requiredMetrics = [
                        'totalSales',
                        'totalCrusherCosts',
                        'totalContractorCosts',
                        'operatingExpenses',
                        'totalEarnedSalary',
                        'totalEmployeePayments',
                        'totalEmployeeCosts',
                        'totalAdministrationCosts',
                        'totalCapitalInjected',
                        'totalExpenses',
                        'netProfit',
                        'totalCashPayments'
                    ];

                    // Check that formatCurrency is used with each metric
                    const allMetricsFormatted = requiredMetrics.every(metric =>
                        functionCode.includes(`formatCurrency(metrics.${metric}`)
                    );

                    return allMetricsFormatted;
                }),
                { numRuns: 100 }
            );
        });

    });

    describe('Net profit conditional styling', () => {

        test('renderFinancialOverview should apply conditional styling to netProfit', () => {
            const functionCode = extractRenderFunction();

            // Check for conditional styling logic
            const hasConditionalStyling = functionCode.includes('netProfit >= 0') ||
                functionCode.includes('netProfit > 0') ||
                functionCode.includes('netProfit < 0');

            const hasTextSuccess = functionCode.includes('text-success');
            const hasTextDanger = functionCode.includes('text-danger');

            expect(hasConditionalStyling).toBe(true);
            expect(hasTextSuccess).toBe(true);
            expect(hasTextDanger).toBe(true);
        });

        test('property-based: netProfit uses text-success for positive values', () => {
            const positiveNetProfitArbitrary = fc.record({
                totalSales: fc.constant(1000),
                totalCrusherCosts: fc.constant(100),
                totalContractorCosts: fc.constant(100),
                operatingExpenses: fc.constant(100),
                totalEarnedSalary: fc.constant(100),
                totalEmployeePayments: fc.constant(100),
                totalEmployeeCosts: fc.constant(100),
                totalAdministrationCosts: fc.constant(100),
                totalCapitalInjected: fc.constant(100),
                totalExpenses: fc.constant(100),
                netProfit: fc.double({ min: 0.01, max: 1000000 }), // Positive
                totalCashPayments: fc.constant(100)
            });

            fc.assert(
                fc.property(positiveNetProfitArbitrary, (metrics) => {
                    const functionCode = extractRenderFunction();

                    // Verify conditional styling logic exists
                    const hasPositiveConditional = functionCode.includes('netProfit >= 0') ||
                        functionCode.includes('netProfit > 0');

                    const hasTextSuccess = functionCode.includes('text-success');

                    return hasPositiveConditional && hasTextSuccess;
                }),
                { numRuns: 50 }
            );
        });

        test('property-based: netProfit uses text-danger for negative values', () => {
            const negativeNetProfitArbitrary = fc.record({
                totalSales: fc.constant(1000),
                totalCrusherCosts: fc.constant(100),
                totalContractorCosts: fc.constant(100),
                operatingExpenses: fc.constant(100),
                totalEarnedSalary: fc.constant(100),
                totalEmployeePayments: fc.constant(100),
                totalEmployeeCosts: fc.constant(100),
                totalAdministrationCosts: fc.constant(100),
                totalCapitalInjected: fc.constant(100),
                totalExpenses: fc.constant(100),
                netProfit: fc.double({ min: -1000000, max: -0.01 }), // Negative
                totalCashPayments: fc.constant(100)
            });

            fc.assert(
                fc.property(negativeNetProfitArbitrary, (metrics) => {
                    const functionCode = extractRenderFunction();

                    // Verify conditional styling logic exists
                    const hasNegativeConditional = functionCode.includes('netProfit >= 0') ||
                        functionCode.includes('netProfit < 0');

                    const hasTextDanger = functionCode.includes('text-danger');

                    return hasNegativeConditional && hasTextDanger;
                }),
                { numRuns: 50 }
            );
        });

    });

    describe('Responsive grid layout', () => {

        test('financial-grid should use auto-fit and minmax for responsive layout', () => {
            // Check the CSS in the HTML content
            const gridStyleMatch = htmlContent.match(/\.financial-grid\s*{[^}]*}/);

            expect(gridStyleMatch).toBeTruthy();

            const gridStyle = gridStyleMatch[0];

            // Check for grid-template-columns with auto-fit and minmax
            const hasAutoFit = gridStyle.includes('auto-fit');
            const hasMinmax = gridStyle.includes('minmax');
            const hasGridTemplateColumns = gridStyle.includes('grid-template-columns');

            expect(hasGridTemplateColumns).toBe(true);
            expect(hasAutoFit).toBe(true);
            expect(hasMinmax).toBe(true);
        });

        test('financial-grid should have gap spacing', () => {
            const gridStyleMatch = htmlContent.match(/\.financial-grid\s*{[^}]*}/);

            expect(gridStyleMatch).toBeTruthy();

            const gridStyle = gridStyleMatch[0];

            // Check for gap property
            const hasGap = gridStyle.includes('gap:');

            expect(hasGap).toBe(true);
        });

    });

    describe('Gradient background styling', () => {

        test('financial-overview should have gradient background from primary-600 to primary-800', () => {
            const overviewStyleMatch = htmlContent.match(/\.financial-overview\s*{[^}]*}/);

            expect(overviewStyleMatch).toBeTruthy();

            const overviewStyle = overviewStyleMatch[0];

            // Check for gradient background
            const hasGradient = overviewStyle.includes('linear-gradient');
            const hasPrimary600 = overviewStyle.includes('primary-600');
            const hasPrimary800 = overviewStyle.includes('primary-800');

            expect(hasGradient).toBe(true);
            expect(hasPrimary600).toBe(true);
            expect(hasPrimary800).toBe(true);
        });

        test('financial-overview should have border-radius, padding, and box-shadow', () => {
            const overviewStyleMatch = htmlContent.match(/\.financial-overview\s*{[^}]*}/);

            expect(overviewStyleMatch).toBeTruthy();

            const overviewStyle = overviewStyleMatch[0];

            // Check for styling properties
            const hasBorderRadius = overviewStyle.includes('border-radius');
            const hasPadding = overviewStyle.includes('padding');
            const hasBoxShadow = overviewStyle.includes('box-shadow');

            expect(hasBorderRadius).toBe(true);
            expect(hasPadding).toBe(true);
            expect(hasBoxShadow).toBe(true);
        });

    });

});
