'use client';

import { useState } from 'react';
import { useEMR } from '@/context/EMRContext';
import { generateId, nowDateStr, nowTimeStr } from '@/lib/store';
import { getShiftFromTime } from '@/lib/utils';
import {
  FormDrawer, FormGroup, FormInput, FormSelect,
  SectionTitle, StatusBadge, EmptyState, CardHeader, TealButton
} from '@/components/FormDrawer';
import { Plus, Activity } from 'lucide-react';
import type { VitalSigns, Shift } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

const ACTION_TAKEN_OPTIONS = [
  '',
  'Analgesic Administered as Prescribed',
  'Repositioned / Position Changed',
  'Ice / Cold Compress Applied',
  'Warm Compress Applied',
  'Treating Doctor / Consultant Informed',
  'Non-Pharmacological Comfort / Breathing',
  'Vital Signs Monitored & Rechecked',
  'Dressing / Wound Care Checked',
  'Splint / Support Provided',
  'Reassessed after 30 Minutes',
  'Other (Specify in notes)',
];

export function VitalSignsTab() {
  const { store, selectedPatient, updateStore } = useEMR();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState({
    date: nowDateStr(), time: nowTimeStr(), shift: 'Morning' as Shift, nurseName: '',
    tempF: 98.6, pulse: 72, bpSys: 120, bpDia: 80, spo2: 98, rr: 16, weightKg: 0,
    painScore: 0, painIntensity: '', painLocation: '', painActionTaken: ''
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [activeDate, setActiveDate] = useState(nowDateStr());

  const patientId = selectedPatient!.id;
  const allRecords = store.vitalSigns.filter(r => r.patientId === patientId);
  const dateRecords = allRecords.filter(r => r.date === activeDate);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 3 + i);
    return d.toISOString().substring(0, 10);
  });
  const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  function setF(k: string, v: number | string) { setForm(prev => ({ ...prev, [k]: v })); }

  function openNew() {
    setForm({
      date: nowDateStr(), time: nowTimeStr(), shift: getShiftFromTime(nowTimeStr()), nurseName: '',
      tempF: 98.6, pulse: 72, bpSys: 120, bpDia: 80, spo2: 98, rr: 16, weightKg: 0,
      painScore: 0, painIntensity: '', painLocation: '', painActionTaken: ''
    });
    setEditId(null);
    setDrawerOpen(true);
  }

  function save(status: 'Completed' | 'Draft') {
    updateStore(prev => {
      if (editId) {
        return { ...prev, vitalSigns: prev.vitalSigns.map(r => r.id === editId ? { ...r, ...form, status } : r) };
      }
      return { ...prev, vitalSigns: [...prev.vitalSigns, { id: generateId(), patientId, ...form, status, createdAt: new Date().toISOString() } as VitalSigns] };
    });
    setActiveDate(form.date);
    setDrawerOpen(false);
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="ncard">
        <CardHeader title="Vital Signs Sheet" actions={<TealButton onClick={openNew} size="sm"><Plus size={14} /> Record Vitals</TealButton>} />
        <div className="ncard-body">
          {/* Date strip */}
          <div className="date-strip">
            {days.map(d => {
              const date = new Date(d);
              return <div key={d} className={`date-day ${d === activeDate ? 'active' : ''}`} onClick={() => setActiveDate(d)}>
                <div className="dow">{DOW[date.getDay()]}</div><div className="dom">{date.getDate()}</div>
              </div>;
            })}
            <input type="date" value={activeDate} onChange={e => setActiveDate(e.target.value)} className="px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-400" />
          </div>

          <div className="mb-3 text-sm"><b>{formatDate(activeDate)}</b>&nbsp;<span className="text-slate-500">{dateRecords.length} reading{dateRecords.length !== 1 ? 's' : ''}</span></div>

          {/* Vitals table */}
          {dateRecords.length === 0 ? (
            <EmptyState icon={<Activity />} title={`No vitals for ${formatDate(activeDate)}`} action={<TealButton onClick={openNew}><Plus size={14} /> Record Vitals</TealButton>} />
          ) : (
            <div className="overflow-x-auto">
              <table className="icu-table">
                <thead>
                  <tr>
                    <th>Time</th><th>Shift</th><th>Temp (°F)</th><th>Pulse (bpm)</th>
                    <th>BP (mmHg)</th><th>SpO₂ (%)</th><th>RR (/min)</th><th>Wt (kg)</th>
                    <th>Pain (0-10)</th><th>Action Taken</th><th>Nurse</th><th>Status</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dateRecords.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="font-bold">{r.time}</td>
                      <td><span className="text-xs px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full">{r.shift}</span></td>
                      <td className={r.tempF > 99.5 ? 'high' : ''}>{r.tempF}</td>
                      <td className={r.pulse > 100 ? 'high' : r.pulse < 60 ? 'low' : ''}>{r.pulse}</td>
                      <td><b>{r.bpSys}</b>/{r.bpDia}</td>
                      <td className={r.spo2 < 95 ? 'high' : ''}>{r.spo2}</td>
                      <td className={r.rr > 20 ? 'high' : ''}>{r.rr}</td>
                      <td>{r.weightKg || '—'}</td>
                      <td>
                        {(r.painScore ?? 0) > 0 ? (
                          <span className={cn("text-xs font-bold px-2 py-0.5 rounded",
                            (r.painScore ?? 0) >= 7 ? "bg-red-100 text-red-700" :
                            (r.painScore ?? 0) >= 4 ? "bg-amber-100 text-amber-700" : "bg-yellow-100 text-yellow-800"
                          )}>
                            {r.painScore}/10
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">0 (None)</span>
                        )}
                      </td>
                      <td className="text-xs text-slate-600 max-w-[140px] truncate" title={r.painActionTaken}>{r.painActionTaken || '—'}</td>
                      <td className="text-xs text-slate-500">{r.nurseName || 'Demo'}</td>
                      <td><StatusBadge status={r.status} /></td>
                      <td>
                        <button onClick={() => {
                          setForm({
                            date: r.date, time: r.time, shift: r.shift, nurseName: r.nurseName,
                            tempF: r.tempF, pulse: r.pulse, bpSys: r.bpSys, bpDia: r.bpDia,
                            spo2: r.spo2, rr: r.rr, weightKg: r.weightKg,
                            painScore: r.painScore ?? 0,
                            painIntensity: r.painIntensity || '',
                            painLocation: r.painLocation || '',
                            painActionTaken: r.painActionTaken || ''
                          });
                          setEditId(r.id);
                          setDrawerOpen(true);
                        }} className="text-xs text-teal-600 hover:underline font-semibold">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Legend */}
          <div className="flex gap-4 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />High</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />Low</span>
          </div>
        </div>
      </div>

      <FormDrawer open={drawerOpen} title="Record Vital Signs" subtitle={`Patient: ${selectedPatient!.name}`} onClose={() => setDrawerOpen(false)} onSave={() => save('Completed')} onSaveDraft={() => save('Draft')}>
        <SectionTitle>General</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <FormGroup label="Time" required><FormInput type="time" value={form.time} onChange={v => setF('time', v)} /></FormGroup>
          <FormGroup label="Shift" required><FormSelect value={form.shift} onChange={v => setF('shift', v)} options={['Morning', 'Afternoon', 'Night']} /></FormGroup>
          <FormGroup label="Date" required><FormInput type="date" value={form.date} onChange={v => setF('date', v)} /></FormGroup>
          <FormGroup label="Nurse Name"><FormInput value={form.nurseName} onChange={v => setF('nurseName', v)} placeholder="Nurse name" /></FormGroup>
        </div>

        <SectionTitle>Vital Signs</SectionTitle>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          <FormGroup label="Temp (°F)" required><FormInput type="number" step="0.1" value={form.tempF} onChange={v => setF('tempF', parseFloat(v) || 0)} /></FormGroup>
          <FormGroup label="Pulse (bpm)" required><FormInput type="number" value={form.pulse} onChange={v => setF('pulse', parseInt(v) || 0)} /></FormGroup>
          <FormGroup label="BP Sys (mmHg)" required><FormInput type="number" value={form.bpSys} onChange={v => setF('bpSys', parseInt(v) || 0)} /></FormGroup>
          <FormGroup label="BP Dia (mmHg)" required><FormInput type="number" value={form.bpDia} onChange={v => setF('bpDia', parseInt(v) || 0)} /></FormGroup>
          <FormGroup label="SpO₂ (%)" required><FormInput type="number" value={form.spo2} onChange={v => setF('spo2', parseInt(v) || 0)} /></FormGroup>
          <FormGroup label="RR (/min)" required><FormInput type="number" value={form.rr} onChange={v => setF('rr', parseInt(v) || 0)} /></FormGroup>
          <FormGroup label="Weight (kg)"><FormInput type="number" step="0.1" value={form.weightKg} onChange={v => setF('weightKg', parseFloat(v) || 0)} /></FormGroup>
        </div>

        <SectionTitle>Pain & Nursing Interventions</SectionTitle>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormGroup label="Pain Score (0 - 10)">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={form.painScore}
                  onChange={e => setF('painScore', parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-2 border border-slate-200 rounded-lg text-sm text-center font-bold focus:outline-none focus:border-teal-400"
                />
                <span className="text-xs text-slate-500">
                  {form.painScore === 0 ? 'No Pain' : form.painScore <= 3 ? 'Mild' : form.painScore <= 6 ? 'Moderate' : 'Severe'}
                </span>
              </div>
            </FormGroup>
            <FormGroup label="Pain Intensity">
              <FormSelect value={form.painIntensity} onChange={v => setF('painIntensity', v)} options={['', 'Mild', 'Moderate', 'Severe', 'Very Severe']} />
            </FormGroup>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormGroup label="Pain Location">
              <FormInput value={form.painLocation} onChange={v => setF('painLocation', v)} placeholder="e.g. Abdomen, Surgical site, Back" />
            </FormGroup>
            <FormGroup label="Action Taken (Dropdown)">
              <FormSelect value={form.painActionTaken} onChange={v => setF('painActionTaken', v)} options={ACTION_TAKEN_OPTIONS} />
            </FormGroup>
          </div>
        </div>
      </FormDrawer>
    </div>
  );
}
