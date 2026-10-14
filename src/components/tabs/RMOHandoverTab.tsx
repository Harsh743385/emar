'use client';
import { useState } from 'react';
import { useEMR } from '@/context/EMRContext';
import { generateId, nowDateStr, nowTimeStr } from '@/lib/store';
import { formatDate } from '@/lib/utils';
import { FormDrawer, FormGroup, FormInput, FormTextarea, SectionTitle, StatusBadge, EmptyState, CardHeader, TealButton, SoftButton } from '@/components/FormDrawer';
import { Plus, Edit2, UserCheck } from 'lucide-react';
import type { RMOHandover } from '@/lib/types';

export function RMOHandoverTab() {
  const { store, selectedPatient, updateStore } = useEMR();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: nowDateStr(), time: nowTimeStr(), fromConsultant: '', toConsultant: '',
    patientCondition: '', clinicalSummary: '', treatmentPlan: '',
    medications: '', pendingTasks: '', handoverNotes: '', acknowledgement: '',
  });

  const patientId = selectedPatient!.id;
  const records = store.rmoHandovers.filter(r => r.patientId === patientId);

  function setF(k: string, v: string) { setForm(p => ({ ...p, [k]: v })); }

  function openNew() {
    setForm({ date: nowDateStr(), time: nowTimeStr(), fromConsultant: '', toConsultant: '', patientCondition: '', clinicalSummary: '', treatmentPlan: '', medications: '', pendingTasks: '', handoverNotes: '', acknowledgement: '' });
    setEditId(null); setDrawerOpen(true);
  }

  function save(status: 'Completed' | 'Draft') {
    updateStore(prev => {
      const rec = { ...form, status };
      if (editId) return { ...prev, rmoHandovers: prev.rmoHandovers.map(r => r.id === editId ? { ...r, ...rec } : r) };
      return { ...prev, rmoHandovers: [...prev.rmoHandovers, { id: generateId(), patientId, ...rec, createdAt: new Date().toISOString() } as RMOHandover] };
    });
    setDrawerOpen(false);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="ncard">
        <CardHeader title="RMO / Doctor Handover" actions={<TealButton onClick={openNew} size="sm"><Plus size={14} /> New Handover</TealButton>} />
        <div className="ncard-body">
          {records.length === 0 ? (
            <EmptyState icon={<UserCheck />} title="No RMO handover records" action={<TealButton onClick={openNew}><Plus size={14} /> New Handover</TealButton>} />
          ) : (
            <div className="space-y-3">
              {records.map(r => (
                <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm">{formatDate(r.date)} {r.time}</span>
                        <StatusBadge status={r.status} />
                      </div>
                      <p className="text-sm text-slate-600"><b>{r.fromConsultant}</b> → <b>{r.toConsultant}</b></p>
                      <p className="text-xs text-amber-700 mt-1 bg-amber-50 px-2 py-0.5 rounded">{r.patientCondition}</p>
                    </div>
                    <SoftButton onClick={() => { setForm({ date: r.date, time: r.time, fromConsultant: r.fromConsultant, toConsultant: r.toConsultant, patientCondition: r.patientCondition, clinicalSummary: r.clinicalSummary, treatmentPlan: r.treatmentPlan, medications: r.medications, pendingTasks: r.pendingTasks, handoverNotes: r.handoverNotes, acknowledgement: r.acknowledgement }); setEditId(r.id); setDrawerOpen(true); }} size="sm"><Edit2 size={12} /> Edit</SoftButton>
                  </div>
                  <div className="space-y-2 text-sm text-slate-700">
                    {r.clinicalSummary && <div><b className="text-xs text-slate-400 uppercase">Summary</b><p>{r.clinicalSummary}</p></div>}
                    {r.treatmentPlan && <div><b className="text-xs text-slate-400 uppercase">Treatment Plan</b><p>{r.treatmentPlan}</p></div>}
                    {r.pendingTasks && <div><b className="text-xs text-slate-400 uppercase">Pending Tasks</b><p>{r.pendingTasks}</p></div>}
                    {r.acknowledgement && <div className="bg-green-50 px-3 py-1.5 rounded-lg"><b className="text-xs text-green-600 uppercase">Acknowledgement</b><p className="text-green-800 text-xs">{r.acknowledgement}</p></div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <FormDrawer open={drawerOpen} title="RMO / Doctor Handover" subtitle={selectedPatient!.name} onClose={() => setDrawerOpen(false)} onSave={() => save('Completed')} onSaveDraft={() => save('Draft')}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <FormGroup label="Date"><FormInput type="date" value={form.date} onChange={v => setF('date', v)} /></FormGroup>
          <FormGroup label="Time"><FormInput type="time" value={form.time} onChange={v => setF('time', v)} /></FormGroup>
          <FormGroup label="From Consultant" required><FormInput value={form.fromConsultant} onChange={v => setF('fromConsultant', v)} placeholder="Dr. Name" /></FormGroup>
          <FormGroup label="To Consultant" required><FormInput value={form.toConsultant} onChange={v => setF('toConsultant', v)} placeholder="Dr. Name" /></FormGroup>
          <FormGroup label="Patient Condition"><FormInput value={form.patientCondition} onChange={v => setF('patientCondition', v)} placeholder="Stable / Critical..." /></FormGroup>
        </div>
        <SectionTitle>Handover Details</SectionTitle>
        <FormGroup label="Clinical Summary"><FormTextarea value={form.clinicalSummary} onChange={v => setF('clinicalSummary', v)} rows={3} /></FormGroup>
        <FormGroup label="Treatment Plan" className="mt-3"><FormTextarea value={form.treatmentPlan} onChange={v => setF('treatmentPlan', v)} rows={2} /></FormGroup>
        <FormGroup label="Current Medications" className="mt-3"><FormTextarea value={form.medications} onChange={v => setF('medications', v)} rows={2} /></FormGroup>
        <FormGroup label="Pending Tasks" className="mt-3"><FormTextarea value={form.pendingTasks} onChange={v => setF('pendingTasks', v)} rows={2} /></FormGroup>
        <FormGroup label="Handover Notes" className="mt-3"><FormTextarea value={form.handoverNotes} onChange={v => setF('handoverNotes', v)} rows={3} /></FormGroup>
        <FormGroup label="Acknowledgement" className="mt-3"><FormInput value={form.acknowledgement} onChange={v => setF('acknowledgement', v)} placeholder="Dr. [Name] — Acknowledged at [time]" /></FormGroup>
      </FormDrawer>
    </div>
  );
}
