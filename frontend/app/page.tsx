import Link from "next/link";
import Header from "@/components/Header";

const PASOS = [
  {
    numero: "1",
    titulo: "Pedí tu presupuesto",
    descripcion:
      "Completá los datos de tu propiedad: servicio, metros, estado del espacio y fecha.",
  },
  {
    numero: "2",
    titulo: "Recibí el estimado al instante",
    descripcion:
      "El pre-presupuesto se calcula automáticamente al momento, sin esperar.",
  },
  {
    numero: "3",
    titulo: "Confirmá con el proveedor",
    descripcion:
      "El proveedor revisa tu solicitud, ajusta el precio si hace falta y lo confirmás.",
  },
];

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <section className="bg-gradient-to-b from-emerald-50 via-white to-white">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center px-4 py-20 text-center sm:py-28">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icon.svg"
              alt="Presupuestos"
              className="h-16 w-16 rounded-2xl shadow-sm"
            />
            <p className="mt-5 text-sm font-medium uppercase tracking-wide text-emerald-700">
              Limpieza residencial y jardinería
            </p>
            <h1 className="mt-3 max-w-xl text-4xl font-semibold leading-tight tracking-tight text-zinc-900 sm:text-5xl">
              Presupuestos claros para tu hogar, sin esperar al técnico
            </h1>
            <p className="mt-4 max-w-lg text-lg text-zinc-600">
              Contanos cómo está tu espacio y recibí un estimado al instante.
              Un proveedor lo revisa y te confirma el precio antes de empezar.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/solicitar"
                className="inline-flex h-12 items-center justify-center rounded-md bg-emerald-600 px-6 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
              >
                Solicitar presupuesto
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-md border border-zinc-300 bg-white px-6 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
              >
                Ingresar
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-zinc-200 bg-zinc-50">
          <div className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-14 sm:grid-cols-3">
            {PASOS.map((paso) => (
              <div key={paso.numero} className="flex flex-col gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">
                  {paso.numero}
                </span>
                <h2 className="text-base font-semibold text-zinc-900">
                  {paso.titulo}
                </h2>
                <p className="text-sm leading-6 text-zinc-600">
                  {paso.descripcion}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}