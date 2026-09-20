export const MENSAJE_ERROR_RED = "Ocurrió un error, intenta de nuevo.";

const MAPEO: Array<[RegExp, string]> = [
  [/Invalid login credentials/i, "Correo o contraseña incorrectos."],
  [/User already registered/i, "Ya existe una cuenta con ese correo electrónico."],
  [/Email not confirmed/i, "Falta confirmar tu correo electrónico."],
  [/Password should be at least/i, "La contraseña debe tener al menos 6 caracteres."],
  [/duplicate key value violates unique constraint/i, "Ese valor ya está registrado."],
  [/Could not find the record/i, "No se encontró el registro."],
  [/Unauthorized/i, "No tenés permisos para realizar esta acción."],
  [/Failed to fetch/i, MENSAJE_ERROR_RED],
  [/NetworkError|Network Error/i, MENSAJE_ERROR_RED],
  [/fetch failed/i, MENSAJE_ERROR_RED],
];

export function traducirError(mensaje: string): string {
  for (const [regex, es] of MAPEO) {
    if (regex.test(mensaje)) return es;
  }
  return MENSAJE_ERROR_RED;
}

export function mensajeDeError(
  error: { message?: string } | null | undefined
): string {
  return traducirError(error?.message ?? "Ocurrió un error inesperado.");
}