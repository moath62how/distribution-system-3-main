# Backend Scripts

This directory contains utility scripts for managing the application.

## Available Scripts

### create-tech-support-user.js

Creates a default tech support user with phone number authentication.

**Usage:**
```bash
node backend/scripts/create-tech-support-user.js
```

**Default Credentials:**
- Phone: +201234567890
- Password: techsupport123
- Role: tech_support

**Important:** Change the default password after first login for security.

## Notes

- All scripts require the MongoDB connection to be available
- Scripts use the `.env` file for configuration
- Scripts are idempotent - they check for existing data before creating
