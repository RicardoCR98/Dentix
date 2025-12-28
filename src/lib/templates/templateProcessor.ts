// src/lib/templates/templateProcessor.ts

export interface TemplateContext {
  patient: {
    name: string;
    age: number;
    doc_id: string;
    phone: string;
  };
  date: {
    today: string;
    time: string;
  };
  doctor: {
    name: string;
  };
  tooth?: string;
  procedure?: string;
  amount?: string;
}

/**
 * Procesa una plantilla reemplazando los placeholders con valores del contexto.
 * Si un placeholder no tiene valor, se deja vacío.
 *
 * Variables disponibles (en español, con una sola llave):
 * - {nombre} - nombre del paciente
 * - {edad} - edad del paciente
 * - {cedula} - cédula/documento del paciente
 * - {telefono} - teléfono del paciente
 * - {fecha} - fecha de hoy
 * - {hora} - hora actual
 * - {doctor} - nombre del doctor
 * - {pieza} - número de pieza dental
 * - {procedimiento} - nombre del procedimiento
 * - {monto} - monto/cantidad
 */
export function processTemplate(
  templateBody: string,
  context: TemplateContext
): string {
  let result = templateBody;

  // Reemplazar todas las variables (español, una sola llave)
  const replacements: Record<string, string> = {
    '{nombre}': context.patient.name,
    '{edad}': String(context.patient.age),
    '{cedula}': context.patient.doc_id,
    '{telefono}': context.patient.phone,
    '{fecha}': context.date.today,
    '{hora}': context.date.time,
    '{doctor}': context.doctor.name,
    '{pieza}': context.tooth || '',
    '{procedimiento}': context.procedure || '',
    '{monto}': context.amount || '',
  };

  for (const [placeholder, value] of Object.entries(replacements)) {
    result = result.replaceAll(placeholder, value);
  }

  // Si quedan placeholders sin resolver, dejarlos tal cual
  // (el doctor los verá y podrá editarlos manualmente)

  return result;
}

/**
 * Calcula la edad a partir de una fecha de nacimiento
 */
export function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Formatea la fecha actual en formato DD/MM/YYYY
 */
export function formatTodayDate(): string {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formatea la hora actual en formato HH:MM
 */
export function formatCurrentTime(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
