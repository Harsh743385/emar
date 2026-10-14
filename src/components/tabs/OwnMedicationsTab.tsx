'use client';
import { useState } from 'react';
import { useEMR } from '@/context/EMRContext';
import { generateId, nowDateStr } from '@/lib/store';
import { formatDate } from '@/lib/utils';
import { FormDrawer, FormGroup, FormInput, FormSelect, SectionTitle, StatusBadge, EmptyState, CardHeader, TealButton, SoftButton } from '@/components/FormDrawer';
import { Plus, Edit2, Pill, Trash2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PatientOwnMedication, PatientOwnMedicationEntry } from '@/lib/types';

export function OwnMedicationsTab() {
  const { store, selectedPatient, updateStore } = useEMR();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [meta, setMeta] = useState({ date: nowDateStr(), nurseName: '' });
  const [meds, setMeds] = useState<PatientOwnMedicationEntry[]>([{
    id: generateId(), medicineName: '', strength: '', dosage: '', frequency: '', duration: '',
    approvalStatus: 'Pending Approval', verificationStatus: 'Pending', consultantApproval: '',
  }]);

  const patientId = selectedPatient!.id;
  const records = store.patientOwnMedications.filter(r => r.patientId === patientId);

  function addMed() {
    setMeds(prev => [...prev, { id: generateId(), medicineName: '', strength: '', dosage: '', frequency: '', duration: '', approvalStatus: 'Pending Approval', verificationStatus: 'Pending', consultantApproval: '' }]);
  }
  function removeMed(id: string) { setMeds(prev => prev.filter(m => m.id !== id)); }
  function updateMed(id: string, k: keyof PatientOwnMedicationEntry, v: string) { setMeds(prev => prev.map(m => m.id === id ? { ...m, [k]: v } : m)); }

  function openNew() {
    setMeta({ date: nowDateStr(), nurseName: '' });
    setMeds([{ id: generateId(), medicineName: '', strength: '', dosage: '', frequency: '', duration: '', approvalStatus: 'Pending Approval', verificationStatus: 'Pending', consultantApproval: '' }]);
    setEditId(null); setDrawerOpen(true);
  }

  function save(status: 'Completed' | 'Draft') {
    updateStore(prev => {
      const rec = { ...meta, medications: meds, status };
      if (editId) return { ...prev, patientOwnMedications: prev.patientOwnMedications.map(r => r.id === editId ? { ...r, ...rec } : r) };
      return { ...prev, patientOwnMedications: [...prev.patientOwnMedications, { id: generateId(), patientId, ...rec, createdAt: new Date().toISOString() } as PatientOwnMedication] };
    });
    setDrawerOpen(false);
  }

  const approvalColor: Record<string, string> = {
    'Approved': 'bg-green-100 text-green-700',
    'Pending Approval': 'bg-amber-100 text-amber-700',
    'Not Approved': 'bg-red-100 text-red-700',
    'Discontinued': 'bg-slate-100 text-slate-600',
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="ncard">
        <CardHeader title="Home Medications" actions={<TealButton onClick={openNew} size="sm"><Plus size={14} /> Add Medications</TealButton>} />
        <div className="ncard-body">
          {records.length === 0 ? (
            <EmptyState icon={<Pill />} title="No home medication records" action={<TealButton onClick={openNew}><Plus size={14} /> Add Medications</TealButton>} />
          ) : (
            <div className="space-y-4">
              {records.map(r => (
                <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{formatDate(r.date)}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <SoftButton onClick={() => { setMeta({ date: r.date, nurseName: r.nurseName }); setMeds(r.medications.map(m => ({ ...m }))); setEditId(r.id); setDrawerOpen(true); }} size="sm"><Edit2 size={12} /> Edit</SoftButton>
                  </div>
                  <div className="space-y-2">
                    {r.medications.map(m => (
                      <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-slate-800">{m.medicineName}</span>
                            <span className="text-xs text-slate-500">{m.strength}</span>
                          </div>
                          <div className="text-xs text-slate-500">{m.dosage} · {m.frequency} · {m.duration}</div>
                          {m.consultantApproval && <div className="text-xs text-green-600"><CheckCircle size={10} className="inline mr-1" />{m.consultantApproval}</div>}
                        </div>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0', approvalColor[m.approvalStatus] || 'bg-slate-100 text-slate-600')}>{m.approvalStatus}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <FormDrawer open={drawerOpen} title="Home Medications" subtitle={selectedPatient!.name} onClose={() => setDrawerOpen(false)} onSave={() => save('Completed')} onSaveDraft={() => save('Draft')}>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <FormGroup label="Date"><FormInput type="date" value={meta.date} onChange={v => setMeta(p => ({ ...p, date: v }))} /></FormGroup>
          <FormGroup label="Nurse Name"><FormInput value={meta.nurseName} onChange={v => setMeta(p => ({ ...p, nurseName: v }))} /></FormGroup>
        </div>
        <SectionTitle>Medication List</SectionTitle>
        <div className="space-y-3">
          {meds.map(m => (
            <div key={m.id} className="bg-slate-50 rounded-xl p-3 space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <FormGroup label="Medicine Name" required><FormInput value={m.medicineName} onChange={v => updateMed(m.id, 'medicineName', v)} /></FormGroup>
                <FormGroup label="Strength"><FormInput value={m.strength} onChange={v => updateMed(m.id, 'strength', v)} placeholder="5mg, 10mg..." /></FormGroup>
                <FormGroup label="Dosage"><FormInput value={m.dosage} onChange={v => updateMed(m.id, 'dosage', v)} placeholder="1 tablet..." /></FormGroup>
                <FormGroup label="Frequency"><FormInput value={m.frequency} onChange={v => updateMed(m.id, 'frequency', v)} placeholder="Once daily..." /></FormGroup>
                <FormGroup label="Duration / Indication"><FormInput value={m.duration} onChange={v => updateMed(m.id, 'duration', v)} /></FormGroup>
                <FormGroup label="Approval Status">
                  <FormSelect value={m.approvalStatus} onChange={v => updateMed(m.id, 'approvalStatus', v)} options={['Pending Approval', 'Approved', 'Not Approved', 'Discontinued']} />
                </FormGroup>
                <FormGroup label="Consultant Approval"><FormInput value={m.consultantApproval || ''} onChange={v => updateMed(m.id, 'consultantApproval', v)} placeholder="Dr. Name — Date" /></FormGroup>
              </div>
              <div className="flex justify-end">
                <button onClick={() => removeMed(m.id)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"><Trash2 size={12} /> Remove</button>
              </div>
            </div>
          ))}
          <button onClick={addMed} className="w-full py-2 border border-dashed border-teal-300 text-teal-600 text-sm rounded-lg hover:bg-teal-50 transition-colors">+ Add Medication</button>
        </div>
      </FormDrawer>
    </div>
  );
}
