'use client';
import { useState } from 'react';
import { useEMR } from '@/context/EMRContext';
import { generateId, nowDateStr } from '@/lib/store';
import { formatDate } from '@/lib/utils';
import { FormDrawer, FormGroup, FormInput, FormSelect, FormTextarea, SectionTitle, StatusBadge, EmptyState, CardHeader, TealButton, SoftButton } from '@/components/FormDrawer';
import { Plus, Edit2, ArrowLeftRight } from 'lucide-react';
import type { ShiftHandover } from '@/lib/types';

export function ShiftHandoverTab() {
  const { store, selectedPatient, updateStore } = useEMR();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: nowDateStr(), fromShift: 'Morning' as 'Morning'|'Afternoon'|'Night', toShift: 'Afternoon' as 'Morning'|'Afternoon'|'Night',
    outgoingNurse: '', incomingNurse: '',
    patientCondition: '', pendingTasks: '', medicationsGiven: '',
    specialInstructions: '', vitalsAtHandover: '', incidentsReported: '',
  });

  const patientId = selectedPatient!.id;
  const records = store.shiftHandovers.filter(r => r.patientId === patientId);

  function setF(k: string, v: string) { setForm(p => ({ ...p, [k]: v })); }

  function openNew() {
    setForm({ date: nowDateStr(), fromShift: 'Morning', toShift: 'Afternoon', outgoingNurse: '', incomingNurse: '', patientCondition: '', pendingTasks: '', medicationsGiven: '', specialInstructions: '', vitalsAtHandover: '', incidentsReported: '' });
    setEditId(null); setDrawerOpen(true);
  }

  function save(status: 'Completed' | 'Draft') {
    updateStore(prev => {
      const rec = { ...form, status };
      if (editId) return { ...prev, shiftHandovers: prev.shiftHandovers.map(r => r.id === editId ? { ...r, ...rec } : r) };
      return { ...prev, shiftHandovers: [...prev.shiftHandovers, { id: generateId(), patientId, ...rec, createdAt: new Date().toISOString() } as ShiftHandover] };
    });
    setDrawerOpen(false);
  }

  const shiftColor: Record<string, string> = {
    Morning: 'bg-amber-100 text-amber-700',
    Afternoon: 'bg-blue-100 text-blue-700',
    Night: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="ncard">
        <CardHeader title="Shift Handover Notes" actions={<TealButton onClick={openNew} size="sm"><Plus size={14} /> New Handover</TealButton>} />
        <div className="ncard-body">
          {records.length === 0 ? (
            <EmptyState icon={<ArrowLeftRight />} title="No shift handover records" action={<TealButton onClick={openNew}><Plus size={14} /> New Handover</TealButton>} />
          ) : (
            <div className="space-y-3">
              {records.map(r => (
                <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm">{formatDate(r.date)}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${shiftColor[r.fromShift]}`}>{r.fromShift}</span>
                        <ArrowLeftRight size={12} className="text-slate-400" />
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${shiftColor[r.toShift]}`}>{r.toShift}</span>
                        <StatusBadge status={r.status} />
                      </div>
                      <p className="text-xs text-slate-600"><b>{r.outgoingNurse}</b> → <b>{r.incomingNurse}</b></p>
                    </div>
                    <SoftButton onClick={() => { setForm({ date: r.date, fromShift: r.fromShift, toShift: r.toShift, outgoingNurse: r.outgoingNurse, incomingNurse: r.incomingNurse, patientCondition: r.patientCondition, pendingTasks: r.pendingTasks, medicationsGiven: r.medicationsGiven, specialInstructions: r.specialInstructions, vitalsAtHandover: r.vitalsAtHandover, incidentsReported: r.incidentsReported }); setEditId(r.id); setDrawerOpen(true); }} size="sm"><Edit2 size={12} /> Edit</SoftButton>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div><b className="text-xs text-slate-400 uppercase">Vitals</b><p className="text-slate-700">{r.vitalsAtHandover}</p></div>
                    <div><b className="text-xs text-slate-400 uppercase">Condition</b><p className="text-slate-700">{r.patientCondition}</p></div>
                    <div><b className="text-xs text-slate-400 uppercase">Medications Given</b><p className="text-slate-700">{r.medicationsGiven}</p></div>
                    <div><b className="text-xs text-slate-400 uppercase">Pending Tasks</b><p className="text-slate-700">{r.pendingTasks}</p></div>
                  </div>
                  {r.specialInstructions && <p className="text-xs text-amber-700 mt-2 bg-amber-50 px-3 py-1.5 rounded-lg"><b>Special Instructions:</b> {r.specialInstructions}</p>}
                  {r.incidentsReported && <p className="text-xs text-red-700 mt-1 bg-red-50 px-3 py-1.5 rounded-lg"><b>Incidents:</b> {r.incidentsReported}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <FormDrawer open={drawerOpen} title="Shift Handover" subtitle={selectedPatient!.name} onClose={() => setDrawerOpen(false)} onSave={() => save('Completed')} onSaveDraft={() => save('Draft')}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <FormGroup label="Date"><FormInput type="date" value={form.date} onChange={v => setF('date', v)} /></FormGroup>
          <FormGroup label="From Shift"><FormSelect value={form.fromShift} onChange={v => setF('fromShift', v)} options={['Morning', 'Afternoon', 'Night']} /></FormGroup>
          <FormGroup label="To Shift"><FormSelect value={form.toShift} onChange={v => setF('toShift', v)} options={['Morning', 'Afternoon', 'Night']} /></FormGroup>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <FormGroup label="Outgoing Nurse" required><FormInput value={form.outgoingNurse} onChange={v => setF('outgoingNurse', v)} /></FormGroup>
          <FormGroup label="Incoming Nurse" required><FormInput value={form.incomingNurse} onChange={v => setF('incomingNurse', v)} /></FormGroup>
        </div>
        <SectionTitle>Clinical Details</SectionTitle>
        <FormGroup label="Vitals at Handover"><FormInput value={form.vitalsAtHandover} onChange={v => setF('vitalsAtHandover', v)} placeholder="BP, Pulse, Temp, SpO₂, RR" /></FormGroup>
        <FormGroup label="Patient Condition" className="mt-3"><FormTextarea value={form.patientCondition} onChange={v => setF('patientCondition', v)} placeholder="Current clinical status..." rows={3} /></FormGroup>
        <FormGroup label="Medications Given" className="mt-3"><FormTextarea value={form.medicationsGiven} onChange={v => setF('medicationsGiven', v)} placeholder="Medications given during shift..." rows={2} /></FormGroup>
        <FormGroup label="Pending Tasks" className="mt-3"><FormTextarea value={form.pendingTasks} onChange={v => setF('pendingTasks', v)} placeholder="Pending tasks for next shift..." rows={2} /></FormGroup>
        <FormGroup label="Special Instructions" className="mt-3"><FormTextarea value={form.specialInstructions} onChange={v => setF('specialInstructions', v)} placeholder="Any special instructions..." rows={2} /></FormGroup>
        <FormGroup label="Incidents Reported" className="mt-3"><FormTextarea value={form.incidentsReported} onChange={v => setF('incidentsReported', v)} placeholder="None / Specify if any..." rows={2} /></FormGroup>
      </FormDrawer>
    </div>
  );
}
