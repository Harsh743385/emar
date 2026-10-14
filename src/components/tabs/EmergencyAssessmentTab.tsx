'use client';
import { useState } from 'react';
import { useEMR } from '@/context/EMRContext';
import { generateId, nowDateStr, nowTimeStr } from '@/lib/store';
import { formatDate } from '@/lib/utils';
import { FormDrawer, FormGroup, FormInput, FormSelect, FormTextarea, SectionTitle, StatusBadge, EmptyState, CardHeader, TealButton, SoftButton } from '@/components/FormDrawer';
import { Plus, Edit2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EmergencyAssessment } from '@/lib/types';

const TRIAGE_COLORS: Record<string, string> = {
  'Red (Immediate)': 'bg-red-100 text-red-800 border-red-300',
  'Yellow (Urgent)': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'Green (Non-Urgent)': 'bg-green-100 text-green-800 border-green-300',
  'Black (Expectant)': 'bg-gray-100 text-gray-800 border-gray-300',
};

export function EmergencyAssessmentTab() {
  const { store, selectedPatient, updateStore } = useEMR();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: nowDateStr(), time: nowTimeStr(), nurseName: '',
    triageCategory: 'Green (Non-Urgent)' as EmergencyAssessment['triageCategory'],
    chiefComplaints: '', painIntensity: '', painDuration: '', painActionTaken: '',
    bpSys: 0, bpDia: 0, pulse: 0, tempF: 98.6, rr: 0, spo2: 0,
    gcs: 15, levelOfConsciousness: 'Alert', painScore: 0, painLocation: '',
    allergyStatus: '', immediateInterventions: '', abnormalFindings: '', escalation: '',
  });

  const patientId = selectedPatient!.id;
  const records = store.emergencyAssessments.filter(r => r.patientId === patientId);

  function setF(k: string, v: unknown) { setForm(p => ({ ...p, [k]: v })); }

  function openNew() {
    setForm({ date: nowDateStr(), time: nowTimeStr(), nurseName: '', triageCategory: 'Green (Non-Urgent)', chiefComplaints: '', painIntensity: '', painDuration: '', painActionTaken: '', bpSys: 0, bpDia: 0, pulse: 0, tempF: 98.6, rr: 0, spo2: 0, gcs: 15, levelOfConsciousness: 'Alert', painScore: 0, painLocation: '', allergyStatus: '', immediateInterventions: '', abnormalFindings: '', escalation: '' });
    setEditId(null); setDrawerOpen(true);
  }

  function save(status: 'Completed' | 'Draft') {
    updateStore(prev => {
      const rec = { ...form, status };
      if (editId) return { ...prev, emergencyAssessments: prev.emergencyAssessments.map(r => r.id === editId ? { ...r, ...rec } : r) };
      return { ...prev, emergencyAssessments: [...prev.emergencyAssessments, { id: generateId(), patientId, ...rec, createdAt: new Date().toISOString() } as EmergencyAssessment] };
    });
    setDrawerOpen(false);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="ncard">
        <CardHeader title="Emergency Assessment" actions={<TealButton onClick={openNew} size="sm"><Plus size={14} /> New Assessment</TealButton>} />
        <div className="ncard-body">
          {records.length === 0 ? (
            <EmptyState icon={<AlertTriangle />} title="No emergency assessments" action={<TealButton onClick={openNew}><Plus size={14} /> New Assessment</TealButton>} />
          ) : (
            <div className="space-y-3">
              {records.map(r => (
                <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm">{formatDate(r.date)} {r.time}</span>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full border font-bold', TRIAGE_COLORS[r.triageCategory] || 'bg-slate-100 text-slate-700 border-slate-200')}>{r.triageCategory}</span>
                        <StatusBadge status={r.status} />
                      </div>
                      <p className="text-sm text-slate-700"><b>Complaints:</b> {r.chiefComplaints}</p>
                      {(r.painIntensity || r.painDuration || r.painActionTaken) && (
                        <div className="flex gap-3 text-xs text-slate-600 mt-1 flex-wrap">
                          {r.painIntensity && <span><b>Intensity:</b> {r.painIntensity}</span>}
                          {r.painDuration && <span><b>Duration:</b> {r.painDuration}</span>}
                          {r.painActionTaken && <span><b>Action:</b> {r.painActionTaken}</span>}
                        </div>
                      )}
                    </div>
                    <SoftButton onClick={() => { setForm({ date: r.date, time: r.time, nurseName: r.nurseName, triageCategory: r.triageCategory, chiefComplaints: r.chiefComplaints, painIntensity: r.painIntensity || '', painDuration: r.painDuration || '', painActionTaken: r.painActionTaken || '', bpSys: r.bpSys, bpDia: r.bpDia, pulse: r.pulse, tempF: r.tempF, rr: r.rr, spo2: r.spo2, gcs: r.gcs, levelOfConsciousness: r.levelOfConsciousness, painScore: r.painScore, painLocation: r.painLocation || '', allergyStatus: r.allergyStatus, immediateInterventions: r.immediateInterventions, abnormalFindings: r.abnormalFindings, escalation: r.escalation || '' }); setEditId(r.id); setDrawerOpen(true); }} size="sm"><Edit2 size={12} /> Edit</SoftButton>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-2">
                    {[['BP', `${r.bpSys}/${r.bpDia}`], ['Pulse', `${r.pulse}`], ['Temp', `${r.tempF}°F`], ['SpO₂', `${r.spo2}%`], ['RR', `${r.rr}`], ['GCS', `${r.gcs}`], ['Pain', `${r.painScore}/10`]].map(([l, v]) => (
                      <div key={l} className="bg-slate-50 rounded-lg p-1.5 text-center"><div className="text-xs text-slate-400">{l}</div><div className="text-xs font-bold text-slate-800">{v}</div></div>
                    ))}
                  </div>
                  {r.immediateInterventions && <p className="text-xs text-slate-600"><b>Interventions:</b> {r.immediateInterventions}</p>}
                  {r.abnormalFindings && <p className="text-xs text-red-600 mt-1"><b>Abnormal:</b> {r.abnormalFindings}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <FormDrawer open={drawerOpen} title="Emergency Assessment" subtitle={selectedPatient!.name} onClose={() => setDrawerOpen(false)} onSave={() => save('Completed')} onSaveDraft={() => save('Draft')}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <FormGroup label="Date"><FormInput type="date" value={form.date} onChange={v => setF('date', v)} /></FormGroup>
          <FormGroup label="Time"><FormInput type="time" value={form.time} onChange={v => setF('time', v)} /></FormGroup>
          <FormGroup label="Nurse Name"><FormInput value={form.nurseName} onChange={v => setF('nurseName', v)} /></FormGroup>
        </div>
        <SectionTitle>Triage</SectionTitle>
        <FormGroup label="Triage Category" required>
          <div className="grid grid-cols-2 gap-2">
            {(['Red (Immediate)', 'Yellow (Urgent)', 'Green (Non-Urgent)', 'Black (Expectant)'] as const).map(cat => (
              <button key={cat} onClick={() => setF('triageCategory', cat)} className={cn('px-3 py-2 rounded-lg border text-sm font-semibold transition-colors text-left', form.triageCategory === cat ? TRIAGE_COLORS[cat] : 'border-slate-200 text-slate-600')}>{cat}</button>
            ))}
          </div>
        </FormGroup>
        <FormGroup label="Chief Complaints" className="mt-3"><FormTextarea value={form.chiefComplaints} onChange={v => setF('chiefComplaints', v)} rows={2} /></FormGroup>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
          <FormGroup label="Intensity">
            <FormSelect value={form.painIntensity} onChange={v => setF('painIntensity', v)} options={['', 'Mild', 'Moderate', 'Severe', 'Very Severe']} />
          </FormGroup>
          <FormGroup label="Duration">
            <FormInput value={form.painDuration} onChange={v => setF('painDuration', v)} placeholder="e.g. 2 hours" />
          </FormGroup>
          <FormGroup label="Action Taken">
            <FormInput value={form.painActionTaken} onChange={v => setF('painActionTaken', v)} placeholder="e.g. Oxygen administered" />
          </FormGroup>
        </div>
        <SectionTitle>Vitals</SectionTitle>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          <FormGroup label="BP Sys"><FormInput type="number" value={form.bpSys} onChange={v => setF('bpSys', parseInt(v) || 0)} /></FormGroup>
          <FormGroup label="BP Dia"><FormInput type="number" value={form.bpDia} onChange={v => setF('bpDia', parseInt(v) || 0)} /></FormGroup>
          <FormGroup label="Pulse"><FormInput type="number" value={form.pulse} onChange={v => setF('pulse', parseInt(v) || 0)} /></FormGroup>
          <FormGroup label="Temp (°F)"><FormInput type="number" step="0.1" value={form.tempF} onChange={v => setF('tempF', parseFloat(v) || 0)} /></FormGroup>
          <FormGroup label="RR"><FormInput type="number" value={form.rr} onChange={v => setF('rr', parseInt(v) || 0)} /></FormGroup>
          <FormGroup label="SpO₂ (%)"><FormInput type="number" value={form.spo2} onChange={v => setF('spo2', parseInt(v) || 0)} /></FormGroup>
          <FormGroup label="GCS (3-15)"><FormInput type="number" min={3} max={15} value={form.gcs} onChange={v => setF('gcs', parseInt(v) || 15)} /></FormGroup>
          <FormGroup label="Pain Score (0-10)"><FormInput type="number" min={0} max={10} value={form.painScore} onChange={v => setF('painScore', parseInt(v) || 0)} /></FormGroup>
        </div>
        <SectionTitle>Clinical Assessment</SectionTitle>
        <FormGroup label="Allergy Status"><FormInput value={form.allergyStatus} onChange={v => setF('allergyStatus', v)} placeholder="NKDA / specify allergy" /></FormGroup>
        <FormGroup label="Immediate Interventions" className="mt-3"><FormTextarea value={form.immediateInterventions} onChange={v => setF('immediateInterventions', v)} rows={3} /></FormGroup>
        <FormGroup label="Abnormal Findings" className="mt-3"><FormTextarea value={form.abnormalFindings} onChange={v => setF('abnormalFindings', v)} rows={2} /></FormGroup>
        <FormGroup label="Escalation / Referrals" className="mt-3"><FormTextarea value={form.escalation} onChange={v => setF('escalation', v)} rows={2} /></FormGroup>
      </FormDrawer>
    </div>
  );
}
