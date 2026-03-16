create table services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  name text not null,
  duration_minutes integer not null,
  price numeric,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  contact_id uuid references contacts(id),
  service_id uuid references services(id),
  staff_id uuid references staff(id),
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text default 'confirmed'
    check (status in ('pending','confirmed','cancelled','completed')),
  notes text,
  reminder_sent boolean default false,
  created_at timestamptz default now()
);

create table staff_schedules (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references staff(id),
  day_of_week integer check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null
);

create table blocked_times (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references staff(id),
  start_at timestamptz not null,
  end_at timestamptz not null,
  reason text
);
