import { Check, Clock, AlertTriangle, X, LogOut } from "lucide-react";

export type AttendanceStatus = "Presente" | "Tarde" | "MuyTarde" | "Ausente" | "SeFueAntes";

export const STATUS_CONFIG: {
  value: AttendanceStatus;
  label: string;
  shortLabel: string;
  icon: typeof Check;
  solid: string;
  card: string;
}[] = [
  {
    value: "Presente",
    label: "Presente",
    shortLabel: "Presente",
    icon: Check,
    solid: "bg-emerald-500 text-white",
    card: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900",
  },
  {
    value: "Tarde",
    label: "Tarde",
    shortLabel: "Tarde",
    icon: Clock,
    solid: "bg-amber-500 text-white",
    card: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900",
  },
  {
    value: "MuyTarde",
    label: "Muy tarde",
    shortLabel: "M. tarde",
    icon: AlertTriangle,
    solid: "bg-orange-600 text-white",
    card: "bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900",
  },
  {
    value: "Ausente",
    label: "Ausente",
    shortLabel: "Ausente",
    icon: X,
    solid: "bg-red-500 text-white",
    card: "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900",
  },
  {
    value: "SeFueAntes",
    label: "Se fue antes",
    shortLabel: "Se fue",
    icon: LogOut,
    solid: "bg-sky-500 text-white",
    card: "bg-sky-50 border-sky-200 dark:bg-sky-950/20 dark:border-sky-900",
  },
];

export function statusConfig(status: AttendanceStatus | null) {
  return STATUS_CONFIG.find((c) => c.value === status) ?? null;
}
