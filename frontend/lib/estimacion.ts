export type EstadoEspacio =
  | "mantenimiento_regular"
  | "maleza_alta"
  | "abandono_total";

export const MULTIPLICADORES: Record<EstadoEspacio, number> = {
  mantenimiento_regular: 1.0,
  maleza_alta: 1.3,
  abandono_total: 1.6,
};

export function calcularPrePresupuesto(
  tarifaBase: number,
  tarifaPorM2: number,
  metrosCuadrados: number,
  estadoEspacio: string
): number {
  const multiplicador = MULTIPLICADORES[estadoEspacio as EstadoEspacio];
  if (multiplicador === undefined) {
    throw new Error(`Estado de espacio inválido: "${estadoEspacio}"`);
  }
  return (tarifaBase + tarifaPorM2 * metrosCuadrados) * multiplicador;
}