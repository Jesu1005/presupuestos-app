-- ==========================================
-- Cliente aprueba/rechaza su solicitud tras la revisión del proveedor.
--
-- RLS en Postgres opera a nivel de fila y NO permite restringir columnas
-- dentro de una policy. Una policy de UPDATE que permita cambiar
-- estado='revisado' -> 'aprobado'/'rechazado' también dejaría modificar
-- precio_final, id_proveedor, notas_cliente, etc. Por eso se exponen RPCs
-- SECURITY DEFINER que validan propietario y estado actual, y únicamente
-- actualizan la columna `estado`. El cliente NO tiene policy de UPDATE
-- directo sobre solicitudes_presupuesto.
-- ==========================================

create or replace function public.aprobar_solicitud(p_solicitud_id bigint)
returns public.solicitudes_presupuesto
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.solicitudes_presupuesto;
begin
  select * into v_row
  from public.solicitudes_presupuesto
  where id = p_solicitud_id;

  if not found then
    raise exception 'Solicitud no encontrada';
  end if;

  if v_row.id_cliente <> auth.uid() then
    raise exception 'No puedes aprobar una solicitud ajena';
  end if;

  if v_row.estado <> 'revisado' then
    raise exception 'La solicitud debe estar en estado "revisado" para poder aprobarla';
  end if;

  update public.solicitudes_presupuesto
  set estado = 'aprobado'
  where id = p_solicitud_id
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.rechazar_solicitud(p_solicitud_id bigint)
returns public.solicitudes_presupuesto
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.solicitudes_presupuesto;
begin
  select * into v_row
  from public.solicitudes_presupuesto
  where id = p_solicitud_id;

  if not found then
    raise exception 'Solicitud no encontrada';
  end if;

  if v_row.id_cliente <> auth.uid() then
    raise exception 'No puedes rechazar una solicitud ajena';
  end if;

  if v_row.estado <> 'revisado' then
    raise exception 'La solicitud debe estar en estado "revisado" para poder rechazarla';
  end if;

  update public.solicitudes_presupuesto
  set estado = 'rechazado'
  where id = p_solicitud_id
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.aprobar_solicitud(bigint) from public;
revoke all on function public.rechazar_solicitud(bigint) from public;
grant execute on function public.aprobar_solicitud(bigint) to authenticated;
grant execute on function public.rechazar_solicitud(bigint) to authenticated;