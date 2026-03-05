import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { getReports } from '../utils/storage';
import { getCurrentWeekId, getPreviousWeekId, formatShortDate } from '../utils/date';
import { WeeklyReport } from '../types';
import { CheckCircle, Clock, TrendingUp, AlertCircle, Calendar, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAuth } from '../contexts/AuthContext';

export function Dashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [currentWeekReport, setCurrentWeekReport] = useState<WeeklyReport | null>(null);
  const [lastWeekReport, setLastWeekReport] = useState<WeeklyReport | null>(null);

  useEffect(() => {
    const allReports = getReports(user.id);
    setReports(allReports);

    const currentWeekId = getCurrentWeekId();
    const prevWeekId = getPreviousWeekId();

    setCurrentWeekReport(allReports.find(r => r.weekId === currentWeekId) || null);
    setLastWeekReport(allReports.find(r => r.weekId === prevWeekId && r.isSubmitted) || null);
  }, [user.id]);

  const currentWeekId = getCurrentWeekId();
  const isCurrentSubmitted = currentWeekReport?.isSubmitted;

  // Calculate monthly average (last 4 weeks)
  const last4Weeks = reports
    .filter(r => r.isSubmitted)
    .sort((a, b) => b.weekId.localeCompare(a.weekId))
    .slice(0, 4);

  const avgPerformance = last4Weeks.length > 0
    ? last4Weeks.reduce((sum, r) => sum + (r.metrics?.performanceIndicator || 0), 0) / last4Weeks.length
    : 0;

  const chartData = last4Weeks.reverse().map(r => ({
    name: formatShortDate(r.weekStartDate),
    performance: r.metrics?.performanceIndicator || 0,
    completion: r.metrics?.completionRate || 0,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">مرحباً {user.name.split(' ')[0]} 👋</h1>
          <p className="text-slate-500 mt-1">إليك ملخص أداءك الأسبوعي</p>
        </div>
        
        {!isCurrentSubmitted ? (
          <Link to="/report">
            <Button className="gap-2 shadow-md shadow-indigo-200">
              <FileText className="w-4 h-4" />
              تعبئة تقرير الأسبوع الحالي
            </Button>
          </Link>
        ) : (
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 font-medium">
            <CheckCircle className="w-5 h-5" />
            تم إرسال تقرير هذا الأسبوع
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-none shadow-lg shadow-indigo-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-indigo-100 font-medium mb-1">متوسط الأداء (آخر 4 أسابيع)</p>
                <h3 className="text-4xl font-bold">{Math.round(avgPerformance)}%</h3>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 text-sm text-indigo-100 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              بناءً على {last4Weeks.length} تقارير سابقة
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 font-medium mb-1">أداء الأسبوع الماضي</p>
                <h3 className="text-3xl font-bold text-slate-800">
                  {lastWeekReport?.metrics?.performanceIndicator || 0}%
                </h3>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-slate-500">
              نسبة الإنجاز: <span className="font-bold text-slate-700">{lastWeekReport?.metrics?.completionRate || 0}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 font-medium mb-1">حالة الأسبوع الحالي</p>
                <h3 className="text-xl font-bold text-slate-800 mt-2">
                  {isCurrentSubmitted ? 'مكتمل' : 'بانتظار التقرير'}
                </h3>
              </div>
              <div className={`p-3 rounded-xl ${isCurrentSubmitted ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                {isCurrentSubmitted ? (
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                ) : (
                  <Clock className="w-6 h-6 text-amber-600" />
                )}
              </div>
            </div>
            <div className="mt-4 text-sm text-slate-500">
              {isCurrentSubmitted 
                ? `${currentWeekReport?.currentWeekTasks.length || 0} مهام مخططة` 
                : 'يرجى تعبئة التقرير قبل نهاية الأسبوع'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>تطور الأداء (آخر 4 أسابيع)</CardTitle>
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
                    <Bar dataKey="performance" name="مؤشر الأداء %" radius={[6, 6, 0, 0]}>
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
            <CardTitle>التقارير الأخيرة</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {reports.filter(r => r.isSubmitted).slice(0, 5).map((report) => (
                <div key={report.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{formatShortDate(report.weekStartDate)} - {formatShortDate(report.weekEndDate)}</p>
                    <p className="text-xs text-slate-500 mt-1">{report.metrics?.performanceIndicator}% أداء</p>
                  </div>
                  <div className="text-xs font-medium px-2 py-1 rounded-md bg-emerald-50 text-emerald-700">
                    مكتمل
                  </div>
                </div>
              ))}
              {reports.filter(r => r.isSubmitted).length === 0 && (
                <div className="p-8 text-center text-slate-500 text-sm">
                  لا توجد تقارير سابقة
                </div>
              )}
            </div>
            {reports.filter(r => r.isSubmitted).length > 0 && (
              <div className="p-4 border-t border-slate-100 text-center">
                <Link to="/history" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                  عرض كل الأرشيف
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


