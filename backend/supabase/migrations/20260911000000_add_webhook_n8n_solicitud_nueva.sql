-- ==========================================
-- Webhook de Supabase -> n8n (nueva solicitud -> correo al proveedor)
--
-- Historia #9 del backlog: el proveedor recibe un correo automático cuando
-- llega una solicitud nueva. Alcance del MVP: un único webhook, disparado por
-- INSERT en solicitudes_presupuesto.
--
-- Supabase provee la función de trigger supabase_functions.http_request
-- (wrapper de pg_net), que ya construye el payload con la fila:
--   {"type":"INSERT","table":"solicitudes_presupuesto","schema":"public",
--    "record":{...},"old_record":null}
-- Es asíncrono: no bloquea ni frena el INSERT original.
--
-- En local la base corre en un contenedor Docker, por lo que "localhost" sería
-- el propio contenedor. Se usa host.docker.internal para alcanzar n8n corriendo
-- en la máquina anfitriona (ruta /webhook/nueva-solicitud, puerto 5678).
-- Al desplegar en producción, reemplazar la URL por la del n8n desplegado.
--
-- No modifica el modelo de datos ni las policies RLS: solo agrega un trigger.
-- ==========================================

create trigger "webhook_n8n_solicitud_nueva"
after insert on public.solicitudes_presupuesto
for each row
execute function supabase_functions.http_request(
  'http://host.docker.internal:5678/webhook/nueva-solicitud',
  'POST',
  '{"Content-Type":"application/json"}',
  '{}',
  '5000'
);