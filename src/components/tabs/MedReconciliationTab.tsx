'use client';
import { useState } from 'react';
import { useEMR } from '@/context/EMRContext';
import { generateId, nowDateStr, nowTimeStr } from '@/lib/store';
import { formatDate } from '@/lib/utils';
import { FormDrawer, FormGroup, FormInput, SectionTitle, StatusBadge, EmptyState, CardHeader, TealButton, SoftButton } from '@/components/FormDrawer';
import { Plus, Edit2, RefreshCw, Trash2 } from 'lucide-react';
import type { MedicationReconciliation, MedicationReconciliationEntry } from '@/lib/types';

export function MedReconciliationTab() {
  const { store, selectedPatient, updateStore } = useEMR();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [meta, setMeta] = useState({ date: nowDateStr(), time: nowTimeStr(), outgoingNurse: '', incomingNurse: '' });
  const [meds, setMeds] = useState<MedicationReconciliationEntry[]>([{ id: generateId(), medicineName: '', previousBalance: 0, quantityReceived: 0, quantityAdministered: 0, remainingQuantity: 0 }]);

  const patientId = selectedPatient!.id;
  const records = store.medicationReconciliations.filter(r => r.patientId === patientId);

  function addMed() { setMeds(prev => [...prev, { id: generateId(), medicineName: '', previousBalance: 0, quantityReceived: 0, quantityAdministered: 0, remainingQuantity: 0 }]); }
  function removeMed(id: string) { setMeds(prev => prev.filter(m => m.id !== id)); }
  function updateMed(id: string, k: keyof MedicationReconciliationEntry, v: string | number) {
    setMeds(prev => prev.map(m => {
      if (m.id !== id) return m;
      const updated = { ...m, [k]: v };
      if (k !== 'medicineName' && k !== 'remainingQuantity') {
        updated.remainingQuantity = (updated.previousBalance + updated.quantityReceived) - updated.quantityAdministered;
      }
      return updated;
    }));
  }

  function openNew() {
    setMeta({ date: nowDateStr(), time: nowTimeStr(), outgoingNurse: '', incomingNurse: '' });
    setMeds([{ id: generateId(), medicineName: '', previousBalance: 0, quantityReceived: 0, quantityAdministered: 0, remainingQuantity: 0 }]);
    setEditId(null); setDrawerOpen(true);
  }

  function save(status: 'Completed' | 'Draft') {
    updateStore(prev => {
      const rec = { ...meta, medications: meds, status };
      if (editId) return { ...prev, medicationReconciliations: prev.medicationReconciliations.map(r => r.id === editId ? { ...r, ...rec } : r) };
      return { ...prev, medicationReconciliations: [...prev.medicationReconciliations, { id: generateId(), patientId, ...rec, createdAt: new Date().toISOString() } as MedicationReconciliation] };
    });
    setDrawerOpen(false);
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="ncard">
        <CardHeader title="Medication Reconciliation" actions={<TealButton onClick={openNew} size="sm"><Plus size={14} /> New Record</TealButton>} />
        <div className="ncard-body">
          {records.length === 0 ? (
            <EmptyState icon={<RefreshCw />} title="No medication reconciliation records" action={<TealButton onClick={openNew}><Plus size={14} /> New Record</TealButton>} />
          ) : (
            <div className="space-y-4">
              {records.map(r => (
                <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{formatDate(r.date)} {r.time}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="text-xs text-slate-500">{r.outgoingNurse} → {r.incomingNurse}</div>
                    <SoftButton onClick={() => { setMeta({ date: r.date, time: r.time, outgoingNurse: r.outgoingNurse, incomingNurse: r.incomingNurse }); setMeds(r.medications.map(m => ({ ...m }))); setEditId(r.id); setDrawerOpen(true); }} size="sm"><Edit2 size={12} /> Edit</SoftButton>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="icu-table">
                      <thead><tr><th>Medicine</th><th>Previous Balance</th><th>Qty Received</th><th>Qty Administered</th><th>Remaining</th></tr></thead>
                      <tbody>
                        {r.medications.map(m => (
                          <tr key={m.id}>
                            <td className="text-left font-medium">{m.medicineName}</td>
                            <td>{m.previousBalance}</td>
                            <td className="text-green-700">{m.quantityReceived}</td>
                            <td className="text-red-700">{m.quantityAdministered}</td>
                            <td className="font-bold">{m.remainingQuantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <FormDrawer open={drawerOpen} title="Medication Reconciliation" subtitle={selectedPatient!.name} onClose={() => setDrawerOpen(false)} onSave={() => save('Completed')} onSaveDraft={() => save('Draft')}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <FormGroup label="Date"><FormInput type="date" value={meta.date} onChange={v => setMeta(p => ({ ...p, date: v }))} /></FormGroup>
          <FormGroup label="Time"><FormInput type="time" value={meta.time} onChange={v => setMeta(p => ({ ...p, time: v }))} /></FormGroup>
          <FormGroup label="Outgoing Nurse"><FormInput value={meta.outgoingNurse} onChange={v => setMeta(p => ({ ...p, outgoingNurse: v }))} /></FormGroup>
          <FormGroup label="Incoming Nurse"><FormInput value={meta.incomingNurse} onChange={v => setMeta(p => ({ ...p, incomingNurse: v }))} /></FormGroup>
        </div>
        <SectionTitle>Medications</SectionTitle>
        <div className="space-y-2">
          <div className="grid grid-cols-5 gap-2 text-xs font-bold text-slate-500 uppercase px-1">
            <span className="col-span-1">Medicine</span><span>Prev. Balance</span><span>Received</span><span>Administered</span><span>Remaining</span>
          </div>
          {meds.map(m => (
            <div key={m.id} className="grid grid-cols-5 gap-2 items-center">
              <input value={m.medicineName} onChange={e => updateMed(m.id, 'medicineName', e.target.value)} placeholder="Medicine name" className="col-span-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-400" />
              {(['previousBalance', 'quantityReceived', 'quantityAdministered'] as const).map(k => (
                <input key={k} type="number" value={m[k]} onChange={e => updateMed(m.id, k, parseInt(e.target.value) || 0)} className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-center focus:outline-none focus:border-teal-400" />
              ))}
              <div className="flex items-center gap-1">
                <div className="flex-1 px-2 py-1.5 bg-teal-50 border border-teal-200 rounded-lg text-xs text-center font-bold text-teal-700">{m.remainingQuantity}</div>
                <button onClick={() => removeMed(m.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
          <button onClick={addMed} className="w-full py-1.5 border border-dashed border-teal-300 text-teal-600 text-xs rounded-lg hover:bg-teal-50 transition-colors">+ Add Medicine</button>
        </div>
      </FormDrawer>
    </div>
  );
}
