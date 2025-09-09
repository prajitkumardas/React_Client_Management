-- ===========================================
-- FINAL DATABASE FIXES FOR SMART CLIENT MANAGER
-- ===========================================
-- Run this in Supabase SQL Editor to fix all remaining issues

-- ===========================================
-- 1. ENSURE PROPER RELATIONSHIPS
-- ===========================================

-- Make sure every user is linked to an organization
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE constraint_name = 'fk_org'
                   AND table_name = 'users') THEN
        ALTER TABLE users
        ADD CONSTRAINT fk_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Ensure org_id is NOT NULL for clients (only if not already set)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'clients'
               AND column_name = 'org_id'
               AND is_nullable = 'YES') THEN
        ALTER TABLE clients ALTER COLUMN org_id SET NOT NULL;
    END IF;
END $$;

-- Ensure org_id is NOT NULL for packages (only if not already set)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'packages_catalog'
               AND column_name = 'org_id'
               AND is_nullable = 'YES') THEN
        ALTER TABLE packages_catalog ALTER COLUMN org_id SET NOT NULL;
    END IF;
END $$;

-- ===========================================
-- 2. FIX RLS POLICIES
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Users can update their own organization" ON organizations;
DROP POLICY IF EXISTS "Users can view users in their organization" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can manage clients in their organization" ON clients;
DROP POLICY IF EXISTS "Users can manage packages in their organization" ON packages_catalog;
DROP POLICY IF EXISTS "Users can manage client packages in their organization" ON client_packages;
DROP POLICY IF EXISTS "Users can manage reminders in their organization" ON reminder_events;
DROP POLICY IF EXISTS "Users can manage attendance in their organization" ON attendance_logs;
DROP POLICY IF EXISTS "Users can manage their own preferences" ON user_preferences;

-- Drop the specific policies that might already exist from previous runs
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

-- Organization policies
CREATE POLICY "organizations_select_policy" ON organizations
  FOR SELECT USING (
    id IN (SELECT org_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "organizations_insert_policy" ON organizations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "organizations_update_policy" ON organizations
  FOR UPDATE USING (
    id IN (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- Users policies
CREATE POLICY "users_select_policy" ON users
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM users WHERE id = auth.uid()) OR id = auth.uid()
  );

CREATE POLICY "users_insert_policy" ON users
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "users_update_policy" ON users
  FOR UPDATE USING (id = auth.uid());

-- Clients policies
CREATE POLICY "clients_select_policy" ON clients
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "clients_insert_policy" ON clients
  FOR INSERT WITH CHECK (
    org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "clients_update_policy" ON clients
  FOR UPDATE USING (
    org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "clients_delete_policy" ON clients
  FOR DELETE USING (
    org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- Packages policies
CREATE POLICY "packages_select_policy" ON packages_catalog
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "packages_insert_policy" ON packages_catalog
  FOR INSERT WITH CHECK (
    org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "packages_update_policy" ON packages_catalog
  FOR UPDATE USING (
    org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "packages_delete_policy" ON packages_catalog
  FOR DELETE USING (
    org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
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

-- Attendance policies
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

-- Reminder policies
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
-- 3. IMPROVED DASHBOARD FUNCTION
-- ===========================================

CREATE OR REPLACE FUNCTION get_dashboard_stats(org_uuid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_clients', COALESCE((SELECT COUNT(*) FROM clients WHERE org_id = org_uuid), 0),
    'active_packages', COALESCE((
      SELECT COUNT(*) FROM client_packages cp
      JOIN clients c ON cp.client_id = c.id
      WHERE c.org_id = org_uuid AND cp.status = 'active'
    ), 0),
    'expiring_packages', COALESCE((
      SELECT COUNT(*) FROM client_packages cp
      JOIN clients c ON cp.client_id = c.id
      WHERE c.org_id = org_uuid AND cp.status = 'expiring_soon'
    ), 0),
    'expired_packages', COALESCE((
      SELECT COUNT(*) FROM client_packages cp
      JOIN clients c ON cp.client_id = c.id
      WHERE c.org_id = org_uuid AND cp.status = 'expired'
    ), 0),
    'new_clients_this_month', COALESCE((
      SELECT COUNT(*) FROM clients
      WHERE org_id = org_uuid
      AND created_at >= date_trunc('month', current_date)
    ), 0)
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_dashboard_stats(uuid) TO anon;
GRANT EXECUTE ON FUNCTION get_dashboard_stats(uuid) TO authenticated;

-- ===========================================
-- 4. IMPROVED SIGNUP FUNCTION
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
  -- Create organization
  INSERT INTO organizations (name)
  VALUES (org_name)
  RETURNING * INTO org_record;

  -- Create user record
  INSERT INTO users (id, email, org_id, role)
  VALUES (user_id, user_email, org_record.id, 'admin')
  RETURNING * INTO user_record;

  -- Return success
  RETURN json_build_object(
    'success', true,
    'organization', json_build_object(
      'id', org_record.id,
      'name', org_record.name,
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION handle_user_signup(uuid, text, text) TO anon;
GRANT EXECUTE ON FUNCTION handle_user_signup(uuid, text, text) TO authenticated;

-- ===========================================
-- 5. GRANT ALL NECESSARY PERMISSIONS
-- ===========================================

GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

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

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ===========================================
-- SUCCESS MESSAGE
-- ===========================================

SELECT 'Final database fixes applied successfully!' as status;