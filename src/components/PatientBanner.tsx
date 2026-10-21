'use client';

import { useState } from 'react';
import { cn, formatDate } from '@/lib/utils';
import type { Patient } from '@/lib/types';
import { Bed, Stethoscope, Calendar, Phone, Edit2, Check, X, ShieldAlert } from 'lucide-react';
import { useEMR } from '@/context/EMRContext';

const TAB_LABELS: Record<string, string> = {
  'initial-assessment': 'Initial Nursing Assessment',
  'counselling-form': 'Patient & Family Counselling Form',
  'reassessment': 'Nursing Re-Assessment (Shift-wise)',
  'final-assessment': 'Final Assessment',
  'emergency-assessment': 'Emergency Assessment',
  'daycare-assessment': 'Daycare Assessment',
  'vital-signs': 'Vital Signs',
  'io-chart': 'I/O Chart',
  'icu-chart': 'ICU/CCU Chart',
  'diabetic-chart': 'Diabetic Flow Chart',
  'nursing-notes': 'Progress Notes',
  'care-plan': 'Nursing Care Plan',
  'family-education': 'Family Education Record',
  'mar': 'Medication Administration',
  'pressure-ulcer': 'Pressure Ulcer Assessment',
  'catheter-care': 'Urinary Catheter Care',
  'bundle-care': 'Bundle Care',
  'phlebitis': 'Phlebitis Assessment',
  'mini-nutrition': 'Mini Nutritional Assessment',
  'pre-op': 'Pre-Operative Checklist',
  'patient-transfer': 'Patient Transfer & SBAR',
  'valuables': 'Valuable Items Handover',
  'shift-handover': 'Shift Handover',
  'rmo-handover': 'Doctor Assessment (RMO)',
  'physio-assessment': 'Physiotherapy Assessment',
  'physio-sessions': 'PT Session Notes',
  'med-reconciliation': 'Medication Reconciliation',
  'own-medications': 'Home Medications',
  'form-master': 'Form Master',
  'field-master': 'Field Master',
  'dynamic-forms': 'Dynamic Nursing Forms (Configurable Engine)',
};

interface PatientBannerProps {
  patient: Patient;
  activeTab: string;
}

export function PatientBanner({ patient, activeTab }: PatientBannerProps) {
  const { updatePatientDiagnosis, store } = useEMR();
  const [isEditingDx, setIsEditingDx] = useState(false);
  const [dxInput, setDxInput] = useState(patient.diagnosis);

  // Check if patient has vulnerable flag or high-risk assessments
  const isVulnerable = patient.isVulnerable ||
    store.nursingAssessments.some(a => a.patientId === patient.id && (a.isVulnerableHighRisk || (a.vulnerableCriteria && a.vulnerableCriteria.length > 0)));

  const wardColors: Record<string, string> = {
    'ICU': 'bg-red-100 text-red-700 border-red-200',
    'CCU': 'bg-red-100 text-red-700 border-red-200',
    'Emergency': 'bg-amber-100 text-amber-700 border-amber-200',
    'General': 'bg-green-100 text-green-700 border-green-200',
    'Daycare': 'bg-blue-100 text-blue-700 border-blue-200',
    'OT': 'bg-purple-100 text-purple-700 border-purple-200',
  };

  function handleSaveDiagnosis() {
    if (dxInput.trim()) {
      updatePatientDiagnosis(patient.id, dxInput.trim());
    }
    setIsEditingDx(false);
  }

  function handleCancelDiagnosis() {
    setDxInput(patient.diagnosis);
    setIsEditingDx(false);
  }

  return (
    <div className="bg-white border-b border-slate-200 px-5 py-3 flex-shrink-0 no-print">
      {/* Breadcrumb */}
      <div className="text-xs text-slate-400 mb-1.5 flex items-center justify-between">
        <div>
          Digital Nursing &rsaquo; <span className="text-teal-600 font-medium">{TAB_LABELS[activeTab] || activeTab}</span>
        </div>
        {isVulnerable && (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 border border-red-300 text-red-800 text-[11px] font-bold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-600"></span>
            <span>🔴 VULNERABLE PATIENT — RED ID BAND</span>
          </div>
        )}
      </div>

      {/* Patient info row */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Avatar + name */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {patient.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span>{patient.name}</span>
              {isVulnerable && (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-red-600 text-white font-bold uppercase tracking-wide">
                  Red Alert Band
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500">
              {patient.uhid} &nbsp;·&nbsp; {patient.ipdNo}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap text-xs text-slate-600">
          <BannerItem icon={<Stethoscope size={12} />} label={`${patient.age}Y / ${patient.gender} / ${patient.bloodGroup}`} />
          <BannerItem icon={<Bed size={12} />} label={`${patient.ward} — Bed ${patient.bed}`} />
          <BannerItem icon={<Calendar size={12} />} label={`Admitted: ${formatDate(patient.admissionDate)}`} />
          <BannerItem icon={<Phone size={12} />} label={patient.consultantDoctor} />
        </div>

        <span className={cn('ml-auto text-xs font-semibold px-2.5 py-1 rounded-full border', wardColors[patient.ward] || 'bg-slate-100 text-slate-600 border-slate-200')}>
          {patient.ward}
        </span>
      </div>

      {/* Diagnosis with Instant Doctor/Nurse Live Sync */}
      <div className="mt-1.5 flex items-center gap-2 text-xs">
        <span className="font-semibold text-slate-600 uppercase tracking-wider text-[11px]">Doctor Diagnosis:</span>
        {isEditingDx ? (
          <div className="flex items-center gap-1.5 flex-1 max-w-xl">
            <input
              type="text"
              value={dxInput}
              onChange={e => setDxInput(e.target.value)}
              placeholder="Enter confirmed / provisional diagnosis..."
              className="flex-1 px-2 py-0.5 border border-teal-400 rounded text-xs text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') handleSaveDiagnosis();
                if (e.key === 'Escape') handleCancelDiagnosis();
              }}
            />
            <button
              onClick={handleSaveDiagnosis}
              className="px-2 py-0.5 bg-teal-600 text-white rounded text-xs font-medium hover:bg-teal-700 flex items-center gap-1"
              title="Save & Sync Everywhere"
            >
              <Check size={12} /> Save
            </button>
            <button
              onClick={handleCancelDiagnosis}
              className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-xs font-medium hover:bg-slate-300"
              title="Cancel"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => { setDxInput(patient.diagnosis); setIsEditingDx(true); }}>
            <span className="text-slate-800 font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
              {patient.diagnosis || 'No Diagnosis recorded'}
            </span>
            <button
              className="text-slate-400 hover:text-teal-600 transition-colors opacity-75 group-hover:opacity-100 flex items-center gap-1 text-[11px]"
              title="Click to update diagnosis — reflects across all records"
            >
              <Edit2 size={11} />
              <span className="hidden sm:inline text-xs text-slate-500">Edit Dx</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function BannerItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-md px-2 py-1">
      <span className="text-slate-400">{icon}</span>
      <span>{label}</span>
    </div>
  );
}
