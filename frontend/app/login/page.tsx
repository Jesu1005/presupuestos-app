"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Button from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { mensajeDeError } from "@/lib/errors";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { mostrar } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data, error: authError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      mostrar(mensajeDeError(authError), "error");
      setLoading(false);
      return;
    }

    const { data: perfil, error: perfilError } = await supabase
      .from("perfiles")
      .select("rol")
      .eq("id", data.user.id)
      .single();

    if (perfilError || !perfil) {
      mostrar("No se pudo obtener el perfil del usuario.", "error");
      setLoading(false);
      return;
    }

    router.push(perfil.rol === "cliente" ? "/solicitar" : "/proveedor");
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
        Iniciar sesión
      </h1>
      <p className="mt-1 text-center text-sm text-zinc-500">
        Ingresá con tu correo y contraseña.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
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
            placeholder="Tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        <Button type="submit" disabled={loading} className="mt-2">
          {loading ? "Ingresando..." : "Iniciar sesión"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        ¿No tenés cuenta?{" "}
        <a
          href="/registro"
          className="font-medium text-zinc-900 hover:underline"
        >
          Crear cuenta
        </a>
      </p>
      </main>
    </>
  );
}