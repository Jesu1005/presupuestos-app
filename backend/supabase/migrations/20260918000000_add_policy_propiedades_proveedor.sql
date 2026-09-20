-- ==========================================
-- Lectura de propiedades por parte del proveedor.
--
-- La página /proveedor/[id] (detalle de una solicitud) muestra la
-- dirección y los m² de la propiedad (JOIN solicitudes_presupuesto ->
-- propiedades). La policy existente "propiedades_select_own" solo
-- permite leer la propia fila al cliente propietario, por lo que el
-- JOIN devolvería null y la dirección aparecería como "—".
--
-- Esta policy adicional permite a un usuario autenticado leer una fila
-- de propiedades si existe una solicitud dirigida a él
-- (id_proveedor = auth.uid()) que referencia esa propiedad.
-- Las policies se combinan con OR: el dueño sigue accediendo con la
-- policy existente y el proveedor solo ve propiedades de solicitudes
-- asignadas a él. RLS sigue habilitado y no se eliminan policies.
-- ==========================================

create policy "propiedades_select_proveedor_solicitudes"
  on public.propiedades for select
  to authenticated
  using (
    exists (
      select 1
      from public.solicitudes_presupuesto s
      where s.id_propiedad = propiedades.id
        and s.id_proveedor = auth.uid()
    )
  );