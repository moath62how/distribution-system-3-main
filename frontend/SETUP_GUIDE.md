# InfraFinance Frontend - Setup Guide

## ✅ What Has Been Created

The complete React frontend has been implemented with the following structure:

### Core Files
- ✅ `package.json` - Dependencies and scripts
- ✅ `vite.config.js` - Vite build configuration
- ✅ `index.html` - HTML entry point
- ✅ `.env` - Environment variables
- ✅ `.env.example` - Environment template
- ✅ `.eslintrc.cjs` - ESLint configuration

### Source Files (`src/`)

#### Entry Points
- ✅ `main.jsx` - React entry point
- ✅ `App.jsx` - Main app with routing
- ✅ `index.css` - Global styles and design tokens

#### Context
- ✅ `context/AuthContext.jsx` - Authentication and user management

#### Layouts
- ✅ `layouts/ProtectedLayout.jsx` - Protected route wrapper
- ✅ `layouts/ProtectedLayout.css` - Layout styles

#### Components
- ✅ `components/Sidebar.jsx` - Navigation sidebar
- ✅ `components/Sidebar.css` - Sidebar styles
- ✅ `components/Loader.jsx` - Loading spinner
- ✅ `components/Loader.css` - Loader styles

#### Pages
- ✅ `pages/Login.jsx` - Login page
- ✅ `pages/Login.css` - Login styles
- ✅ `pages/Dashboard.jsx` - Dashboard with metrics
- ✅ `pages/Dashboard.css` - Dashboard styles
- ✅ `pages/Clients.jsx` - Clients listing
- ✅ `pages/Clients.css` - Clients styles
- ✅ `pages/ClientDetails.jsx` - Client details page
- ✅ `pages/ClientDetails.css` - Client details styles

#### Utilities
- ✅ `utils/api.js` - API client with caching and deduplication
- ✅ `utils/formatters.js` - Date, currency, and number formatters
- ✅ `utils/validation.js` - Form validation helpers
- ✅ `utils/imageCompressor.js` - Image compression utility

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd frontend
npm install
```

This will install:
- React 18.2.0
- React Router DOM 6.20.0
- SweetAlert2 11.10.0
- Vite 5.0.8
- And other dev dependencies

### Step 2: Configure Environment

The `.env` file is already created with:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

If your backend runs on a different port, update this value.

### Step 3: Start Development Server

```bash
npm run dev
```

The app will start at `http://localhost:3000`

### Step 4: Access the Application

Open your browser and navigate to `http://localhost:3000`

You should see the login page.

## 📋 Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint
npm run lint
```

## 🔐 Login

Use the credentials from your backend system. The login form accepts:
- Phone number (Egyptian format)
- Password
- Role selection (Manager, Accountant, Tech Support)

## 🎨 Features Implemented

### Authentication
- ✅ Login with phone number validation
- ✅ Role-based access control
- ✅ Token management
- ✅ Auto-redirect on 401

### Dashboard
- ✅ Financial metrics (receivables, payables)
- ✅ Profit/loss calculations
- ✅ Entity counts (clients, contractors, crushers, employees)
- ✅ Recent activity feed
- ✅ Quick action cards
- ✅ Auto-refresh functionality

### Clients Management
- ✅ Clients listing with grid layout
- ✅ Search functionality (debounced)
- ✅ Pagination
- ✅ Add new client modal
- ✅ Delete client with confirmation
- ✅ Balance status indicators

### Client Details
- ✅ Financial summary cards
- ✅ Material totals breakdown
- ✅ Deliveries table with filters
- ✅ Payments management with receipt upload
- ✅ Adjustments management
- ✅ PDF report generation
- ✅ Edit client information
- ✅ Image compression for receipts

### UI/UX
- ✅ RTL (Right-to-Left) layout
- ✅ Arabic language support
- ✅ Responsive design
- ✅ Material Symbols icons
- ✅ Cairo font
- ✅ Modern color scheme
- ✅ Smooth animations
- ✅ Loading states
- ✅ Error handling with SweetAlert2

## 🔧 Technical Details

### API Integration
- Smart caching for GET requests (5 seconds)
- Request deduplication
- Automatic token injection
- Throttling for submissions (300ms)
- Centralized error handling

### State Management
- React Context for authentication
- Local state with hooks
- Callback memoization for performance

### Styling Approach
- CSS custom properties (variables)
- BEM-inspired naming
- Mobile-first responsive design
- No CSS frameworks (custom implementation)

## 📁 Project Structure

```
frontend/
├── public/              # Static files
├── src/
│   ├── components/      # Reusable UI components
│   ├── context/         # React Context providers
│   ├── layouts/         # Page layouts
│   ├── pages/           # Route pages
│   ├── utils/           # Helper functions
│   ├── App.jsx          # Main app component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── .env                 # Environment variables
├── .eslintrc.cjs        # ESLint config
├── index.html           # HTML template
├── package.json         # Dependencies
├── vite.config.js       # Vite config
└── README.md            # Documentation
```

## 🐛 Troubleshooting

### Port Already in Use
If port 3000 is busy, Vite will automatically use the next available port (3001, 3002, etc.)

### API Connection Issues
1. Verify backend is running on `http://localhost:5000`
2. Check `.env` file has correct `VITE_API_BASE_URL`
3. Check browser console for CORS errors

### Build Errors
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Clear Vite cache: `rm -rf node_modules/.vite`

## 🔄 Next Steps

The following pages are placeholders and need implementation:
- Crushers management
- Suppliers management
- Contractors management
- Employees management
- Administration
- Projects
- Expenses
- New delivery entry

Follow the same pattern used for Clients pages to implement these features.

## 📝 Notes

- The frontend folder is excluded from git (added to `.gitignore`)
- All API calls use the centralized `api.js` utility
- Authentication state persists in localStorage
- Images are automatically compressed before upload
- All dates and numbers use Arabic locale formatting

## 🎯 Testing Checklist

- [ ] Login with valid credentials
- [ ] Navigate to Dashboard
- [ ] View clients list
- [ ] Search for a client
- [ ] Add new client
- [ ] View client details
- [ ] Add payment with receipt
- [ ] Add adjustment
- [ ] Generate PDF reports
- [ ] Logout

## 💡 Tips

1. Use React DevTools browser extension for debugging
2. Check Network tab for API calls
3. Use SweetAlert2 for all user notifications
4. Follow existing patterns for consistency
5. Test on mobile devices for responsive design

---

**Created:** May 20, 2026
**Status:** ✅ Ready for Development
