"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabaseClient";

type MisSolicitud = {
  id: number;
  estado: string;
  fecha_deseada: string;
  turno: string;
  estado_espacio: string;
  pre_presupuesto: number | null;
  precio_final: number | null;
  perfiles: { nombre: string }[];
  tipos_servicio: { nombre: string }[];
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

export default function MisSolicitudesPage() {
  const router = useRouter();
  const [solicitudes, setSolicitudes] = useState<MisSolicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("solicitudes_presupuesto")
      .select(
        "id, estado, fecha_deseada, turno, estado_espacio, pre_presupuesto, precio_final, perfiles!solicitudes_presupuesto_id_proveedor_fkey(nombre), tipos_servicio(nombre)"
      )
      .eq("id_cliente", user.id)
      .order("fecha_creacion", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setSolicitudes((data ?? []) as MisSolicitud[]);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    (async () => {
      await cargar();
    })();
  }, [cargar]);

  async function decidir(id: number, fn: "aprobar_solicitud" | "rechazar_solicitud") {
    setActingId(id);
    setError(null);
    const { error } = await supabase.rpc(fn, { p_solicitud_id: id });
    setActingId(null);
    if (error) {
      setError(error.message);
      return;
    }
    cargar();
  }

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Mis solicitudes
        </h1>
        <Link
          href="/solicitar"
          className="text-sm font-medium text-zinc-900 hover:underline"
        >
          Nueva solicitud
        </Link>
      </div>
      <p className="mt-1 text-sm text-zinc-500">
        Estado de tus solicitudes de presupuesto.
      </p>

      {error && (
        <p className="mt-6 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading && (
        <p className="mt-8 text-sm text-zinc-500">Cargando…</p>
      )}

      {!loading && solicitudes.length === 0 && (
        <p className="mt-8 rounded-md bg-zinc-50 p-4 text-sm text-zinc-500">
          Todavía no enviaste solicitudes.{" "}
          <Link href="/solicitar" className="font-medium text-zinc-900 underline">
            Creá una ahora
          </Link>
          .
        </p>
      )}

      <ul className="mt-8 flex flex-col gap-4">
        {solicitudes.map((s) => (
          <li
            key={s.id}
            className="rounded-lg border border-zinc-200 bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <p className="font-medium text-zinc-900">
                Solicitud #{s.id}{" "}
                <span className="font-normal text-zinc-500">
                  · {toList(s.tipos_servicio)[0]?.nombre ?? "—"}
                </span>
              </p>
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${BADGES[s.estado]}`}
              >
                {s.estado}
              </span>
            </div>

            <dl className="mt-3 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
              <div className="flex justify-between">
                <dt className="text-zinc-500">Proveedor</dt>
                <dd className="font-medium text-zinc-900">
                  {toList(s.perfiles)[0]?.nombre ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Fecha deseada</dt>
                <dd className="font-medium text-zinc-900">
                  {s.fecha_deseada} · {TURNOS[s.turno]}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Estado del espacio</dt>
                <dd className="font-medium text-zinc-900">
                  {ESTADOS_ESPACIO[s.estado_espacio]}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Pre-presupuesto</dt>
                <dd className="font-medium text-zinc-900">
                  ${Number(s.pre_presupuesto ?? 0).toFixed(2)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Precio final</dt>
                <dd className="font-medium text-zinc-900">
                  {s.precio_final !== null
                    ? `$${Number(s.precio_final).toFixed(2)}`
                    : "Pendiente"}
                </dd>
              </div>
            </dl>

            {s.estado === "revisado" && (
              <div className="mt-4 flex gap-3 border-t border-zinc-100 pt-4">
                <button
                  disabled={actingId !== null}
                  onClick={() => decidir(s.id, "aprobar_solicitud")}
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-500 disabled:opacity-50"
                >
                  Aprobar
                </button>
                <button
                  disabled={actingId !== null}
                  onClick={() => decidir(s.id, "rechazar_solicitud")}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
                >
                  Rechazar
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </main>
    </>
  );
}