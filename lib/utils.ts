import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isToday, isYesterday, isTomorrow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEE, MMM d");
}

export function formatDateFull(dateStr: string): string {
  return format(parseISO(dateStr), "EEEE, MMMM d");
}

export function toDateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function todayString(): string {
  return toDateString(new Date());
}

export function addDays(dateStr: string, days: number): string {
  const date = parseISO(dateStr);
  date.setDate(date.getDate() + days);
  return toDateString(date);
}

export function formatCalories(cal: number): string {
  return Math.round(cal).toLocaleString();
}

export function formatProtein(protein: number): string {
  return Math.round(protein * 10) / 10 + "g";
}
