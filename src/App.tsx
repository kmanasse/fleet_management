import React, { useState } from 'react';
import './index.css';
import { AuthProvider, useAuth } from './AuthContext';
import LoginPage from './LoginPage';
import Navbar from './Sidebar';
import Dashboard from './Dashboard';
import AlertsPage from './AlertsPage';
import ReceiptsPage from './ReceiptsPage';
import DriverPortal from './DriverPortal';
import AdminSettings from './AdminSettings';
import TripsPage from './TripsPage';

type Page = 'dashboard' | 'alerts' | 'receipts' | 'driver-portal' | 'admin-settings' | 'trips';

function AppInner() {
  const { user, can } = useAuth();
  const [page, setPage] = useState<Page>('dashboard');
  if (!user) return <LoginPage />;
  const effectivePage: Page = user.role === 'driver' ? 'driver-portal' : (can(page) ? page : 'dashboard');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f8fafb' }}>
      <Navbar current={effectivePage} onChange={(p: Page) => setPage(p)} />
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {effectivePage === 'dashboard'      && <Dashboard />}
        {effectivePage === 'alerts'         && <AlertsPage />}
        {effectivePage === 'receipts'       && <ReceiptsPage />}
        {effectivePage === 'driver-portal'  && <DriverPortal />}
        {effectivePage === 'admin-settings' && <AdminSettings />}
        {effectivePage === 'trips'          && <TripsPage />}
      </main>
    </div>
  );
}

export default function App() {
  return <AuthProvider><AppInner /></AuthProvider>;
}
