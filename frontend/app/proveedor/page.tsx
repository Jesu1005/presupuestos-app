"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { TarjetasSkeleton } from "@/components/ui/Skeleton";
import { MENSAJE_ERROR_RED, mensajeDeError } from "@/lib/errors";
import { formatearFecha, formatearMoneda } from "@/lib/format";
import { supabase } from "@/lib/supabaseClient";

type SolicitudProveedor = {
  id: number;
  estado: string;
  fecha_deseada: string;
  turno: string;
  pre_presupuesto: number | null;
  precio_final: number | null;
  perfiles: { nombre: string }[];
  tipos_servicio: { nombre: string }[];
};

const TURNOS: Record<string, string> = {
  manana: "Mañana",
  tarde: "Tarde",
};

const FILTROS = [
  { valor: "todos", label: "Todas" },
  { valor: "solicitado", label: "Solicitadas" },
  { valor: "revisado", label: "Revisadas" },
  { valor: "aprobado", label: "Aprobadas" },
  { valor: "rechazado", label: "Rechazadas" },
] as const;

type Filtro = (typeof FILTROS)[number]["valor"];

function toList<T>(v: T | T[] | null | undefined): T[] {
  return Array.isArray(v) ? v : v ? [v] : [];
}

export default function ProveedorPage() {
  const router = useRouter();
  const [solicitudes, setSolicitudes] = useState<SolicitudProveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("todos");

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

        const { data, error } = await supabase
          .from("solicitudes_presupuesto")
          .select(
            "id, estado, fecha_deseada, turno, pre_presupuesto, precio_final, perfiles!solicitudes_presupuesto_id_cliente_fkey(nombre), tipos_servicio(nombre)"
          )
          .eq("id_proveedor", user.id)
          .order("fecha_creacion", { ascending: false });

        if (error) {
          setError(mensajeDeError(error));
        } else {
          setSolicitudes((data ?? []) as SolicitudProveedor[]);
        }
      } catch {
        if (activo) setError(MENSAJE_ERROR_RED);
      } finally {
        if (activo) setLoading(false);
      }
    })();

    return () => {
      activo = false;
    };
  }, [router]);

  const conteos = solicitudes.reduce<Record<string, number>>((acc, s) => {
    acc[s.estado] = (acc[s.estado] ?? 0) + 1;
    return acc;
  }, {});

  const filtradas =
    filtro === "todos"
      ? solicitudes
      : solicitudes.filter((s) => s.estado === filtro);

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900">Solicitudes</h1>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Solicitudes de presupuesto recibidas como proveedor.
        </p>

        {error && (
          <p className="mt-6 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {loading && <TarjetasSkeleton />}

        {!loading && !error && solicitudes.length === 0 && (
<p className="mt-8 rounded-md bg-white p-4 text-sm text-zinc-500">
              Todavía no recibiste solicitudes.
            </p>
        )}

        {!loading && !error && solicitudes.length > 0 && (
          <>
            <div className="mt-6 flex flex-wrap gap-2">
              {FILTROS.map((f) => {
                const cantidad =
                  f.valor === "todos"
                    ? solicitudes.length
                    : conteos[f.valor] ?? 0;
                const activo = filtro === f.valor;
                return (
                  <button
                    key={f.valor}
                    type="button"
                    onClick={() => setFiltro(f.valor)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      activo
                        ? "bg-emerald-600 text-white"
                        : "border border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-100"
                    }`}
                  >
                    {f.label} ({cantidad})
                  </button>
                );
              })}
            </div>

            {filtradas.length === 0 ? (
              <p className="mt-6 rounded-md bg-white p-4 text-sm text-zinc-500">
                No hay solicitudes en este estado.
              </p>
            ) : (
              <ul className="mt-6 flex flex-col gap-4">
                {filtradas.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-lg border border-zinc-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-zinc-900">
                          {toList(s.perfiles)[0]?.nombre ?? "—"}
                        </p>
                        <p className="text-sm text-zinc-500">
                          {toList(s.tipos_servicio)[0]?.nombre ?? "—"}
                        </p>
                      </div>
                      <Badge estado={s.estado} />
                    </div>

                    <dl className="mt-3 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                      <div className="flex justify-between">
                        <dt className="text-zinc-500">Fecha</dt>
                        <dd className="font-medium text-zinc-900">
                          {formatearFecha(s.fecha_deseada)} · {TURNOS[s.turno]}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-zinc-500">Pre-presupuesto</dt>
                        <dd className="font-medium text-zinc-900">
                          {formatearMoneda(Number(s.pre_presupuesto ?? 0))}
                        </dd>
                      </div>
                      <div className="flex justify-between sm:col-span-2">
                        <dt className="text-zinc-500">Precio final</dt>
                        <dd className="font-medium text-zinc-900">
                          {s.precio_final !== null
                            ? formatearMoneda(Number(s.precio_final))
                            : "Pendiente"}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-3">
                      <Button
                        href={`/proveedor/${s.id}`}
                        variant="secondary"
                        size="sm"
                      >
                        Ver detalle
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </>
  );
}