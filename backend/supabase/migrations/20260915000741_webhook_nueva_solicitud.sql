-- ==========================================
-- Webhook de nueva solicitud con pg_net (reemplaza a Database Webhooks)
--
-- Historia #9 del backlog: el proveedor recibe un correo automático cuando
-- llega una solicitud nueva. Alcance del MVP: un único webhook, disparado por
-- INSERT en solicitudes_presupuesto.
--
-- El Studio local no ofrece el panel de "Database Webhooks", así que se
-- replica esa funcionalidad con un trigger AFTER INSERT y la extensión pg_net
-- (misma tecnología que Supabase usa por debajo). La función construye un
-- payload con datos desnormalizados (nombres/email) y llama net.http_post.
--
-- Nota: se elimina el trigger previo webhook_n8n_solicitud_nueva de la
-- migración 20260911000000 (basado en supabase_functions.http_request) para
-- que cada INSERT dispare un solo webhook.
--
-- En local la base corre en un contenedor Docker, por lo que "localhost" sería
-- el propio contenedor. Se usa host.docker.internal para alcanzar n8n corriendo
-- en la máquina anfitriona (puerto 5678).
-- Al desplegar en producción, reemplazar la URL por la del n8n desplegado.
--
-- No modifica el modelo de datos ni las policies RLS: solo agrega un trigger.
-- ==========================================

-- 1. Extensión pg_net (si aún no está habilitada). El worker asíncrono de
--    pg_net se inicia automáticamente con la extensión; cada net.http_post
--    devuelve un id y la respuesta queda en net._http_response.
create extension if not exists pg_net;

-- 2. Función de trigger: arma el payload y dispara el POST a n8n.
--    SECURITY DEFINER para que pueda leer perfiles/tipos_servicio aunque el
--    INSERT lo haga un rol con RLS (el cliente no puede leer la fila del
--    proveedor con las policies actuales).
create or replace function public.notificar_nueva_solicitud()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_proveedor_nombre varchar;
  v_proveedor_email varchar;
  v_cliente_nombre varchar;
  v_servicio_nombre varchar;
  v_body jsonb;
begin
  select p.nombre, p.email
    into v_proveedor_nombre, v_proveedor_email
  from public.perfiles p
  where p.id = new.id_proveedor;

  select p.nombre
    into v_cliente_nombre
  from public.perfiles p
  where p.id = new.id_cliente;

  select ts.nombre
    into v_servicio_nombre
  from public.tipos_servicio ts
  where ts.id = new.id_tipo_servicio;

  v_body := jsonb_build_object(
    'proveedor_nombre', v_proveedor_nombre,
    'proveedor_email', v_proveedor_email,
    'cliente_nombre', v_cliente_nombre,
    'servicio_nombre', v_servicio_nombre,
    'pre_presupuesto', new.pre_presupuesto,
    'fecha_deseada', new.fecha_deseada,
    'turno', new.turno,
    'solicitud_id', new.id
  );

  perform net.http_post(
    url := 'http://host.docker.internal:5678/webhook/1c25a6bd-2a7b-42a7-b06f-893311d65afb',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := v_body
  );

  return new;
end;
$$;

-- 3. Reemplazo del webhook anterior y alta del nuevo trigger.
drop trigger if exists "webhook_n8n_solicitud_nueva" on public.solicitudes_presupuesto;

create trigger "webhook_nueva_solicitud"
after insert on public.solicitudes_presupuesto
for each row
execute function public.notificar_nueva_solicitud();