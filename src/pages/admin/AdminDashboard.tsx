import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { getAllReports } from '../../utils/storage';
import { getCurrentWeekId, formatDate } from '../../utils/date';
import { WeeklyReport } from '../../types';
import { Users, CheckCircle, Clock, Search, Filter, Eye, Download, FileText, User } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Link } from 'react-router-dom';
import { exportMultipleReports, exportWeeklyReport } from '../../utils/exportReport';
import { useAuth } from '../../contexts/AuthContext';

export function AdminDashboard() {
  const { availableUsers } = useAuth();
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWeek, setFilterWeek] = useState('all');

  useEffect(() => {
    setReports(getAllReports().filter(r => r.isSubmitted).sort((a, b) => (b.weekId || '').localeCompare(a.weekId || '')));
  }, []);

  const currentWeekId = getCurrentWeekId();
  const currentWeekReports = reports.filter(r => r.weekId === currentWeekId);
  const employees = availableUsers.filter(u => u.role === 'employee');
  const pendingEmployeesCount = Math.max(0, employees.length - currentWeekReports.length);

  const uniqueWeeks = Array.from(new Set(reports.map(r => r.weekId))).sort().reverse();

  const filteredReports = reports.filter(r => {
    const matchesSearch = r.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWeek = filterWeek === 'all' || r.weekId === filterWeek;
    return matchesSearch && matchesWeek;
  });

  return (
    <div className="space-y-8 fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            صندوق الوارد (تقارير الموظفين)
          </h1>
          <p className="text-slate-500 mt-1">استعراض سريع للتقارير الأسبوعية المعتمدة</p>
        </div>
        <button
          onClick={() => exportMultipleReports(filteredReports)}
          disabled={filteredReports.length === 0}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-medium shadow-md shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Download className="w-5 h-5" />
          تصدير الكل بصيغة Excel ({filteredReports.length})
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-emerald-50 border-emerald-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500"></div>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-emerald-800 font-medium mb-1">تقارير هذا الأسبوع</p>
                <h3 className="text-4xl font-bold text-emerald-900 mt-2">{currentWeekReports.length}</h3>
              </div>
              <div className="p-3 bg-white/60 rounded-xl text-emerald-600 shadow-sm border border-emerald-100">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm mt-4 text-emerald-700">موظف سلّم التقرير حتى الآن</p>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-500"></div>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-amber-800 font-medium mb-1">الموظفين المتأخرين</p>
                <h3 className="text-4xl font-bold text-amber-900 mt-2">{pendingEmployeesCount}</h3>
              </div>
              <div className="p-3 bg-white/60 rounded-xl text-amber-600 shadow-sm border border-amber-100">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm mt-4 text-amber-700">لم يسلموا تقرير الأسبوع الحالي</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-slate-400"></div>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-600 font-medium mb-1">إجمالي تقارير الأرشيف</p>
                <h3 className="text-4xl font-bold text-slate-800 mt-2">{reports.length}</h3>
              </div>
              <div className="p-3 bg-white/60 rounded-xl text-slate-500 shadow-sm border border-slate-200">
                <FileText className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm mt-4 text-slate-500">منذ بدء تشغيل النظام</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center border-b border-slate-100 bg-slate-50/50 pb-4">
          <div className="flex-1 w-full md:w-80 relative">
            <Search className="w-5 h-5 absolute right-3 top-2.5 text-slate-400" />
            <Input
              placeholder="ابحث باسم الموظف..."
              className="pl-3 pr-11 py-5 shadow-sm border-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="bg-white border text-slate-400 border-slate-200 p-2.5 rounded-lg shadow-sm">
              <Filter className="w-5 h-5" />
            </div>
            <Select
              value={filterWeek}
              onChange={(e) => setFilterWeek(e.target.value)}
              className="w-full md:w-56 py-2.5 shadow-sm border-slate-200 font-medium text-slate-700"
            >
              <option value="all">جميع الأسابيع (الأرشيف الكامل)</option>
              {uniqueWeeks.map((week) => (
                <option key={week} value={week}>الأسبوع {(week as string).split('-W')[1]}</option>
              ))}
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-4 font-bold">الموظف</th>
                  <th className="px-6 py-4 font-bold">تاريخ الأسبوع</th>
                  <th className="px-6 py-4 font-bold">رقم الأسبوع</th>
                  <th className="px-6 py-4 font-bold">المهام (منجزة/مخططة)</th>
                  <th className="px-6 py-4 font-bold">تاريخ التقديم</th>
                  <th className="px-6 py-4 font-bold text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((report) => {
                  const completedTasks = report.previousWeekTasks.filter(t => t.status === 'completed').length;
                  const totalPrevTasks = report.previousWeekTasks.length;
                  const plannedTasks = report.currentWeekTasks.length;

                  return (
                    <tr key={report.id} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold shadow-sm border border-indigo-200">
                            {report.employeeName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 text-base">{report.employeeName}</span>
                            <div className="text-xs text-slate-500 mt-0.5">{report.employeeId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {formatDate(report.weekStartDate)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold border border-slate-200">
                          {report.weekId.split('-W')[1]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs font-medium text-slate-600 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                            المنجزة: <strong>{completedTasks}</strong> من {totalPrevTasks}
                          </span>
                          <span className="text-xs font-medium text-slate-600 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                            المخططة للقادم: <strong>{plannedTasks}</strong>
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                          {report.submittedAt ? formatDate(report.submittedAt) : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            to={`/admin/reports/${report.id}`}
                            className="p-2 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 rounded-lg transition-colors border border-transparent hover:border-indigo-200"
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => exportWeeklyReport(report)}
                            className="p-2 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 rounded-lg transition-colors border border-transparent hover:border-emerald-200"
                            title="تصدير Excel"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredReports.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-500 bg-slate-50/50">
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="w-12 h-12 text-slate-300 mb-3" />
                        <p className="font-medium text-slate-600 text-lg">لا توجد تقارير مطابقة للبحث</p>
                        <p className="text-sm mt-1">جرّب تغيير فلاتر البحث أو اختار أسبوعاً آخر</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
