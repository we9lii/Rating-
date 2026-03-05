import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { getAllReports } from '../../utils/storage';
import { formatDate } from '../../utils/date';
import { WeeklyReport } from '../../types';
import { ArrowRight, Calendar, CheckCircle, XCircle, BarChart2, User, Target, Clock } from 'lucide-react';

export function AdminReportDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<WeeklyReport | null>(null);

  useEffect(() => {
    const allReports = getAllReports();
    const foundReport = allReports.find(r => r.id === id);
    if (foundReport) {
      setReport(foundReport);
    } else {
      // Handle not found
      navigate('/admin/reports');
    }
  }, [id, navigate]);

  if (!report) return <div className="p-8 text-center">جاري التحميل...</div>;

  const completedTasks = report.previousWeekTasks.filter(t => t.status === 'completed').length;
  const totalPrevTasks = report.previousWeekTasks.length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Navigation */}
      <div className="flex items-center gap-4">
        <Link to="/admin/reports">
          <Button variant="ghost" size="sm" className="w-10 h-10 p-0 rounded-full bg-white shadow-sm border border-slate-200 hover:bg-slate-50">
            <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">تفاصيل التقرير</h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4" />
            أسبوع {report.weekId.split('-W')[1]} ({formatDate(report.weekStartDate)} - {formatDate(report.weekEndDate)})
          </p>
        </div>
      </div>

      {/* Employee Info & High-level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <Card className="md:col-span-4 bg-indigo-600 text-white border-none shadow-lg shadow-indigo-200">
          <CardContent className="p-6 flex flex-col h-full justify-between">
            <div>
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                <User className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold mb-1">{report.employeeName}</h2>
              <p className="text-indigo-200 text-sm">مقدم التقرير</p>
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/20">
              <p className="text-sm text-indigo-200 mb-1 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                تاريخ التسليم
              </p>
              <p className="font-medium">{report.submittedAt ? formatDate(report.submittedAt) : 'غير محدد'}</p>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-white border-slate-200 shadow-sm flex flex-col justify-center">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6" />
              </div>
              <p className="text-sm text-slate-500 font-medium mb-1">مؤشر الأداء</p>
              <h3 className="text-3xl font-bold text-slate-800">{report.metrics?.performanceIndicator}%</h3>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-slate-200 shadow-sm flex flex-col justify-center">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6" />
              </div>
              <p className="text-sm text-slate-500 font-medium mb-1">نسبة الإنجاز</p>
              <h3 className="text-3xl font-bold text-slate-800">{report.metrics?.completionRate}%</h3>
              <p className="text-xs text-slate-400 mt-1">{completedTasks} من أصل {totalPrevTasks} مهام</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm flex flex-col justify-center">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
                <BarChart2 className="w-6 h-6" />
              </div>
              <p className="text-sm text-slate-500 font-medium mb-1">متوسط التقييم</p>
              <h3 className="text-3xl font-bold text-slate-800">{report.metrics?.averageEvaluation} <span className="text-lg text-slate-400 font-normal">/ 10</span></h3>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detailed Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Previous Week Evaluation */}
        <Card className="border-slate-200 shadow-sm h-full">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <CardTitle>تقييم مهام الأسبوع المنصرف</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {report.previousWeekTasks.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {report.previousWeekTasks.map((task, index) => (
                  <div key={task.id} className="p-5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {task.status === 'completed' ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <CheckCircle className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                            <XCircle className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`font-bold text-base flex items-center gap-2 ${task.status === 'completed' ? 'text-slate-800' : 'text-slate-600'}`}>
                            {task.name}
                            {task.isUnplanned && (
                              <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">مهمة إضافية</span>
                            )}
                          </h4>
                          <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-md whitespace-nowrap">
                            أهمية: {task.importance}/10
                          </span>
                        </div>
                        
                        {task.description && (
                          <p className="text-sm text-slate-500 mb-3">{task.description}</p>
                        )}
                        
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-md border ${
                            task.status === 'completed' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {task.status === 'completed' ? 'تم التنفيذ' : 'لم يتم التنفيذ'}
                          </span>
                          
                          <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                            التقييم: {task.evaluationScore}/10
                          </span>
                        </div>

                        {task.status === 'not_completed' && task.reasonNotCompleted && (
                          <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100 text-sm">
                            <span className="font-bold text-red-800 block mb-1">سبب عدم الإنجاز:</span>
                            <span className="text-red-700">{task.reasonNotCompleted}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                لا توجد مهام مقيمة لهذا الأسبوع.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Week Plan */}
        <Card className="border-slate-200 shadow-sm h-full">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600" />
              <CardTitle>خطة الأسبوع الحالي</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {report.currentWeekTasks.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {report.currentWeekTasks.map((task, index) => (
                  <div key={task.id} className="p-5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs mt-0.5">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-slate-800 text-base">{task.name}</h4>
                          <span className={`text-xs font-medium px-2 py-1 rounded-md whitespace-nowrap ${
                            task.importance >= 8 ? 'bg-red-50 text-red-700' :
                            task.importance >= 5 ? 'bg-amber-50 text-amber-700' :
                            'bg-emerald-50 text-emerald-700'
                          }`}>
                            أهمية: {task.importance}/10
                          </span>
                        </div>
                        
                        {task.description ? (
                          <p className="text-sm text-slate-500 mt-1">{task.description}</p>
                        ) : (
                          <p className="text-sm text-slate-400 italic mt-1">لا يوجد وصف إضافي</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                لم يتم جدولة مهام جديدة.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
