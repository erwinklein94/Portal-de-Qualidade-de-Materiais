-- Portal de Qualidade de Materiais Rumo
-- Execute como uma única migration no projeto uoyuksxxuydbcywyupxd.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.material_areas (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code in ('amv', 'wood_sleeper', 'concrete_sleeper', 'ballast', 'subcomponents')),
  name text not null unique,
  description text not null default '',
  accent_color text not null default '#32A6E6',
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  trade_name text not null,
  tax_id text,
  area_id uuid not null references public.material_areas(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'inactive', 'pending')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trade_name, area_id)
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  user_kind text not null check (user_kind in ('team', 'supplier')),
  team_role text check (team_role in ('editor', 'analyst', 'coordinator', 'viewer')),
  supplier_id uuid references public.suppliers(id) on delete restrict,
  area_id uuid references public.material_areas(id) on delete restrict,
  is_active boolean not null default true,
  must_change_password boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_access_shape check (
    (user_kind = 'team' and team_role is not null and supplier_id is null and area_id is null)
    or
    (user_kind = 'supplier' and team_role is null and supplier_id is not null and area_id is not null)
  )
);

create table public.quality_records (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  area_id uuid not null references public.material_areas(id) on delete restrict,
  reference_date date not null,
  reference_week smallint not null check (reference_week between 1 and 53),
  status text not null default 'draft' check (status in ('draft', 'submitted', 'under_review', 'approved', 'rejected')),
  payload jsonb not null default '{}'::jsonb,
  review_notes text,
  created_by uuid not null references auth.users(id) on delete restrict,
  reviewed_by uuid references auth.users(id) on delete set null,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_supplier_id_idx on public.profiles (supplier_id);
create index profiles_area_id_idx on public.profiles (area_id);
create index suppliers_area_id_idx on public.suppliers (area_id);
create index quality_records_area_date_idx on public.quality_records (area_id, reference_date desc);
create index quality_records_supplier_date_idx on public.quality_records (supplier_id, reference_date desc);
create index quality_records_status_idx on public.quality_records (status);
create index quality_records_created_by_idx on public.quality_records (created_by);
create index quality_records_reviewed_by_idx on public.quality_records (reviewed_by);

create function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function private.validate_quality_record_payload()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.suppliers where id = new.supplier_id and area_id = new.area_id
  ) then
    raise exception 'O fornecedor informado não pertence à área do registro.';
  end if;

  if jsonb_typeof(new.payload) <> 'object'
    or nullif(btrim(new.payload ->> 'order_number'), '') is null
    or not (new.payload ?& array[
      'total_order_volume', 'inspected_volume', 'rejected_volume', 'released_stock_volume'
    ])
    or jsonb_typeof(new.payload -> 'total_order_volume') is distinct from 'number'
    or jsonb_typeof(new.payload -> 'inspected_volume') is distinct from 'number'
    or jsonb_typeof(new.payload -> 'rejected_volume') is distinct from 'number'
    or jsonb_typeof(new.payload -> 'released_stock_volume') is distinct from 'number' then
    raise exception 'Os campos obrigatórios do registro de qualidade não foram informados.';
  end if;

  if (new.payload ->> 'total_order_volume')::numeric < 0
    or (new.payload ->> 'inspected_volume')::numeric < 0
    or (new.payload ->> 'rejected_volume')::numeric < 0
    or (new.payload ->> 'released_stock_volume')::numeric < 0 then
    raise exception 'Os volumes devem ser iguais ou maiores que zero.';
  end if;

  return new;
end;
$$;

create trigger suppliers_set_updated_at before update on public.suppliers
for each row execute function private.set_updated_at();
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function private.set_updated_at();
create trigger quality_records_set_updated_at before update on public.quality_records
for each row execute function private.set_updated_at();
create trigger quality_records_validate_payload before insert or update on public.quality_records
for each row execute function private.validate_quality_record_payload();

create function private.is_team_member()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and user_kind = 'team' and is_active = true
  );
$$;

create function private.has_team_role(allowed_roles text[])
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and user_kind = 'team'
      and team_role = any(allowed_roles)
      and is_active = true
  );
$$;

create function private.current_supplier_id()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select supplier_id from public.profiles
  where id = (select auth.uid()) and user_kind = 'supplier' and is_active = true;
$$;

create function private.current_area_id()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select area_id from public.profiles
  where id = (select auth.uid()) and is_active = true;
$$;

revoke all on function private.is_team_member() from public;
revoke all on function private.has_team_role(text[]) from public;
revoke all on function private.current_supplier_id() from public;
revoke all on function private.current_area_id() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_team_member() to authenticated;
grant execute on function private.has_team_role(text[]) to authenticated;
grant execute on function private.current_supplier_id() to authenticated;
grant execute on function private.current_area_id() to authenticated;

alter table public.material_areas enable row level security;
alter table public.suppliers enable row level security;
alter table public.profiles enable row level security;
alter table public.quality_records enable row level security;
alter table public.material_areas force row level security;
alter table public.suppliers force row level security;
alter table public.profiles force row level security;
alter table public.quality_records force row level security;

create policy "team or assigned supplier read active material areas"
on public.material_areas for select to authenticated
using (
  is_active = true
  and ((select private.is_team_member()) or id = (select private.current_area_id()))
);

create policy "users read own profile or team reads profiles"
on public.profiles for select to authenticated
using ((select auth.uid()) = id or (select private.is_team_member()));
create policy "account managers update profiles"
on public.profiles for update to authenticated
using ((select private.has_team_role(array['editor','analyst','coordinator'])))
with check ((select private.has_team_role(array['editor','analyst','coordinator'])));

create policy "team or assigned supplier read suppliers"
on public.suppliers for select to authenticated
using (
  (select private.is_team_member())
  or (id = (select private.current_supplier_id()) and area_id = (select private.current_area_id()))
);
create policy "account managers insert suppliers"
on public.suppliers for insert to authenticated
with check ((select private.has_team_role(array['editor','coordinator'])));
create policy "account managers update suppliers"
on public.suppliers for update to authenticated
using ((select private.has_team_role(array['editor','coordinator'])))
with check ((select private.has_team_role(array['editor','coordinator'])));
create policy "account managers delete suppliers"
on public.suppliers for delete to authenticated
using ((select private.has_team_role(array['editor','coordinator'])));

create policy "team or assigned supplier read quality records"
on public.quality_records for select to authenticated
using (
  (select private.is_team_member())
  or (supplier_id = (select private.current_supplier_id()) and area_id = (select private.current_area_id()))
);
create policy "users insert permitted quality records"
on public.quality_records for insert to authenticated
with check (
  (
    created_by = (select auth.uid())
    and supplier_id = (select private.current_supplier_id())
    and area_id = (select private.current_area_id())
    and status in ('draft', 'submitted')
  )
  or (
    (select private.has_team_role(array['editor','coordinator']))
    and created_by = (select auth.uid())
  )
);
create policy "users update permitted quality records"
on public.quality_records for update to authenticated
using (
  (
    supplier_id = (select private.current_supplier_id())
    and area_id = (select private.current_area_id())
    and status in ('draft', 'rejected')
  )
  or (select private.has_team_role(array['editor','analyst','coordinator']))
)
with check (
  (
    created_by = (select auth.uid())
    and supplier_id = (select private.current_supplier_id())
    and area_id = (select private.current_area_id())
    and status in ('draft', 'submitted')
  )
  or (select private.has_team_role(array['editor','analyst','coordinator']))
);
create policy "editors and coordinators delete records"
on public.quality_records for delete to authenticated
using ((select private.has_team_role(array['editor','coordinator'])));

grant select on public.material_areas to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.suppliers to authenticated;
grant select, insert, update, delete on public.quality_records to authenticated;
grant all privileges on table public.material_areas, public.suppliers, public.profiles, public.quality_records to service_role;

-- Alguns projetos possuem esta função auxiliar criada pelo painel. Caso exista,
-- ela não deve ficar executável pelos papéis usados pela aplicação.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end;
$$;

insert into public.material_areas (code, name, description, accent_color, sort_order)
values
  ('amv', 'AMV', 'Aparelhos de mudança de via e seus conjuntos', '#32A6E6', 1),
  ('wood_sleeper', 'Dormente de Madeira', 'Controle de qualidade de dormentes de madeira', '#1E9F7F', 2),
  ('concrete_sleeper', 'Dormente de Concreto', 'Controle de qualidade de dormentes de concreto', '#7FE06C', 3),
  ('ballast', 'Lastro', 'Materiais minerais utilizados na superestrutura ferroviária', '#F78344', 4),
  ('subcomponents', 'Subcomponentes', 'Componentes e insumos complementares da via', '#9F4BB9', 5);
