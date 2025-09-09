-- Smart Client Manager Database Schema
-- This file contains the complete database schema for Supabase

-- Enable necessary extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- Organizations table
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text default 'Asia/Kolkata',
  address text,
  phone text,
  email text,
  user_id uuid references auth.users(id) on delete cascade, -- 👈 Add user_id column
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Users table (extends Supabase auth.users)
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid references organizations(id) on delete cascade,
  email text,
  name text,
  role text default 'admin',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Clients table
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade not null,
  full_name text not null,
  age int,
  phone text,
  email text,
  package_id uuid references packages_catalog(id) on delete set null,
  status text default 'Active' check (status in ('Active', 'Inactive')),
  join_date date default current_date,
  address text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Packages catalog table
create table if not exists packages_catalog (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade not null,
  name text not null,
  duration_days int not null,
  price numeric(10,2),
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Client packages table (many-to-many relationship with additional data)
create table if not exists client_packages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  package_id uuid references packages_catalog(id) on delete cascade not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'active',
  price_paid numeric(10,2),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Ensure valid status values
  constraint valid_status check (status in ('upcoming', 'active', 'expiring_soon', 'expired', 'cancelled'))
);

-- Reminder events table
create table if not exists reminder_events (
  id uuid primary key default gen_random_uuid(),
  client_package_id uuid references client_packages(id) on delete cascade not null,
  reminder_type text not null, -- '3_days_before', 'on_expiry', '3_days_after'
  sent_at timestamptz,
  channel text default 'in_app', -- 'in_app', 'email', 'sms', 'whatsapp'
  status text default 'pending', -- 'pending', 'sent', 'failed'
  message text,
  created_at timestamptz default now(),
  
  -- Ensure valid reminder types
  constraint valid_reminder_type check (reminder_type in ('3_days_before', 'on_expiry', '3_days_after')),
  constraint valid_channel check (channel in ('in_app', 'email', 'sms', 'whatsapp')),
  constraint valid_reminder_status check (status in ('pending', 'sent', 'failed'))
);

-- Attendance logs table
create table if not exists attendance_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  checkin_at timestamptz default now(),
  method text default 'manual', -- 'manual', 'qr', 'biometric'
  notes text,
  created_at timestamptz default now(),
  
  -- Ensure valid methods
  constraint valid_method check (method in ('manual', 'qr', 'biometric'))
);

-- User preferences table
create table if not exists user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  email_reminders boolean default true,
  sms_reminders boolean default false,
  expiry_alerts boolean default true,
  new_client_alerts boolean default true,
  reminder_days_before int default 3,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Ensure unique preferences per user
  unique(user_id)
);

-- Create indexes for better performance
create index if not exists idx_clients_org_id on clients(org_id);
create index if not exists idx_clients_name on clients(name);
create index if not exists idx_clients_phone on clients(phone);
create index if not exists idx_clients_email on clients(email);

create index if not exists idx_packages_catalog_org_id on packages_catalog(org_id);
create index if not exists idx_packages_catalog_name on packages_catalog(name);

create index if not exists idx_client_packages_client_id on client_packages(client_id);
create index if not exists idx_client_packages_package_id on client_packages(package_id);
create index if not exists idx_client_packages_status on client_packages(status);
create index if not exists idx_client_packages_end_date on client_packages(end_date);

create index if not exists idx_reminder_events_client_package_id on reminder_events(client_package_id);
create index if not exists idx_reminder_events_status on reminder_events(status);

create index if not exists idx_attendance_logs_client_id on attendance_logs(client_id);
create index if not exists idx_attendance_logs_checkin_at on attendance_logs(checkin_at);

-- Create updated_at trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger update_organizations_updated_at before update on organizations
  for each row execute function update_updated_at_column();

create trigger update_users_updated_at before update on users
  for each row execute function update_updated_at_column();

create trigger update_clients_updated_at before update on clients
  for each row execute function update_updated_at_column();

create trigger update_packages_catalog_updated_at before update on packages_catalog
  for each row execute function update_updated_at_column();

create trigger update_client_packages_updated_at before update on client_packages
  for each row execute function update_updated_at_column();

create trigger update_user_preferences_updated_at before update on user_preferences
  for each row execute function update_updated_at_column();

-- Function to automatically update package status
create or replace function update_package_status()
returns trigger as $$
begin
  -- Update status based on dates
  if new.start_date > current_date then
    new.status = 'upcoming';
  elsif new.end_date < current_date then
    new.status = 'expired';
  elsif new.end_date <= current_date + interval '3 days' then
    new.status = 'expiring_soon';
  else
    new.status = 'active';
  end if;
  
  return new;
end;
$$ language plpgsql;

-- Create trigger for automatic status updates
create trigger update_client_package_status before insert or update on client_packages
  for each row execute function update_package_status();

-- Function to get dashboard statistics
create or replace function get_dashboard_stats(org_uuid uuid)
returns json as $$
declare
  result json;
begin
  select json_build_object(
    'total_clients', (
      select count(*) from clients where org_id = org_uuid
    ),
    'active_packages', (
      select count(*) 
      from client_packages cp
      join clients c on cp.client_id = c.id
      where c.org_id = org_uuid and cp.status = 'active'
    ),
    'expiring_packages', (
      select count(*) 
      from client_packages cp
      join clients c on cp.client_id = c.id
      where c.org_id = org_uuid and cp.status = 'expiring_soon'
    ),
    'expired_packages', (
      select count(*) 
      from client_packages cp
      join clients c on cp.client_id = c.id
      where c.org_id = org_uuid and cp.status = 'expired'
    ),
    'new_clients_this_month', (
      select count(*) 
      from clients 
      where org_id = org_uuid 
      and created_at >= date_trunc('month', current_date)
    )
  ) into result;
  
  return result;
end;
$$ language plpgsql security definer;

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
alter table organizations enable row level security;
alter table users enable row level security;
alter table clients enable row level security;
alter table packages_catalog enable row level security;
alter table client_packages enable row level security;
alter table reminder_events enable row level security;
alter table attendance_logs enable row level security;
alter table user_preferences enable row level security;

-- Organizations policies
create policy "Users can view their own organization" on organizations
  for select using (user_id = auth.uid());

create policy "Users can update their own organization" on organizations
  for update using (user_id = auth.uid());

create policy "Users can insert their own organization" on organizations
  for insert with check (user_id = auth.uid());

-- Users policies
create policy "Users can view users in their organization" on users
  for select using (
    org_id in (
      select org_id from users where id = auth.uid()
    )
  );

create policy "Users can update their own profile" on users
  for update using (id = auth.uid());

-- Clients policies
create policy "Users can manage clients in their organization" on clients
  for all using (
    org_id in (
      select org_id from users where id = auth.uid()
    )
  );

-- Packages catalog policies
create policy "Users can manage packages in their organization" on packages_catalog
  for all using (
    org_id in (
      select org_id from users where id = auth.uid()
    )
  );

-- Client packages policies
create policy "Users can manage client packages in their organization" on client_packages
  for all using (
    client_id in (
      select c.id from clients c
      join users u on c.org_id = u.org_id
      where u.id = auth.uid()
    )
  );

-- Reminder events policies
create policy "Users can manage reminders in their organization" on reminder_events
  for all using (
    client_package_id in (
      select cp.id from client_packages cp
      join clients c on cp.client_id = c.id
      join users u on c.org_id = u.org_id
      where u.id = auth.uid()
    )
  );

-- Attendance logs policies
create policy "Users can manage attendance in their organization" on attendance_logs
  for all using (
    client_id in (
      select c.id from clients c
      join users u on c.org_id = u.org_id
      where u.id = auth.uid()
    )
  );

-- User preferences policies
create policy "Users can manage their own preferences" on user_preferences
  for all using (user_id = auth.uid());

-- Insert sample data (optional - for testing)
-- Uncomment the following lines if you want sample data

/*
-- Sample organization
insert into organizations (id, name, timezone) values 
  ('550e8400-e29b-41d4-a716-446655440000', 'Demo Gym', 'Asia/Kolkata');

-- Sample user (you'll need to create this user in Supabase Auth first)
-- insert into users (id, org_id, email, name, role) values 
--   ('auth-user-id-here', '550e8400-e29b-41d4-a716-446655440000', 'admin@demo.com', 'Admin User', 'admin');

-- Sample packages
insert into packages_catalog (org_id, name, duration_days, price) values 
  ('550e8400-e29b-41d4-a716-446655440000', 'Monthly Membership', 30, 1000.00),
  ('550e8400-e29b-41d4-a716-446655440000', 'Quarterly Membership', 90, 2700.00),
  ('550e8400-e29b-41d4-a716-446655440000', 'Annual Membership', 365, 10000.00);

-- Sample clients
insert into clients (org_id, name, email, phone, address) values 
  ('550e8400-e29b-41d4-a716-446655440000', 'John Doe', 'john@example.com', '+91-9876543210', '123 Main St, City'),
  ('550e8400-e29b-41d4-a716-446655440000', 'Jane Smith', 'jane@example.com', '+91-9876543211', '456 Oak Ave, City');
*/