'use client';

import { useState } from 'react';
import { useEMR } from '@/context/EMRContext';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { PatientDashboard } from '@/components/PatientDashboard';
import { NursingWorkspace } from '@/components/NursingWorkspace';
import { HospitalHomePage } from '@/components/hospital/HospitalHomePage';
import { ICUDashboard } from '@/components/hospital/ICUDashboard';
import { EmergencyAdmissionModal } from '@/components/hospital/EmergencyAdmissionModal';
import { AmbulanceModal } from '@/components/hospital/AmbulanceModal';
import { StaffAdminPage } from '@/components/hospital/StaffAdminPage';
import { NABHComplianceCenter } from '@/components/compliance/NABHComplianceCenter';
import { FormMasterTab } from '@/components/tabs/FormMasterTab';
import { FieldMasterTab } from '@/components/tabs/FieldMasterTab';
import type { Patient } from '@/lib/types';

export function AppShell() {
  const { store, selectedPatient, selectPatient } = useEMR();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [admissionModalOpen, setAdmissionModalOpen] = useState(false);
  const [ambulanceModalOpen, setAmbulanceModalOpen] = useState(false);

  function handleTabChange(tab: string) {
    if (tab === 'admission') {
      setAdmissionModalOpen(true);
      return;
    }
    setActiveTab(tab);
  }

  function handleOpenPatientChart(patient: Patient) {
    selectPatient(patient);
    setActiveTab('icu-chart');
  }

  function handleAdmissionSuccess(patient: Patient) {
    setAdmissionModalOpen(false);
    selectPatient(patient);
    setActiveTab('icu-chart');
  }

  const renderMainContent = () => {
    // 1. Hospital Home
    if (activeTab === 'home') {
      return (
        <HospitalHomePage
          onNavigate={(tab, patient) => {
            if (patient) {
              handleOpenPatientChart(patient);
            } else {
              setActiveTab(tab);
            }
          }}
          onOpenAdmission={() => setAdmissionModalOpen(true)}
          onOpenAmbulance={() => setAmbulanceModalOpen(true)}
        />
      );
    }

    // 2. ICU / CCU Bed Grid Dashboard
    if (activeTab === 'dashboard' || activeTab === 'icu' || activeTab === 'ccu' || activeTab === 'ventilators' || activeTab === 'emergency') {
      const initialFilter = activeTab === 'icu' ? 'ICU' : activeTab === 'ccu' ? 'CCU' : activeTab === 'ventilators' ? 'Ventilator' : activeTab === 'emergency' ? 'Emergency' : 'All';
      return (
        <ICUDashboard
          onOpenPatientChart={handleOpenPatientChart}
          onOpenAdmission={() => setAdmissionModalOpen(true)}
          initialFilter={initialFilter}
        />
      );
    }

    // 3. Beds & Staff Admin
    if (activeTab === 'staff-admin') {
      return <StaffAdminPage />;
    }

    // 4. NABH Accreditation & Quality Center
    if (activeTab.startsWith('nabh-')) {
      return <NABHComplianceCenter />;
    }

    // 5. Administration: Form Master & Field Master (accessible globally)
    if (activeTab === 'form-master') {
      return (
        <div className="p-4 max-w-7xl mx-auto overflow-y-auto">
          <FormMasterTab onNavigateToFieldMaster={() => setActiveTab('field-master')} />
        </div>
      );
    }
    if (activeTab === 'field-master') {
      return (
        <div className="p-4 max-w-7xl mx-auto overflow-y-auto">
          <FieldMasterTab />
        </div>
      );
    }

    if (activeTab === 'dynamic-forms' && !selectedPatient && store.patients.length > 0) {
      selectPatient(store.patients[0]);
    }

    // 6. Patients Directory (when no patient selected or activeTab === 'patients')
    if (activeTab === 'patients' || !selectedPatient) {
      return (
        <PatientDashboard
          onSelectTab={tab => {
            setActiveTab(tab);
          }}
        />
      );
    }

    // 5. Patient Workspace (ICU Chart, Vitals, Assessment, etc.)
    return <NursingWorkspace activeTab={activeTab} onTabChange={handleTabChange} />;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        open={sidebarOpen}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        selectedPatient={selectedPatient}
      />

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <div className="demo-banner no-print flex items-center justify-center gap-2">
          <span>⚠ DEMONSTRATION & TRAINING HOSPITAL EMR — All patient records are fictional. Not for direct clinical diagnosis.</span>
        </div>

        <Header
          onMenuClick={() => setSidebarOpen(p => !p)}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        <main className="flex-1 overflow-y-auto">
          {renderMainContent()}
        </main>
      </div>

      {/* Emergency Admission Modal */}
      <EmergencyAdmissionModal
        open={admissionModalOpen}
        onClose={() => setAdmissionModalOpen(false)}
        onSuccess={handleAdmissionSuccess}
      />

      {/* Ambulance Dispatch Modal */}
      <AmbulanceModal
        open={ambulanceModalOpen}
        onClose={() => setAmbulanceModalOpen(false)}
      />
    </div>
  );
}
