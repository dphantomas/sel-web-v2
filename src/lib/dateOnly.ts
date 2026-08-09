// Fechas "de calendario" (sin hora), como las de un encuentro o una instancia
// de curso: se guardan ancladas a medianoche UTC (`new Date("2026-07-19")`).
// `new Date(x)` + getters/format locales corre el día mostrado en husos
// horarios negativos como Argentina (UTC-3): medianoche UTC del domingo 19 cae
// el sábado 18 a las 21:00 hora local. Estos helpers operan siempre en UTC
// para evitar ese corrimiento.

export function formatDateOnly(value: string | Date, options: Intl.DateTimeFormatOptions): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("es-AR", { ...options, timeZone: "UTC" });
}

// Sólo la primera letra: CSS `capitalize` pone en mayúscula cada palabra
// ("Domingo, 19 De Julio De 2026" en vez de "Domingo, 19 de julio de 2026").
export function capitalizeFirst(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function addDaysToDateOnly(value: string | Date, days: number): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const shifted = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
  return shifted.toISOString().slice(0, 10);
}

export function toDateInputValue(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
}

// Próximo domingo a partir de hoy (hoy en el huso horario del navegador del
// admin, no una fecha guardada, así que sí es correcto usar getters locales).
export function nextSundayFromToday(): string {
  const today = new Date();
  const daysUntilSunday = (7 - today.getDay()) % 7;
  const target = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() + daysUntilSunday));
  return target.toISOString().slice(0, 10);
}

// Trunca una fecha "de calendario" ya anclada a medianoche UTC (p.ej.
// `Meeting.date`) a esa misma medianoche, usando getters UTC para no
// correrla de día.
function toUTCDateOnly(value: string | Date): Date {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

const APP_TIMEZONE = "America/Argentina/Buenos_Aires";

// A diferencia de `Meeting.date`, `GroupMember.joinedAt` es un timestamp real
// (`DateTime @default(now())`) tomado en el momento exacto en que se agregó
// al miembro. Truncarlo con getters UTC corre el día para cualquier alta
// hecha entre las 21:00 y las 23:59 hora Argentina (UTC-3): esa hora local
// ya cae en el día siguiente en UTC. Para comparar contra una fecha de
// calendario hay que ubicar primero el timestamp en la zona horaria de la
// app y recién ahí tomar el día.
function toAppCalendarDay(value: string | Date): Date {
  const date = typeof value === "string" ? new Date(value) : value;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  return new Date(Date.UTC(year, month - 1, day));
}

// Un miembro sólo es parte del "roster" de un encuentro si ya se había unido
// al grupo ese día (se une el mismo día del encuentro = cuenta). Encuentros
// anteriores a su alta no lo incluyen, aunque siga siendo miembro hoy.
export function wasMemberAtMeeting(joinedAt: string | Date, meetingDate: string | Date): boolean {
  return toAppCalendarDay(joinedAt).getTime() <= toUTCDateOnly(meetingDate).getTime();
}
