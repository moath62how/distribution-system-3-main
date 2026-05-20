# InfraFinance Frontend

React-based frontend for the InfraFinance distribution management system.

## Setup Instructions

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

Create a `.env` file in the frontend directory:

```bash
cp .env.example .env
```

Edit `.env` and set your API URL:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
```

The production build will be in the `dist` folder.

## Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable components (Sidebar, Loader)
│   ├── context/          # React Context (AuthContext)
│   ├── layouts/          # Layout components (ProtectedLayout)
│   ├── pages/            # Page components (Login, Dashboard, Clients, etc.)
│   ├── utils/            # Utility functions (api, formatters, validation)
│   ├── App.jsx           # Main app component with routing
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── index.html            # HTML template
├── package.json          # Dependencies
└── vite.config.js        # Vite configuration
```

## Features Implemented

### First Iteration
- ✅ Authentication (Login with phone number)
- ✅ Dashboard with metrics and statistics
- ✅ User role management
- ✅ Sidebar navigation
- ✅ Protected routes

### Second Iteration
- ✅ Clients listing page with search and pagination
- ✅ Client details page with:
  - Financial summary
  - Material totals
  - Deliveries table with filters
  - Payments management
  - Adjustments management
  - PDF report generation

## Technologies Used

- **React 18** - UI library
- **React Router v6** - Routing
- **Vite** - Build tool
- **SweetAlert2** - Beautiful alerts
- **CSS Variables** - Theming
- **Material Symbols** - Icons

## API Integration

The frontend communicates with the backend API using the custom `api.js` utility which includes:
- Request deduplication
- Response caching (GET requests)
- Automatic token injection
- Error handling
- 401 redirect to login

## Styling

The application uses a custom CSS design system with:
- RTL (Right-to-Left) layout for Arabic
- CSS custom properties for theming
- Responsive design
- Cairo font family
- Material Design inspired components

## Default Login Credentials

Check with your backend administrator for login credentials.

## Notes

- The frontend folder is excluded from git (added to .gitignore)
- Make sure the backend API is running before starting the frontend
- The application requires a modern browser with ES6+ support
