const formateadorMoneda = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
});

const formateadorFecha = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatearMoneda(valor: number): string {
  return formateadorMoneda.format(valor);
}

export function formatearFecha(iso: string): string {
  const [anio, mes, dia] = iso.split("-").map(Number);
  if (!anio || !mes || !dia) return iso;
  return formateadorFecha.format(new Date(anio, mes - 1, dia));
}
