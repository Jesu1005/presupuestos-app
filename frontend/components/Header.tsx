"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";

type Rol = "cliente" | "proveedor" | null;

const LINKS: Record<"cliente" | "proveedor", { href: string; label: string }[]> =
  {
    cliente: [
      { href: "/solicitar", label: "Solicitar" },
      { href: "/mis-solicitudes", label: "Mis solicitudes" },
    ],
    proveedor: [{ href: "/proveedor", label: "Solicitudes" }],
  };

function NavLink({ href, label, activo }: { href: string; label: string; activo: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        activo
          ? "bg-emerald-50 text-emerald-800"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
      }`}
    >
      {label}
    </Link>
  );
}

function Inicial({ nombre }: { nombre: string }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">
      {nombre.trim().charAt(0).toUpperCase()}
    </span>
  );
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [rol, setRol] = useState<Rol>(null);
  const [nombre, setNombre] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const esInicio = pathname === "/";

  useEffect(() => {
    let activo = true;

    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!activo) return;

        if (!user) {
          setRol(null);
          setNombre(null);
          return;
        }

        const { data } = await supabase
          .from("perfiles")
          .select("rol, nombre")
          .eq("id", user.id)
          .single();

        if (activo) {
          setRol(data?.rol === "proveedor" ? "proveedor" : "cliente");
          setNombre(data?.nombre ?? null);
        }
      } catch {
        if (activo) {
          setRol(null);
          setNombre(null);
        }
      } finally {
        if (activo) setCargando(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && activo) {
        setRol(null);
        setNombre(null);
        setCargando(false);
      }
    });

    return () => {
      activo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function cerrarSesion() {
    try {
      await supabase.auth.signOut();
    } finally {
      setRol(null);
      setNombre(null);
      router.push("/");
    }
  }

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-bold tracking-tight text-emerald-700"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="" className="h-7 w-7" />
          Presupuestos
        </Link>

        <nav className="flex items-center gap-1">
          {cargando ? null : rol && !esInicio ? (
            <>
              <div className="mr-1 flex items-center gap-2">
                <Inicial nombre={nombre ?? ""} />
                <span className="hidden max-w-40 truncate text-sm font-medium text-zinc-800 md:block">
                  {nombre}
                </span>
              </div>
              {LINKS[rol].map((link) => (
                <NavLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  activo={pathname === link.href}
                />
              ))}
              <Button
                variant="secondary"
                size="sm"
                onClick={cerrarSesion}
                className="ml-1"
              >
                Cerrar sesión
              </Button>
            </>
          ) : (
            <>
              <NavLink href="/login" label="Ingresar" activo={pathname === "/login"} />
              <NavLink
                href="/registro"
                label="Crear cuenta"
                activo={pathname === "/registro"}
              />
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
