import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { ReportForm } from './pages/ReportForm';
import { ReportHistory } from './pages/ReportHistory';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminReportDetails } from './pages/admin/AdminReportDetails';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {user.role === 'admin' ? (
          <>
            <Route index element={<AdminDashboard />} />
            <Route path="admin/reports/:id" element={<AdminReportDetails />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            <Route index element={<Dashboard />} />
            <Route path="report" element={<ReportForm />} />
            <Route path="history" element={<ReportHistory />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
