# Requirements Document

## Introduction

This document specifies the requirements for integrating missing features into the main dashboard (backend/public/index.html). The system currently displays information for Clients, Contractors, Crushers, Expenses, and Deliveries. However, four additional features exist in the API but are not fully represented on the dashboard: Employees (employee management and payroll), Administration (administrative payments and capital tracking), Projects (project management), and Suppliers (supplier management and payments). This enhancement will provide complete visibility into all system entities and their financial metrics on the main dashboard.

Note: Navigation to these sections is already available through the sidebar. This integration focuses on displaying financial metrics, statistics, and recent activity for these entities on the dashboard overview.

## Glossary

- **Dashboard**: The main landing page (backend/public/index.html) that displays system overview and quick access to features
- **Financial_Overview**: The top section of the dashboard displaying aggregate financial metrics
- **Stats_Grid**: A grid layout displaying count-based statistics for various entities
- **Recent_Activity**: A section displaying recent transactions or changes for various entities
- **Employee_System**: The employee management and payroll tracking feature
- **Administration_System**: The administrative payments and capital injection tracking feature
- **Project_System**: The project management feature
- **Supplier_System**: The supplier management and payment tracking feature
- **Metrics_API**: The /api/metrics endpoint that provides aggregated financial and statistical data
- **Entity**: A business object in the system (Client, Contractor, Crusher, Employee, Administration, Project, or Supplier)

## Requirements

### Requirement 1: Display Employee Financial Metrics

**User Story:** As a manager, I want to see employee-related financial metrics in the financial overview section, so that I can understand employee costs at a glance.

#### Acceptance Criteria

1. THE Financial_Overview SHALL display total earned salary from the Metrics_API
2. THE Financial_Overview SHALL display total employee payments from the Metrics_API
3. THE Financial_Overview SHALL display net employee costs from the Metrics_API
4. THE Financial_Overview SHALL format all employee financial values using the formatCurrency function
5. THE Financial_Overview SHALL display employee cost metrics with appropriate Arabic labels

### Requirement 2: Display Administration Financial Metrics

**User Story:** As a manager, I want to see administration-related financial metrics in the financial overview section, so that I can track administrative costs and capital.

#### Acceptance Criteria

1. THE Financial_Overview SHALL display total administration costs from the Metrics_API
2. THE Financial_Overview SHALL display total capital injected from the Metrics_API
3. THE Financial_Overview SHALL format all administration financial values using the formatCurrency function
4. THE Financial_Overview SHALL display administration metrics with appropriate Arabic labels

### Requirement 3: Display Entity Count Statistics

**User Story:** As a system user, I want to see count statistics for all entities including employees, administration, projects, and suppliers, so that I can understand the system scale.

#### Acceptance Criteria

1. THE Stats_Grid SHALL display the total count of employees from the Metrics_API
2. THE Stats_Grid SHALL display the total count of administration entities from the Metrics_API
3. THE Stats_Grid SHALL display the total count of projects from the Metrics_API
4. THE Stats_Grid SHALL display the total count of suppliers from the Metrics_API
5. THE Stats_Grid SHALL display each count with an appropriate Arabic label
6. THE Stats_Grid SHALL maintain consistent styling with existing stat cards

### Requirement 4: Display Employee Balance Statistics

**User Story:** As a manager, I want to see employee balance statistics in the stats grid, so that I can quickly identify outstanding employee payments.

#### Acceptance Criteria

1. THE Stats_Grid SHALL display the total amount owed to employees
2. THE Stats_Grid SHALL calculate employee balances from actual employee data
3. THE Stats_Grid SHALL display negative balances (amounts owed to employees) with danger styling (red color)
4. THE Stats_Grid SHALL format employee balance values using the formatCurrency function
5. THE Stats_Grid SHALL use the Arabic label "مستحقات الموظفين" (Employee Dues)

### Requirement 5: Display Supplier Balance Statistics

**User Story:** As a manager, I want to see supplier balance statistics in the stats grid, so that I can quickly identify outstanding supplier payments.

#### Acceptance Criteria

1. THE Stats_Grid SHALL display the total amount owed to suppliers
2. THE Stats_Grid SHALL calculate supplier balances from actual supplier data
3. THE Stats_Grid SHALL display amounts owed to suppliers with danger styling (red color)
4. THE Stats_Grid SHALL format supplier balance values using the formatCurrency function
5. THE Stats_Grid SHALL use the Arabic label "مستحقات الموردين" (Supplier Dues)

### Requirement 6: Display Recent Employee Activity

**User Story:** As a system user, I want to see recent employee activity in the recent activity section, so that I can stay informed about employee-related changes.

#### Acceptance Criteria

1. THE Recent_Activity SHALL fetch recent employee data from the /api/employees endpoint
2. THE Recent_Activity SHALL display up to 3 recent employee records
3. THE Recent_Activity SHALL display each employee's name with the prefix "موظف:" (Employee:)
4. THE Recent_Activity SHALL display each employee's balance or status information
5. THE Recent_Activity SHALL use an appropriate icon (👨‍💼 or 👤) for employee activity items
6. THE Recent_Activity SHALL format employee activity timestamps using the formatDate function

### Requirement 7: Display Recent Administration Activity

**User Story:** As a system user, I want to see recent administration activity in the recent activity section, so that I can stay informed about administrative transactions.

#### Acceptance Criteria

1. THE Recent_Activity SHALL fetch recent administration data from the /api/administration endpoint
2. THE Recent_Activity SHALL display up to 2 recent administration records
3. THE Recent_Activity SHALL display each administration entity's name with the prefix "إدارة:" (Administration:)
4. THE Recent_Activity SHALL display relevant financial information for each administration record
5. THE Recent_Activity SHALL use an appropriate icon (🏢 or 📊) for administration activity items
6. THE Recent_Activity SHALL format administration activity timestamps using the formatDate function

### Requirement 8: Display Recent Project Activity

**User Story:** As a system user, I want to see recent project activity in the recent activity section, so that I can stay informed about project changes.

#### Acceptance Criteria

1. THE Recent_Activity SHALL fetch recent project data from the /api/projects endpoint
2. THE Recent_Activity SHALL display up to 2 recent project records
3. THE Recent_Activity SHALL display each project's name with the prefix "مشروع:" (Project:)
4. THE Recent_Activity SHALL display relevant project information
5. THE Recent_Activity SHALL use an appropriate icon (📁 or 🏗️) for project activity items
6. THE Recent_Activity SHALL format project activity timestamps using the formatDate function

### Requirement 9: Display Recent Supplier Activity

**User Story:** As a system user, I want to see recent supplier activity in the recent activity section, so that I can stay informed about supplier-related changes.

#### Acceptance Criteria

1. THE Recent_Activity SHALL fetch recent supplier data from the /api/suppliers endpoint
2. THE Recent_Activity SHALL display up to 2 recent supplier records
3. THE Recent_Activity SHALL display each supplier's name with the prefix "مورد:" (Supplier:)
4. THE Recent_Activity SHALL display each supplier's balance information
5. THE Recent_Activity SHALL use an appropriate icon (🚚 or 📦) for supplier activity items
6. THE Recent_Activity SHALL format supplier activity timestamps using the formatDate function

### Requirement 10: Maintain Consistent Dashboard Layout

**User Story:** As a system user, I want the new dashboard elements to match the existing design, so that the interface remains consistent and familiar.

#### Acceptance Criteria

1. THE Dashboard SHALL maintain the existing grid layout for dashboard sections
2. THE Dashboard SHALL use the existing CSS classes and styling variables
3. THE Dashboard SHALL maintain responsive behavior on mobile devices
4. THE Dashboard SHALL preserve the existing color scheme and typography
5. THE Dashboard SHALL maintain the existing card hover effects and transitions

### Requirement 11: Handle API Errors Gracefully

**User Story:** As a system user, I want to see appropriate error messages when data fails to load, so that I understand when issues occur.

#### Acceptance Criteria

1. WHEN the Metrics_API request fails, THE Dashboard SHALL display an error message in the Financial_Overview section
2. WHEN entity data requests fail, THE Dashboard SHALL display error messages in the affected sections
3. THE Dashboard SHALL log all API errors to the browser console for debugging
4. THE Dashboard SHALL continue to display successfully loaded sections even if other sections fail
5. THE Dashboard SHALL use Arabic error messages consistent with the existing interface

### Requirement 12: Preserve Auto-Refresh Functionality

**User Story:** As a system user, I want the dashboard to automatically refresh all data including new sections, so that I always see current information.

#### Acceptance Criteria

1. THE Dashboard SHALL refresh all entity data every 30 seconds
2. THE Dashboard SHALL include new entity data in the auto-refresh cycle
3. THE Dashboard SHALL update the "last updated" timestamp after each refresh
4. WHEN the page becomes hidden, THE Dashboard SHALL stop auto-refresh
5. WHEN the page becomes visible again, THE Dashboard SHALL resume auto-refresh

### Requirement 13: Optimize API Request Performance

**User Story:** As a system user, I want the dashboard to load quickly, so that I can access information without delays.

#### Acceptance Criteria

1. THE Dashboard SHALL fetch all entity data in parallel using Promise.all
2. THE Dashboard SHALL limit entity list requests to recent records only
3. THE Dashboard SHALL use the existing apiGet utility function for all API requests
4. THE Dashboard SHALL display loading indicators while data is being fetched
5. THE Dashboard SHALL cache the Metrics_API response for the duration of the refresh interval
