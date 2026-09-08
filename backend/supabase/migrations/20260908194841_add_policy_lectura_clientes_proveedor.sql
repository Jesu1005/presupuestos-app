-- ==========================================
-- Lectura del nombre del cliente por parte del proveedor.
--
-- La página /proveedor muestra el nombre del cliente que hizo cada solicitud
-- (JOIN solicitudes_presupuesto -> perfiles). La policy existente
-- "perfiles_select_own" solo permite leer la propia fila, por lo que el
-- JOIN devolvería null. Esta policy adicional permite a un usuario
-- autenticado leer una fila de perfiles si existe una solicitud dirigida
-- a él (id_proveedor = auth.uid()) en la que esa fila sea el cliente.
-- Las policies se combinan con OR, así que la propia fila sigue siendo
-- accesible con la policy existente.
-- ==========================================

create policy "perfiles_select_clientes_de_mis_solicitudes"
  on public.perfiles for select
  to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.solicitudes_presupuesto s
      where s.id_proveedor = auth.uid()
        and s.id_cliente = perfiles.id
    )
  );