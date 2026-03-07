# Requirements Document

## Introduction

This document specifies requirements for a comprehensive Financial Dashboard Redesign that provides business owners with immediate, clear insights into company financial health. The dashboard prioritizes answering critical business questions: profitability status, cost distribution, cash movement, and outstanding balances. The redesign transforms raw financial data into actionable insights through visual clarity, strategic information hierarchy, and decision-focused metrics.

## Glossary

- **Dashboard**: The main financial overview interface displaying profit, costs, cash flow, and balances
- **Financial_Metrics_API**: The backend endpoint (/metrics) that provides aggregated financial data
- **Profit_Overview_Section**: Top dashboard section showing revenue, costs, and net profit/loss
- **Final_Financial_Result_Card**: Comprehensive summary card showing operating result, expenses, net profit/loss, outstanding client due, and profit before payment
- **Cost_Breakdown_Section**: Visual representation of expense distribution across categories
- **Cash_Flow_Section**: Display of actual money movement (in vs out)
- **Outstanding_Balances_Section**: Display of receivables and payables
- **Operational_Metrics_Section**: Secondary metrics showing business entity counts
- **Chart_Library**: Chart.js library loaded via CDN for data visualization
- **Color_Indicator**: Visual cue using green (positive), red (negative), or neutral colors
- **RTL_Layout**: Right-to-left layout for Arabic interface
- **Metric_Card**: Individual UI component displaying a single financial metric
- **Net_Operating_Result**: Total Revenue minus Operational Costs (Crushers, Suppliers, Contractors, Employees)
- **Total_Expenses**: Sum of Administrative, Office, and Miscellaneous expenses
- **Total_Due**: Outstanding balance owed by clients (Total Revenue - Total Client Payments)
- **Profit_Before_Payment**: Net Profit/Loss plus Total Due (shows profitability if all clients paid)

## Requirements

### Requirement 1: Display Profit Overview

**User Story:** As a business owner, I want to see total revenue, total costs, and net profit at the top of the dashboard, so that I can immediately understand if the company is profitable.

#### Acceptance Criteria

1. THE Dashboard SHALL display three large Metric_Cards in the Profit_Overview_Section showing Total Revenue, Total Costs, and Net Profit/Loss
2. WHEN calculating Total Revenue, THE Dashboard SHALL sum all income from client entries
3. WHEN calculating Total Costs, THE Dashboard SHALL sum Crushers, Suppliers, Contractors, Employees, Administrative, Expenses, and Losses
4. WHEN calculating Net Profit, THE Dashboard SHALL subtract Total Costs from Total Revenue
5. WHEN Net Profit is positive, THE Dashboard SHALL display the value with a green Color_Indicator
6. WHEN Net Profit is negative, THE Dashboard SHALL display the value with a red Color_Indicator
7. THE Dashboard SHALL position the Profit_Overview_Section at the top of the interface above all other sections

### Requirement 2: Visualize Cost Distribution

**User Story:** As a business owner, I want to see where my money is going through a visual breakdown, so that I can identify the largest expense categories.

#### Acceptance Criteria

1. THE Dashboard SHALL display a pie chart in the Cost_Breakdown_Section showing cost distribution
2. THE Dashboard SHALL include these cost categories: Employees, Contractors, Crushers, Suppliers, Administrative, Expenses, Losses
3. THE Dashboard SHALL display a numeric list alongside the pie chart showing each category's value
4. THE Dashboard SHALL load Chart.js from CDN URL https://cdn.jsdelivr.net/npm/chart.js
5. WHEN Chart.js fails to load, THE Dashboard SHALL display the numeric list without the chart
6. THE Dashboard SHALL position the Cost_Breakdown_Section below the Profit_Overview_Section

### Requirement 3: Display Cash Flow Analysis

**User Story:** As a business owner, I want to see actual cash movement (money in vs money out), so that I can understand liquidity and cash position.

#### Acceptance Criteria

1. THE Dashboard SHALL display two columns in the Cash_Flow_Section: Money In and Money Out
2. WHEN calculating Money In, THE Dashboard SHALL sum Client Payments and positive Client Adjustments
3. WHEN calculating Money Out, THE Dashboard SHALL sum Supplier Payments, Crusher Payments, Contractor Payments, Employee Payments, Expenses, and Administrative Costs
4. THE Dashboard SHALL display Net Cash Flow calculated as Money In minus Money Out
5. WHEN Net Cash Flow is positive, THE Dashboard SHALL display it with a green Color_Indicator
6. WHEN Net Cash Flow is negative, THE Dashboard SHALL display it with a red Color_Indicator
7. THE Dashboard SHALL position the Cash_Flow_Section below the Cost_Breakdown_Section

### Requirement 4: Display Outstanding Balances

**User Story:** As a business owner, I want to see who owes us money and who we owe money to, so that I can manage receivables and payables.

#### Acceptance Criteria

1. THE Dashboard SHALL display two panels in the Outstanding_Balances_Section: "Money Owed To Us" and "Money We Owe"
2. WHEN displaying Money Owed To Us, THE Dashboard SHALL show outstanding client balances with a green Color_Indicator
3. WHEN displaying Money We Owe, THE Dashboard SHALL show outstanding balances for Suppliers, Crushers, Contractors, and Employees with a red Color_Indicator
4. THE Dashboard SHALL calculate Money Owed To Us as the sum of all positive client balances
5. THE Dashboard SHALL calculate Money We Owe as the sum of all negative balances across Suppliers, Crushers, Contractors, and Employees
6. THE Dashboard SHALL position the Outstanding_Balances_Section below the Cash_Flow_Section

### Requirement 5: Display Operational Metrics

**User Story:** As a business owner, I want to see counts of business entities (employees, clients, projects), so that I can understand operational scale.

#### Acceptance Criteria

1. THE Dashboard SHALL display Operational_Metrics_Section with cards showing: Total Employees, Total Clients, Total Crushers, Total Suppliers, Total Contractors, Total Projects, Total Entries
2. THE Dashboard SHALL position the Operational_Metrics_Section below all financial sections
3. THE Dashboard SHALL use neutral Color_Indicators for operational metrics
4. THE Dashboard SHALL display operational metrics in smaller cards than financial metrics

### Requirement 6: Fetch Financial Data

**User Story:** As a dashboard user, I want the system to automatically load financial data from the backend, so that I see current information without manual refresh.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Dashboard SHALL fetch data from the Financial_Metrics_API endpoint
2. WHEN the Financial_Metrics_API returns data, THE Dashboard SHALL populate all sections with the received metrics
3. WHEN the Financial_Metrics_API request fails, THE Dashboard SHALL display an error message to the user
4. THE Dashboard SHALL use the apiGet utility function from js/utils/index.js for API requests
5. THE Dashboard SHALL use the formatCurrency utility function to format all monetary values

### Requirement 7: Maintain Responsive Layout

**User Story:** As a dashboard user on any device, I want the dashboard to adapt to my screen size, so that I can view financial data on mobile, tablet, or desktop.

#### Acceptance Criteria

1. WHEN viewed on desktop screens, THE Dashboard SHALL display metrics in multi-column layouts
2. WHEN viewed on tablet screens, THE Dashboard SHALL adjust to two-column layouts
3. WHEN viewed on mobile screens, THE Dashboard SHALL display metrics in single-column layouts
4. THE Dashboard SHALL maintain readability of all text and numbers across all screen sizes
5. THE Dashboard SHALL ensure chart visualizations remain legible on small screens

### Requirement 8: Support RTL Layout

**User Story:** As an Arabic-speaking user, I want the dashboard to display in right-to-left layout, so that the interface matches my reading direction.

#### Acceptance Criteria

1. THE Dashboard SHALL apply RTL_Layout to all sections and components
2. THE Dashboard SHALL position section labels and values according to RTL conventions
3. THE Dashboard SHALL ensure chart legends and labels follow RTL direction
4. THE Dashboard SHALL maintain existing sidebar.css and modern-theme.css styling
5. THE Dashboard SHALL preserve the existing authentication flow

### Requirement 9: Apply Visual Hierarchy

**User Story:** As a business owner, I want the most important financial information to be visually prominent, so that I can quickly assess business health.

#### Acceptance Criteria

1. THE Dashboard SHALL display Profit_Overview_Section with larger cards than other sections
2. THE Dashboard SHALL use larger font sizes for primary metrics (Revenue, Costs, Net Profit) than secondary metrics
3. THE Dashboard SHALL separate sections with clear visual boundaries
4. THE Dashboard SHALL use icons to enhance metric recognition: money icons for financial data, user icons for people counts, truck icons for suppliers, factory icons for crushers
5. THE Dashboard SHALL maintain consistent card styling across all sections

### Requirement 10: Display Final Financial Result

**User Story:** As a business owner, I want to see a comprehensive final financial result that combines operating profit, expenses, and outstanding balances, so that I can understand the true financial state of the company in under 5 seconds.

#### Acceptance Criteria

1. THE Dashboard SHALL display a Final_Financial_Result_Card below the Profit_Overview_Section
2. WHEN calculating Net Operating Result, THE Dashboard SHALL subtract Operational Costs (Crushers, Suppliers, Contractors, Employees) from Total Revenue
3. WHEN calculating Total Expenses, THE Dashboard SHALL sum Administrative expenses, Office expenses, and Miscellaneous expenses
4. WHEN calculating Net Profit/Loss, THE Dashboard SHALL subtract Total Expenses from Net Operating Result
5. WHEN calculating Total Due, THE Dashboard SHALL subtract Total Client Payments from Total Revenue
6. WHEN calculating Profit/Loss Before Payment, THE Dashboard SHALL add Total Due to Net Profit/Loss
7. THE Dashboard SHALL display these metrics in the Final_Financial_Result_Card: Operating Result, Expenses, Net Profit/Loss, Outstanding Client Due, Profit Before Payment
8. WHEN Net Profit/Loss is positive, THE Dashboard SHALL display it with a green Color_Indicator
9. WHEN Net Profit/Loss is negative, THE Dashboard SHALL display it with a red Color_Indicator
10. WHEN Profit Before Payment is positive, THE Dashboard SHALL display it with a green Color_Indicator
11. WHEN Profit Before Payment is negative, THE Dashboard SHALL display it with a red Color_Indicator
12. THE Dashboard SHALL use neutral Color_Indicators for Operating Result and Outstanding Client Due
13. THE Dashboard SHALL position the Final_Financial_Result_Card below the Profit_Overview_Section and above the Cost_Breakdown_Section

### Requirement 11: Provide Business Insights

**User Story:** As a business owner, I want the dashboard design to help me answer key business questions, so that I can make informed decisions.

#### Acceptance Criteria

1. WHEN viewing the Profit_Overview_Section, THE Dashboard SHALL enable the user to answer "Are we making money?"
2. WHEN viewing the Cost_Breakdown_Section, THE Dashboard SHALL enable the user to answer "Which area costs the most money?"
3. WHEN viewing the Cash_Flow_Section, THE Dashboard SHALL enable the user to answer "How much cash actually moved?"
4. WHEN viewing the Outstanding_Balances_Section, THE Dashboard SHALL enable the user to answer "Are clients paying on time?" and "How much do we owe?"
5. WHEN viewing the Final_Financial_Result_Card, THE Dashboard SHALL enable the user to answer "Are we profitable?", "How much do clients owe us?", "Are expenses hurting profit?", and "What would profit be if all payments were received?" within 5 seconds
6. THE Dashboard SHALL prioritize financial clarity over decorative elements

