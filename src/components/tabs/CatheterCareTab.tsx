'use client';

import { useState } from 'react';
import { useEMR } from '@/context/EMRContext';
import { generateId, nowDateStr, nowTimeStr } from '@/lib/store';
import { formatDate } from '@/lib/utils';
import { FormDrawer, FormGroup, FormInput, FormSelect, FormTextarea, SectionTitle, StatusBadge, EmptyState, CardHeader, TealButton, SoftButton, YesNoToggle } from '@/components/FormDrawer';
import { Plus, Edit2, Droplets } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CatheterCare } from '@/lib/types';

// 5 pre-insertion safety checklist questions (Yes/No only)
const SAFETY_CHECKLIST = [
  'Is an appropriate indication present for the catheter?',
  'Are all items sterile for catheter insertion?',
  'Is the catheter inserted using a strict aseptic non-touch technique?',
  'Is the catheter size appropriate for the patient?',
  'Is the catheter properly secured after placement?',
];

export function CatheterCareTab() {
  const { store, selectedPatient, updateStore } = useEMR();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: nowDateStr(), time: nowTimeStr(), nurseName: '',
    catheterType: '', insertionDate: nowDateStr(), insertionTime: '',
    catheterPosition: 'Inside' as 'Inside' | 'Outside', // NEW: inside/outside indicator
    safetyChecklist: SAFETY_CHECKLIST.map(() => null as boolean | null), // NEW: 5 yes/no questions
    siteCondition: '', patency: '', urineCharacteristics: '', urineOutputMl: 0,
    carePerformed: '',
    // 3 complication types
    complicationUTI: 'None', complicationBlockage: 'None', complicationLeakage: 'None',
    actionTaken: '',
    removalDate: '', removalTime: '', removalReason: '',
  });

  const patientId = selectedPatient!.id;
  const records = store.catheterCare.filter(r => r.patientId === patientId);

  function setF(k: string, v: string | number) { setForm(p => ({ ...p, [k]: v })); }

  function openNew() {
    setForm({ date: nowDateStr(), time: nowTimeStr(), nurseName: '', catheterType: '', insertionDate: nowDateStr(), insertionTime: '', catheterPosition: 'Inside', safetyChecklist: SAFETY_CHECKLIST.map(() => null), siteCondition: '', patency: '', urineCharacteristics: '', urineOutputMl: 0, carePerformed: '', complicationUTI: 'None', complicationBlockage: 'None', complicationLeakage: 'None', actionTaken: '', removalDate: '', removalTime: '', removalReason: '' });
    setEditId(null); setDrawerOpen(true);
  }

  function openEdit(r: CatheterCare) {
    setForm({
      date: r.date, time: r.time, nurseName: r.nurseName,
      catheterType: r.catheterType,
      insertionDate: r.insertionDate,
      insertionTime: r.insertionTime,
      catheterPosition: r.catheterPosition || 'Inside',
      safetyChecklist: r.safetyChecklist || SAFETY_CHECKLIST.map(() => null),
      siteCondition: r.siteCondition,
      patency: r.patency,
      urineCharacteristics: r.urineCharacteristics,
      urineOutputMl: r.urineOutputMl,
      carePerformed: r.carePerformed,
      complicationUTI: r.complicationUTI || 'None',
      complicationBlockage: r.complicationBlockage || 'None',
      complicationLeakage: r.complicationLeakage || 'None',
      actionTaken: r.actionTaken,
      removalDate: r.removalDate || '',
      removalTime: r.removalTime || '',
      removalReason: r.removalReason || ''
    });
    setEditId(r.id); setDrawerOpen(true);
  }

  function save(status: 'Completed' | 'Draft') {
    updateStore(prev => {
      if (editId) return { ...prev, catheterCare: prev.catheterCare.map(r => r.id === editId ? { ...r, ...form, status } : r) };
      return { ...prev, catheterCare: [...prev.catheterCare, { id: generateId(), patientId, ...form, status, createdAt: new Date().toISOString() } as CatheterCare] };
    });
    setDrawerOpen(false);
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="ncard">
        <CardHeader title="Urinary Catheter Care" actions={<TealButton onClick={openNew} size="sm"><Plus size={14} /> Urinary Catheter Care</TealButton>} />
        <div className="ncard-body">
          {records.length === 0 ? (
            <EmptyState icon={<Droplets />} title="No urinary catheter care records" action={<TealButton onClick={openNew}><Plus size={14} /> Urinary Catheter Care</TealButton>} />
          ) : (
            <div className="space-y-3">
              {records.map(r => (
                <div key={r.id} className="row-item">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm">{formatDate(r.date)} {r.time}</span>
                      {r.catheterPosition && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-semibold border border-teal-200">Catheter {r.catheterPosition}</span>
                      )}
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600 mb-2">
                      <span><b>Type:</b> {r.catheterType}</span>
                      <span><b>Site:</b> {r.siteCondition}</span>
                      <span><b>Patency:</b> {r.patency}</span>
                      <span><b>Urine:</b> {r.urineOutputMl} mL</span>
                    </div>
                    {r.insertionDate && (
                      <div className="text-xs text-slate-500 mb-1">
                        📅 Inserted: {r.insertionDate} {r.insertionTime || ''}
                        {r.removalDate && ` → Removed: ${r.removalDate} ${r.removalTime || ''}`}
                      </div>
                    )}
                    <p className="text-xs text-slate-600">{r.carePerformed}</p>
                    {r.complications && r.complications !== 'None' && <p className="text-xs text-red-600 mt-1"><b>Complications:</b> {r.complications}</p>}
                    <div className="text-xs text-slate-400 mt-1">By {r.nurseName || 'Demo Nurse'}</div>
                  </div>
                  <SoftButton onClick={() => openEdit(r)} size="sm"><Edit2 size={12} /> Edit</SoftButton>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <FormDrawer open={drawerOpen} title={editId ? 'Edit Urinary Catheter Care' : 'Urinary Catheter Care'} subtitle={selectedPatient!.name} onClose={() => setDrawerOpen(false)} onSave={() => save('Completed')} onSaveDraft={() => save('Draft')}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <FormGroup label="Date"><FormInput type="date" value={form.date} onChange={v => setF('date', v)} /></FormGroup>
          <FormGroup label="Time"><FormInput type="time" value={form.time} onChange={v => setF('time', v)} /></FormGroup>
          <FormGroup label="Nurse Name"><FormInput value={form.nurseName} onChange={v => setF('nurseName', v)} placeholder="Nurse name" /></FormGroup>
        </div>
        {/* 1. Catheter Position — moved first per requirement */}
        <SectionTitle>Catheter Position</SectionTitle>
        <div className="flex gap-3">
          {(['Inside', 'Outside'] as const).map(pos => (
            <button key={pos} onClick={() => setForm(p => ({ ...p, catheterPosition: pos }))} className={cn('flex-1 py-2 rounded-xl border-2 text-sm font-semibold transition-colors', form.catheterPosition === pos ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300')}>Catheter {pos}</button>
          ))}
        </div>

        {/* 2. Catheter Care Details */}
        <SectionTitle>Catheter Care Details</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <FormGroup label="Catheter Type" required>
            <FormSelect value={form.catheterType} onChange={v => setF('catheterType', v)} options={['', 'Foley Catheter (12Fr)', 'Foley Catheter (14Fr)', 'Foley Catheter (16Fr)', 'Foley Catheter (18Fr)', 'Suprapubic Catheter', 'Condom Catheter', 'Intermittent Catheter', 'Other']} />
          </FormGroup>
          <FormGroup label="Insertion Date"><FormInput type="date" value={form.insertionDate} onChange={v => setF('insertionDate', v)} /></FormGroup>
          <FormGroup label="Insertion Time"><FormInput type="time" value={form.insertionTime} onChange={v => setF('insertionTime', v)} /></FormGroup>
        </div>

        {/* 3. Assessment */}
        <SectionTitle>Assessment</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <FormGroup label="Site Condition"><FormInput value={form.siteCondition} onChange={v => setF('siteCondition', v)} placeholder="Intact, redness, discharge..." /></FormGroup>
          <FormGroup label="Patency"><FormSelect value={form.patency} onChange={v => setF('patency', v)} options={['', 'Patent', 'Blocked', 'Bypassing', 'Kinked']} /></FormGroup>
          <FormGroup label="Urine Characteristics"><FormInput value={form.urineCharacteristics} onChange={v => setF('urineCharacteristics', v)} placeholder="Clear, yellow, cloudy, haematuria..." /></FormGroup>
          <FormGroup label="Urine Output (mL)"><FormInput type="number" value={form.urineOutputMl} onChange={v => setF('urineOutputMl', parseInt(v) || 0)} /></FormGroup>
        </div>
        <FormGroup label="Care Performed" className="mt-3"><FormTextarea value={form.carePerformed} onChange={v => setF('carePerformed', v)} placeholder="Describe care performed..." rows={3} /></FormGroup>

        {/* 4. Pre-Insertion Safety Checklist */}
        <SectionTitle>Pre-Insertion Safety Checklist</SectionTitle>
        <div className="space-y-2">
          {SAFETY_CHECKLIST.map((q, i) => (
            <div key={i} className="flex items-start justify-between gap-3 px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-sm text-slate-700 flex-1">{i + 1}. {q}</span>
              <div className="flex-shrink-0">
                <YesNoToggle value={form.safetyChecklist[i]} onChange={v => setForm(p => ({ ...p, safetyChecklist: p.safetyChecklist.map((c, j) => j === i ? v : c) }))} />
              </div>
            </div>
          ))}
        </div>

        {/* Complications — 3 types */}
        <SectionTitle>Complications</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FormGroup label="UTI (Urinary Tract Infection)">
            <FormSelect value={form.complicationUTI} onChange={v => setF('complicationUTI', v)} options={['None', 'Suspected', 'Confirmed', 'Under Treatment']} />
          </FormGroup>
          <FormGroup label="Blockage">
            <FormSelect value={form.complicationBlockage} onChange={v => setF('complicationBlockage', v)} options={['None', 'Partial Blockage', 'Complete Blockage', 'Resolved']} />
          </FormGroup>
          <FormGroup label="Leakage / Bypassing">
            <FormSelect value={form.complicationLeakage} onChange={v => setF('complicationLeakage', v)} options={['None', 'Mild Leakage', 'Significant Leakage', 'Bypassing']} />
          </FormGroup>
        </div>
        <FormGroup label="Action Taken" className="mt-3"><FormInput value={form.actionTaken} onChange={v => setF('actionTaken', v)} placeholder="Action taken..." /></FormGroup>
        <SectionTitle>Removal (if applicable)</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          <FormGroup label="Removal Date"><FormInput type="date" value={form.removalDate} onChange={v => setF('removalDate', v)} /></FormGroup>
          <FormGroup label="Removal Time"><FormInput type="time" value={form.removalTime} onChange={v => setF('removalTime', v)} /></FormGroup>
          <FormGroup label="Reason for Removal"><FormInput value={form.removalReason} onChange={v => setF('removalReason', v)} placeholder="Reason..." /></FormGroup>
        </div>
      </FormDrawer>
    </div>
  );
}
