"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Button from "@/components/ui/Button";
import { Field, Select, TextInput } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { mensajeDeError } from "@/lib/errors";
import { calcularPrePresupuesto, MULTIPLICADORES, type EstadoEspacio } from "@/lib/estimacion";
import { formatearMoneda } from "@/lib/format";
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

function hoyISO(): string {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

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

  const [loading, setLoading] = useState(false);
  const { mostrar } = useToast();

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!userId) return;
    if (!proveedor) {
      mostrar("Aún no hay proveedores registrados.", "error");
      return;
    }
    if (idServicio === null) return;

    setLoading(true);

    const metrosNumber = Number.parseFloat(metros);
    if (!direccion || !metrosNumber || !fecha) {
      mostrar("Completá dirección, metros cuadrados y fecha.", "error");
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
        mostrar(mensajeDeError(propError), "error");
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
      mostrar(mensajeDeError(solError), "error");
      setLoading(false);
      return;
    }

    mostrar(`Solicitud #${solicitud.id} enviada con éxito.`, "exito");
    setLoading(false);
    router.push("/mis-solicitudes");
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

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <Field label="Tipo de servicio" htmlFor="servicio">
          <Select
            id="servicio"
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
          </Select>
        </Field>

        <Field label="Dirección" htmlFor="direccion">
          <TextInput
            id="direccion"
            type="text"
            required
            placeholder="Calle y número"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
          />
        </Field>

        <Field label="Tipo de propiedad" htmlFor="tipoPropiedad">
          <Select
            id="tipoPropiedad"
            value={tipoPropiedad}
            onChange={(e) => setTipoPropiedad(e.target.value)}
          >
            {Object.entries(TIPOS_PROPIEDAD).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Metros cuadrados" htmlFor="metros">
          <TextInput
            id="metros"
            type="number"
            min="0"
            step="any"
            required
            placeholder="Ej. 85"
            value={metros}
            onChange={(e) => setMetros(e.target.value)}
          />
        </Field>

        <Field label="Estado del espacio" htmlFor="estado">
          <Select
            id="estado"
            value={estadoEspacio}
            onChange={(e) => setEstadoEspacio(e.target.value)}
          >
            {Object.entries(ESTADOS_ESPACIO).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Fecha deseada" htmlFor="fecha">
          <TextInput
            id="fecha"
            type="date"
            required
            min={hoyISO()}
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </Field>

        <Field label="Turno" htmlFor="turno">
          <Select
            id="turno"
            value={turno}
            onChange={(e) => setTurno(e.target.value)}
          >
            {Object.entries(TURNOS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        <Button
          type="submit"
          disabled={loading || sinProveedor}
          className="mt-2"
        >
          {loading ? "Enviando..." : "Enviar solicitud"}
        </Button>
      </form>

      <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-4">
        <p className="text-sm text-zinc-500">
          Pre-presupuesto estimado ({ESTADOS_ESPACIO[estadoEspacio].toLowerCase()}:
          <span className="font-medium text-zinc-700"> ×{MULTIPLICADORES[estadoEspacio as EstadoEspacio]}</span> )
        </p>
        <p className="mt-1 text-2xl font-semibold text-zinc-900">
          {formatearMoneda(prePresupuesto)}
        </p>
        {servicio && (
          <p className="mt-2 text-xs text-zinc-500">
            Tarifa base {formatearMoneda(servicio.tarifa_base)} +{" "}
            {formatearMoneda(servicio.tarifa_por_m2)}/m². El proveedor podrá
            confirmar o ajustar el precio final antes de enviártelo.
          </p>
        )}
      </div>
    </main>
    </>
  );
}