# Tech Support Admin Page

## Overview

A dedicated admin page for tech support users to manage the system, create users, and view audit logs.

## Access

- **URL**: `/tech-support-admin.html`
- **Required Role**: `tech_support` only
- **Authentication**: Required (redirects to login if not authenticated)
- **Authorization**: Automatically redirects non-tech-support users to dashboard

## Features

### 1. User Management Tab

#### Create New Users
- Add new users with username, phone (optional), password, and role
- Supported roles:
  - Manager (مدير)
  - Accountant (محاسب)
  - Tech Support (دعم فني)
  - System Maintenance (صيانة النظام)
- Phone number normalization (supports multiple formats)
- Password validation (minimum 8 characters)

#### View All Users
- Table display of all active users
- Shows:
  - Username
  - Phone number
  - Role (with color-coded badges)
  - Status (Active/Inactive)
  - Creation date
  - Action buttons

#### User Actions
- **Reset Password**: Change any user's password
- **Activate/Deactivate**: Toggle user account status
- Cannot delete manager accounts (safety feature)

### 2. Audit Logs Tab

#### View System Logs
- Comprehensive audit trail of all system activities
- Displays:
  - Timestamp
  - User who performed the action
  - User role
  - Action type (create, update, delete, login, etc.)
  - Entity type (Client, Supplier, User, etc.)
  - Description
  - IP address

#### Filter Options
- **Action Type**: Filter by operation (create, update, delete, login, etc.)
- **Entity Type**: Filter by entity (User, Client, Supplier, etc.)
- **Date Range**: Filter by date from/to
- Real-time filtering with search button

#### Export Functionality
- Export filtered logs to CSV format
- Includes Arabic headers for Excel compatibility
- Automatic filename with current date
- Limited to 10,000 records for performance

#### Pagination
- 20 logs per page
- Previous/Next navigation
- Page number buttons
- Shows total pages and current page

## API Endpoints Used

### User Management
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `POST /api/users/:id/reset-password` - Reset user password
- `PUT /api/users/:id/activate` - Activate user
- `PUT /api/users/:id/deactivate` - Deactivate user

### Audit Logs
- `GET /api/audit` - Get audit logs with pagination and filters
- `GET /api/audit/export` - Export audit logs to CSV

## Security Features

1. **Role-Based Access**: Only tech support users can access this page
2. **Authentication Check**: Redirects unauthenticated users to login
3. **Authorization Check**: Redirects unauthorized users to dashboard
4. **Audit Logging**: All user management actions are logged
5. **Password Validation**: Enforces minimum password length
6. **Manager Protection**: Cannot delete manager accounts

## UI Features

- **Modern Design**: Clean, professional interface with gradient headers
- **Responsive Layout**: Works on desktop and mobile devices
- **Tab Navigation**: Easy switching between user management and logs
- **Color-Coded Badges**: Visual distinction for roles and statuses
- **SweetAlert2 Integration**: Beautiful confirmation dialogs and alerts
- **Real-time Updates**: Tables refresh after actions

## Phone Number Handling

The page supports multiple phone number formats:
- `01xxxxxxxxx` → Normalized to `+201xxxxxxxxx`
- `1xxxxxxxxx` → Normalized to `+201xxxxxxxxx`
- `+201xxxxxxxxx` → Used as is
- `201xxxxxxxxx` → Normalized to `+201xxxxxxxxx`

## Usage Examples

### Creating a New User
1. Navigate to "إدارة المستخدمين" tab
2. Fill in the form:
   - Username: `محمد_أحمد`
   - Phone: `01234567890` (optional)
   - Password: `password123`
   - Role: Select from dropdown
3. Click "إضافة مستخدم"
4. Success message appears and user list refreshes

### Resetting a Password
1. Find the user in the table
2. Click "إعادة تعيين كلمة المرور"
3. Enter new password in the dialog
4. Click "تأكيد"
5. Success message confirms the change

### Viewing Audit Logs
1. Navigate to "سجلات النظام" tab
2. Optionally set filters:
   - Action type
   - Entity type
   - Date range
3. Click "بحث" to apply filters
4. View paginated results
5. Click "تصدير CSV" to download

### Exporting Logs
1. Set desired filters
2. Click "تصدير CSV"
3. File downloads automatically with name `audit-logs-YYYY-MM-DD.csv`
4. Open in Excel (Arabic text displays correctly)

## Navigation

The tech support admin page is accessible from the sidebar:
- Section: "الدعم الفني" (Tech Support)
- Link: "لوحة الدعم الفني" (Tech Support Dashboard)
- Only visible to users with `tech_support` role

## Technical Details

### Dependencies
- SweetAlert2 for dialogs
- Auth.js for authentication management
- Modern CSS with flexbox and grid
- Vanilla JavaScript (no framework required)

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- Responsive design for mobile devices

### Performance
- Pagination limits results to 20 per page
- Export limited to 10,000 records
- Efficient MongoDB queries with indexes
- Lazy loading of data on tab switch

## Troubleshooting

### Cannot Access Page
- Ensure you're logged in as tech support user
- Check that your role is exactly `tech_support`
- Clear browser cache and try again

### Users Not Loading
- Check browser console for errors
- Verify API endpoint is accessible
- Ensure authentication token is valid

### Export Not Working
- Check that filters are valid
- Ensure date format is correct
- Verify browser allows downloads

## Future Enhancements

Potential features for future versions:
- Bulk user operations
- Advanced log search
- User activity statistics
- Role permission editor
- Email notifications
- Two-factor authentication setup
