import {
  startOfWeek,
  endOfWeek,
  format,
  subWeeks,
  getISOWeek,
  getISOWeekYear,
  parseISO,
} from 'date-fns';
import { ar } from 'date-fns/locale';

// We consider Sunday as the start of the week (default in date-fns startOfWeek with weekStartsOn: 0)
const WEEK_STARTS_ON = 0;

export function getCurrentWeekId(date: Date = new Date()): string {
  const year = getISOWeekYear(date);
  const week = getISOWeek(date);
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

export function getPreviousWeekId(date: Date = new Date()): string {
  const prevWeekDate = subWeeks(date, 1);
  return getCurrentWeekId(prevWeekDate);
}

export function getWeekDateRange(date: Date = new Date()): { start: string; end: string } {
  const start = startOfWeek(date, { weekStartsOn: WEEK_STARTS_ON });
  const end = endOfWeek(date, { weekStartsOn: WEEK_STARTS_ON });
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export function formatDate(isoString: string): string {
  if (!isoString) return '';
  return format(parseISO(isoString), 'dd MMMM yyyy', { locale: ar });
}

export function formatShortDate(isoString: string): string {
  if (!isoString) return '';
  return format(parseISO(isoString), 'dd MMM', { locale: ar });
}
