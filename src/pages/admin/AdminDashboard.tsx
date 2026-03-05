import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { getAllReports } from '../../utils/storage';
import { getCurrentWeekId, formatShortDate } from '../../utils/date';
import { WeeklyReport } from '../../types';
import { Users, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';

export function AdminDashboard() {
  const { availableUsers } = useAuth();
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  
  useEffect(() => {
    setReports(getAllReports().filter(r => r.isSubmitted));
  }, []);

  const currentWeekId = getCurrentWeekId();
  const currentWeekReports = reports.filter(r => r.weekId === currentWeekId);
  
  const employees = availableUsers.filter(u => u.role === 'employee');
  const submissionRate = employees.length > 0 
    ? (currentWeekReports.length / employees.length) * 100 
    : 0;

  const avgCompanyPerformance = reports.length > 0
    ? reports.reduce((sum, r) => sum + (r.metrics?.performanceIndicator || 0), 0) / reports.length
    : 0;

  // Group by week for chart
  const reportsByWeek = reports.reduce((acc, report) => {
    if (!acc[report.weekId]) {
      acc[report.weekId] = {
        name: formatShortDate(report.weekStartDate),
        weekId: report.weekId,
        totalPerformance: 0,
        count: 0
      };
    }
    acc[report.weekId].totalPerformance += (report.metrics?.performanceIndicator || 0);
    acc[report.weekId].count += 1;
    return acc;
  }, {} as Record<string, { name: string, weekId: string, totalPerformance: number, count: number }>);

  const chartData = (Object.values(reportsByWeek) as Array<{ name: string, weekId: string, totalPerformance: number, count: number }>)
    .sort((a, b) => a.weekId.localeCompare(b.weekId))
    .slice(-4)
    .map(w => ({
      name: w.name,
      performance: Math.round(w.totalPerformance / w.count)
    }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">نظرة عامة على أداء الشركة</h1>
        <p className="text-slate-500 mt-1">ملخص تقارير الموظفين والأداء العام</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white border-none shadow-lg shadow-slate-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-300 font-medium mb-1">متوسط أداء الشركة</p>
                <h3 className="text-4xl font-bold">{Math.round(avgCompanyPerformance)}%</h3>
              </div>
              <div className="p-3 bg-white/10 rounded-xl">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 text-sm text-slate-300 flex items-center gap-1">
              إجمالي التقارير المعتمدة: {reports.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 font-medium mb-1">تقارير الأسبوع الحالي</p>
                <h3 className="text-3xl font-bold text-slate-800">
                  {currentWeekReports.length} <span className="text-lg text-slate-400 font-normal">من {employees.length}</span>
                </h3>
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-slate-500">
              نسبة التسليم: <span className="font-bold text-slate-700">{Math.round(submissionRate)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 font-medium mb-1">حالة الموظفين</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="flex items-center gap-1 text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                    <CheckCircle className="w-4 h-4" /> {currentWeekReports.length} سلموا
                  </span>
                  <span className="flex items-center gap-1 text-sm font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                    <Clock className="w-4 h-4" /> {employees.length - currentWeekReports.length} بانتظار
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>متوسط الأداء العام (آخر 4 أسابيع)</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip 
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="performance" name="متوسط الأداء %" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.performance >= 80 ? '#10b981' : entry.performance >= 50 ? '#6366f1' : '#f59e0b'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex flex-col items-center justify-center text-slate-400">
                <BarChart className="w-12 h-12 mb-2 opacity-20" />
                <p>لا توجد بيانات كافية لعرض الرسم البياني</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>أحدث التقارير المسلمة</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {reports.sort((a, b) => new Date(b.submittedAt || '').getTime() - new Date(a.submittedAt || '').getTime()).slice(0, 5).map((report) => (
                <div key={report.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{report.employeeName}</p>
                    <p className="text-xs text-slate-500 mt-1">أسبوع {report.weekId.split('-W')[1]} • أداء {report.metrics?.performanceIndicator}%</p>
                  </div>
                  <div className="text-xs font-medium px-2 py-1 rounded-md bg-emerald-50 text-emerald-700">
                    مكتمل
                  </div>
                </div>
              ))}
              {reports.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-sm">
                  لا توجد تقارير مسلمة بعد
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
