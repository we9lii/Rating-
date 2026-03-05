import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { getReports } from '../utils/storage';
import { formatShortDate, formatDate } from '../utils/date';
import { WeeklyReport } from '../types';
import { Calendar, CheckCircle, XCircle, BarChart2, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ReportHistory() {
  const { user } = useAuth();
  const [reports, setReports] = useState<WeeklyReport[]>([]);

  useEffect(() => {
    const allReports = getReports(user.id)
      .filter(r => r.isSubmitted)
      .sort((a, b) => b.weekId.localeCompare(a.weekId));
    setReports(allReports);
  }, [user.id]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">أرشيف التقارير</h1>
        <p className="text-slate-500 mt-1">سجل الأداء التراكمي للأسابيع الماضية</p>
      </div>

      {reports.length === 0 ? (
        <Card className="border-dashed border-2 bg-slate-50">
          <CardContent className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 text-slate-400">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">لا يوجد أرشيف بعد</h3>
            <p className="text-slate-500 max-w-md">
              لم تقم بإرسال أي تقارير أسبوعية حتى الآن. بمجرد إرسال تقريرك الأول، سيظهر هنا.
            </p>
            <Link to="/report" className="mt-6 inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm h-10 px-4 py-2 text-sm">
              تعبئة التقرير الحالي
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {reports.map((report) => (
            <Card key={report.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-slate-50 border-b border-slate-100 p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">
                      أسبوع {report.weekId.split('-W')[1]}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {formatDate(report.weekStartDate)} - {formatDate(report.weekEndDate)}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                  <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex-shrink-0">
                    <p className="text-xs text-slate-500 mb-1">مؤشر الأداء</p>
                    <p className="font-bold text-indigo-600 text-lg">{report.metrics?.performanceIndicator}%</p>
                  </div>
                  <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex-shrink-0">
                    <p className="text-xs text-slate-500 mb-1">نسبة الإنجاز</p>
                    <p className="font-bold text-emerald-600 text-lg">{report.metrics?.completionRate}%</p>
                  </div>
                  <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex-shrink-0">
                    <p className="text-xs text-slate-500 mb-1">متوسط التقييم</p>
                    <p className="font-bold text-amber-600 text-lg">{report.metrics?.averageEvaluation} / 10</p>
                  </div>
                </div>
              </div>
              
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-100">
                  {/* Previous Tasks Evaluation */}
                  <div className="p-6">
                    <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ما تم إنجازه (تقييم الأسبوع)
                    </h4>
                    {report.previousWeekTasks.length > 0 ? (
                      <ul className="space-y-3">
                        {report.previousWeekTasks.map(task => (
                          <li key={task.id} className="flex items-start gap-3 text-sm">
                            {task.status === 'completed' ? (
                              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                            )}
                            <div>
                              <p className={task.status === 'completed' ? 'text-slate-800 font-medium flex items-center gap-2' : 'text-slate-500 line-through flex items-center gap-2'}>
                                {task.name}
                                {task.isUnplanned && (
                                  <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">مهمة إضافية</span>
                                )}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                  تقييم: {task.evaluationScore}/10
                                </span>
                                {task.status === 'not_completed' && task.reasonNotCompleted && (
                                  <span className="text-xs text-red-500">
                                    السبب: {task.reasonNotCompleted}
                                  </span>
                                )}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500 italic">لا توجد مهام مقيمة لهذا الأسبوع.</p>
                    )}
                  </div>
                  
                  {/* Current Tasks Plan */}
                  <div className="p-6 bg-slate-50/50">
                    <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-indigo-500" />
                      خطة الأسبوع (المهام المجدولة)
                    </h4>
                    {report.currentWeekTasks.length > 0 ? (
                      <ul className="space-y-3">
                        {report.currentWeekTasks.map(task => (
                          <li key={task.id} className="flex items-start gap-3 text-sm bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                            <div>
                              <p className="text-slate-800 font-medium">{task.name}</p>
                              <span className="text-xs text-slate-500 mt-1 block">
                                الأهمية: {task.importance}/10
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500 italic">لم يتم جدولة مهام جديدة.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
