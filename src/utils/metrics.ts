import { Task, WeeklyMetrics } from '../types';

export function calculateMetrics(tasks: Task[]): WeeklyMetrics {
  if (!tasks || tasks.length === 0) {
    return {
      completionRate: 0,
      performanceIndicator: 0,
      averageEvaluation: 0,
    };
  }

  let completedCount = 0;
  let totalImportance = 0;
  let weightedEvaluationSum = 0;
  let totalEvaluationScore = 0;
  let evaluatedTasksCount = 0;

  tasks.forEach((task) => {
    if (task.status === 'completed') {
      completedCount++;
    }

    if (task.status !== 'pending') {
      const evalScore = task.evaluationScore || 0;
      totalImportance += task.importance;
      weightedEvaluationSum += task.importance * evalScore;
      
      totalEvaluationScore += evalScore;
      evaluatedTasksCount++;
    }
  });

  const completionRate = (completedCount / tasks.length) * 100;
  
  // (Sum of (Importance * Evaluation)) / (Sum of Importance * 10)
  const performanceIndicator = totalImportance > 0 
    ? (weightedEvaluationSum / (totalImportance * 10)) * 100 
    : 0;

  const averageEvaluation = evaluatedTasksCount > 0 
    ? totalEvaluationScore / evaluatedTasksCount 
    : 0;

  return {
    completionRate: Math.round(completionRate * 10) / 10,
    performanceIndicator: Math.round(performanceIndicator * 10) / 10,
    averageEvaluation: Math.round(averageEvaluation * 10) / 10,
  };
}
