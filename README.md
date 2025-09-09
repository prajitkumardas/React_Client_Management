# Smart Client Manager

A comprehensive SaaS application for gyms, hostels, coaching centers, and similar organizations to manage clients, track memberships/packages, automate reminders, and provide quick insights into operations.

## Features

### MVP Features (v1.0)
- ✅ **Client Management**: Add/Edit/Delete client records with contact information
- ✅ **Package Management**: Define packages with duration and pricing
- ✅ **Dashboard & Insights**: KPI cards showing active clients, expiring packages, etc.
- ✅ **Auto-Status Updates**: Automatic package status updates (active, expiring, expired)
- ✅ **Data Export**: Export clients and packages to Excel/CSV, generate PDF reports
- ✅ **QR Check-in System**: QR code scanning and manual check-in for attendance
- ✅ **Authentication**: Secure login/signup with organization management
- 🔄 **Reminder System**: Foundation for automated notifications (in development)

### Tech Stack
- **Frontend**: React 19 + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Routing**: React Router DOM
- **State Management**: TanStack Query (React Query)
- **UI Components**: Lucide React icons
- **Exports**: xlsx (Excel), jsPDF (PDF)
- **QR Scanner**: react-qr-scanner

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smart-client-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Settings > API to get your project URL and anon key
   - Copy the database schema from `database-schema.sql` and run it in the Supabase SQL Editor

4. **Configure environment variables**
   - Copy `.env.local` and update with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   - Navigate to `http://localhost:5173`
   - Create an account to get started

## Database Setup

The application uses Supabase PostgreSQL with the following main tables:

- **organizations**: Organization/business information
- **users**: User accounts linked to organizations
- **clients**: Client/member records
- **packages_catalog**: Available packages/memberships
- **client_packages**: Client-package assignments with status tracking
- **attendance_logs**: Check-in records
- **reminder_events**: Notification tracking

### Setting up the Database

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `database-schema.sql`
4. Run the script to create all tables, indexes, and security policies

## Project Structure

```
src/
├── components/          # Reusable UI components
│   └── Layout.jsx      # Main app layout with navigation
├── contexts/           # React contexts
│   └── AuthContext.jsx # Authentication context
├── lib/               # Utility libraries
│   ├── supabase.js    # Supabase client and database helpers
│   └── utils.js       # Utility functions (date, export, validation)
├── pages/             # Page components
│   ├── Auth.jsx       # Login/signup page
│   ├── Dashboard.jsx  # Main dashboard with KPIs
│   ├── Clients.jsx    # Client management
│   ├── Packages.jsx   # Package management
│   ├── CheckIn.jsx    # QR check-in system
│   ├── Reports.jsx    # Reports and analytics
│   └── Settings.jsx   # Organization and user settings
└── App.jsx           # Main app component with routing
```

## Usage

### First Time Setup
1. Sign up with your email and organization name
2. Create your first package (e.g., "Monthly Membership", 30 days, ₹1000)
3. Add your first client with contact information
4. Assign packages to clients from the client management page

### Daily Operations
- **Dashboard**: View overview of active clients, expiring packages
- **Check-in**: Use QR scanner or manual entry for client attendance
- **Reports**: Export data and generate reports for analysis
- **Settings**: Manage organization details and preferences

## Key Features Explained

### Auto-Status Updates
Package statuses are automatically updated based on dates:
- **Upcoming**: Start date is in the future
- **Active**: Currently within the package period
- **Expiring Soon**: Within 3 days of expiry
- **Expired**: Past the end date

### Export Functionality
- **Excel Export**: Client lists, package catalogs, summary reports
- **PDF Reports**: Individual client reports with package history
- **Date Filtering**: Generate reports for specific time periods

### QR Check-in System
- Camera-based QR code scanning for quick check-ins
- Manual entry fallback with client search
- Attendance logging with timestamps and methods

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Adding New Features
1. Database changes: Update `database-schema.sql`
2. API functions: Add to `src/lib/supabase.js`
3. UI components: Create in `src/components/` or `src/pages/`
4. Routing: Update `src/App.jsx`

## Deployment

### Supabase + Vercel (Recommended)
1. Push your code to GitHub
2. Connect your Supabase project
3. Deploy to Vercel with environment variables
4. Configure custom domain if needed

### Environment Variables for Production
```env
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key
```

## Security

- Row Level Security (RLS) enabled on all tables
- Organization-based data isolation
- Secure authentication with Supabase Auth
- API keys and sensitive data in environment variables

## Future Roadmap

### Phase 2 Features
- WhatsApp/SMS reminder integration
- Bulk client import via CSV
- Advanced analytics and reporting
- Multi-user access with roles

### Phase 3 Features
- Payment integration (Razorpay/Stripe)
- Client portal for self-service
- Mobile app (React Native/PWA)
- AI-powered insights and recommendations

## Support

For issues and questions:
1. Check the database schema and ensure all tables are created
2. Verify environment variables are set correctly
3. Check browser console for any JavaScript errors
4. Ensure Supabase project is active and accessible

## License

This project is licensed under the MIT License.
