# Phone Number Login Setup

## Changes Made

### 1. User Model Updates
- Added `phone` field to User schema (unique, optional)
- Added `tech_support` role to the enum list
- Phone field is indexed and supports sparse indexing (allows null values)

### 2. Authentication Service Updates
- Modified `login()` method to accept phone number or username
- Updated to search for users by either username OR phone number
- Added tech support user to `createDefaultUsers()` method
- Default tech support credentials:
  - Username: الدعم_الفني
  - Phone: +201234567890
  - Password: techsupport123

### 3. Authentication Controller Updates
- Modified login endpoint to accept both `phone` and `username` parameters
- Uses phone if provided, falls back to username

### 4. Frontend Updates

#### login.html
- Added form ID for JavaScript handling
- Added error message display area
- Added loading state for login button
- Integrated with auth.js for authentication
- Added phone number input validation and formatting
- Form submits phone number to backend API

#### auth.js
- Added `tech_support` role to role display names mapping

### 5. Scripts
Created `backend/scripts/create-tech-support-user.js`:
- Standalone script to create tech support user
- Checks if user already exists before creating
- Provides clear output with credentials
- Can be run independently: `node backend/scripts/create-tech-support-user.js`

## Usage

### Login with Phone Number
1. Open the login page
2. Enter phone number in any of these formats:
   - `01xxxxxxxxx` (11 digits starting with 01)
   - `1xxxxxxxxx` (10 digits starting with 1)
   - `+201xxxxxxxxx` (13 characters with country code)
   - The system automatically normalizes all formats to +201xxxxxxxxx
3. Enter password
4. Select role (optional - for display purposes)
5. Click "تسجيل الدخول"

### Create Tech Support User
Run the script:
```bash
node backend/scripts/create-tech-support-user.js
```

Or the tech support user will be created automatically when the server starts (via `authService.createDefaultUsers()`).

### Default Users
After running the application, these users will be available:

1. **Manager**
   - Username: المدير
   - Password: manager123

2. **Accountant**
   - Username: المحاسب
   - Password: accountant123

3. **System Maintenance**
   - Username: صيانة_النظام
   - Password: maintenance123

4. **Tech Support** (NEW)
   - Phone: +201234567890
   - Can login with: `01234567890` or `1234567890` or `+201234567890`
   - Password: techsupport123
   - **Special Permissions**: Tech support has full access to all system features and bypasses all role restrictions

## Tech Support Role

The tech support role is a special administrative role with the following characteristics:

- **Full System Access**: Automatically granted access to all endpoints regardless of role requirements
- **Bypass Role Checks**: All `requireRole()` middleware checks automatically pass for tech support users
- **Historical Data Access**: Can modify historical data including prices (same as manager)
- **All Permissions**: Has all permissions that managers, accountants, and system maintenance have combined
- **Audit Logging**: All actions are logged in the audit trail with role `tech_support`

This role is designed for technical support staff who need unrestricted access to troubleshoot and fix issues.

## Phone Number Format

The login form accepts phone numbers in multiple formats and automatically normalizes them:

**Accepted Formats:**
- `01xxxxxxxxx` → Converted to `+201xxxxxxxxx`
- `1xxxxxxxxx` → Converted to `+201xxxxxxxxx`
- `+201xxxxxxxxx` → Used as is
- `201xxxxxxxxx` → Converted to `+201xxxxxxxxx`

**Examples:**
- User enters: `01234567890` → System uses: `+201234567890`
- User enters: `1234567890` → System uses: `+201234567890`
- User enters: `+201234567890` → System uses: `+201234567890`

## Security Notes

⚠️ **IMPORTANT**: Change all default passwords after first login!

## API Endpoint

**POST** `/api/auth/login`

Request body (phone number is normalized on the frontend):
```json
{
  "phone": "+201234567890",
  "password": "techsupport123"
}
```

Note: The frontend accepts multiple phone formats (01xxxxxxxxx, 1xxxxxxxxx, +201xxxxxxxxx) and normalizes them to +201xxxxxxxxx before sending to the API.

Or with username:
```json
{
  "username": "المدير",
  "password": "manager123"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt-token-here",
    "user": {
      "id": "user-id",
      "username": "username",
      "phone": "+201234567890",
      "role": "tech_support"
    }
  }
}
```
