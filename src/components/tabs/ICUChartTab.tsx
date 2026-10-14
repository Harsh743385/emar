'use client';
import { useState } from 'react';
import { useEMR } from '@/context/EMRContext';
import { generateId, nowDateStr, nowTimeStr } from '@/lib/store';
import { FormDrawer, FormGroup, FormInput, FormSelect, FormTextarea, SectionTitle, StatusBadge, EmptyState, CardHeader, TealButton, SoftButton } from '@/components/FormDrawer';
import { Plus, Edit2, BarChart2 } from 'lucide-react';
import type { ICUChart } from '@/lib/types';

export function ICUChartTab() {
  const { store, selectedPatient, updateStore } = useEMR();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [activeDate, setActiveDate] = useState(nowDateStr());
  const [form, setForm] = useState({
    date: nowDateStr(), time: nowTimeStr(), nurseName: '',
    bpSys: 0, bpDia: 0, pulse: 0, tempF: 98.6, rr: 0, spo2: 0,
    gcs: 15, levelOfConsciousness: 'Alert',
    ventilatorStatus: '', fio2: 0, peep: 0,
    heartRhythm: '', intakeTotal: 0, outputTotal: 0,
    medicationInfusion: '', nursingObservations: '',
    abnormalFindings: '', doctorInformed: false, doctorName: '', escalationTime: '',
  });

  const patientId = selectedPatient!.id;
  const allRecords = store.icuCharts.filter(r => r.patientId === patientId);
  const dateRecords = allRecords.filter(r => r.date === activeDate);

  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 3 + i); return d.toISOString().substring(0, 10); });
  const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  function setF(k: string, v: unknown) { setForm(p => ({ ...p, [k]: v })); }

  function openNew() {
    setForm({ date: nowDateStr(), time: nowTimeStr(), nurseName: '', bpSys: 0, bpDia: 0, pulse: 0, tempF: 98.6, rr: 0, spo2: 0, gcs: 15, levelOfConsciousness: 'Alert', ventilatorStatus: '', fio2: 0, peep: 0, heartRhythm: '', intakeTotal: 0, outputTotal: 0, medicationInfusion: '', nursingObservations: '', abnormalFindings: '', doctorInformed: false, doctorName: '', escalationTime: '' });
    setEditId(null); setDrawerOpen(true);
  }

  function save(status: 'Completed' | 'Draft') {
    updateStore(prev => {
      const rec = { ...form, status };
      if (editId) return { ...prev, icuCharts: prev.icuCharts.map(r => r.id === editId ? { ...r, ...rec } : r) };
      return { ...prev, icuCharts: [...prev.icuCharts, { id: generateId(), patientId, ...rec, createdAt: new Date().toISOString() } as ICUChart] };
    });
    setActiveDate(form.date); setDrawerOpen(false);
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="ncard">
        <CardHeader title="ICU / CCU Chart" actions={<TealButton onClick={openNew} size="sm"><Plus size={14} /> Add Entry</TealButton>} />
        <div className="ncard-body">
          <div className="date-strip">
            {days.map(d => { const date = new Date(d); return <div key={d} className={`date-day ${d === activeDate ? 'active' : ''}`} onClick={() => setActiveDate(d)}><div className="dow">{DOW[date.getDay()]}</div><div className="dom">{date.getDate()}</div></div>; })}
            <input type="date" value={activeDate} onChange={e => setActiveDate(e.target.value)} className="px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-400" />
          </div>

          {dateRecords.length === 0 ? (
            <EmptyState icon={<BarChart2 />} title="No ICU/CCU entries for this date" action={<TealButton onClick={openNew}><Plus size={14} /> Add Entry</TealButton>} />
          ) : (
            <div className="space-y-3">
              {dateRecords.map(r => (
                <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{r.time}</span>
                      <StatusBadge status={r.status} />
                      {r.doctorInformed && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Dr. Informed</span>}
                    </div>
                    <SoftButton onClick={() => { setForm({ date: r.date, time: r.time, nurseName: r.nurseName || '', bpSys: r.bpSys, bpDia: r.bpDia, pulse: r.pulse, tempF: r.tempF, rr: r.rr, spo2: r.spo2, gcs: r.gcs, levelOfConsciousness: r.levelOfConsciousness || 'Alert', ventilatorStatus: r.ventilatorStatus || '', fio2: r.fio2 ?? r.fiO2 ?? 0, peep: r.peep ?? 0, heartRhythm: r.heartRhythm || '', intakeTotal: r.intakeTotal ?? r.totalIntake ?? 0, outputTotal: r.outputTotal ?? r.totalOutput ?? 0, medicationInfusion: r.medicationInfusion || '', nursingObservations: r.nursingObservations || '', abnormalFindings: r.abnormalFindings || '', doctorInformed: r.doctorInformed ?? false, doctorName: r.doctorName || '', escalationTime: r.escalationTime || '' }); setEditId(r.id); setDrawerOpen(true); }} size="sm"><Edit2 size={12} /> Edit</SoftButton>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2">
                    {[['BP', `${r.bpSys}/${r.bpDia}`], ['Pulse', `${r.pulse}`], ['Temp', `${r.tempF}°F`], ['SpO₂', `${r.spo2}%`], ['RR', `${r.rr}`], ['GCS', `${r.gcs}`]].map(([l, v]) => (
                      <div key={l} className="bg-slate-50 rounded-lg p-2 text-center">
                        <div className="text-xs text-slate-400">{l}</div>
                        <div className="text-sm font-bold text-slate-800">{v}</div>
                      </div>
                    ))}
                  </div>
                  {r.ventilatorStatus && <p className="text-xs text-slate-600 mb-1"><b>Ventilator:</b> {r.ventilatorStatus} FiO₂:{r.fio2 ?? r.fiO2 ?? 0}% PEEP:{r.peep}</p>}
                  {r.ioSourceId && (
                    <div className="flex flex-wrap gap-2 mt-2 p-2 bg-blue-50 rounded-lg border border-blue-100">
                      <span className="text-xs font-semibold text-blue-600">📋 Auto-reflected from I/O Chart</span>
                      {r.totalIntake !== undefined && <span className="text-xs text-green-700">↑ In: {r.totalIntake} mL</span>}
                      {r.totalOutput !== undefined && <span className="text-xs text-red-700">↓ Out: {r.totalOutput} mL</span>}
                      {r.ioBalance !== undefined && <span className="text-xs font-bold text-teal-700">Balance: {r.ioBalance} mL</span>}
                    </div>
                  )}
                  {!r.ioSourceId && r.nursingObservations && <p className="text-xs text-slate-600 mb-1">{r.nursingObservations}</p>}
                  {r.abnormalFindings && <p className="text-xs text-red-600"><b>Abnormal:</b> {r.abnormalFindings}</p>}
                  <div className="text-xs text-slate-400 mt-2">By {r.nurseName || 'Demo Nurse'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <FormDrawer open={drawerOpen} title="ICU/CCU Chart Entry" subtitle={selectedPatient!.name} onClose={() => setDrawerOpen(false)} onSave={() => save('Completed')} onSaveDraft={() => save('Draft')}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <FormGroup label="Time" required><FormInput type="time" value={form.time} onChange={v => setF('time', v)} /></FormGroup>
          <FormGroup label="Date" required><FormInput type="date" value={form.date} onChange={v => setF('date', v)} /></FormGroup>
          <FormGroup label="Nurse Name"><FormInput value={form.nurseName} onChange={v => setF('nurseName', v)} /></FormGroup>
        </div>
        <SectionTitle>Vital Signs</SectionTitle>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          <FormGroup label="BP Sys (mmHg)"><FormInput type="number" value={form.bpSys} onChange={v => setF('bpSys', parseInt(v) || 0)} /></FormGroup>
          <FormGroup label="BP Dia (mmHg)"><FormInput type="number" value={form.bpDia} onChange={v => setF('bpDia', parseInt(v) || 0)} /></FormGroup>
          <FormGroup label="Pulse (bpm)"><FormInput type="number" value={form.pulse} onChange={v => setF('pulse', parseInt(v) || 0)} /></FormGroup>
          <FormGroup label="Temp (°F)"><FormInput type="number" step="0.1" value={form.tempF} onChange={v => setF('tempF', parseFloat(v) || 0)} /></FormGroup>
          <FormGroup label="RR (/min)"><FormInput type="number" value={form.rr} onChange={v => setF('rr', parseInt(v) || 0)} /></FormGroup>
          <FormGroup label="SpO₂ (%)"><FormInput type="number" value={form.spo2} onChange={v => setF('spo2', parseInt(v) || 0)} /></FormGroup>
          <FormGroup label="GCS (3-15)"><FormInput type="number" min={3} max={15} value={form.gcs} onChange={v => setF('gcs', parseInt(v) || 15)} /></FormGroup>
          <FormGroup label="Consciousness"><FormSelect value={form.levelOfConsciousness} onChange={v => setF('levelOfConsciousness', v)} options={['Alert', 'Sedated', 'Confused', 'Verbal', 'Pain response', 'Unresponsive']} /></FormGroup>
        </div>
        <SectionTitle>Ventilator / Respiratory</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <FormGroup label="Ventilator Status"><FormInput value={form.ventilatorStatus} onChange={v => setF('ventilatorStatus', v)} placeholder="Volume Control, BiPAP, Off..." /></FormGroup>
          <FormGroup label="FiO₂ (%)"><FormInput type="number" value={form.fio2} onChange={v => setF('fio2', parseInt(v) || 0)} /></FormGroup>
          <FormGroup label="PEEP (cmH₂O)"><FormInput type="number" value={form.peep} onChange={v => setF('peep', parseInt(v) || 0)} /></FormGroup>
          <FormGroup label="Heart Rhythm"><FormInput value={form.heartRhythm} onChange={v => setF('heartRhythm', v)} placeholder="Sinus rhythm, AF, etc." /></FormGroup>
        </div>
        <SectionTitle>I/O Summary</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <FormGroup label="Total Intake (mL)"><FormInput type="number" value={form.intakeTotal} onChange={v => setF('intakeTotal', parseInt(v) || 0)} /></FormGroup>
          <FormGroup label="Total Output (mL)"><FormInput type="number" value={form.outputTotal} onChange={v => setF('outputTotal', parseInt(v) || 0)} /></FormGroup>
        </div>
        <SectionTitle>Observations</SectionTitle>
        <FormGroup label="Medication / Infusion"><FormTextarea value={form.medicationInfusion} onChange={v => setF('medicationInfusion', v)} rows={2} /></FormGroup>
        <FormGroup label="Nursing Observations" className="mt-3"><FormTextarea value={form.nursingObservations} onChange={v => setF('nursingObservations', v)} rows={3} /></FormGroup>
        <FormGroup label="Abnormal Findings" className="mt-3"><FormTextarea value={form.abnormalFindings} onChange={v => setF('abnormalFindings', v)} placeholder="Document any abnormal findings..." rows={2} /></FormGroup>
        <SectionTitle>Doctor Escalation</SectionTitle>
        <div className="flex items-center gap-3 mb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.doctorInformed} onChange={e => setF('doctorInformed', e.target.checked)} className="w-4 h-4 accent-teal-500" />
            <span className="text-sm font-medium">Doctor Informed</span>
          </label>
        </div>
        {form.doctorInformed && (
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Doctor Name"><FormInput value={form.doctorName} onChange={v => setF('doctorName', v)} /></FormGroup>
            <FormGroup label="Time Informed"><FormInput type="time" value={form.escalationTime} onChange={v => setF('escalationTime', v)} /></FormGroup>
          </div>
        )}
      </FormDrawer>
    </div>
  );
}
