'use client';

import { useState } from 'react';
import { useEMR } from '@/context/EMRContext';
import {
  Search, Bell, BellOff, Filter, Activity, HeartPulse, Wind,
  BedDouble, Stethoscope, ChevronRight, UserPlus, AlertTriangle,
  Clock, ShieldAlert, ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { playAlertSound } from '@/lib/hospitalData';
import type { Patient, HospitalBed } from '@/lib/types';

interface ICUDashboardProps {
  onOpenPatientChart: (patient: Patient) => void;
  onOpenAdmission: () => void;
  initialFilter?: string;
}

export function ICUDashboard({ onOpenPatientChart, onOpenAdmission, initialFilter = 'All' }: ICUDashboardProps) {
  const { store, selectPatient } = useEMR();
  const [search, setSearch] = useState('');
  const [wardFilter, setWardFilter] = useState(initialFilter);
  const [shift, setShift] = useState<'Morning' | 'Evening' | 'Night'>('Morning');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showAlertsDrawer, setShowAlertsDrawer] = useState(false);

  const beds = store.beds || [];
  const ventilators = store.ventilators || [];
  const alerts = store.alerts || [];
  const unackedAlerts = alerts.filter(a => !a.acknowledged);

  // Filter beds
  const filteredBeds = beds.filter(bed => {
    // Ward filter
    if (wardFilter === 'ICU' && bed.ward !== 'ICU') return false;
    if (wardFilter === 'CCU' && bed.ward !== 'CCU') return false;
    if (wardFilter === 'Emergency' && bed.ward !== 'Emergency') return false;
    if (wardFilter === 'Ventilator' && !bed.hasVentilator) return false;

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const patient = store.patients.find(p => p.id === bed.patientId);
      const matchBed = bed.bedNo.toLowerCase().includes(q);
      const matchPatient = patient && (
        patient.name.toLowerCase().includes(q) ||
        patient.uhid.toLowerCase().includes(q) ||
        patient.ipdNo.toLowerCase().includes(q) ||
        patient.diagnosis.toLowerCase().includes(q)
      );
      if (!matchBed && !matchPatient) return false;
    }
    return true;
  });

  function handleBedClick(bed: HospitalBed) {
    if (bed.patientId) {
      const patient = store.patients.find(p => p.id === bed.patientId);
      if (patient) {
        selectPatient(patient);
        onOpenPatientChart(patient);
      }
    } else {
      // Empty bed -> open admission
      onOpenAdmission();
    }
  }

  function toggleSound() {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (next) playAlertSound('critical');
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto p-4 md:p-6">
      {/* Top Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Left: Title & Shift */}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="text-teal-600" size={22} />
              <span>ICU & CCU Patient Monitoring Dashboard</span>
            </h1>
            <span className="bg-slate-900 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Live Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time bedside vitals, ventilator parameters, and clinical criticality cards
          </p>
        </div>

        {/* Right Controls: Shift, Sound, Alerts, Admission */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Shift Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            {(['Morning', 'Evening', 'Night'] as const).map(s => (
              <button
                key={s}
                onClick={() => setShift(s)}
                className={cn(
                  'px-3 py-1.5 rounded-lg font-semibold transition-all',
                  shift === s
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Mute Alert Sound' : 'Enable Alert Sound'}
            className={cn(
              'p-2 rounded-xl border transition-colors flex items-center gap-1.5 text-xs font-semibold',
              soundEnabled
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            )}
          >
            {soundEnabled ? <Bell size={16} /> : <BellOff size={16} />}
            <span className="hidden sm:inline">{soundEnabled ? 'Sound ON' : 'Muted'}</span>
          </button>

          {/* Alerts Bell */}
          <button
            onClick={() => setShowAlertsDrawer(p => !p)}
            className="relative p-2 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition-colors"
            title="Active Critical Alerts"
          >
            <AlertTriangle size={18} />
            {unackedAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center animate-pulse">
                {unackedAlerts.length}
              </span>
            )}
          </button>

          {/* Emergency Admission CTA */}
          <button
            onClick={onOpenAdmission}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <UserPlus size={15} />
            <span>Admit Patient</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search bed no, patient name, UHID, IPD, diagnosis..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none shadow-sm"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {['All', 'ICU', 'CCU', 'Emergency', 'Ventilator'].map(f => (
            <button
              key={f}
              onClick={() => setWardFilter(f)}
              className={cn(
                'px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border',
                wardFilter === f
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Bed Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredBeds.map(bed => {
          const patient = bed.patientId ? store.patients.find(p => p.id === bed.patientId) : null;
          const ventilator = bed.ventilatorId ? ventilators.find(v => v.id === bed.ventilatorId) : null;
          const isCritical = patient && (patient.id === 'P003' || patient.id === 'P006' || patient.id === 'P010');
          const isOccupied = bed.status === 'Occupied' && patient;

          // Mock telemetry values based on patient
          let hr = 84;
          let sbp = 118;
          let dbp = 74;
          let spo2 = 98;
          let temp = 98.4;
          let gcs = 15;

          if (patient?.id === 'P003') {
            hr = 102; sbp = 94; dbp = 62; spo2 = 93; temp = 98.2; gcs = 11;
          } else if (patient?.id === 'P006') {
            hr = 136; sbp = 86; dbp = 50; spo2 = 91; temp = 101.8; gcs = 9;
          } else if (patient?.id === 'P007') {
            hr = 78; sbp = 126; dbp = 76; spo2 = 97; temp = 98.6; gcs = 15;
          } else if (patient?.id === 'P008') {
            hr = 88; sbp = 134; dbp = 82; spo2 = 96; temp = 98.5; gcs = 15;
          } else if (patient?.id === 'P010') {
            hr = 122; sbp = 88; dbp = 56; spo2 = 92; temp = 102.6; gcs = 8;
          }

          return (
            <div
              key={bed.id}
              onClick={() => handleBedClick(bed)}
              className={cn(
                'group relative rounded-2xl border-2 transition-all p-4 cursor-pointer flex flex-col justify-between shadow-sm hover:shadow-lg',
                !isOccupied && bed.status === 'Available'
                  ? 'bg-slate-50/70 border-dashed border-slate-300 hover:border-teal-500 hover:bg-teal-50/20'
                  : !isOccupied
                  ? 'bg-amber-50/50 border-amber-200 opacity-70'
                  : isCritical
                  ? 'bg-white border-red-500 hover:border-red-600 ring-1 ring-red-200'
                  : 'bg-white border-slate-200 hover:border-teal-400'
              )}
            >
              {/* Card Header: Bed No & Triage Status */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold shadow-xs',
                      isCritical
                        ? 'bg-red-600 text-white'
                        : isOccupied
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-200 text-slate-700'
                    )}>
                      {bed.bedNo}
                    </span>
                    <span className="text-xs font-bold text-slate-500">{bed.ward}</span>
                  </div>

                  {isOccupied ? (
                    <span className={cn(
                      'text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full',
                      isCritical
                        ? 'bg-red-100 text-red-700 border border-red-200 animate-pulse'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    )}>
                      {isCritical ? 'RED (CRITICAL)' : 'YELLOW (WATCH)'}
                    </span>
                  ) : (
                    <span className={cn(
                      'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
                      bed.status === 'Available' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                    )}>
                      {bed.status}
                    </span>
                  )}
                </div>

                {/* Patient Information (or Empty Bed Notice) */}
                {isOccupied && patient ? (
                  <>
                    <div className="font-extrabold text-slate-900 text-sm group-hover:text-teal-600 transition-colors truncate">
                      {patient.name}
                    </div>
                    <div className="text-xs text-slate-500 mb-2 truncate">
                      {patient.age}Y · {patient.gender} · IPD: {patient.ipdNo}
                    </div>

                    <div className="bg-slate-50 rounded-lg p-2 text-xs text-slate-600 mb-3 border border-slate-100 line-clamp-2 min-h-[42px]">
                      <b>Dx:</b> {patient.diagnosis}
                    </div>

                    {/* Telemetry Vitals Grid */}
                    <div className="grid grid-cols-4 gap-1.5 text-center bg-slate-100/70 rounded-xl p-2.5 text-xs mb-3">
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">HR</div>
                        <div className={cn('font-extrabold text-sm', hr > 110 || hr < 55 ? 'text-red-600' : 'text-slate-800')}>
                          {hr}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">BP</div>
                        <div className={cn('font-extrabold text-sm', sbp < 90 ? 'text-red-600' : 'text-slate-800')}>
                          {sbp}/{dbp}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">SpO₂</div>
                        <div className={cn('font-extrabold text-sm', spo2 < 93 ? 'text-red-600' : 'text-emerald-600')}>
                          {spo2}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">GCS</div>
                        <div className={cn('font-extrabold text-sm', gcs <= 8 ? 'text-red-600' : 'text-teal-700')}>
                          {gcs}
                        </div>
                      </div>
                    </div>

                    {/* Ventilator Indicator */}
                    {ventilator && (
                      <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50/70 border border-blue-100 px-2 py-1 rounded-lg mb-2">
                        <Wind size={13} className="text-blue-500" />
                        <span className="font-semibold">{ventilator.mode}</span>
                        <span className="text-[11px] text-blue-600 font-normal">FiO₂: {ventilator.fio2}% · PEEP: {ventilator.peep}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-8 text-center text-slate-400 space-y-2">
                    <BedDouble size={36} className="mx-auto opacity-30 group-hover:text-teal-500 transition-colors" />
                    <div className="text-sm font-semibold text-slate-600">Bed Unoccupied</div>
                    <p className="text-xs text-slate-400">Click to admit emergency patient</p>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              {isOccupied && patient ? (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="truncate max-w-[130px]">Dr. {patient.consultantDoctor.replace('Dr. ', '')}</span>
                  <span className="text-teal-600 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-0.5 whitespace-nowrap">
                    Open Chart <ArrowUpRight size={13} />
                  </span>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-200/50 text-center">
                  <span className="text-xs font-semibold text-teal-600">
                    + Allocate Bed
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Emergency Alerts Drawer / Modal */}
      {showAlertsDrawer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-end">
          <div className="bg-white h-full w-full max-w-md shadow-2xl p-6 flex flex-col justify-between animate-in slide-in-from-right">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle size={20} />
                  <h3 className="font-bold text-base text-slate-900">Active Physiological Alerts</h3>
                </div>
                <button
                  onClick={() => setShowAlertsDrawer(false)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-700"
                >
                  Close
                </button>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[75vh]">
                {alerts.map(a => (
                  <div
                    key={a.id}
                    className={cn(
                      'p-3.5 rounded-xl border text-xs space-y-1.5',
                      a.severity === 'Critical' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-slate-900 text-sm">{a.bedNo} — {a.patientName}</span>
                      <span className="text-[10px] text-slate-400">{a.timestamp}</span>
                    </div>
                    <div className="text-slate-700">
                      <b>Parameter:</b> <span className="font-bold text-red-700">{a.parameter} ({a.value})</span> · Threshold: {a.threshold}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', a.severity === 'Critical' ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800')}>
                        {a.severity}
                      </span>
                      {a.acknowledged ? (
                        <span className="text-[11px] text-slate-400">Ack by {a.acknowledgedBy}</span>
                      ) : (
                        <button
                          onClick={() => {
                            // Acknowledge alert
                            a.acknowledged = true;
                            a.acknowledgedBy = 'Duty Nurse';
                            setShowAlertsDrawer(false);
                          }}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-[11px]"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowAlertsDrawer(false)}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
