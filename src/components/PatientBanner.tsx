'use client';

import { cn, formatDate } from '@/lib/utils';
import type { Patient } from '@/lib/types';
import { Bed, Stethoscope, Calendar, Phone } from 'lucide-react';

const TAB_LABELS: Record<string, string> = {
  'initial-assessment': 'Initial Nursing Assessment',
  'counselling-form': 'Patient & Family Counselling Form',
  'reassessment': 'Nursing Reassessment',
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
};

interface PatientBannerProps {
  patient: Patient;
  activeTab: string;
}

export function PatientBanner({ patient, activeTab }: PatientBannerProps) {
  const wardColors: Record<string, string> = {
    'ICU': 'bg-red-100 text-red-700 border-red-200',
    'CCU': 'bg-red-100 text-red-700 border-red-200',
    'Emergency': 'bg-amber-100 text-amber-700 border-amber-200',
    'General': 'bg-green-100 text-green-700 border-green-200',
    'Daycare': 'bg-blue-100 text-blue-700 border-blue-200',
    'OT': 'bg-purple-100 text-purple-700 border-purple-200',
  };

  return (
    <div className="bg-white border-b border-slate-200 px-5 py-3 flex-shrink-0 no-print">
      {/* Breadcrumb */}
      <div className="text-xs text-slate-400 mb-1.5">
        Digital Nursing &rsaquo; <span className="text-teal-600 font-medium">{TAB_LABELS[activeTab] || activeTab}</span>
      </div>

      {/* Patient info row */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Avatar + name */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {patient.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm">{patient.name}</div>
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

      {/* Diagnosis */}
      <div className="mt-1.5 text-xs text-slate-500">
        <span className="font-medium text-slate-600">Dx:</span> {patient.diagnosis}
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
