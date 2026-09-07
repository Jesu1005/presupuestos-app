const SOLICITUDES = [
  {
    id: 1,
    cliente: "María López",
    servicio: "Limpieza residencial",
    prePresupuesto: 84.0,
    estado: "solicitado",
  },
  {
    id: 2,
    cliente: "Carlos Fernández",
    servicio: "Jardinería",
    prePresupuesto: 195.0,
    estado: "revisado",
  },
  {
    id: 3,
    cliente: "Ana Gómez",
    servicio: "Limpieza residencial",
    prePresupuesto: 160.0,
    estado: "aprobado",
  },
] as const;

const BADGES: Record<string, string> = {
  solicitado: "bg-blue-100 text-blue-700",
  revisado: "bg-amber-100 text-amber-700",
  aprobado: "bg-green-100 text-green-700",
  rechazado: "bg-red-100 text-red-700",
};

export default function ProveedorPage() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Solicitudes</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Solicitudes de presupuesto recibidas como proveedor.
      </p>

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
            {SOLICITUDES.map((s) => (
              <tr key={s.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3 font-medium text-zinc-900">
                  {s.cliente}
                </td>
                <td className="px-4 py-3 text-zinc-600">{s.servicio}</td>
                <td className="px-4 py-3 text-zinc-600">
                  ${s.prePresupuesto.toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${BADGES[s.estado]}`}
                  >
                    {s.estado}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100">
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}