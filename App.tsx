
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { Teachers } from './pages/Teachers';
import { MarksEntry } from './pages/MarksEntry';
import { Reports } from './pages/Reports';
import { Assessments } from './pages/Assessments';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';

export default function App() {
  
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/teachers" element={<Teachers />} />
          <Route path="/marks" element={<MarksEntry />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/assessments" element={<Assessments />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}
