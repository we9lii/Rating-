import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { getAllReports } from '../../utils/storage';
import { formatDate, formatShortDate } from '../../utils/date';
import { WeeklyReport } from '../../types';
import { Search, Filter, Calendar, User, CheckCircle, XCircle, Eye } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Link } from 'react-router-dom';

export function AdminReports() {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWeek, setFilterWeek] = useState('all');

  useEffect(() => {
    setReports(getAllReports().filter(r => r.isSubmitted).sort((a, b) => (b.weekId || '').localeCompare(a.weekId || '')));
  }, []);

  const uniqueWeeks = Array.from(new Set(reports.map(r => r.weekId))).sort().reverse();

  const filteredReports = reports.filter(r => {
    const matchesSearch = r.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWeek = filterWeek === 'all' || r.weekId === filterWeek;
    return matchesSearch && matchesWeek;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">تقارير الموظفين</h1>
        <p className="text-slate-500 mt-1">استعراض ومتابعة تقارير الأداء الأسبوعية لجميع الموظفين</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center border-b border-slate-100 bg-slate-50/50">
          <div className="flex-1 w-full md:w-auto relative">
            <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
            <Input 
              placeholder="ابحث باسم الموظف..." 
              className="pl-3 pr-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <Select 
              value={filterWeek} 
              onChange={(e) => setFilterWeek(e.target.value)}
              className="w-full md:w-48"
            >
              <option value="all">جميع الأسابيع</option>
              {uniqueWeeks.map((week) => (
                <option key={week} value={week}>أسبوع {(week as string).split('-W')[1]}</option>
              ))}
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-medium">الموظف</th>
                  <th className="px-6 py-4 font-medium">الأسبوع</th>
                  <th className="px-6 py-4 font-medium">مؤشر الأداء</th>
                  <th className="px-6 py-4 font-medium">نسبة الإنجاز</th>
                  <th className="px-6 py-4 font-medium">المهام (منجزة/مخططة)</th>
                  <th className="px-6 py-4 font-medium">تاريخ التسليم</th>
                  <th className="px-6 py-4 font-medium text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((report) => {
                  const completedTasks = report.previousWeekTasks.filter(t => t.status === 'completed').length;
                  const totalPrevTasks = report.previousWeekTasks.length;
                  const plannedTasks = report.currentWeekTasks.length;
                  
                  return (
                    <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                            <User className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-slate-800">{report.employeeName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>أسبوع {report.weekId.split('-W')[1]}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          (report.metrics?.performanceIndicator || 0) >= 80 ? 'bg-emerald-100 text-emerald-800' :
                          (report.metrics?.performanceIndicator || 0) >= 50 ? 'bg-indigo-100 text-indigo-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {report.metrics?.performanceIndicator}%
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {report.metrics?.completionRate}%
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                            <CheckCircle className="w-3 h-3" /> {completedTasks}/{totalPrevTasks}
                          </span>
                          <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                            مخطط: {plannedTasks}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {report.submittedAt ? formatDate(report.submittedAt) : '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link to={`/admin/reports/${report.id}`} className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors">
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {filteredReports.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      لا توجد تقارير مطابقة للبحث
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
