# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Fault Condition** - Text Contrast and Data Organization
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate poor contrast and unorganized layout
  - **Scoped PBT Approach**: Scope the property to the concrete failing cases - text contrast ratio < 4.5:1 and flat metrics structure
  - Test that renderFinancialOverview produces text with adequate contrast (≥4.5:1 ratio) against gradient background
  - Test that renderFinancialOverview organizes 12 metrics into logical sections (Revenue, Costs, Expenses, Balances)
  - Test that sections have visual distinction (headers, separators)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the usability issues exist)
  - Document counterexamples found (e.g., "contrast ratio is 3.2:1, below WCAG threshold" or "all metrics in flat grid without sections")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing Functionality
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-UI aspects (currency formatting, conditional styling, responsive layout, gradient background)
  - Write property-based tests capturing observed behavior patterns:
    - All 12 metrics are displayed (totalSales, totalCrusherCosts, totalContractorCosts, operatingExpenses, totalEarnedSalary, totalEmployeePayments, totalEmployeeCosts, totalAdministrationCosts, totalCapitalInjected, totalExpenses, netProfit, totalCashPayments)
    - Currency values formatted using formatCurrency function
    - Net profit uses conditional styling (text-success for positive, text-danger for negative)
    - Responsive grid layout with auto-fit and minmax works correctly
    - Gradient background styling (primary-600 to primary-800) with border-radius, padding, and box-shadow is applied
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 3. Fix for dashboard UI improvements (text contrast and data organization)

  - [x] 3.1 Implement the fix in backend/public/index.html
    - Update text color classes in renderFinancialOverview to ensure WCAG 2.1 AA compliance (≥4.5:1 contrast ratio)
    - Replace white text with lighter shades (text-gray-50 or text-gray-100) that provide adequate contrast against primary-800 background
    - Organize the 12 metrics into logical sections:
      - Revenue Section: totalSales, totalEarnedSalary
      - Costs Section: totalCrusherCosts, totalContractorCosts, totalEmployeeCosts
      - Expenses Section: operatingExpenses, totalAdministrationCosts, totalExpenses
      - Balances Section: totalCapitalInjected, totalEmployeePayments, totalCashPayments, netProfit
    - Add section headers with appropriate styling for visual hierarchy
    - Add visual separators or subtle background variations between sections
    - Update HTML structure to use semantic elements (section/div with classes) for each group
    - Ensure sections remain visually distinct on all screen sizes
    - Preserve gradient background styling, currency formatting, conditional styling for netProfit, and responsive grid layout
    - _Bug_Condition: isBugCondition(input) where input.textColor has poor contrast OR input.metricsLayout is single unorganized grid_
    - _Expected_Behavior: hasAdequateContrast(result.textColor, result.backgroundColor) AND hasLogicalSections(result.domStructure) AND hasVisualDistinction(result.sections)_
    - _Preservation: All 12 metrics displayed, gradient background styling, formatCurrency function, conditional styling for netProfit, responsive grid layout_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Text Contrast and Data Organization
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms usability issues are fixed)
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Existing Functionality
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (currency formatting, conditional styling, responsive layout, gradient background all unchanged)

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
