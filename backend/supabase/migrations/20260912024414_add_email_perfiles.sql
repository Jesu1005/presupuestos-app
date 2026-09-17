-- ==========================================
-- Agregar columna email a perfiles
--
-- Guarda el correo del usuario en perfiles para poder notificarlo sin
-- depender de auth.users (que el cliente no puede leer por RLS).
-- Se deja NULLABLE por simplicidad: las filas existentes no requieren
-- valor temporal y el registro siempre la completa desde el formulario.
-- ==========================================

alter table public.perfiles
  add column email varchar;