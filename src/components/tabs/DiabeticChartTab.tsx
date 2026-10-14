'use client';
import { useState } from 'react';
import { useEMR } from '@/context/EMRContext';
import { generateId, nowDateStr, nowTimeStr } from '@/lib/store';
import { FormDrawer, FormGroup, FormInput, FormSelect, FormTextarea, SectionTitle, StatusBadge, EmptyState, CardHeader, TealButton } from '@/components/FormDrawer';
import { Plus, TestTube } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DiabeticFlowChart } from '@/lib/types';

export function DiabeticChartTab() {
  const { store, selectedPatient, updateStore } = useEMR();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [activeDate, setActiveDate] = useState(nowDateStr());
  const [form, setForm] = useState({
    date: nowDateStr(), time: nowTimeStr(), nurseName: '',
    glucoseMgDl: 0, testType: 'Random' as DiabeticFlowChart['testType'],
    mealStatus: 'Random' as DiabeticFlowChart['mealStatus'],
    insulinGiven: false, insulinType: '', dose: 0,
    isHypoglycaemia: false, isHyperglycaemia: false,
    actionTaken: '', remarks: '',
  });

  const patientId = selectedPatient!.id;
  const allRecords = store.diabeticFlowCharts.filter(r => r.patientId === patientId);
  const dateRecords = allRecords.filter(r => r.date === activeDate);

  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 3 + i); return d.toISOString().substring(0, 10); });
  const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  function setF(k: string, v: unknown) { setForm(p => ({ ...p, [k]: v })); }

  function openNew() {
    const g = 0;
    setForm({ date: nowDateStr(), time: nowTimeStr(), nurseName: '', glucoseMgDl: g, testType: 'Random', mealStatus: 'Random', insulinGiven: false, insulinType: '', dose: 0, isHypoglycaemia: false, isHyperglycaemia: false, actionTaken: '', remarks: '' });
    setEditId(null); setDrawerOpen(true);
  }

  function save(status: 'Completed' | 'Draft') {
    const hypo = form.glucoseMgDl < 70 && form.glucoseMgDl > 0;
    const hyper = form.glucoseMgDl > 200;
    updateStore(prev => {
      const rec = { ...form, isHypoglycaemia: hypo, isHyperglycaemia: hyper, status };
      if (editId) return { ...prev, diabeticFlowCharts: prev.diabeticFlowCharts.map(r => r.id === editId ? { ...r, ...rec } : r) };
      return { ...prev, diabeticFlowCharts: [...prev.diabeticFlowCharts, { id: generateId(), patientId, ...rec, createdAt: new Date().toISOString() } as DiabeticFlowChart] };
    });
    setActiveDate(form.date); setDrawerOpen(false);
  }

  function glucoseColor(g: number) {
    if (g < 70) return 'text-blue-700 font-bold';
    if (g <= 140) return 'text-green-700';
    if (g <= 200) return 'text-amber-700 font-semibold';
    return 'text-red-700 font-bold';
  }

  // NOTE: Glucose thresholds below are demo placeholders. Hospital-approved values must be configured before clinical use.
  const avgGlucose = dateRecords.length > 0 ? Math.round(dateRecords.reduce((s, r) => s + r.glucoseMgDl, 0) / dateRecords.length) : null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-700">
        ⚠ Glucose alert thresholds shown are demo placeholders (&lt;70 = Low, &gt;200 = High). Hospital-approved thresholds must be configured before clinical use.
      </div>
      <div className="ncard">
        <CardHeader title="Diabetic Flow Chart" actions={<TealButton onClick={openNew} size="sm"><Plus size={14} /> Add Reading</TealButton>} />
        <div className="ncard-body">
          <div className="date-strip">
            {days.map(d => { const date = new Date(d); return <div key={d} className={`date-day ${d === activeDate ? 'active' : ''}`} onClick={() => setActiveDate(d)}><div className="dow">{DOW[date.getDay()]}</div><div className="dom">{date.getDate()}</div></div>; })}
            <input type="date" value={activeDate} onChange={e => setActiveDate(e.target.value)} className="px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-400" />
          </div>

          {/* Summary */}
          {avgGlucose !== null && (
            <div className="flex items-center gap-4 mb-4 p-3 bg-slate-50 rounded-xl">
              <div><div className="text-xs text-slate-400">Avg Glucose</div><div className={cn('text-xl font-bold', glucoseColor(avgGlucose))}>{avgGlucose} mg/dL</div></div>
              <div><div className="text-xs text-slate-400">Readings</div><div className="text-xl font-bold text-slate-700">{dateRecords.length}</div></div>
              {dateRecords.some(r => r.isHypoglycaemia) && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">⬇ Hypoglycaemia noted</span>}
              {dateRecords.some(r => r.isHyperglycaemia) && <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">⬆ Hyperglycaemia noted</span>}
            </div>
          )}

          {dateRecords.length === 0 ? (
            <EmptyState icon={<TestTube />} title="No glucose readings for this date" action={<TealButton onClick={openNew}><Plus size={14} /> Add Reading</TealButton>} />
          ) : (
            <div className="overflow-x-auto">
              <table className="icu-table">
                <thead>
                  <tr>
                    <th>Time</th><th>Glucose (mg/dL)</th><th>Test Type</th><th>Meal Status</th>
                    <th>Insulin Given</th><th>Dose</th><th>Flags</th><th>Action</th><th>Nurse</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dateRecords.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="font-bold">{r.time}</td>
                      <td className={glucoseColor(r.glucoseMgDl)}>{r.glucoseMgDl}</td>
                      <td className="text-xs">{r.testType}</td>
                      <td className="text-xs">{r.mealStatus}</td>
                      <td>{r.insulinGiven ? <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">Yes — {r.insulinType}</span> : '—'}</td>
                      <td>{r.insulinGiven ? `${r.dose} units` : '—'}</td>
                      <td className="text-xs">
                        {r.isHypoglycaemia && <span className="text-blue-700 font-bold">HYPO ⬇</span>}
                        {r.isHyperglycaemia && <span className="text-red-700 font-bold">HYPER ⬆</span>}
                        {!r.isHypoglycaemia && !r.isHyperglycaemia && <span className="text-green-600">Normal</span>}
                      </td>
                      <td className="text-xs text-slate-600 max-w-32 truncate">{r.actionTaken}</td>
                      <td className="text-xs text-slate-500">{r.nurseName || 'Demo'}</td>
                      <td><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <FormDrawer open={drawerOpen} title="Record Blood Glucose" subtitle={selectedPatient!.name} onClose={() => setDrawerOpen(false)} onSave={() => save('Completed')} onSaveDraft={() => save('Draft')}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <FormGroup label="Time" required><FormInput type="time" value={form.time} onChange={v => setF('time', v)} /></FormGroup>
          <FormGroup label="Date" required><FormInput type="date" value={form.date} onChange={v => setF('date', v)} /></FormGroup>
          <FormGroup label="Nurse Name"><FormInput value={form.nurseName} onChange={v => setF('nurseName', v)} /></FormGroup>
        </div>
        <SectionTitle>Blood Glucose</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <FormGroup label="Glucose (mg/dL)" required>
            <FormInput type="number" value={form.glucoseMgDl} onChange={v => setF('glucoseMgDl', parseInt(v) || 0)} />
            {form.glucoseMgDl > 0 && (
              <div className={cn('text-xs mt-1 font-semibold', glucoseColor(form.glucoseMgDl))}>
                {form.glucoseMgDl < 70 ? '⚠ Hypoglycaemia' : form.glucoseMgDl > 200 ? '⚠ Hyperglycaemia' : '✓ Normal range'}
              </div>
            )}
          </FormGroup>
          <FormGroup label="Test Type" required>
            <FormSelect value={form.testType} onChange={v => setF('testType', v)} options={['Fasting', 'Post-Prandial', 'Random', 'Bedside']} />
          </FormGroup>
          <FormGroup label="Meal Status">
            <FormSelect value={form.mealStatus} onChange={v => setF('mealStatus', v)} options={['Fasting', 'Post-Meal', 'Pre-Meal', 'Random']} />
          </FormGroup>
        </div>
        <SectionTitle>Insulin / Medication</SectionTitle>
        <div className="flex items-center gap-3 mb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.insulinGiven} onChange={e => setF('insulinGiven', e.target.checked)} className="w-4 h-4 accent-teal-500" />
            <span className="text-sm font-medium">Insulin Given</span>
          </label>
        </div>
        {form.insulinGiven && (
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Insulin Type"><FormInput value={form.insulinType} onChange={v => setF('insulinType', v)} placeholder="Regular, NPH, Glargine..." /></FormGroup>
            <FormGroup label="Dose (units)"><FormInput type="number" step="0.5" value={form.dose} onChange={v => setF('dose', parseFloat(v) || 0)} /></FormGroup>
          </div>
        )}
        <FormGroup label="Action Taken" className="mt-3"><FormTextarea value={form.actionTaken} onChange={v => setF('actionTaken', v)} placeholder="Action taken for this reading..." rows={2} /></FormGroup>
        <FormGroup label="Remarks" className="mt-3"><FormTextarea value={form.remarks} onChange={v => setF('remarks', v)} placeholder="Remarks..." rows={2} /></FormGroup>
      </FormDrawer>
    </div>
  );
}
