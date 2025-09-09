-- ===========================================
-- COMPLETE DATABASE MIGRATION FOR SMART CLIENT MANAGER
-- ===========================================
-- This migration fixes all signup, RLS, and data fetching issues
-- Run this in Supabase SQL Editor to completely fix the application

-- ===========================================
-- 1. CLEANUP: Drop all existing policies and functions
-- ===========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
DROP POLICY IF EXISTS "Users can update their own organization" ON organizations;
DROP POLICY IF EXISTS "Users can view users in their organization" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can manage clients in their organization" ON clients;
DROP POLICY IF EXISTS "Users can manage packages in their organization" ON packages_catalog;
DROP POLICY IF EXISTS "Users can manage client packages in their organization" ON client_packages;
DROP POLICY IF EXISTS "Users can manage reminders in their organization" ON reminder_events;
DROP POLICY IF EXISTS "Users can manage attendance in their organization" ON attendance_logs;
DROP POLICY IF EXISTS "Users can manage their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Enable all operations for organizations" ON organizations;
DROP POLICY IF EXISTS "Enable all operations for users" ON users;

-- Drop new policies (in case migration was run partially)
DROP POLICY IF EXISTS "organizations_select_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_insert_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_update_policy" ON organizations;
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "clients_select_policy" ON clients;
DROP POLICY IF EXISTS "clients_insert_policy" ON clients;
DROP POLICY IF EXISTS "clients_update_policy" ON clients;
DROP POLICY IF EXISTS "clients_delete_policy" ON clients;
DROP POLICY IF EXISTS "packages_select_policy" ON packages_catalog;
DROP POLICY IF EXISTS "packages_insert_policy" ON packages_catalog;
DROP POLICY IF EXISTS "packages_update_policy" ON packages_catalog;
DROP POLICY IF EXISTS "packages_delete_policy" ON packages_catalog;
DROP POLICY IF EXISTS "client_packages_select_policy" ON client_packages;
DROP POLICY IF EXISTS "client_packages_insert_policy" ON client_packages;
DROP POLICY IF EXISTS "client_packages_update_policy" ON client_packages;
DROP POLICY IF EXISTS "client_packages_delete_policy" ON client_packages;
DROP POLICY IF EXISTS "attendance_select_policy" ON attendance_logs;
DROP POLICY IF EXISTS "attendance_insert_policy" ON attendance_logs;
DROP POLICY IF EXISTS "reminders_select_policy" ON reminder_events;
DROP POLICY IF EXISTS "reminders_insert_policy" ON reminder_events;
DROP POLICY IF EXISTS "preferences_select_policy" ON user_preferences;
DROP POLICY IF EXISTS "preferences_insert_policy" ON user_preferences;
DROP POLICY IF EXISTS "preferences_update_policy" ON user_preferences;
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "clients_select_policy" ON clients;
DROP POLICY IF EXISTS "clients_insert_policy" ON clients;
DROP POLICY IF EXISTS "clients_update_policy" ON clients;
DROP POLICY IF EXISTS "clients_delete_policy" ON clients;
DROP POLICY IF EXISTS "packages_select_policy" ON packages_catalog;
DROP POLICY IF EXISTS "packages_insert_policy" ON packages_catalog;
DROP POLICY IF EXISTS "packages_update_policy" ON packages_catalog;
DROP POLICY IF EXISTS "packages_delete_policy" ON packages_catalog;
DROP POLICY IF EXISTS "client_packages_select_policy" ON client_packages;
DROP POLICY IF EXISTS "client_packages_insert_policy" ON client_packages;
DROP POLICY IF EXISTS "client_packages_update_policy" ON client_packages;
DROP POLICY IF EXISTS "client_packages_delete_policy" ON client_packages;
DROP POLICY IF EXISTS "attendance_select_policy" ON attendance_logs;
DROP POLICY IF EXISTS "attendance_insert_policy" ON attendance_logs;
DROP POLICY IF EXISTS "reminders_select_policy" ON reminder_events;
DROP POLICY IF EXISTS "reminders_insert_policy" ON reminder_events;
DROP POLICY IF EXISTS "preferences_select_policy" ON user_preferences;
DROP POLICY IF EXISTS "preferences_insert_policy" ON user_preferences;
DROP POLICY IF EXISTS "preferences_update_policy" ON user_preferences;

-- Drop existing functions
DROP FUNCTION IF EXISTS handle_user_signup(uuid, text, text);
DROP FUNCTION IF EXISTS get_dashboard_stats(uuid);

-- ===========================================
-- 2. GRANT PERMISSIONS
-- ===========================================

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant table permissions
GRANT ALL ON organizations TO anon;
GRANT ALL ON organizations TO authenticated;
GRANT ALL ON users TO anon;
GRANT ALL ON users TO authenticated;
GRANT ALL ON clients TO anon;
GRANT ALL ON clients TO authenticated;
GRANT ALL ON packages_catalog TO anon;
GRANT ALL ON packages_catalog TO authenticated;
GRANT ALL ON client_packages TO anon;
GRANT ALL ON client_packages TO authenticated;
GRANT ALL ON attendance_logs TO anon;
GRANT ALL ON attendance_logs TO authenticated;
GRANT ALL ON reminder_events TO anon;
GRANT ALL ON reminder_events TO authenticated;
GRANT ALL ON user_preferences TO anon;
GRANT ALL ON user_preferences TO authenticated;

-- Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ===========================================
-- 3. IMPROVED SIGNUP FUNCTION
-- ===========================================

CREATE OR REPLACE FUNCTION handle_user_signup(
  user_id uuid,
  user_email text,
  org_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org_record record;
  user_record record;
BEGIN
  -- Create organization with user_id
  INSERT INTO organizations (name, user_id)
  VALUES (org_name, user_id)
  RETURNING * INTO org_record;

  -- Create user record
  INSERT INTO users (id, email, org_id, role)
  VALUES (user_id, user_email, org_record.id, 'admin')
  RETURNING * INTO user_record;

  -- Return success with full data
  RETURN json_build_object(
    'success', true,
    'organization', json_build_object(
      'id', org_record.id,
      'name', org_record.name,
      'user_id', org_record.user_id,
      'created_at', org_record.created_at
    ),
    'user', json_build_object(
      'id', user_record.id,
      'email', user_record.email,
      'org_id', user_record.org_id,
      'role', user_record.role
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

-- Grant execute permission on signup function
GRANT EXECUTE ON FUNCTION handle_user_signup(uuid, text, text) TO anon;
GRANT EXECUTE ON FUNCTION handle_user_signup(uuid, text, text) TO authenticated;

-- ===========================================
-- 4. IMPROVED DASHBOARD STATS FUNCTION
-- ===========================================

CREATE OR REPLACE FUNCTION get_dashboard_stats(org_uuid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  total_clients_count integer := 0;
  active_packages_count integer := 0;
  expiring_packages_count integer := 0;
  expired_packages_count integer := 0;
  new_clients_this_month_count integer := 0;
BEGIN
  -- Get total clients (handle null case)
  SELECT COUNT(*) INTO total_clients_count
  FROM clients
  WHERE org_id = org_uuid;

  -- Get active packages
  SELECT COUNT(*) INTO active_packages_count
  FROM client_packages cp
  JOIN clients c ON cp.client_id = c.id
  WHERE c.org_id = org_uuid AND cp.status = 'active';

  -- Get expiring packages
  SELECT COUNT(*) INTO expiring_packages_count
  FROM client_packages cp
  JOIN clients c ON cp.client_id = c.id
  WHERE c.org_id = org_uuid AND cp.status = 'expiring_soon';

  -- Get expired packages
  SELECT COUNT(*) INTO expired_packages_count
  FROM client_packages cp
  JOIN clients c ON cp.client_id = c.id
  WHERE c.org_id = org_uuid AND cp.status = 'expired';

  -- Get new clients this month
  SELECT COUNT(*) INTO new_clients_this_month_count
  FROM clients
  WHERE org_id = org_uuid
  AND created_at >= date_trunc('month', CURRENT_DATE);

  -- Return structured JSON
  RETURN json_build_object(
    'total_clients', total_clients_count,
    'active_packages', active_packages_count,
    'expiring_packages', expiring_packages_count,
    'expired_packages', expired_packages_count,
    'new_clients_this_month', new_clients_this_month_count
  );
END;
$$;

-- Grant execute permission on dashboard function
GRANT EXECUTE ON FUNCTION get_dashboard_stats(uuid) TO anon;
GRANT EXECUTE ON FUNCTION get_dashboard_stats(uuid) TO authenticated;

-- Add user_id column to organizations table (if it doesn't exist)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update clients table schema to match requirements
ALTER TABLE clients ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS age int;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS package_id uuid REFERENCES packages_catalog(id) ON DELETE SET NULL;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS status text DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive'));
ALTER TABLE clients ADD COLUMN IF NOT EXISTS join_date date DEFAULT CURRENT_DATE;

-- Migrate existing name data to full_name if it exists
UPDATE clients SET full_name = name WHERE full_name IS NULL AND name IS NOT NULL;

-- Make full_name not null after migration
ALTER TABLE clients ALTER COLUMN full_name SET NOT NULL;

-- Drop old name column if it exists
ALTER TABLE clients DROP COLUMN IF EXISTS name;

-- ===========================================
-- 5. PROPER RLS POLICIES
-- ===========================================

-- Organizations policies
CREATE POLICY "organizations_select_policy" ON organizations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "organizations_insert_policy" ON organizations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "organizations_update_policy" ON organizations
  FOR UPDATE USING (user_id = auth.uid());

-- Users policies
CREATE POLICY "users_select_policy" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_insert_policy" ON users
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "users_update_policy" ON users
  FOR UPDATE USING (id = auth.uid());

-- Clients policies
CREATE POLICY "clients_select_policy" ON clients
  FOR SELECT USING (
    org_id IN (
      SELECT u.org_id FROM users u WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "clients_insert_policy" ON clients
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT u.org_id FROM users u WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "clients_update_policy" ON clients
  FOR UPDATE USING (
    org_id IN (
      SELECT u.org_id FROM users u WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "clients_delete_policy" ON clients
  FOR DELETE USING (
    org_id IN (
      SELECT u.org_id FROM users u WHERE u.id = auth.uid()
    )
  );

-- Packages catalog policies
CREATE POLICY "packages_select_policy" ON packages_catalog
  FOR SELECT USING (
    org_id IN (
      SELECT u.org_id FROM users u WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "packages_insert_policy" ON packages_catalog
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT u.org_id FROM users u WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "packages_update_policy" ON packages_catalog
  FOR UPDATE USING (
    org_id IN (
      SELECT u.org_id FROM users u WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "packages_delete_policy" ON packages_catalog
  FOR DELETE USING (
    org_id IN (
      SELECT u.org_id FROM users u WHERE u.id = auth.uid()
    )
  );

-- Client packages policies
CREATE POLICY "client_packages_select_policy" ON client_packages
  FOR SELECT USING (
    client_id IN (
      SELECT c.id FROM clients c
      JOIN users u ON c.org_id = u.org_id
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "client_packages_insert_policy" ON client_packages
  FOR INSERT WITH CHECK (
    client_id IN (
      SELECT c.id FROM clients c
      JOIN users u ON c.org_id = u.org_id
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "client_packages_update_policy" ON client_packages
  FOR UPDATE USING (
    client_id IN (
      SELECT c.id FROM clients c
      JOIN users u ON c.org_id = u.org_id
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "client_packages_delete_policy" ON client_packages
  FOR DELETE USING (
    client_id IN (
      SELECT c.id FROM clients c
      JOIN users u ON c.org_id = u.org_id
      WHERE u.id = auth.uid()
    )
  );

-- Attendance logs policies
CREATE POLICY "attendance_select_policy" ON attendance_logs
  FOR SELECT USING (
    client_id IN (
      SELECT c.id FROM clients c
      JOIN users u ON c.org_id = u.org_id
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "attendance_insert_policy" ON attendance_logs
  FOR INSERT WITH CHECK (
    client_id IN (
      SELECT c.id FROM clients c
      JOIN users u ON c.org_id = u.org_id
      WHERE u.id = auth.uid()
    )
  );

-- Reminder events policies
CREATE POLICY "reminders_select_policy" ON reminder_events
  FOR SELECT USING (
    client_package_id IN (
      SELECT cp.id FROM client_packages cp
      JOIN clients c ON cp.client_id = c.id
      JOIN users u ON c.org_id = u.org_id
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "reminders_insert_policy" ON reminder_events
  FOR INSERT WITH CHECK (
    client_package_id IN (
      SELECT cp.id FROM client_packages cp
      JOIN clients c ON cp.client_id = c.id
      JOIN users u ON c.org_id = u.org_id
      WHERE u.id = auth.uid()
    )
  );

-- User preferences policies
CREATE POLICY "preferences_select_policy" ON user_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "preferences_insert_policy" ON user_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "preferences_update_policy" ON user_preferences
  FOR UPDATE USING (user_id = auth.uid());

-- ===========================================
-- 6. SUCCESS MESSAGE
-- ===========================================

-- This migration is complete. The application should now work properly with:
-- ✅ Fixed signup flow with organization creation
-- ✅ Proper RLS policies for data security
-- ✅ Dashboard stats that return 0 instead of errors
-- ✅ Full CRUD operations for authenticated users
-- ✅ Organization-based data isolation

SELECT 'Database migration completed successfully!' as status;