"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
  tipos_servicio: { nombre: string }[];
  propiedades: { direccion: string; metros_cuadrados: number }[];
};

const BADGES: Record<string, string> = {
  solicitado: "bg-blue-100 text-blue-700",
  revisado: "bg-amber-100 text-amber-700",
  aprobado: "bg-green-100 text-green-700",
  rechazado: "bg-red-100 text-red-700",
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
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);

      const { data, error } = await supabase
        .from("solicitudes_presupuesto")
        .select(
          "id, estado, fecha_deseada, turno, estado_espacio, pre_presupuesto, precio_final, notas_cliente, perfiles!solicitudes_presupuesto_id_cliente_fkey(nombre), tipos_servicio(nombre), propiedades(direccion, metros_cuadrados)"
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
      setLoading(false);
    })();
  }, [params.id, router]);

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
        <p className="text-sm text-zinc-500">Cargando…</p>
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

  const inputClass =
    "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none";
  const labelClass = "mb-1 block text-sm font-medium text-zinc-700";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (!solicitud) return;

    const precio = Number.parseFloat(precioFinal.replace(",", "."));
    if (!precio || precio <= 0) {
      setError("Ingresá un precio final válido.");
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase
      .from("solicitudes_presupuesto")
      .update({ precio_final: precio, estado: "revisado" })
      .eq("id", solicitud.id)
      .eq("id_proveedor", userId ?? "");

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setSaved(true);
    setSolicitud({ ...solicitud, precio_final: precio, estado: "revisado" });
  }

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Solicitud #{solicitud.id}
        </h1>
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${BADGES[solicitud.estado]}`}
        >
          {solicitud.estado}
        </span>
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
              {solicitud.fecha_deseada} · {TURNOS[solicitud.turno]}
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
              ${Number(solicitud.pre_presupuesto ?? 0).toFixed(2)}
            </dd>
          </div>
        </div>
      </dl>

      {saved && (
        <p className="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Solicitud actualizada y marcada como «revisado». El cliente ya puede
          aprobarla o rechazarla.
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="precioFinal" className={labelClass}>
            Precio final
          </label>
          <input
            id="precioFinal"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="Ej. 95.00"
            className={inputClass}
            value={precioFinal}
            onChange={(e) => setPrecioFinal(e.target.value)}
          />
          <p className="mt-1 text-xs text-zinc-500">
            Confirmá o ajustá el precio. Al guardar, la solicitud pasa a estado
            «revisado» y el cliente podrá aprobarla o rechazarla.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar y marcar como revisado"}
        </button>
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