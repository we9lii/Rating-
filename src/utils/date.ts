import {
  startOfWeek,
  endOfWeek,
  format,
  subWeeks,
  addWeeks,
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

export function getNextWeekId(date: Date = new Date()): string {
  const nextWeekDate = addWeeks(date, 1);
  return getCurrentWeekId(nextWeekDate);
}

export function getNextWeekDateRange(date: Date = new Date()): { start: string; end: string } {
  const nextWeekDate = addWeeks(date, 1);
  return getWeekDateRange(nextWeekDate);
}

export interface WeekInfo {
  id: string;
  start: string;
  end: string;
  isCurrent: boolean;
}

export function getRecentWeeks(count: number = 5): WeekInfo[] {
  const weeks: WeekInfo[] = [];
  const now = new Date();
  const currentWeekId = getCurrentWeekId(now);

  // Start from the current week and go backwards
  for (let i = count - 1; i >= 0; i--) {
    const d = subWeeks(now, i);
    const id = getCurrentWeekId(d);
    const range = getWeekDateRange(d);
    weeks.push({
      id,
      start: range.start,
      end: range.end,
      isCurrent: id === currentWeekId,
    });
  }

  return weeks;
}
