const MAPEO: Array<[RegExp, string]> = [
  [/Invalid login credentials/i, "Correo o contraseña incorrectos."],
  [/User already registered/i, "Ya existe una cuenta con ese correo electrónico."],
  [/Email not confirmed/i, "Falta confirmar tu correo electrónico."],
  [/Password should be at least/i, "La contraseña debe tener al menos 6 caracteres."],
  [/duplicate key value violates unique constraint/i, "Ese valor ya está registrado."],
  [/Could not find the record/i, "No se encontró el registro."],
  [/Unauthorized/i, "No tenés permisos para realizar esta acción."],
];

export function traducirError(mensaje: string): string {
  for (const [regex, es] of MAPEO) {
    if (regex.test(mensaje)) return es;
  }
  return mensaje;
}

export function mensajeDeError(
  error: { message?: string } | null | undefined
): string {
  return traducirError(error?.message ?? "Ocurrió un error inesperado.");
}