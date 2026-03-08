import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, History, User, Users, Shield } from 'lucide-react';
import { cn } from './ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { Select } from './ui/Select';

export function Layout() {
  const location = useLocation();
  const { user, switchUser, availableUsers } = useAuth();

  const employeeNavItems = [
    { name: 'لوحة القيادة', path: '/', icon: LayoutDashboard },
    { name: 'التقرير الأسبوعي', path: '/report', icon: FileText },
    { name: 'الأرشيف', path: '/history', icon: History },
  ];

  const adminNavItems = [
    { name: 'صندوق الوارد', path: '/', icon: LayoutDashboard },
  ];

  const navItems = user.role === 'admin' ? adminNavItems : employeeNavItems;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Sidebar / Bottom Nav */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-l border-slate-200 flex-shrink-0 z-10 sticky top-0 md:h-screen flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xl", user.role === 'admin' ? "bg-slate-800" : "bg-indigo-600")}>
            {user.role === 'admin' ? <Shield className="w-5 h-5" /> : 'W'}
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-lg leading-tight">بوابة التقارير</h1>
            <p className="text-xs text-slate-500">{user.role === 'admin' ? 'لوحة الإدارة' : 'الأسبوعية للموظفين'}</p>
          </div>
        </div>

        <nav className="p-4 flex md:flex-col gap-2 overflow-x-auto md:overflow-visible flex-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all whitespace-nowrap",
                  isActive
                    ? (user.role === 'admin' ? "bg-slate-100 text-slate-900" : "bg-indigo-50 text-indigo-700")
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? (user.role === 'admin' ? "text-slate-800" : "text-indigo-600") : "text-slate-400")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50 mt-auto">
          <div className="mb-3 flex items-center gap-3 px-2">
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", user.role === 'admin' ? "bg-slate-200 text-slate-700" : "bg-indigo-100 text-indigo-600")}>
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{user.name}</p>
              <p className="text-xs text-slate-500">{user.role === 'admin' ? 'مدير النظام' : 'موظف'}</p>
            </div>
          </div>

          {/* Role Switcher for Demo Purposes */}
          <div className="mt-4 pt-4 border-t border-slate-200/60">
            <p className="text-xs text-slate-400 mb-2 px-1 font-medium">تبديل الحساب (للتجربة)</p>
            <Select
              value={user.id}
              onChange={(e) => switchUser(e.target.value)}
              className="h-8 text-xs bg-white"
            >
              {availableUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role === 'admin' ? 'إدارة' : 'موظف'})</option>
              ))}
            </Select>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
