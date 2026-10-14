'use client';
import { useState } from 'react';
import { useEMR } from '@/context/EMRContext';
import { generateId, nowDateStr, nowTimeStr } from '@/lib/store';
import { formatDate } from '@/lib/utils';
import { FormDrawer, FormGroup, FormInput, FormSelect, FormTextarea, SectionTitle, StatusBadge, EmptyState, CardHeader, TealButton, SoftButton } from '@/components/FormDrawer';
import { Plus, Edit2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PhlebitisAssessment } from '@/lib/types';

const GRADE_INFO = [
  { grade: 0, label: 'No symptoms', color: 'bg-green-50 text-green-700 border-green-200' },
  { grade: 1, label: 'Erythema at access site with or without pain', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { grade: 2, label: 'Pain, erythema and/or oedema', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { grade: 3, label: 'Pain, erythema and/or oedema, streak formation, palpable venous cord', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { grade: 4, label: 'Pain, erythema, oedema, streak formation, palpable venous cord >1 inch, purulent drainage', color: 'bg-red-50 text-red-700 border-red-200' },
  { grade: 5, label: 'Grade 4 symptoms with fever, malaise and visible thrombus — IV site must be discontinued and systemic treatment initiated', color: 'bg-rose-100 text-rose-800 border-rose-400' },
];

export function PhlebitisTab() {
  const { store, selectedPatient, updateStore } = useEMR();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: nowDateStr(), time: nowTimeStr(), nurseName: '',
    ivSite: '', insertionDate: '', insertionTime: '', removalDate: '', removalTime: '',
    pain: 'None' as PhlebitisAssessment['pain'],
    redness: false, swelling: false, warmth: false,
    phlebitisGrade: 0 as PhlebitisAssessment['phlebitisGrade'],
    actionTaken: '', remarks: '',
  });

  const patientId = selectedPatient!.id;
  const records = store.phlebitisAssessments.filter(r => r.patientId === patientId);

  function setF(k: string, v: unknown) { setForm(p => ({ ...p, [k]: v })); }

  // Auto-calculate grade from symptoms (Grade 5 can only be set manually)
  function calcGrade(pain: string, redness: boolean, swelling: boolean, warmth: boolean): PhlebitisAssessment['phlebitisGrade'] {
    const count = (redness ? 1 : 0) + (swelling ? 1 : 0) + (warmth ? 1 : 0) + (pain !== 'None' ? 1 : 0);
    if (count === 0) return 0;
    if (count === 1) return 1;
    if (count === 2) return 2;
    if (count === 3) return 3;
    return 4;
  }

  function updateSymptom(k: string, v: unknown) {
    const updated = { ...form, [k]: v };
    const grade = calcGrade(k === 'pain' ? v as string : form.pain, k === 'redness' ? v as boolean : form.redness, k === 'swelling' ? v as boolean : form.swelling, k === 'warmth' ? v as boolean : form.warmth);
    setForm({ ...updated, phlebitisGrade: grade });
  }

  function openNew() {
    setForm({ date: nowDateStr(), time: nowTimeStr(), nurseName: '', ivSite: '', insertionDate: '', insertionTime: '', removalDate: '', removalTime: '', pain: 'None', redness: false, swelling: false, warmth: false, phlebitisGrade: 0, actionTaken: '', remarks: '' });
    setEditId(null); setDrawerOpen(true);
  }

  function save(status: 'Completed' | 'Draft') {
    updateStore(prev => {
      const rec = { ...form, status };
      if (editId) return { ...prev, phlebitisAssessments: prev.phlebitisAssessments.map(r => r.id === editId ? { ...r, ...rec } : r) };
      return { ...prev, phlebitisAssessments: [...prev.phlebitisAssessments, { id: generateId(), patientId, ...rec, createdAt: new Date().toISOString() } as PhlebitisAssessment] };
    });
    setDrawerOpen(false);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 text-xs text-slate-600">
        ℹ Phlebitis grading scale shown is a demo placeholder. Verify against hospital-approved VIP (Visual Infusion Phlebitis) scale before clinical use.
      </div>
      <div className="ncard">
        <CardHeader title="Phlebitis Assessment" actions={<TealButton onClick={openNew} size="sm"><Plus size={14} /> New Assessment</TealButton>} />
        <div className="ncard-body">
          {records.length === 0 ? (
            <EmptyState icon={<Zap />} title="No phlebitis assessments" action={<TealButton onClick={openNew}><Plus size={14} /> New Assessment</TealButton>} />
          ) : (
            <div className="space-y-3">
              {records.map(r => {
                const gradeInfo = GRADE_INFO[r.phlebitisGrade] || GRADE_INFO[GRADE_INFO.length - 1];
                return (
                  <div key={r.id} className="row-item">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-sm">{formatDate(r.date)} {r.time}</span>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full border font-bold', gradeInfo.color)}>Grade {r.phlebitisGrade}</span>
                        <StatusBadge status={r.status} />
                      </div>
                      <div className="text-sm text-slate-700 mb-1"><b>Site:</b> {r.ivSite}</div>
                      {r.insertionDate && (
                        <div className="text-xs text-slate-500 mb-1">
                          📅 Inserted: {r.insertionDate} {r.insertionTime || ''}
                          {r.removalDate && ` → Removed: ${r.removalDate} ${r.removalTime || ''}`}
                        </div>
                      )}
                      <div className="flex gap-3 text-xs mb-1">
                        <span><b>Pain:</b> {r.pain}</span>
                        {r.redness && <span className="text-red-600">Redness ✓</span>}
                        {r.swelling && <span className="text-orange-600">Swelling ✓</span>}
                        {r.warmth && <span className="text-amber-600">Warmth ✓</span>}
                      </div>
                      <p className="text-xs text-slate-600 italic">{gradeInfo.label}</p>
                      {r.actionTaken && <p className="text-xs text-slate-600 mt-1"><b>Action:</b> {r.actionTaken}</p>}
                      <div className="text-xs text-slate-400 mt-1">By {r.nurseName || 'Demo Nurse'}</div>
                    </div>
                    <SoftButton onClick={() => { setForm({ date: r.date, time: r.time, nurseName: r.nurseName, ivSite: r.ivSite, insertionDate: r.insertionDate || '', insertionTime: r.insertionTime || '', removalDate: r.removalDate || '', removalTime: r.removalTime || '', pain: r.pain, redness: r.redness, swelling: r.swelling, warmth: r.warmth, phlebitisGrade: r.phlebitisGrade, actionTaken: r.actionTaken, remarks: r.remarks }); setEditId(r.id); setDrawerOpen(true); }} size="sm"><Edit2 size={12} /> Edit</SoftButton>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <FormDrawer open={drawerOpen} title="Phlebitis Assessment" subtitle={selectedPatient!.name} onClose={() => setDrawerOpen(false)} onSave={() => save('Completed')} onSaveDraft={() => save('Draft')}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <FormGroup label="Date"><FormInput type="date" value={form.date} onChange={v => setF('date', v)} /></FormGroup>
          <FormGroup label="Time"><FormInput type="time" value={form.time} onChange={v => setF('time', v)} /></FormGroup>
          <FormGroup label="Nurse Name"><FormInput value={form.nurseName} onChange={v => setF('nurseName', v)} /></FormGroup>
        </div>
        <SectionTitle>IV Site Assessment</SectionTitle>
        <FormGroup label="IV Cannula Site" required><FormInput value={form.ivSite} onChange={v => setF('ivSite', v)} placeholder="e.g. Right forearm cephalic vein" /></FormGroup>
        
        <SectionTitle>Device Insertion & Removal</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <FormGroup label="Insertion Date"><FormInput type="date" value={form.insertionDate} onChange={v => setF('insertionDate', v)} /></FormGroup>
          <FormGroup label="Insertion Time"><FormInput type="time" value={form.insertionTime} onChange={v => setF('insertionTime', v)} /></FormGroup>
          <FormGroup label="Removal Date"><FormInput type="date" value={form.removalDate} onChange={v => setF('removalDate', v)} /></FormGroup>
          <FormGroup label="Removal Time"><FormInput type="time" value={form.removalTime} onChange={v => setF('removalTime', v)} /></FormGroup>
        </div>
        {form.removalDate && form.insertionDate && new Date(`${form.removalDate}T${form.removalTime || '00:00'}`) < new Date(`${form.insertionDate}T${form.insertionTime || '00:00'}`) && (
          <p className="text-xs text-red-600 mt-1">⚠ Removal date/time cannot be earlier than insertion date/time.</p>
        )}

        <div className="grid grid-cols-2 gap-3 mt-3">
          <FormGroup label="Pain / Tenderness">
            <FormSelect value={form.pain} onChange={v => updateSymptom('pain', v)} options={['None', 'Mild', 'Moderate', 'Severe']} />
          </FormGroup>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3">
          {[['redness', 'Redness'], ['swelling', 'Swelling'], ['warmth', 'Warmth']].map(([k, label]) => (
            <label key={k} className={cn('flex items-center gap-2 cursor-pointer px-3 py-2.5 rounded-lg border transition-colors', (form as Record<string, unknown>)[k] ? 'bg-red-50 border-red-300' : 'border-slate-200')}>
              <input type="checkbox" checked={!!(form as Record<string, unknown>)[k]} onChange={e => updateSymptom(k, e.target.checked)} className="w-4 h-4 accent-red-500" />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>

        <SectionTitle>Grade Assessment (Auto-calculated)</SectionTitle>
        <div className="grid grid-cols-1 gap-2">
          {GRADE_INFO.map(g => (
            <button key={g.grade} onClick={() => setF('phlebitisGrade', g.grade as PhlebitisAssessment['phlebitisGrade'])} className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors', form.phlebitisGrade === g.grade ? g.color : 'border-slate-200 text-slate-600 hover:border-slate-300')}>
              <span className="font-bold text-sm w-16">Grade {g.grade}</span>
              <span className="text-xs flex-1">{g.label}</span>
            </button>
          ))}
        </div>

        <SectionTitle>Action & Remarks</SectionTitle>
        <FormGroup label="Action Taken"><FormTextarea value={form.actionTaken} onChange={v => setF('actionTaken', v)} placeholder="Re-site cannula, apply warm compress, notify doctor..." rows={2} /></FormGroup>
        <FormGroup label="Remarks" className="mt-3"><FormTextarea value={form.remarks} onChange={v => setF('remarks', v)} rows={2} /></FormGroup>
      </FormDrawer>
    </div>
  );
}
