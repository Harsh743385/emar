'use client';

import { useState } from 'react';
import { useEMR } from '@/context/EMRContext';
import {
  PhoneCall, AlertCircle, BedDouble, Wind, Stethoscope, HeartPulse,
  Activity, Users, ShieldAlert, ArrowRight, Ambulance, Sparkles,
  Building2, CheckCircle2, Clock, AlertTriangle, ChevronRight, UserPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Patient } from '@/lib/types';

interface HospitalHomePageProps {
  onNavigate: (tab: string, patient?: Patient) => void;
  onOpenAdmission: () => void;
  onOpenAmbulance: () => void;
}

export function HospitalHomePage({ onNavigate, onOpenAdmission, onOpenAmbulance }: HospitalHomePageProps) {
  const { store, selectPatient } = useEMR();
  const [callModal, setCallModal] = useState(false);

  const beds = store.beds || [];
  const ventilators = store.ventilators || [];
  const staff = store.staff || [];
  const alerts = (store.alerts || []).filter(a => !a.acknowledged);

  const icuBeds = beds.filter(b => b.ward === 'ICU');
  const icuAvailable = icuBeds.filter(b => b.status === 'Available').length;

  const ccuBeds = beds.filter(b => b.ward === 'CCU');
  const ccuAvailable = ccuBeds.filter(b => b.status === 'Available').length;

  const ventAvailable = ventilators.filter(v => v.status === 'Available' || v.status === 'Standby').length;
  const docsOnDuty = staff.filter(s => s.role === 'Doctor' || s.role === 'Consultant' || s.role === 'RMO').length;
  const nursesOnDuty = staff.filter(s => s.role === 'Nurse').length;

  const departments = [
    { name: 'Emergency & Trauma', desc: 'Level 1 Trauma Care & Resuscitation', icon: AlertCircle, color: 'text-red-500 bg-red-50 border-red-100', tab: 'emergency' },
    { name: 'Intensive Care (ICU)', desc: '24/7 Invasive Monitoring & Ventilator Support', icon: Activity, color: 'text-blue-500 bg-blue-50 border-blue-100', tab: 'icu' },
    { name: 'Coronary Care (CCU)', desc: 'Acute Cardiac Care & Hemodynamic Monitoring', icon: HeartPulse, color: 'text-rose-500 bg-rose-50 border-rose-100', tab: 'ccu' },
    { name: 'Cardiology', desc: 'Cath Lab, Angiography, Temporary Pacing', icon: HeartPulse, color: 'text-amber-500 bg-amber-50 border-amber-100', tab: 'dashboard' },
    { name: 'Trauma Surgery', desc: 'Emergency Surgical Interventions', icon: ShieldAlert, color: 'text-indigo-500 bg-indigo-50 border-indigo-100', tab: 'dashboard' },
    { name: 'Pediatrics & NICU', desc: 'Critical Neonatal & Pediatric Care', icon: Users, color: 'text-emerald-500 bg-emerald-50 border-emerald-100', tab: 'dashboard' },
    { name: '24/7 Pharmacy', desc: 'Emergency Drugs & Vasopressor Infusions', icon: Sparkles, color: 'text-purple-500 bg-purple-50 border-purple-100', tab: 'dashboard' },
    { name: 'Clinical Laboratory', desc: 'ABG, Cardiac Enzymes & Stat Blood Tests', icon: CheckCircle2, color: 'text-teal-500 bg-teal-50 border-teal-100', tab: 'dashboard' },
  ];

  const criticalPatients = store.patients.filter(p => p.ward === 'ICU' || p.ward === 'CCU' || p.ward === 'Emergency');

  function openPatientChart(patient: Patient) {
    selectPatient(patient);
    onNavigate('icu-chart', patient);
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 md:p-8 shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-semibold tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              24/7 Level-1 Emergency & Critical Care Response
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">
              City Emergency & Critical Care Hospital
            </h1>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Equipped with an advanced digital ICU/CCU patient monitoring system, bedside telemetry, invasive hemodynamics, and real-time triage tracking.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><Building2 size={14} className="text-teal-400" /> NABH Accredited Facility</span>
              <span className="flex items-center gap-1.5"><Clock size={14} className="text-teal-400" /> Avg. Triage Response: &lt; 2 Mins</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-teal-400" /> 100% Ventilator Equipped Beds</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto flex-shrink-0">
            {/* CALL 108 Emergency Button */}
            <button
              onClick={() => setCallModal(true)}
              className="flex items-center justify-center gap-3 px-6 py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/30 transition-all transform active:scale-95 text-base border border-red-400/30"
            >
              <PhoneCall className="animate-bounce" size={20} />
              <span>EMERGENCY: CALL 108</span>
            </button>

            <button
              onClick={onOpenAdmission}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-xl shadow-md transition-all text-sm"
            >
              <UserPlus size={16} />
              <span>Emergency Admission & Triage</span>
            </button>

            <button
              onClick={onOpenAmbulance}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium rounded-xl transition-all text-sm"
            >
              <Ambulance size={16} className="text-amber-400" />
              <span>Request Hospital Ambulance</span>
            </button>
          </div>
        </div>
      </div>

      {/* Emergency Active Alert Ticker (if alerts exist) */}
      {alerts.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg animate-pulse">
              <AlertTriangle size={20} />
            </div>
            <div>
              <div className="font-bold text-red-900 text-sm flex items-center gap-2">
                <span>CRITICAL PHYSIOLOGICAL ALERTS ACTIVE ({alerts.length})</span>
                <span className="bg-red-200 text-red-800 text-xs px-2 py-0.5 rounded-full font-semibold">Live Monitor</span>
              </div>
              <p className="text-xs text-red-700 mt-0.5">
                {alerts.map(a => `${a.bedNo} (${a.patientName}): ${a.parameter} ${a.value}`).join(' • ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('dashboard')}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm whitespace-nowrap transition-colors"
          >
            Open Bed Grid &rarr;
          </button>
        </div>
      )}

      {/* Live Status Cards (Live Bed & Staff Statistics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Beds</span>
            <BedDouble size={18} className="text-slate-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{beds.length}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>{beds.filter(b => b.status === 'Occupied').length} Occupied</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">ICU Beds</span>
            <Activity size={18} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600">{icuAvailable} / {icuBeds.length}</div>
          <div className="text-[11px] text-blue-700 mt-1 font-medium">Available now</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">CCU Beds</span>
            <HeartPulse size={18} className="text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600">{ccuAvailable} / {ccuBeds.length}</div>
          <div className="text-[11px] text-rose-700 mt-1 font-medium">Available now</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-teal-300 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Ventilators</span>
            <Wind size={18} className="text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-teal-600">{ventAvailable} / {ventilators.length}</div>
          <div className="text-[11px] text-teal-700 mt-1 font-medium">Standby / Ready</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Doctors on Duty</span>
            <Stethoscope size={18} className="text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-600">{docsOnDuty}</div>
          <div className="text-[11px] text-slate-500 mt-1">2 Intensivists active</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Nurses on Duty</span>
            <Users size={18} className="text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{nursesOnDuty}</div>
          <div className="text-[11px] text-slate-500 mt-1">1:1 ICU Nurse Ratio</div>
        </div>
      </div>

      {/* Critical Care Bed Fast-Access Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity size={18} className="text-teal-600" />
              <span>Active ICU & CCU Monitored Patients</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any patient to inspect bedside vital signs, ventilator flow, and 24-hour paper charts
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onNavigate('dashboard')}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            >
              <span>View All Beds</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {criticalPatients.map(patient => {
            const isICU = patient.ward === 'ICU';
            const isCCU = patient.ward === 'CCU';
            const isER = patient.ward === 'Emergency';

            return (
              <div
                key={patient.id}
                onClick={() => openPatientChart(patient)}
                className="group relative bg-slate-50 hover:bg-white border border-slate-200 hover:border-teal-400 rounded-xl p-4 cursor-pointer transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'px-2 py-0.5 rounded-md text-xs font-bold font-mono',
                      isICU ? 'bg-red-100 text-red-700 border border-red-200' :
                      isCCU ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                      'bg-amber-100 text-amber-700 border border-amber-200'
                    )}>
                      {patient.bed}
                    </span>
                    <span className="text-xs font-bold text-slate-700">{patient.ward}</span>
                  </div>
                  <span className={cn(
                    'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
                    patient.id === 'P003' || patient.id === 'P006' || patient.id === 'P010'
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-amber-100 text-amber-800'
                  )}>
                    {patient.id === 'P003' || patient.id === 'P006' || patient.id === 'P010' ? 'CRITICAL (RED)' : 'SERIOUS (YELLOW)'}
                  </span>
                </div>

                <div className="font-bold text-slate-900 text-sm group-hover:text-teal-600 transition-colors">
                  {patient.name}
                </div>
                <div className="text-xs text-slate-500 mb-3">
                  {patient.age}Y · {patient.gender} · IPD: {patient.ipdNo}
                </div>

                <div className="bg-white group-hover:bg-slate-50 rounded-lg p-2 border border-slate-100 text-xs text-slate-600 mb-3 line-clamp-1">
                  <b>Diagnosis:</b> {patient.diagnosis}
                </div>

                <div className="grid grid-cols-4 gap-1 text-center bg-slate-100/70 rounded-lg p-2 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400">HR</div>
                    <div className="font-bold text-slate-800">{patient.id === 'P003' ? '102' : '84'} <span className="text-[9px] font-normal">bpm</span></div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">BP</div>
                    <div className="font-bold text-slate-800">{patient.id === 'P003' ? '94/62' : '118/74'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">SpO₂</div>
                    <div className={cn('font-bold', patient.id === 'P003' ? 'text-amber-600' : 'text-emerald-600')}>
                      {patient.id === 'P003' ? '93%' : '98%'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">GCS</div>
                    <div className="font-bold text-teal-700">{patient.id === 'P003' ? '11/15' : '15/15'}</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                  <span>Dr: {patient.consultantDoctor.replace('Dr. ', '')}</span>
                  <span className="text-teal-600 font-medium group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                    Open Chart <ChevronRight size={12} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hospital Departments Directory */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-1">Clinical Departments & Facilities</h2>
        <p className="text-xs text-slate-500 mb-4">Dedicated specialized emergency units operating 24 hours</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {departments.map((dept, i) => {
            const Icon = dept.icon;
            return (
              <div
                key={i}
                onClick={() => onNavigate(dept.tab)}
                className="p-3.5 border rounded-xl hover:shadow-md transition-all cursor-pointer bg-white hover:border-slate-300 flex items-start gap-3"
              >
                <div className={cn('p-2.5 rounded-lg border flex-shrink-0', dept.color)}>
                  <Icon size={18} />
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-sm">{dept.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5 leading-snug">{dept.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Demonstration Clinical Disclaimer */}
      <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-center text-xs text-amber-800">
        <b>Clinical Notice:</b> This software is configured for clinical demonstration and training workflows. Patient data is fictional. Not for direct diagnostic intervention without institutional validation.
      </div>

      {/* Call 108 Modal */}
      {callModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <PhoneCall size={32} className="animate-pulse" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">Hospital Emergency Hotline</h3>
              <p className="text-sm text-slate-600">
                Direct link to City Critical Care Hospital Triage & Rapid Ambulance Dispatch.
              </p>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-left text-xs text-slate-700">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-500">Toll-Free Emergency:</span>
                  <span className="font-bold text-red-600 text-sm">108</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-500">ICU Desk Direct:</span>
                  <span className="font-bold text-slate-800">079-8866210666</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-500">Trauma Desk:</span>
                  <span className="font-bold text-slate-800">079-8866212666</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-500">GPS Ambulance Dispatch:</span>
                  <span className="font-bold text-emerald-600">Active (4 units on road)</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setCallModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm"
                >
                  Close
                </button>
                <a
                  href="tel:108"
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm text-center flex items-center justify-center gap-1.5 shadow-md shadow-red-500/20"
                >
                  <PhoneCall size={14} /> Call Now (108)
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
