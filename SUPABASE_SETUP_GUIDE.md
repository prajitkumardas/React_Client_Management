# Complete Supabase Integration Guide for Smart Client Manager

This guide will walk you through setting up Supabase from scratch and integrating it with your Smart Client Manager application.

## Step 1: Create a Supabase Account and Project

### 1.1 Sign Up for Supabase
1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"Sign Up"**
3. Sign up using:
   - GitHub account (recommended)
   - Google account
   - Or email/password

### 1.2 Create a New Project
1. After signing in, click **"New Project"**
2. Choose your organization (or create one if first time)
3. Fill in project details:
   - **Name**: `smart-client-manager` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your location
   - **Pricing Plan**: Start with "Free" plan
4. Click **"Create new project"**
5. Wait 2-3 minutes for project setup to complete

## Step 2: Get Your Project Credentials

### 2.1 Access Project Settings
1. In your Supabase dashboard, click on your project
2. Go to **Settings** (gear icon in left sidebar)
3. Click on **API** in the settings menu

### 2.2 Copy Required Credentials
You'll need these two values:
- **Project URL**: `https://your-project-id.supabase.co`
- **anon public key**: Long string starting with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

⚠️ **Important**: Copy the `anon public` key, NOT the `service_role` key (which should be kept secret)

## Step 3: Configure Environment Variables

### 3.1 Update .env.local File
1. Open your project in VS Code
2. Open the `.env.local` file in the root directory
3. Replace the placeholder values with your actual credentials:

```env
# Replace these with your actual Supabase credentials
VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

### 3.2 Example of Completed .env.local
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNjU0ODAwMCwiZXhwIjoxOTUyMTI0MDAwfQ.example-signature-here
```

## Step 4: Set Up the Database Schema

### 4.1 Access SQL Editor
1. In your Supabase dashboard, go to **SQL Editor** (in left sidebar)
2. Click **"New query"**

### 4.2 Run the Database Schema
1. Open the `database-schema.sql` file from your project
2. Copy ALL the content from this file
3. Paste it into the SQL Editor in Supabase
4. Click **"Run"** button (or press Ctrl+Enter)
5. Wait for the query to complete (should see "Success" message)

### 4.3 Verify Tables Were Created
1. Go to **Table Editor** in Supabase dashboard
2. You should see these tables:
   - `organizations`
   - `users`
   - `clients`
   - `packages_catalog`
   - `client_packages`
   - `reminder_events`
   - `attendance_logs`
   - `user_preferences`

## Step 5: Configure Authentication

### 5.1 Enable Email Authentication
1. Go to **Authentication** → **Settings** in Supabase dashboard
2. Under **Auth Providers**, ensure **Email** is enabled
3. Configure email settings:
   - **Enable email confirmations**: Turn OFF for development (turn ON for production)
   - **Enable email change confirmations**: Turn OFF for development
   - **Enable secure email change**: Turn OFF for development

### 5.2 Configure Site URL (Important!)
1. Still in **Authentication** → **Settings**
2. Under **Site URL**, add your development URL:
   - For development: `http://localhost:5174`
   - For production: Your actual domain
3. Under **Redirect URLs**, add:
   - `http://localhost:5174/**` (for development)
   - Your production URLs when deploying

## Step 6: Test the Integration

### 6.1 Restart Your Development Server
1. Stop the current dev server (Ctrl+C in terminal)
2. Start it again:
```bash
npm run dev
```

### 6.2 Verify the Application Loads
1. Open `http://localhost:5174` in your browser
2. You should now see the login/signup page instead of the configuration notice
3. If you still see the configuration notice, double-check your `.env.local` file

### 6.3 Test User Registration
1. Click **"Create your account"** or toggle to signup mode
2. Fill in:
   - **Organization Name**: Test Organization
   - **Email**: your-email@example.com
   - **Password**: test123456
3. Click **"Create account"**
4. You should be redirected to the dashboard

### 6.4 Verify Database Records
1. Go back to Supabase **Table Editor**
2. Check the `organizations` table - should have your test organization
3. Check the `users` table - should have your user record
4. Check **Authentication** → **Users** - should show your registered user

## Step 7: Test Core Functionality

### 7.1 Test Client Management
1. Go to **Clients** page in the app
2. Click **"Add Client"**
3. Fill in client details and save
4. Verify the client appears in the list
5. Check Supabase `clients` table to confirm data is saved

### 7.2 Test Package Management
1. Go to **Packages** page
2. Click **"Add Package"**
3. Create a test package (e.g., "Monthly Membership", 30 days, ₹1000)
4. Verify it appears in the packages list

### 7.3 Test Dashboard
1. Go to **Dashboard**
2. Should show your test data in the KPI cards
3. Should display recent clients

## Step 8: Enable Row Level Security (RLS) Verification

### 8.1 Check RLS is Working
1. In Supabase, go to **Authentication** → **Users**
2. Note your user ID
3. Go to **Table Editor** → **clients**
4. Your test client should have the correct `org_id`
5. Try creating another user account and verify they can't see the first user's data

## Step 9: Production Configuration (When Ready)

### 9.1 Update Authentication Settings
1. **Enable email confirmations**: Turn ON
2. **Enable email change confirmations**: Turn ON
3. **Enable secure email change**: Turn ON
4. Configure **SMTP settings** for email delivery

### 9.2 Update Site URLs
1. Replace localhost URLs with your production domain
2. Add proper redirect URLs for your deployed app

### 9.3 Environment Variables for Production
Create production environment variables:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Troubleshooting Common Issues

### Issue 1: "Invalid supabaseUrl" Error
**Solution**: 
- Check that your `.env.local` file has the correct URL format
- Ensure the URL starts with `https://` and ends with `.supabase.co`
- Restart your dev server after changing environment variables

### Issue 2: Authentication Not Working
**Solution**:
- Verify Site URL is set correctly in Supabase Auth settings
- Check that email confirmations are disabled for development
- Ensure redirect URLs include your localhost URL

### Issue 3: Database Connection Issues
**Solution**:
- Verify the database schema was run successfully
- Check that RLS policies are enabled
- Ensure your anon key has the correct permissions

### Issue 4: Tables Not Visible
**Solution**:
- Re-run the database schema from `database-schema.sql`
- Check the SQL Editor for any error messages
- Verify all tables were created in the Table Editor

### Issue 5: User Can't Access Data
**Solution**:
- Check that the user record was created in the `users` table
- Verify the `org_id` is correctly set
- Ensure RLS policies are working correctly

## Next Steps After Setup

1. **Add Sample Data**: Create some test clients and packages
2. **Test All Features**: Go through each page and test functionality
3. **Configure Exports**: Test Excel and PDF export features
4. **Set Up Reminders**: Configure notification preferences
5. **Test QR Check-in**: Try the attendance tracking features

## Support

If you encounter any issues:
1. Check the browser console for error messages
2. Verify your Supabase project is active and accessible
3. Ensure all environment variables are set correctly
4. Check that the database schema was applied successfully

Your Smart Client Manager application should now be fully integrated with Supabase and ready to use!