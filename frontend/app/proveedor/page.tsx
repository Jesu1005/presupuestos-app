"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
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

function toList<T>(v: T | T[] | null | undefined): T[] {
  return Array.isArray(v) ? v : v ? [v] : [];
}

export default function ProveedorPage() {
  const router = useRouter();
  const [solicitudes, setSolicitudes] = useState<SolicitudProveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      const { data, error } = await supabase
        .from("solicitudes_presupuesto")
        .select(
          "id, estado, fecha_deseada, turno, pre_presupuesto, precio_final, perfiles!solicitudes_presupuesto_id_cliente_fkey(nombre), tipos_servicio(nombre)"
        )
        .eq("id_proveedor", user.id)
        .order("fecha_creacion", { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setSolicitudes((data ?? []) as SolicitudProveedor[]);
      }
      setLoading(false);
    })();
  }, [router]);

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Solicitudes</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Solicitudes de presupuesto recibidas como proveedor.
      </p>

      {error && (
        <p className="mt-6 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading && (
        <p className="mt-8 text-sm text-zinc-500">Cargando solicitudes…</p>
      )}

      {!loading && !error && solicitudes.length === 0 && (
        <p className="mt-8 rounded-md bg-zinc-50 p-4 text-sm text-zinc-500">
          Todavía no recibiste solicitudes.
        </p>
      )}

      {!loading && !error && solicitudes.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-lg border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">
                  Servicio
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">
                  Pre-presupuesto
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">
                  Estado
                </th>
                <th className="px-4 py-3 text-right font-medium text-zinc-500">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {solicitudes.map((s) => (
                <tr key={s.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {toList(s.perfiles)[0]?.nombre ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {toList(s.tipos_servicio)[0]?.nombre ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {s.fecha_deseada} · {TURNOS[s.turno]}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    ${Number(s.pre_presupuesto ?? 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${BADGES[s.estado]}`}
                    >
                      {s.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/proveedor/${s.id}`}
                      className="inline-flex rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
                    >
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
    </>
  );
}