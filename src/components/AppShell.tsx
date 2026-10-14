'use client';

import { useState } from 'react';
import { useEMR } from '@/context/EMRContext';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { PatientDashboard } from '@/components/PatientDashboard';
import { NursingWorkspace } from '@/components/NursingWorkspace';

export function AppShell() {
  const { selectedPatient } = useEMR();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  function handleTabChange(tab: string) {
    setActiveTab(tab);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        open={sidebarOpen}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        selectedPatient={selectedPatient}
      />

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <div className="demo-banner no-print">
          ⚠ DEMONSTRATION APPLICATION — All patient data is fictional. Not for clinical use.
        </div>

        <Header
          onMenuClick={() => setSidebarOpen(p => !p)}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' || !selectedPatient ? (
            <PatientDashboard onSelectTab={handleTabChange} />
          ) : (
            <NursingWorkspace activeTab={activeTab} onTabChange={handleTabChange} />
          )}
        </main>
      </div>
    </div>
  );
}
