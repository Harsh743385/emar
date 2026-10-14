'use client';

import { useState } from 'react';
import { useEMR } from '@/context/EMRContext';
import { cn, formatDate } from '@/lib/utils';
import { Search, Users, BedDouble, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import type { Patient } from '@/lib/types';

interface PatientDashboardProps {
  onSelectTab: (tab: string) => void;
}

export function PatientDashboard({ onSelectTab }: PatientDashboardProps) {
  const { store, selectPatient } = useEMR();
  const [search, setSearch] = useState('');
  const [wardFilter, setWardFilter] = useState('All');

  const wards = ['All', ...Array.from(new Set(store.patients.map(p => p.ward)))];

  const filtered = store.patients.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      p.name.toLowerCase().includes(q) ||
      p.uhid.toLowerCase().includes(q) ||
      p.ipdNo.toLowerCase().includes(q) ||
      p.diagnosis.toLowerCase().includes(q);
    const matchWard = wardFilter === 'All' || p.ward === wardFilter;
    return matchSearch && matchWard;
  });

  function handleOpen(patient: Patient) {
    selectPatient(patient);
    onSelectTab('initial-assessment');
  }

  const totalActive = store.patients.filter(p => p.status === 'Active').length;
  const icuCount = store.patients.filter(p => p.ward === 'ICU' || p.ward === 'CCU').length;
  const emergencyCount = store.patients.filter(p => p.ward === 'Emergency').length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Users size={20} />} label="Total Admitted" value={totalActive} color="bg-teal-50 text-teal-600" />
        <StatCard icon={<BedDouble size={20} />} label="ICU / CCU" value={icuCount} color="bg-red-50 text-red-600" />
        <StatCard icon={<AlertTriangle size={20} />} label="Emergency" value={emergencyCount} color="bg-amber-50 text-amber-600" />
        <StatCard icon={<Activity size={20} />} label="Pending Notes" value={2} color="bg-blue-50 text-blue-600" />
      </div>

      {/* Heading */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Admitted Patients</h2>
          <p className="text-sm text-slate-500">Select a patient to open their nursing workspace</p>
        </div>
      </div>

      {/* Search & filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex items-center gap-2 flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl">
          <Search size={15} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, UHID, IPD no, diagnosis..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder-slate-400"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {wards.map(w => (
            <button
              key={w}
              onClick={() => setWardFilter(w)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border',
                wardFilter === w
                  ? 'bg-teal-500 text-white border-teal-500'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
              )}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* Patient cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(patient => (
          <PatientCard key={patient.id} patient={patient} store={store} onOpen={handleOpen} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-16 text-slate-400">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No patients found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Recent activity */}
      <div className="mt-8">
        <h3 className="font-bold text-slate-700 mb-3">Recent Nursing Activities</h3>
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {[
            { time: '21:00', msg: 'Shift handover recorded — P001 Rajesh Kumar Sharma', nurse: 'Sr. Kavita Bhosale', icon: '🔄', color: 'bg-blue-50 text-blue-600' },
            { time: '18:30', msg: 'Emergency assessment — P005 Arjun Singh Rawat', nurse: 'Sr. Kavita Bhosale', icon: '🚨', color: 'bg-red-50 text-red-600' },
            { time: '14:00', msg: 'ICU bundle care checked — P003 Mohammed Irfan Sheikh', nurse: 'Sr. Sampat Jain', icon: '✅', color: 'bg-green-50 text-green-600' },
            { time: '10:30', msg: 'Physiotherapy session 2 — P004 Sunita Ramesh Verma', nurse: 'Dr. Pratik Gaikwad', icon: '🏃', color: 'bg-purple-50 text-purple-600' },
            { time: '08:00', msg: 'Vitals recorded — P001 Rajesh Kumar Sharma', nurse: 'Sr. Kavita Bhosale', icon: '❤️', color: 'bg-teal-50 text-teal-600' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0', item.color)}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800 truncate">{item.msg}</p>
                <p className="text-xs text-slate-500">{item.nurse}</p>
              </div>
              <span className="text-xs text-slate-400 flex-shrink-0">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: number; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', color)}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      <div className="text-sm text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

function PatientCard({ patient, store, onOpen }: {
  patient: Patient;
  store: import('@/lib/types').EMRStore;
  onOpen: (p: Patient) => void;
}) {
  // Count records for this patient
  const assessmentCount = store.nursingAssessments.filter(a => a.patientId === patient.id).length;

  const wardColors: Record<string, string> = {
    'ICU': 'bg-red-100 text-red-700',
    'CCU': 'bg-red-100 text-red-700',
    'Emergency': 'bg-amber-100 text-amber-700',
    'General': 'bg-green-100 text-green-700',
    'Daycare': 'bg-blue-100 text-blue-700',
    'OT': 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:border-teal-300 hover:shadow-md transition-all fade-in">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center text-teal-700 font-bold text-sm flex-shrink-0">
          {patient.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-900 truncate text-sm">{patient.name}</div>
          <div className="text-xs text-slate-500">
            {patient.age}Y / {patient.gender} · {patient.bloodGroup}
          </div>
        </div>
        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0', wardColors[patient.ward] || 'bg-slate-100 text-slate-600')}>
          {patient.ward}
        </span>
      </div>

      {/* Info */}
      <div className="space-y-1.5 mb-3">
        <InfoRow label="UHID" value={patient.uhid} />
        <InfoRow label="IPD No" value={patient.ipdNo} />
        <InfoRow label="Bed" value={patient.bed} />
        <InfoRow label="Doctor" value={patient.consultantDoctor} />
        <InfoRow label="Admitted" value={formatDate(patient.admissionDate)} />
        <div className="text-xs">
          <span className="text-slate-400">Diagnosis: </span>
          <span className="text-slate-700">{patient.diagnosis}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <CheckCircle size={12} className="text-teal-500" />
          <span>{assessmentCount} assessment{assessmentCount !== 1 ? 's' : ''}</span>
        </div>
        <button
          onClick={() => onOpen(patient)}
          className="px-4 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          Open Record →
        </button>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex text-xs gap-1">
      <span className="text-slate-400 w-16 flex-shrink-0">{label}:</span>
      <span className="text-slate-700 truncate">{value}</span>
    </div>
  );
}
