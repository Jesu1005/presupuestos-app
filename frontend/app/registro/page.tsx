"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Button from "@/components/ui/Button";
import { Field, Select, TextInput } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { mensajeDeError } from "@/lib/errors";
import { supabase } from "@/lib/supabaseClient";

export default function RegistroPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [rol, setRol] = useState<"cliente" | "proveedor">("cliente");
  const [loading, setLoading] = useState(false);
  const { mostrar } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      mostrar(mensajeDeError(authError), "error");
      setLoading(false);
      return;
    }

    if (!data.user) {
      mostrar("No se pudo crear el usuario.", "error");
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from("perfiles").insert({
      id: data.user.id,
      rol,
      nombre,
      telefono,
      email,
    });

    if (profileError) {
      mostrar(mensajeDeError(profileError), "error");
      setLoading(false);
      return;
    }

    router.push(rol === "cliente" ? "/solicitar" : "/proveedor");
  }

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icon.svg"
        alt="Presupuestos"
        className="mx-auto h-16 w-16 rounded-2xl shadow-sm"
      />
      <h1 className="mt-4 text-center text-2xl font-semibold text-zinc-900">
        Crear cuenta
      </h1>
      <p className="mt-1 text-center text-sm text-zinc-500">
        Registrate para solicitar o responder presupuestos.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <Field label="Nombre" htmlFor="nombre">
          <TextInput
            id="nombre"
            type="text"
            required
            placeholder="Tu nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </Field>

        <Field label="Teléfono" htmlFor="telefono">
          <TextInput
            id="telefono"
            type="tel"
            placeholder="Opcional"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
        </Field>

        <Field label="Correo electrónico" htmlFor="email">
          <TextInput
            id="email"
            type="email"
            required
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field label="Contraseña" htmlFor="password">
          <TextInput
            id="password"
            type="password"
            required
            minLength={6}
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        <Field label="Rol" htmlFor="rol">
          <Select
            id="rol"
            value={rol}
            onChange={(e) => setRol(e.target.value as "cliente" | "proveedor")}
          >
            <option value="cliente">Cliente</option>
            <option value="proveedor">Proveedor</option>
          </Select>
        </Field>

        <Button type="submit" disabled={loading} className="mt-2">
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        ¿Ya tenés cuenta?{" "}
        <a href="/login" className="font-medium text-zinc-900 hover:underline">
          Iniciar sesión
        </a>
      </p>
      </main>
    </>
  );
}