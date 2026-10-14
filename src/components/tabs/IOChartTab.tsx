'use client';

import { useState } from 'react';
import { useEMR } from '@/context/EMRContext';
import { generateId, nowDateStr, nowTimeStr } from '@/lib/store';
import { getShiftFromTime } from '@/lib/utils';
import { FormDrawer, FormGroup, FormInput, FormSelect, FormTextarea, SectionTitle, StatusBadge, EmptyState, CardHeader, TealButton } from '@/components/FormDrawer';
import { Plus, Droplets } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IOChartEntry } from '@/lib/types';

// Standard nursing time slots for I/O documentation
const TIME_SLOTS = ['02:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '00:00'];

function defaultForm() {
  return {
    date: nowDateStr(), time: nowTimeStr(), shift: getShiftFromTime(nowTimeStr()) as 'Morning' | 'Afternoon' | 'Night',
    nurseName: '',
    oralIntake: 0, rtIntake: 0, infusion: 0, antibiotic: 0, ivFluids: 0, intakeOther: 0, intakeOtherLabel: '',
    urineOutput: 0, drainOutput: 0, vomit: 0, stool: 0, rtAspiration: 0, outputOther: 0,
    remarks: '',
  };
}

export function IOChartTab() {
  const { store, selectedPatient, updateStore } = useEMR();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState(defaultForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [activeDate, setActiveDate] = useState(nowDateStr());

  const patientId = selectedPatient!.id;
  const allRecords = store.ioChart.filter(r => r.patientId === patientId);
  const dateRecords = allRecords.filter(r => r.date === activeDate);

  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 3 + i); return d.toISOString().substring(0, 10); });
  const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  function setF(k: string, v: number | string) { setForm(prev => ({ ...prev, [k]: v })); }

  function openNew() { setForm(defaultForm()); setEditId(null); setDrawerOpen(true); }

  function save(status: 'Completed' | 'Draft') {
    updateStore(prev => {
      // Save or update I/O chart entry
      const newIoId = editId || generateId();
      let newIoChart: IOChartEntry[];
      if (editId) {
        newIoChart = prev.ioChart.map(r => r.id === editId ? { ...r, ...form, status } : r);
      } else {
        const entry: IOChartEntry = { id: newIoId, patientId, ...form, status, createdAt: new Date().toISOString() };
        newIoChart = [...prev.ioChart, entry];
      }

      // Auto-reflect in ICU chart — create/update a linked ICU chart entry for the same date+time
      const totalIntake = form.oralIntake + form.rtIntake + form.infusion + form.antibiotic + form.ivFluids + form.intakeOther;
      const totalOutput = form.urineOutput + form.drainOutput + form.vomit + form.stool + form.rtAspiration + form.outputOther;
      const existingIcu = prev.icuCharts.find(r => r.patientId === patientId && r.ioSourceId === newIoId);
      const icuEntry = {
        id: existingIcu?.id || generateId(),
        patientId,
        date: form.date,
        time: form.time,
        shift: form.shift,
        nurseName: form.nurseName,
        ioSourceId: newIoId, // link back to I/O entry
        // I/O linked fields
        totalIntake,
        totalOutput,
        ioBalance: totalIntake - totalOutput,
        oralIntake: form.oralIntake,
        ivFluids: form.ivFluids + form.infusion + form.antibiotic,
        urineOutput: form.urineOutput,
        drainOutput: form.drainOutput,
        // Placeholder vitals (user can override in ICU tab)
        bpSys: existingIcu?.bpSys ?? 0, bpDia: existingIcu?.bpDia ?? 0,
        pulse: existingIcu?.pulse ?? 0, tempF: existingIcu?.tempF ?? 0,
        rr: existingIcu?.rr ?? 0, spo2: existingIcu?.spo2 ?? 0,
        gcs: existingIcu?.gcs ?? 15, levelOfConsciousness: existingIcu?.levelOfConsciousness ?? 'Alert',
        bloodSugar: existingIcu?.bloodSugar ?? 0,
        ventilatorMode: existingIcu?.ventilatorMode ?? '',
        fiO2: existingIcu?.fiO2 ?? 0, peep: existingIcu?.peep ?? 0,
        sedationScore: existingIcu?.sedationScore ?? '',
        remarks: form.remarks,
        status: status as 'Completed' | 'Draft',
        createdAt: existingIcu?.createdAt ?? new Date().toISOString(),
      };
      const newIcuCharts = existingIcu
        ? prev.icuCharts.map(r => r.id === existingIcu.id ? icuEntry : r)
        : [...prev.icuCharts, icuEntry];

      return { ...prev, ioChart: newIoChart, icuCharts: newIcuCharts };
    });
    setActiveDate(form.date); setDrawerOpen(false);
  }

  // Totals for active date
  const totalIn = dateRecords.reduce((s, r) => s + r.oralIntake + r.rtIntake + r.infusion + r.antibiotic + r.ivFluids + r.intakeOther, 0);
  const totalOut = dateRecords.reduce((s, r) => s + r.urineOutput + r.drainOutput + r.vomit + r.stool + r.rtAspiration + r.outputOther, 0);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="ncard">
        <CardHeader title="Intake / Output Chart" actions={<TealButton onClick={openNew} size="sm"><Plus size={14} /> Add Entry</TealButton>} />
        <div className="ncard-body">
          <div className="date-strip">
            {days.map(d => { const date = new Date(d); return <div key={d} className={`date-day ${d === activeDate ? 'active' : ''}`} onClick={() => setActiveDate(d)}><div className="dow">{DOW[date.getDay()]}</div><div className="dom">{date.getDate()}</div></div>; })}
            <input type="date" value={activeDate} onChange={e => setActiveDate(e.target.value)} className="px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-400" />
          </div>

          {/* Totals */}
          <div className="io-totals-grid mb-4">
            <div className="io-total-box"><div className="lbl text-xs text-slate-400">Total Intake</div><div className="v text-lg font-bold text-slate-800">{totalIn} mL</div></div>
            <div className="io-total-box"><div className="lbl text-xs text-slate-400">Total Output</div><div className="v text-lg font-bold text-slate-800">{totalOut} mL</div></div>
            <div className="io-total-box balance"><div className="lbl text-xs text-slate-400">Balance</div><div className="v text-lg font-bold text-teal-700">{totalIn - totalOut} mL</div></div>
          </div>

          {dateRecords.length === 0 ? (
            <EmptyState icon={<Droplets />} title="No I/O entries for this date" action={<TealButton onClick={openNew}><Plus size={14} /> Add Entry</TealButton>} />
          ) : (
            <div className="overflow-x-auto">
              <table className="icu-table">
                <thead>
                  <tr>
                    <th>Time</th><th>Shift</th>
                    <th colSpan={6} className="bg-green-50 text-green-700">INTAKE (mL)</th>
                    <th colSpan={6} className="bg-red-50 text-red-700">OUTPUT (mL)</th>
                    <th>Remarks</th><th>Status</th>
                  </tr>
                  <tr>
                    <th></th><th></th>
                    <th className="bg-green-50 text-green-600">Oral</th>
                    <th className="bg-green-50 text-green-600">RT</th>
                    <th className="bg-green-50 text-green-600">Infusion</th>
                    <th className="bg-green-50 text-green-600">Antibiotic</th>
                    <th className="bg-green-50 text-green-600">IV Fluid</th>
                    <th className="bg-green-50 text-green-600">Other</th>
                    <th className="bg-red-50 text-red-600">Urine</th>
                    <th className="bg-red-50 text-red-600">Drain</th>
                    <th className="bg-red-50 text-red-600">Vomit</th>
                    <th className="bg-red-50 text-red-600">Stool</th>
                    <th className="bg-red-50 text-red-600">RT Asp.</th>
                    <th className="bg-red-50 text-red-600">Other</th>
                    <th></th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {dateRecords.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="font-bold">{r.time}</td>
                      <td><span className="text-xs px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full">{r.shift}</span></td>
                      <td className="text-green-700">{r.oralIntake || '—'}</td>
                      <td className="text-green-700">{r.rtIntake || '—'}</td>
                      <td className="text-green-700">{r.infusion || '—'}</td>
                      <td className="text-green-700">{r.antibiotic || '—'}</td>
                      <td className="text-green-700">{r.ivFluids || '—'}</td>
                      <td className="text-green-700">{r.intakeOther || '—'}</td>
                      <td className="text-red-700">{r.urineOutput || '—'}</td>
                      <td className="text-red-700">{r.drainOutput || '—'}</td>
                      <td className="text-red-700">{r.vomit || '—'}</td>
                      <td className="text-red-700">{r.stool || '—'}</td>
                      <td className="text-red-700">{r.rtAspiration || '—'}</td>
                      <td className="text-red-700">{r.outputOther || '—'}</td>
                      <td className="text-xs text-slate-400">{r.remarks}</td>
                      <td><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <FormDrawer open={drawerOpen} title="Add I/O Entry" subtitle={selectedPatient!.name} onClose={() => setDrawerOpen(false)} onSave={() => save('Completed')} onSaveDraft={() => save('Draft')}>
        {/* Time slot quick-picker */}
        <div className="mb-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Quick Time Selection</div>
          <div className="flex flex-wrap gap-1.5">
            {TIME_SLOTS.map(t => (
              <button key={t} onClick={() => setF('time', t)} className={cn('px-2.5 py-1 rounded-full border text-xs font-medium transition-colors', form.time === t ? 'bg-teal-500 text-white border-teal-500' : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300')}>{t}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <FormGroup label="Time" required><FormInput type="time" value={form.time} onChange={v => setF('time', v)} /></FormGroup>
          <FormGroup label="Shift"><FormSelect value={form.shift} onChange={v => setF('shift', v)} options={['Morning', 'Afternoon', 'Night']} /></FormGroup>
          <FormGroup label="Date" required><FormInput type="date" value={form.date} onChange={v => setF('date', v)} /></FormGroup>
          <FormGroup label="Nurse Name"><FormInput value={form.nurseName} onChange={v => setF('nurseName', v)} placeholder="Nurse name" /></FormGroup>
        </div>

        <SectionTitle>Intake (mL)</SectionTitle>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          <FormGroup label="Oral Intake"><FormInput type="number" value={form.oralIntake} onChange={v => setF('oralIntake', parseInt(v) || 0)} /></FormGroup>
          <FormGroup label="RT (Ryle's Tube)"><FormInput type="number" value={form.rtIntake} onChange={v => setF('rtIntake', parseInt(v) || 0)} /></FormGroup>
          <FormGroup label="Infusion"><FormInput type="number" value={form.infusion} onChange={v => setF('infusion', parseInt(v) || 0)} /></FormGroup>
          <FormGroup label="Antibiotic"><FormInput type="number" value={form.antibiotic} onChange={v => setF('antibiotic', parseInt(v) || 0)} /></FormGroup>
          <FormGroup label="IV Fluids"><FormInput type="number" value={form.ivFluids} onChange={v => setF('ivFluids', parseInt(v) || 0)} /></FormGroup>
          <FormGroup label="Other (Intake)"><FormInput type="number" value={form.intakeOther} onChange={v => setF('intakeOther', parseInt(v) || 0)} /></FormGroup>
        </div>

        <SectionTitle>Output (mL)</SectionTitle>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          <FormGroup label="Urine Output"><FormInput type="number" value={form.urineOutput} onChange={v => setF('urineOutput', parseInt(v) || 0)} /></FormGroup>
          <FormGroup label="Drain Output"><FormInput type="number" value={form.drainOutput} onChange={v => setF('drainOutput', parseInt(v) || 0)} /></FormGroup>
          <FormGroup label="Vomit"><FormInput type="number" value={form.vomit} onChange={v => setF('vomit', parseInt(v) || 0)} /></FormGroup>
          <FormGroup label="Stool"><FormInput type="number" value={form.stool} onChange={v => setF('stool', parseInt(v) || 0)} /></FormGroup>
          <FormGroup label="RT Aspiration"><FormInput type="number" value={form.rtAspiration} onChange={v => setF('rtAspiration', parseInt(v) || 0)} /></FormGroup>
          <FormGroup label="Other (Output)"><FormInput type="number" value={form.outputOther} onChange={v => setF('outputOther', parseInt(v) || 0)} /></FormGroup>
        </div>

        <SectionTitle>Remarks</SectionTitle>
        <FormGroup label="Remarks"><FormTextarea value={form.remarks} onChange={v => setF('remarks', v)} placeholder="Remarks..." rows={2} /></FormGroup>
      </FormDrawer>
    </div>
  );
}
