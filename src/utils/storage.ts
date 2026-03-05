import { WeeklyReport } from '../types';

const STORAGE_KEY = 'weekly_reports_data';

export function getAllReports(): WeeklyReport[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const reports = JSON.parse(data) as WeeklyReport[];
    // Migrate old data
    return reports.map(r => ({
      ...r,
      employeeId: r.employeeId || 'emp-1',
      employeeName: r.employeeName || 'أحمد محمد'
    }));
  } catch (e) {
    console.error('Failed to load reports from storage', e);
    return [];
  }
}

export function getReports(employeeId: string): WeeklyReport[] {
  const allReports = getAllReports();
  return allReports.filter(r => r.employeeId === employeeId);
}

export function saveReport(report: WeeklyReport): void {
  const reports = getAllReports();
  const existingIndex = reports.findIndex((r) => r.id === report.id);
  
  if (existingIndex >= 0) {
    reports[existingIndex] = report;
  } else {
    reports.push(report);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

export function getReportByWeekId(employeeId: string, weekId: string): WeeklyReport | undefined {
  const reports = getReports(employeeId);
  return reports.find((r) => r.weekId === weekId);
}

export function getPreviousReport(employeeId: string, currentWeekId: string): WeeklyReport | undefined {
  const reports = getReports(employeeId);
  // Sort by weekId descending to find the most recent one before current
  const sorted = [...reports].sort((a, b) => (b.weekId || '').localeCompare(a.weekId || ''));
  return sorted.find((r) => (r.weekId || '') < currentWeekId && r.isSubmitted);
}
