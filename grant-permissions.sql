-- Grant necessary permissions for the anon role
-- Run this in Supabase SQL Editor

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant permissions on tables
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

-- Grant execute permission on functions
GRANT EXECUTE ON FUNCTION handle_user_signup(uuid, text, text) TO anon;
GRANT EXECUTE ON FUNCTION handle_user_signup(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_stats(uuid) TO anon;
GRANT EXECUTE ON FUNCTION get_dashboard_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION update_package_status() TO anon;
GRANT EXECUTE ON FUNCTION update_package_status() TO authenticated;

-- Grant permissions on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;