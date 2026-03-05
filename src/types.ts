export type TaskStatus = 'pending' | 'completed' | 'not_completed';

export type UserRole = 'employee' | 'admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export interface Task {
  id: string;
  name: string;
  description?: string;
  importance: number; // 1 to 10
  status: TaskStatus;
  evaluationScore?: number; // 0 to 10
  reasonNotCompleted?: string;
  isUnplanned?: boolean;
}

export interface WeeklyMetrics {
  completionRate: number; // percentage
  performanceIndicator: number; // percentage
  averageEvaluation: number; // 0 to 10
}

export interface WeeklyReport {
  id: string;
  employeeId: string;
  employeeName: string;
  weekId: string; // e.g., "2023-W42"
  weekStartDate: string; // ISO date string
  weekEndDate: string; // ISO date string
  previousWeekTasks: Task[]; // Tasks from the previous week to evaluate
  currentWeekTasks: Task[]; // Tasks planned for the current week
  submittedAt?: string; // ISO date string
  isSubmitted: boolean;
  metrics?: WeeklyMetrics;
}
