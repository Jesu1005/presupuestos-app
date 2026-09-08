"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function RegistroPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [rol, setRol] = useState<"cliente" | "proveedor">("cliente");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const inputClass =
    "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none";
  const labelClass = "mb-1 block text-sm font-medium text-zinc-700";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError("No se pudo crear el usuario.");
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from("perfiles").insert({
      id: data.user.id,
      rol,
      nombre,
      telefono,
    });

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    router.push(rol === "cliente" ? "/solicitar" : "/proveedor");
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Crear cuenta</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Registrate para solicitar o responder presupuestos.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <div>
          <label htmlFor="nombre" className={labelClass}>
            Nombre
          </label>
          <input
            id="nombre"
            type="text"
            required
            placeholder="Tu nombre"
            className={inputClass}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="telefono" className={labelClass}>
            Teléfono
          </label>
          <input
            id="telefono"
            type="tel"
            placeholder="Opcional"
            className={inputClass}
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            required
            placeholder="correo@ejemplo.com"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            placeholder="Mínimo 6 caracteres"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="rol" className={labelClass}>
            Rol
          </label>
          <select
            id="rol"
            className={inputClass}
            value={rol}
            onChange={(e) => setRol(e.target.value as "cliente" | "proveedor")}
          >
            <option value="cliente">Cliente</option>
            <option value="proveedor">Proveedor</option>
          </select>
        </div>

        {error && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
        >
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        ¿Ya tenés cuenta?{" "}
        <a href="/login" className="font-medium text-zinc-900 hover:underline">
          Iniciar sesión
        </a>
      </p>
    </main>
  );
}
