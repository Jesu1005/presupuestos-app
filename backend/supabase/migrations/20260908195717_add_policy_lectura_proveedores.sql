-- ==========================================
-- Lectura de proveedores por parte del cliente.
--
-- El flujo de /solicitar necesita encontrar el proveedor fijo del MVP para
-- asignarlo como id_proveedor antes de que exista una solicitud, y
-- /mis-solicitudes muestra el nombre del proveedor (JOIN). Con RLS, el
-- cliente solo ve su propia fila de perfiles, por lo que estas consultas
-- devolvían vacío. En el MVP hay un único proveedor de prueba, así que se
-- permite a todo usuario autenticado leer las filas con rol 'proveedor'.
-- Las policies se combinan con OR, no reemplazan a las existentes.
-- ==========================================

create policy "perfiles_select_proveedores"
  on public.perfiles for select
  to authenticated
  using (rol = 'proveedor');