-- ==========================================
-- RLS policies para las 4 tablas del MVP
-- ==========================================

-- ---------- perfiles ----------
alter table public.perfiles enable row level security;

create policy "perfiles_select_own"
  on public.perfiles for select
  using (auth.uid() = id);

create policy "perfiles_update_own"
  on public.perfiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "perfiles_insert_own"
  on public.perfiles for insert
  with check (auth.uid() = id);

-- ---------- tipos_servicio ----------
alter table public.tipos_servicio enable row level security;

create policy "tipos_servicio_select_authenticated"
  on public.tipos_servicio for select
  to authenticated
  using (true);

-- Sin policies de insert/update/delete: las tarifas son fijas y se
-- cargan por seed.sql. Nadie puede modificarlas desde el frontend.

-- ---------- propiedades ----------
alter table public.propiedades enable row level security;

create policy "propiedades_select_own"
  on public.propiedades for select
  using (id_cliente = auth.uid());

create policy "propiedades_insert_own"
  on public.propiedades for insert
  with check (id_cliente = auth.uid());

create policy "propiedades_update_own"
  on public.propiedades for update
  using (id_cliente = auth.uid())
  with check (id_cliente = auth.uid());

create policy "propiedades_delete_own"
  on public.propiedades for delete
  using (id_cliente = auth.uid());

-- ---------- solicitudes_presupuesto ----------
alter table public.solicitudes_presupuesto enable row level security;

-- Cliente: lee y crea solo sus propias solicitudes
create policy "solicitudes_select_cliente"
  on public.solicitudes_presupuesto for select
  using (id_cliente = auth.uid());

create policy "solicitudes_insert_cliente"
  on public.solicitudes_presupuesto for insert
  with check (id_cliente = auth.uid());

-- Proveedor: lee y actualiza solo las solicitudes dirigidas a él
-- (le permite cambiar estado y precio_final). El cliente NO tiene
-- policy de update, por lo que no puede editar estado/precio_final
-- después de creada la solicitud.
create policy "solicitudes_select_proveedor"
  on public.solicitudes_presupuesto for select
  using (id_proveedor = auth.uid());

create policy "solicitudes_update_proveedor"
  on public.solicitudes_presupuesto for update
  using (id_proveedor = auth.uid())
  with check (id_proveedor = auth.uid());
