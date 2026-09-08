import { describe, expect, it } from "vitest";
import { calcularPrePresupuesto } from "./estimacion";

describe("calcularPrePresupuesto", () => {
  const base = 20;
  const porM2 = 0.8;

  it("aplica el multiplicador 1.0 para mantenimiento_regular", () => {
    expect(calcularPrePresupuesto(base, porM2, 100, "mantenimiento_regular")).toBe(100);
  });

  it("aplica el multiplicador 1.3 para maleza_alta", () => {
    expect(calcularPrePresupuesto(base, porM2, 100, "maleza_alta")).toBeCloseTo(130, 10);
  });

  it("aplica el multiplicador 1.6 para abandono_total", () => {
    expect(calcularPrePresupuesto(base, porM2, 100, "abandono_total")).toBeCloseTo(160, 10);
  });

  it("con 0 metros cuadrados devuelve solo la tarifa base (× multiplicador)", () => {
    expect(calcularPrePresupuesto(base, porM2, 0, "mantenimiento_regular")).toBe(20);
  });

  it("maneja correctamente metros cuadrados con decimales", () => {
    const resultado = calcularPrePresupuesto(base, porM2, 85.5, "mantenimiento_regular");
    expect(resultado).toBeCloseTo(20 + 0.8 * 85.5, 10);
  });

  it("lanza un error explícito para un estado_espacio inválido", () => {
    expect(() =>
      calcularPrePresupuesto(base, porM2, 100, "estado_invalido")
    ).toThrow(/estado de espacio inválido/i);
  });
});