-- Datos iniciales del MVP: tarifas fijas por tipo de servicio.
-- Este archivo se ejecuta automáticamente cada vez que corres `supabase db reset`.

insert into public.tipos_servicio (nombre, tarifa_base, tarifa_por_m2)
values
  ('Limpieza residencial', 20.00, 0.80),
  ('Jardinería / corte de césped', 15.00, 0.50);
