import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DemoProvider } from './context/DemoContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { NewAssessment } from './pages/NewAssessment';
import { Batches } from './pages/Batches';
import { BatchDetail } from './pages/BatchDetail';
import { AIVision } from './pages/AIVision';
import { Reports } from './pages/Reports';
import { ReportDetail } from './pages/ReportDetail';
import { History } from './pages/History';
import { Analytics } from './pages/Analytics';
import { Centers } from './pages/Centers';
import { Settings } from './pages/Settings';
import { QRVerify } from './pages/QRVerify';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <DemoProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/verify/:code" element={<QRVerify />} />
            <Route path="/verify" element={<QRVerify />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="assessment/new" element={<NewAssessment />} />
                <Route path="assessment/:id" element={<BatchDetail />} />
                <Route path="batches" element={<Batches />} />
                <Route path="batches/:id" element={<BatchDetail />} />
                <Route path="ai-analysis" element={<AIVision />} />
                <Route path="reports" element={<Reports />} />
                <Route path="reports/:id" element={<ReportDetail />} />
                <Route path="history" element={<History />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="centers" element={<Centers />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </DemoProvider>
    </AuthProvider>
  );
};

export default App;
