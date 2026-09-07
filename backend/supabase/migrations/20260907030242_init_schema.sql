-- ==========================================
-- 1. ENUMS
-- ==========================================

create type public.rol_usuario as enum (
  'cliente',
  'proveedor'
);

create type public.tipo_propiedad as enum (
  'casa',
  'apartamento',
  'local_comercial',
  'otro'
);

create type public.estado_espacio as enum (
  'mantenimiento_regular',
  'maleza_alta',
  'abandono_total'
);

create type public.turno_dia as enum (
  'manana',
  'tarde'
);

create type public.estado_presupuesto as enum (
  'solicitado',
  'revisado',
  'aprobado',
  'rechazado'
);

-- ==========================================
-- 1. USUARIOS (aprovechando Supabase Auth)
-- perfiles.id referencia a auth.users(id)
-- ==========================================

create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  rol public.rol_usuario not null,
  nombre varchar not null,
  telefono varchar,
  fecha_creacion timestamp default now()
);

comment on table public.perfiles is 'Datos de perfil de cada usuario. Un mismo usuario es cliente o proveedor, no ambos, validado en la aplicación.';
comment on column public.perfiles.id is 'Mismo id que auth.users(id) de Supabase Auth. No se guarda contraseña aquí: la maneja Supabase Auth.';

-- ==========================================
-- 2. CATÁLOGO DE SERVICIOS (tarifas fijas)
-- ==========================================

create table public.tipos_servicio (
  id serial primary key,
  nombre varchar unique not null,
  tarifa_base decimal not null,
  tarifa_por_m2 decimal not null
);

comment on table public.tipos_servicio is 'Catálogo único y fijo para todos los proveedores en el MVP (Apartado 5 del informe). Editable directamente en la tabla sin tocar código, pero no hay panel de configuración por proveedor.';
comment on column public.tipos_servicio.nombre is 'Ej. Limpieza residencial, Jardinería / corte de césped';
comment on column public.tipos_servicio.tarifa_base is 'Tarifa fija estándar del MVP, definida por el equipo, no configurable por proveedor';

-- ==========================================
-- 3. PROPIEDADES (simplificado, sin áreas por zona)
-- ==========================================

create table public.propiedades (
  id serial primary key,
  id_cliente uuid references public.perfiles (id),
  direccion varchar not null,
  tipo_propiedad public.tipo_propiedad,
  metros_cuadrados decimal not null
);

comment on table public.propiedades is 'Sin desglose por áreas/zonas: en el MVP se evalúa la propiedad como una unidad, no por habitación o zona de jardín.';

-- ==========================================
-- 4. SOLICITUDES DE PRESUPUESTO (núcleo del MVP)
-- ==========================================

create table public.solicitudes_presupuesto (
  id serial primary key,
  id_cliente uuid references public.perfiles (id),
  id_proveedor uuid references public.perfiles (id),
  id_propiedad int references public.propiedades (id),
  id_tipo_servicio int references public.tipos_servicio (id),
  estado_espacio public.estado_espacio not null,
  fecha_deseada date not null,
  turno public.turno_dia not null,
  pre_presupuesto decimal,
  precio_final decimal,
  estado public.estado_presupuesto default 'solicitado',
  notas_cliente text,
  fecha_creacion timestamp default now()
);

comment on table public.solicitudes_presupuesto is 'Tabla central del MVP. Un cliente solicita, un proveedor responde: sin competencia entre múltiples proveedores por la misma solicitud (eso queda para una iteración futura tipo marketplace).';
comment on column public.solicitudes_presupuesto.id_proveedor is 'Proveedor al que se dirige la solicitud';
comment on column public.solicitudes_presupuesto.estado_espacio is 'Reemplaza la carga de fotos: selección de opción múltiple del cliente';
comment on column public.solicitudes_presupuesto.pre_presupuesto is 'Calculado automáticamente: tarifa_base + (m2 × tarifa_por_m2) × multiplicador_según_estado_espacio';
comment on column public.solicitudes_presupuesto.precio_final is 'Editado o confirmado manualmente por el proveedor antes de enviarlo al cliente (Sprint 3)';
