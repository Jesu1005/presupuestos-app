"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { MENSAJE_ERROR_RED, mensajeDeError } from "@/lib/errors";
import { MULTIPLICADORES, type EstadoEspacio } from "@/lib/estimacion";
import { formatearFecha, formatearMoneda } from "@/lib/format";
import { supabase } from "@/lib/supabaseClient";

type SolicitudDetalle = {
  id: number;
  estado: string;
  fecha_deseada: string;
  turno: string;
  estado_espacio: string;
  pre_presupuesto: number | null;
  precio_final: number | null;
  notas_cliente: string | null;
  perfiles: { nombre: string }[];
  tipos_servicio: { nombre: string; tarifa_base: number; tarifa_por_m2: number }[];
  propiedades: { direccion: string; metros_cuadrados: number }[];
};

const TURNOS: Record<string, string> = {
  manana: "Mañana",
  tarde: "Tarde",
};

const ESTADOS_ESPACIO: Record<string, string> = {
  mantenimiento_regular: "Mantenimiento regular",
  maleza_alta: "Maleza alta",
  abandono_total: "Abandono total",
};

function toList<T>(v: T | T[] | null | undefined): T[] {
  return Array.isArray(v) ? v : v ? [v] : [];
}

export default function VerSolicitudPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [solicitud, setSolicitud] = useState<SolicitudDetalle | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [precioFinal, setPrecioFinal] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [precioError, setPrecioError] = useState<string | null>(null);
  const { mostrar } = useToast();

  useEffect(() => {
    let activo = true;

    (async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
          router.push("/login");
          return;
        }
        if (!activo) return;
        setUserId(user.id);

        const { data, error } = await supabase
          .from("solicitudes_presupuesto")
          .select(
            "id, estado, fecha_deseada, turno, estado_espacio, pre_presupuesto, precio_final, notas_cliente, perfiles!solicitudes_presupuesto_id_cliente_fkey(nombre), tipos_servicio(nombre, tarifa_base, tarifa_por_m2), propiedades(direccion, metros_cuadrados)"
          )
          .eq("id", Number(params.id))
          .eq("id_proveedor", user.id)
          .maybeSingle();

        if (error || !data) {
          setError(
            "No se encontró la solicitud o no tenés permisos para verla."
          );
        } else {
          const s = data as SolicitudDetalle;
          setSolicitud(s);
          setPrecioFinal(
            s.precio_final !== null ? String(s.precio_final) : ""
          );
        }
      } catch {
        if (activo) {
          setError(MENSAJE_ERROR_RED);
        }
      } finally {
        if (activo) setLoading(false);
      }
    })();

    return () => {
      activo = false;
    };
  }, [params.id, router]);

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-6 h-64 w-full rounded-lg" />
        <Skeleton className="mt-4 h-28 w-full rounded-lg" />
        <Skeleton className="mt-6 h-24 w-full rounded-lg" />
      </main>
    );
  }

  if (error || !solicitud) {
    return (
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
        <h1 className="text-2xl font-semibold text-zinc-900">Solicitud</h1>
        <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
        <Link
          href="/proveedor"
          className="mt-4 inline-block text-sm font-medium text-zinc-900 hover:underline"
        >
          Volver a solicitudes
        </Link>
      </main>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!solicitud) return;

    const precio = Number.parseFloat(precioFinal.replace(",", "."));
    if (precioFinal.trim() === "" || Number.isNaN(precio) || precio <= 0) {
      setPrecioError("Ingresá un precio final válido (mayor a 0).");
      return;
    }
    setPrecioError(null);

    setSaving(true);
    try {
      const { error: updateError } = await supabase
        .from("solicitudes_presupuesto")
        .update({ precio_final: precio, estado: "revisado" })
        .eq("id", solicitud.id)
        .eq("id_proveedor", userId ?? "");

      if (updateError) {
        mostrar(mensajeDeError(updateError), "error");
        setSaving(false);
        return;
      }

      setSaving(false);
      mostrar(
        "Solicitud actualizada y marcada como «revisado». El cliente ya puede aprobarla o rechazarla.",
        "exito"
      );
      setSolicitud({ ...solicitud, precio_final: precio, estado: "revisado" });
    } catch {
      setSaving(false);
      mostrar(MENSAJE_ERROR_RED, "error");
    }
  }

  const servicio = toList(solicitud.tipos_servicio)[0];
  const propiedad = toList(solicitud.propiedades)[0];
  const metros = Number(propiedad?.metros_cuadrados ?? 0);
  const multiplicador =
    MULTIPLICADORES[solicitud.estado_espacio as EstadoEspacio] ?? 1;
  const subtotalServicio = servicio
    ? servicio.tarifa_base + servicio.tarifa_por_m2 * metros
    : 0;

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Solicitud #{solicitud.id}
        </h1>
        <Badge estado={solicitud.estado} />
      </div>

      <dl className="mt-6 overflow-hidden rounded-lg border border-zinc-200">
        <div className="divide-y divide-zinc-100 text-sm">
          <div className="flex justify-between px-4 py-3">
            <dt className="text-zinc-500">Cliente</dt>
            <dd className="font-medium text-zinc-900">
              {toList(solicitud.perfiles)[0]?.nombre ?? "—"}
            </dd>
          </div>
          <div className="flex justify-between px-4 py-3">
            <dt className="text-zinc-500">Servicio</dt>
            <dd className="font-medium text-zinc-900">
              {toList(solicitud.tipos_servicio)[0]?.nombre ?? "—"}
            </dd>
          </div>
          <div className="flex justify-between px-4 py-3">
            <dt className="text-zinc-500">Dirección</dt>
            <dd className="font-medium text-zinc-900">
              {toList(solicitud.propiedades)[0]?.direccion ?? "—"} (
              {toList(solicitud.propiedades)[0]?.metros_cuadrados ?? "?"} m²)
            </dd>
          </div>
          <div className="flex justify-between px-4 py-3">
            <dt className="text-zinc-500">Fecha deseada</dt>
            <dd className="font-medium text-zinc-900">
              {formatearFecha(solicitud.fecha_deseada)} · {TURNOS[solicitud.turno]}
            </dd>
          </div>
          <div className="flex justify-between px-4 py-3">
            <dt className="text-zinc-500">Estado del espacio</dt>
            <dd className="font-medium text-zinc-900">
              {ESTADOS_ESPACIO[solicitud.estado_espacio]}
            </dd>
          </div>
          <div className="flex justify-between px-4 py-3">
            <dt className="text-zinc-500">Pre-presupuesto</dt>
            <dd className="font-medium text-zinc-900">
              {formatearMoneda(Number(solicitud.pre_presupuesto ?? 0))}
            </dd>
          </div>
        </div>
      </dl>

      {servicio && (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-sm font-medium text-zinc-700">
            Cómo se calculó el pre-presupuesto
          </p>
          <dl className="mt-3 flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Tarifa base</dt>
              <dd className="text-zinc-900">
                {formatearMoneda(servicio.tarifa_base)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">
                {metros} m² × {formatearMoneda(servicio.tarifa_por_m2)}/m²
              </dt>
              <dd className="text-zinc-900">
                {formatearMoneda(servicio.tarifa_por_m2 * metros)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">
                Estado del espacio ({ESTADOS_ESPACIO[solicitud.estado_espacio]})
              </dt>
              <dd className="text-zinc-900">×{multiplicador}</dd>
            </div>
            <div className="mt-1 flex justify-between gap-4 border-t border-zinc-200 pt-2 font-medium">
              <dt className="text-zinc-700">Total estimado</dt>
              <dd className="text-zinc-900">
                {formatearMoneda(subtotalServicio * multiplicador)}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <Field
          label="Precio final"
          htmlFor="precioFinal"
          hint="Confirmá o ajustá el precio. Al guardar, la solicitud pasa a estado «revisado» y el cliente podrá aprobarla o rechazarla."
          error={precioError ?? undefined}
        >
          <TextInput
            id="precioFinal"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="Ej. 95.00"
            value={precioFinal}
            onChange={(e) => {
              setPrecioFinal(e.target.value);
              setPrecioError(null);
            }}
          />
        </Field>

        <Button type="submit" disabled={saving}>
          {saving ? "Guardando..." : "Guardar y marcar como revisado"}
        </Button>
      </form>

      <Link
        href="/proveedor"
        className="mt-6 inline-block text-sm font-medium text-zinc-900 hover:underline"
      >
        Volver a solicitudes
      </Link>
    </main>
  );
}