"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import type { ReactNode } from "react";

type Tipo = "exito" | "error" | "info";

type Toast = {
  id: number;
  mensaje: string;
  tipo: Tipo;
};

type ToastContextValue = {
  mostrar: (mensaje: string, tipo?: Tipo) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const ESTILOS: Record<Tipo, string> = {
  exito: "border-green-200 bg-green-50 text-green-800",
  error: "border-red-200 bg-red-50 text-red-800",
  info: "border-zinc-200 bg-white text-zinc-800",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const mostrar = useCallback((mensaje: string, tipo: Tipo = "info") => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, mensaje, tipo }]);
    setTimeout(() => {
      setToasts((t) => t.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ mostrar }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tipo === "error" ? "alert" : "status"}
            className={`pointer-events-auto max-w-sm rounded-md border px-4 py-3 text-center text-sm font-medium shadow-sm ${ESTILOS[toast.tipo]}`}
          >
            {toast.mensaje}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast debe usarse dentro de ToastProvider");
  }
  return ctx;
}