"use client";

import { useState } from "react";

const TARIFAS: Record<string, { label: string; base: number; porM2: number }> = {
  limpieza: { label: "Limpieza residencial", base: 20, porM2: 0.8 },
  jardineria: { label: "Jardinería", base: 15, porM2: 0.5 },
};

const ESTADOS: Record<string, { label: string; multiplicador: number }> = {
  regular: { label: "Mantenimiento regular", multiplicador: 1.0 },
  maleza_alta: { label: "Maleza alta", multiplicador: 1.3 },
  abandono_total: { label: "Abandono total", multiplicador: 1.6 },
};

const TURNOS: Record<string, string> = {
  manana: "Mañana",
  tarde: "Tarde",
};

export default function SolicitarPage() {
  const [servicio, setServicio] = useState("limpieza");
  const [metros, setMetros] = useState("");
  const [estado, setEstado] = useState("regular");
  const [fecha, setFecha] = useState("");
  const [turno, setTurno] = useState("manana");

  const m2 = Number.parseFloat(metros) || 0;
  const { base, porM2 } = TARIFAS[servicio];
  const { multiplicador } = ESTADOS[estado];
  const prePresupuesto = (base + porM2 * m2) * multiplicador;

  const inputClass =
    "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none";
  const labelClass = "mb-1 block text-sm font-medium text-zinc-700";

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">
        Solicitar presupuesto
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Completá los datos de tu propiedad. El pre-presupuesto se calcula
        automáticamente.
      </p>

      <form className="mt-8 flex flex-col gap-4">
        <div>
          <label htmlFor="servicio" className={labelClass}>
            Tipo de servicio
          </label>
          <select
            id="servicio"
            className={inputClass}
            value={servicio}
            onChange={(e) => setServicio(e.target.value)}
          >
            {Object.entries(TARIFAS).map(([value, t]) => (
              <option key={value} value={value}>
                {t.label}
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
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          >
            {Object.entries(ESTADOS).map(([value, s]) => (
              <option key={value} value={value}>
                {s.label}
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
            {Object.entries(TURNOS).map(([value, t]) => (
              <option key={value} value={value}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </form>

      <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm text-zinc-500">
          Pre-presupuesto estimado ({" "}
          {ESTADOS[estado].label.toLowerCase()}:
          <span className="font-medium text-zinc-700"> ×{multiplicador}</span> )
        </p>
        <p className="mt-1 text-2xl font-semibold text-zinc-900">
          ${prePresupuesto.toFixed(2)}
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Tarifa base ${base} + ${porM2.toFixed(2)}/m². El proveedor podrá
          confirmar o ajustar el precio final antes de enviártelo.
        </p>
      </div>
    </main>
  );
}