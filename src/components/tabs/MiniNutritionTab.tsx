'use client';
import { useState } from 'react';
import { useEMR } from '@/context/EMRContext';
import { generateId, nowDateStr } from '@/lib/store';
import { formatDate, calcMNAResult } from '@/lib/utils';
import { FormDrawer, FormGroup, StatusBadge, EmptyState, CardHeader, TealButton, SoftButton } from '@/components/FormDrawer';
import { Plus, Edit2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MiniNutritionalAssessment } from '@/lib/types';

const QUESTIONS = [
  {
    key: 'foodIntakeDecline' as const,
    label: 'Has food intake declined over the past 3 months due to loss of appetite, digestive problems, chewing or swallowing difficulties?',
    options: [
      { value: 0, label: '0 — Severe decrease in food intake' },
      { value: 1, label: '1 — Moderate decrease in food intake' },
      { value: 2, label: '2 — No decrease in food intake' },
    ],
  },
  {
    key: 'weightLoss' as const,
    label: 'Weight loss during the last 3 months',
    options: [
      { value: 0, label: '0 — Weight loss greater than 3 kg' },
      { value: 1, label: '1 — Does not know' },
      { value: 2, label: '2 — Weight loss between 1 and 3 kg' },
      { value: 3, label: '3 — No weight loss' },
    ],
  },
  {
    key: 'mobility' as const,
    label: 'Mobility',
    options: [
      { value: 0, label: '0 — Bed or chair bound' },
      { value: 1, label: '1 — Able to get out of bed/chair, but does not go out' },
      { value: 2, label: '2 — Goes out' },
    ],
  },
  {
    key: 'acuteDisease' as const,
    label: 'Has the patient suffered psychological stress or acute disease in the past 3 months?',
    options: [
      { value: 0, label: '0 — Yes' },
      { value: 2, label: '2 — No' },
    ],
  },
  {
    key: 'neuropsychological' as const,
    label: 'Neuropsychological problems',
    options: [
      { value: 0, label: '0 — Severe dementia or depression' },
      { value: 1, label: '1 — Mild dementia' },
      { value: 2, label: '2 — No psychological problems' },
    ],
  },
  {
    key: 'bodyHabitus' as const,
    label: 'Body Mass Index (BMI) or Calf circumference (CC)',
    options: [
      { value: 0, label: '0 — BMI less than 19 / CC < 31 cm' },
      { value: 1, label: '1 — BMI 19 to less than 21 / CC 31 cm' },
      { value: 2, label: '2 — BMI 21 to less than 23' },
      { value: 3, label: '3 — BMI 23 or greater' },
    ],
  },
];

type MNAFormData = {
  date: string;
  nurseName: string;
  foodIntakeDecline: 0 | 1 | 2;
  weightLoss: 0 | 1 | 2 | 3;
  mobility: 0 | 1 | 2;
  acuteDisease: 0 | 2;
  neuropsychological: 0 | 1 | 2;
  bodyHabitus: 0 | 1 | 2 | 3;
};

function defaultForm(): MNAFormData {
  return { date: nowDateStr(), nurseName: '', foodIntakeDecline: 2, weightLoss: 3, mobility: 2, acuteDisease: 2, neuropsychological: 2, bodyHabitus: 3 };
}

export function MiniNutritionTab() {
  const { store, selectedPatient, updateStore } = useEMR();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<MNAFormData>(defaultForm());

  const patientId = selectedPatient!.id;
  const records = store.miniNutritionalAssessments.filter(r => r.patientId === patientId);

  const totalScore = form.foodIntakeDecline + form.weightLoss + form.mobility + form.acuteDisease + form.neuropsychological + form.bodyHabitus;
  const screeningResult = calcMNAResult(totalScore);

  function setF(k: keyof MNAFormData, v: unknown) { setForm(p => ({ ...p, [k]: v })); }

  function openNew() { setForm(defaultForm()); setEditId(null); setDrawerOpen(true); }

  function save(status: 'Completed' | 'Draft') {
    const total = form.foodIntakeDecline + form.weightLoss + form.mobility + form.acuteDisease + form.neuropsychological + form.bodyHabitus;
    const result = calcMNAResult(total) as MiniNutritionalAssessment['screeningResult'];
    updateStore(prev => {
      const rec = { ...form, totalScore: total, screeningResult: result, status };
      if (editId) return { ...prev, miniNutritionalAssessments: prev.miniNutritionalAssessments.map(r => r.id === editId ? { ...r, ...rec } : r) };
      return { ...prev, miniNutritionalAssessments: [...prev.miniNutritionalAssessments, { id: generateId(), patientId, ...rec, createdAt: new Date().toISOString() } as MiniNutritionalAssessment] };
    });
    setDrawerOpen(false);
  }

  function resultColor(result: string) {
    if (result.includes('Malnourished')) return 'bg-red-100 text-red-700';
    if (result.includes('At Risk')) return 'bg-amber-100 text-amber-700';
    return 'bg-green-100 text-green-700';
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="ncard">
        <CardHeader title="Mini Nutritional Assessment (MNA)" actions={<TealButton onClick={openNew} size="sm"><Plus size={14} /> New Assessment</TealButton>} />
        <div className="ncard-body">
          {records.length === 0 ? (
            <EmptyState icon={<Users />} title="No nutritional assessments" action={<TealButton onClick={openNew}><Plus size={14} /> New Assessment</TealButton>} />
          ) : (
            <div className="space-y-3">
              {records.map(r => (
                <div key={r.id} className="row-item">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-sm">{formatDate(r.date)}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-xs text-slate-400">Total Score</div>
                        <div className="text-2xl font-bold text-slate-800">{r.totalScore}<span className="text-sm font-normal text-slate-400">/14</span></div>
                      </div>
                      <span className={cn('px-3 py-1 rounded-full text-sm font-semibold', resultColor(r.screeningResult))}>{r.screeningResult}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">By {r.nurseName || 'Demo Nurse'}</div>
                  </div>
                  <SoftButton onClick={() => { setForm({ date: r.date, nurseName: r.nurseName, foodIntakeDecline: r.foodIntakeDecline, weightLoss: r.weightLoss, mobility: r.mobility, acuteDisease: r.acuteDisease, neuropsychological: r.neuropsychological, bodyHabitus: r.bodyHabitus }); setEditId(r.id); setDrawerOpen(true); }} size="sm"><Edit2 size={12} /> Edit</SoftButton>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <FormDrawer open={drawerOpen} title="Mini Nutritional Assessment (MNA)" subtitle={selectedPatient!.name} onClose={() => setDrawerOpen(false)} onSave={() => save('Completed')} onSaveDraft={() => save('Draft')}>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <FormGroup label="Date"><input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-400" /></FormGroup>
          <FormGroup label="Nurse Name"><input value={form.nurseName} onChange={e => setForm(p => ({ ...p, nurseName: e.target.value }))} placeholder="Nurse name" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-400" /></FormGroup>
        </div>

        <div className="space-y-4">
          {QUESTIONS.map(q => (
            <div key={q.key} className="bg-slate-50 rounded-xl p-4">
              <div className="text-sm font-semibold text-slate-800 mb-2">{q.label}</div>
              <div className="space-y-1.5">
                {q.options.map(opt => (
                  <label key={opt.value} className={cn('flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border transition-colors', (form as unknown as Record<string, number>)[q.key] === opt.value ? 'bg-teal-50 border-teal-300' : 'border-transparent hover:border-slate-200 bg-white')}>
                    <input type="radio" name={q.key} value={opt.value} checked={(form as unknown as Record<string, number>)[q.key] === opt.value} onChange={() => setF(q.key, opt.value)} className="accent-teal-500" />
                    <span className="text-sm text-slate-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Score summary */}
        <div className={cn('mt-4 p-4 rounded-xl border-2', screeningResult.includes('Malnourished') ? 'bg-red-50 border-red-200' : screeningResult.includes('At Risk') ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200')}>
          <div className="flex items-center gap-4">
            <div>
              <div className="text-xs text-slate-500 uppercase font-semibold">Total Score</div>
              <div className="text-3xl font-bold text-slate-800">{totalScore} <span className="text-base font-normal text-slate-400">/ 14</span></div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase font-semibold">Result</div>
              <div className="text-lg font-bold text-slate-800">{screeningResult}</div>
            </div>
          </div>
        </div>
      </FormDrawer>
    </div>
  );
}
