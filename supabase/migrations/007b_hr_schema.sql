-- Osobní a pracovní profil zaměstnance
create table public.employee_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  birth_date date,
  phone text,
  personal_email text,
  address text,
  city text,
  postal_code text,
  marital_status text,
  education text,
  emergency_contact_name text,
  emergency_contact_phone text,
  bank_account text,
  position_title text,
  department text,
  crew_name text,
  hire_date date,
  employment_type text,
  contract_type text,
  supervisor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vacation_balances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year int not null,
  days_entitled int not null,
  days_used int not null default 0,
  days_remaining int generated always as (days_entitled - days_used) stored,
  unique (user_id, year)
);

create table public.payslips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period text not null,
  gross_salary numeric(10,2) not null,
  net_salary numeric(10,2) not null,
  bonuses numeric(10,2) default 0,
  deductions numeric(10,2) default 0,
  issued_at date not null default current_date,
  created_at timestamptz not null default now()
);

create table public.benefits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  value_czk numeric(10,2),
  description text
);

create table public.business_trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  destination text not null,
  purpose text,
  start_date date not null,
  end_date date not null,
  status text not null default 'planovana' check (status in ('planovana', 'probiha', 'dokoncena'))
);

create table public.work_orders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client text,
  status text not null default 'planovana' check (status in ('planovana', 'probiha', 'hotovo')),
  assigned_to uuid references auth.users(id) on delete set null,
  start_date date,
  end_date date,
  notes text
);

create table public.work_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  work_date date not null default current_date,
  description text not null,
  hours numeric(4,1),
  status text not null default 'odvedeno' check (status in ('odvedeno', 'chybi', 'nedokonceno')),
  logged_at timestamptz not null default now()
);

create table public.warehouse_items (
  id uuid primary key default gen_random_uuid(),
  item_name text not null,
  quantity numeric(10,2) not null default 0,
  unit text not null default 'ks',
  location text,
  updated_at timestamptz not null default now()
);

create index employee_profiles_supervisor_idx on public.employee_profiles (supervisor_id);
create index vacation_balances_user_idx on public.vacation_balances (user_id);
create index payslips_user_idx on public.payslips (user_id);
create index benefits_user_idx on public.benefits (user_id);
create index business_trips_user_idx on public.business_trips (user_id);
create index work_orders_assigned_idx on public.work_orders (assigned_to);
create index work_logs_user_idx on public.work_logs (user_id);

-- Kdo může vidět záznamy dané osoby: sám sebe, ředitel vždy, manažer všechny řadové
-- (mistr + zaměstnanec), mistr jen svou přímou směnu (supervisor_id = mistr)
create or replace function public.can_view_employee(_target uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select
    auth.uid() = _target
    or public.has_role(auth.uid(), 'hr_admin')
    or (
      public.has_role(auth.uid(), 'manazer')
      and exists (
        select 1 from public.user_roles ur
        where ur.user_id = _target and ur.role in ('mistr', 'zamestnanec')
      )
    )
    or (
      public.has_role(auth.uid(), 'mistr')
      and exists (
        select 1 from public.employee_profiles ep
        where ep.user_id = _target and ep.supervisor_id = auth.uid()
      )
    )
$$;

grant execute on function public.can_view_employee to authenticated;

alter table public.employee_profiles enable row level security;
alter table public.vacation_balances enable row level security;
alter table public.payslips enable row level security;
alter table public.benefits enable row level security;
alter table public.business_trips enable row level security;
alter table public.work_orders enable row level security;
alter table public.work_logs enable row level security;
alter table public.warehouse_items enable row level security;

grant select, insert, update, delete on public.employee_profiles to authenticated;
grant select, insert, update, delete on public.vacation_balances to authenticated;
grant select, insert, update, delete on public.payslips to authenticated;
grant select, insert, update, delete on public.benefits to authenticated;
grant select, insert, update, delete on public.business_trips to authenticated;
grant select, insert, update, delete on public.work_orders to authenticated;
grant select, insert on public.work_logs to authenticated;
grant select, insert, update, delete on public.warehouse_items to authenticated;

create policy "Vidi profil podle can_view_employee" on public.employee_profiles
  for select using (public.can_view_employee(user_id));
create policy "Reditel spravuje profily" on public.employee_profiles
  for all using (public.has_role(auth.uid(), 'hr_admin'));

create policy "Vidi dovolenou podle can_view_employee" on public.vacation_balances
  for select using (public.can_view_employee(user_id));
create policy "Reditel spravuje dovolenou" on public.vacation_balances
  for all using (public.has_role(auth.uid(), 'hr_admin'));

create policy "Vidi mzdy podle can_view_employee" on public.payslips
  for select using (public.can_view_employee(user_id));
create policy "Reditel spravuje mzdy" on public.payslips
  for all using (public.has_role(auth.uid(), 'hr_admin'));

create policy "Vidi benefity podle can_view_employee" on public.benefits
  for select using (public.can_view_employee(user_id));
create policy "Reditel spravuje benefity" on public.benefits
  for all using (public.has_role(auth.uid(), 'hr_admin'));

create policy "Vidi cesty podle can_view_employee" on public.business_trips
  for select using (public.can_view_employee(user_id));
create policy "Reditel spravuje cesty" on public.business_trips
  for all using (public.has_role(auth.uid(), 'hr_admin'));

create policy "Vidi zakazky" on public.work_orders
  for select using (
    public.has_role(auth.uid(), 'hr_admin')
    or public.has_role(auth.uid(), 'manazer')
    or public.has_role(auth.uid(), 'mistr')
    or assigned_to = auth.uid()
  );
create policy "Reditel spravuje zakazky" on public.work_orders
  for all using (public.has_role(auth.uid(), 'hr_admin'));

create policy "Vidi dochazku podle can_view_employee" on public.work_logs
  for select using (public.can_view_employee(user_id));
create policy "Zapisuje vlastni dochazku" on public.work_logs
  for insert with check (auth.uid() = user_id or public.has_role(auth.uid(), 'hr_admin'));
create policy "Reditel spravuje dochazku" on public.work_logs
  for all using (public.has_role(auth.uid(), 'hr_admin'));

create policy "Sklad cteni pro vedeni" on public.warehouse_items
  for select using (
    public.has_role(auth.uid(), 'hr_admin')
    or public.has_role(auth.uid(), 'manazer')
    or public.has_role(auth.uid(), 'mistr')
  );
create policy "Reditel spravuje sklad" on public.warehouse_items
  for all using (public.has_role(auth.uid(), 'hr_admin'));
