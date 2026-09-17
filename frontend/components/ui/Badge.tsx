"use client";

type Estado = "solicitado" | "revisado" | "aprobado" | "rechazado";

const ESTILOS: Record<Estado, string> = {
  solicitado: "bg-blue-100 text-blue-700",
  revisado: "bg-amber-100 text-amber-700",
  aprobado: "bg-green-100 text-green-700",
  rechazado: "bg-red-100 text-red-700",
};

export default function Badge({ estado }: { estado: string }) {
  const clase = ESTILOS[estado as Estado] ?? "bg-zinc-100 text-zinc-600";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${clase}`}
    >
      {estado}
    </span>
  );
}