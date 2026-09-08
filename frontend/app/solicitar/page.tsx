"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { calcularPrePresupuesto, MULTIPLICADORES, type EstadoEspacio } from "@/lib/estimacion";
import { supabase } from "@/lib/supabaseClient";

type TipoServicio = {
  id: number;
  nombre: string;
  tarifa_base: number;
  tarifa_por_m2: number;
};

const ESTADOS_ESPACIO: Record<string, string> = {
  mantenimiento_regular: "Mantenimiento regular",
  maleza_alta: "Maleza alta",
  abandono_total: "Abandono total",
};

const TIPOS_PROPIEDAD: Record<string, string> = {
  casa: "Casa",
  apartamento: "Departamento",
  local_comercial: "Local comercial",
  otro: "Otro",
};

const TURNOS: Record<string, string> = {
  manana: "Mañana",
  tarde: "Tarde",
};

export default function SolicitarPage() {
  const router = useRouter();

  const [servicios, setServicios] = useState<TipoServicio[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [proveedor, setProveedor] = useState<{ id: string; nombre: string } | null>(null);
  const [sinProveedor, setSinProveedor] = useState(false);

  const [direccion, setDireccion] = useState("");
  const [tipoPropiedad, setTipoPropiedad] = useState("casa");
  const [idServicio, setIdServicio] = useState<number | null>(null);
  const [metros, setMetros] = useState("");
  const [estadoEspacio, setEstadoEspacio] = useState("mantenimiento_regular");
  const [fecha, setFecha] = useState("");
  const [turno, setTurno] = useState("manana");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successId, setSuccessId] = useState<number | null>(null);

  const servicio = servicios.find((s) => s.id === idServicio);
  const m2 = Number.parseFloat(metros) || 0;
  const prePresupuesto = servicio
    ? calcularPrePresupuesto(
        servicio.tarifa_base,
        servicio.tarifa_por_m2,
        m2,
        estadoEspacio
      )
    : 0;

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

      const { data: serviciosData } = await supabase
        .from("tipos_servicio")
        .select("id, nombre, tarifa_base, tarifa_por_m2")
        .order("id");
      setServicios(serviciosData ?? []);
      if (serviciosData && serviciosData.length > 0) {
        setIdServicio(serviciosData[0].id);
      }

      const { data: proveedorData } = await supabase
        .from("perfiles")
        .select("id, nombre")
        .eq("rol", "proveedor")
        .limit(1);
      if (proveedorData && proveedorData.length > 0) {
        setProveedor(proveedorData[0]);
      } else {
        setSinProveedor(true);
      }
    })();
  }, [router]);

  const inputClass =
    "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none";
  const labelClass = "mb-1 block text-sm font-medium text-zinc-700";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessId(null);

    if (!userId) return;
    if (!proveedor) {
      setError("Aún no hay proveedores registrados.");
      setLoading(false);
      return;
    }
    if (idServicio === null) return;

    setLoading(true);

    const metrosNumber = Number.parseFloat(metros);
    if (!direccion || !metrosNumber || !fecha) {
      setError("Completá dirección, metros cuadrados y fecha.");
      setLoading(false);
      return;
    }

    const { data: existente } = await supabase
      .from("propiedades")
      .select("id")
      .eq("id_cliente", userId)
      .eq("direccion", direccion)
      .eq("tipo_propiedad", tipoPropiedad)
      .eq("metros_cuadrados", metrosNumber)
      .limit(1);

    let idPropiedad: number;
    if (existente && existente.length > 0) {
      idPropiedad = existente[0].id;
    } else {
      const { data: nueva, error: propError } = await supabase
        .from("propiedades")
        .insert({
          id_cliente: userId,
          direccion,
          tipo_propiedad: tipoPropiedad,
          metros_cuadrados: metrosNumber,
        })
        .select("id")
        .single();
      if (propError) {
        setError(propError.message);
        setLoading(false);
        return;
      }
      idPropiedad = nueva.id;
    }

    const { data: solicitud, error: solError } = await supabase
      .from("solicitudes_presupuesto")
      .insert({
        id_cliente: userId,
        id_proveedor: proveedor.id,
        id_propiedad: idPropiedad,
        id_tipo_servicio: idServicio,
        estado_espacio: estadoEspacio,
        fecha_deseada: fecha,
        turno,
        pre_presupuesto: Number(prePresupuesto.toFixed(2)),
      })
      .select("id")
      .single();

    if (solError) {
      setError(solError.message);
      setLoading(false);
      return;
    }

    setSuccessId(solicitud.id);
    setLoading(false);
  }

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Solicitar presupuesto
        </h1>
        <Link
          href="/mis-solicitudes"
          className="text-sm font-medium text-zinc-900 hover:underline"
        >
          Mis solicitudes
        </Link>
      </div>
      <p className="mt-1 text-sm text-zinc-500">
        Completá los datos de tu propiedad. El pre-presupuesto se calcula
        automáticamente.
      </p>

      {sinProveedor && (
        <p className="mt-6 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          Todavía no hay ningún proveedor registrado. Registrate un proveedor
          primero (o pedile a otro usuario que se registre con rol proveedor)
          para poder enviar solicitudes.
        </p>
      )}

      {successId !== null && (
        <div className="mt-6 rounded-md border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">
            Solicitud enviada con éxito.
          </p>
          <p className="mt-1 text-sm text-green-700">
            Número de solicitud:{" "}
            <span className="font-semibold">#{successId}</span>
          </p>
          <Link
            href="/mis-solicitudes"
            className="mt-3 inline-block text-sm font-medium text-green-800 hover:underline"
          >
            Ver mis solicitudes
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <div>
          <label htmlFor="servicio" className={labelClass}>
            Tipo de servicio
          </label>
          <select
            id="servicio"
            className={inputClass}
            value={idServicio ?? ""}
            onChange={(e) => setIdServicio(Number(e.target.value))}
            disabled={servicios.length === 0}
          >
            {servicios.length === 0 && <option value="">Cargando…</option>}
            {servicios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="direccion" className={labelClass}>
            Dirección
          </label>
          <input
            id="direccion"
            type="text"
            required
            placeholder="Calle y número"
            className={inputClass}
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="tipoPropiedad" className={labelClass}>
            Tipo de propiedad
          </label>
          <select
            id="tipoPropiedad"
            className={inputClass}
            value={tipoPropiedad}
            onChange={(e) => setTipoPropiedad(e.target.value)}
          >
            {Object.entries(TIPOS_PROPIEDAD).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="metros" className={labelClass}>
            Metros cuadrados
          </label>
          <input
            id="metros"
            type="number"
            min="0"
            step="any"
            required
            placeholder="Ej. 85"
            className={inputClass}
            value={metros}
            onChange={(e) => setMetros(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="estado" className={labelClass}>
            Estado del espacio
          </label>
          <select
            id="estado"
            className={inputClass}
            value={estadoEspacio}
            onChange={(e) => setEstadoEspacio(e.target.value)}
          >
            {Object.entries(ESTADOS_ESPACIO).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="fecha" className={labelClass}>
            Fecha deseada
          </label>
          <input
            id="fecha"
            type="date"
            required
            className={inputClass}
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="turno" className={labelClass}>
            Turno
          </label>
          <select
            id="turno"
            className={inputClass}
            value={turno}
            onChange={(e) => setTurno(e.target.value)}
          >
            {Object.entries(TURNOS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || sinProveedor}
          className="mt-2 rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
        >
          {loading ? "Enviando..." : "Enviar solicitud"}
        </button>
      </form>

      <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm text-zinc-500">
          Pre-presupuesto estimado ({ESTADOS_ESPACIO[estadoEspacio].toLowerCase()}:
          <span className="font-medium text-zinc-700"> ×{MULTIPLICADORES[estadoEspacio as EstadoEspacio]}</span> )
        </p>
        <p className="mt-1 text-2xl font-semibold text-zinc-900">
          ${prePresupuesto.toFixed(2)}
        </p>
        {servicio && (
          <p className="mt-2 text-xs text-zinc-500">
            Tarifa base ${servicio.tarifa_base} + $
            {servicio.tarifa_por_m2.toFixed(2)}/m². El proveedor podrá confirmar
            o ajustar el precio final antes de enviártelo.
          </p>
        )}
      </div>
    </main>
    </>
  );
}