'use client';
import { useState } from 'react';
import { useEMR } from '@/context/EMRContext';
import { generateId, nowDateStr, nowTimeStr } from '@/lib/store';
import { formatDate } from '@/lib/utils';
import { FormDrawer, FormGroup, FormInput, FormTextarea, SectionTitle, StatusBadge, EmptyState, CardHeader, TealButton, SoftButton } from '@/components/FormDrawer';
import { Plus, Edit2, ArrowLeftRight } from 'lucide-react';
import type { PatientTransfer } from '@/lib/types';

export function PatientTransferTab() {
  const { store, selectedPatient, updateStore } = useEMR();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: nowDateStr(), time: nowTimeStr(), nurseName: '',
    fromLocation: '', toLocation: '', reason: '', patientCondition: '',
    vitalsBp: '', vitalsPulse: 0, vitalsTemp: 0, vitalsRr: 0, vitalsSpo2: 0,
    ongoingTreatment: '', medications: '', lines: '',
    // SBAR
    situation: '', background: '', assessment: '', recommendations: '',
    accompanyingStaff: '', belongingsStatus: '', pendingReports: '', receivingStaff: '',
    summary: '',
  });

  const patientId = selectedPatient!.id;
  const records = store.patientTransfers.filter(r => r.patientId === patientId);

  function setF(k: string, v: unknown) { setForm(p => ({ ...p, [k]: v })); }

  function openNew() {
    setForm({ date: nowDateStr(), time: nowTimeStr(), nurseName: '', fromLocation: '', toLocation: '', reason: '', patientCondition: '', vitalsBp: '', vitalsPulse: 0, vitalsTemp: 0, vitalsRr: 0, vitalsSpo2: 0, ongoingTreatment: '', medications: '', lines: '', situation: '', background: '', assessment: '', recommendations: '', accompanyingStaff: '', belongingsStatus: '', pendingReports: '', receivingStaff: '', summary: '' });
    setEditId(null); setDrawerOpen(true);
  }

  function save(status: 'Completed' | 'Draft') {
    updateStore(prev => {
      const rec = { ...form, status };
      if (editId) return { ...prev, patientTransfers: prev.patientTransfers.map(r => r.id === editId ? { ...r, ...rec } : r) };
      return { ...prev, patientTransfers: [...prev.patientTransfers, { id: generateId(), patientId, ...rec, createdAt: new Date().toISOString() } as PatientTransfer] };
    });
    setDrawerOpen(false);
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="ncard">
        <CardHeader title="Patient Transfer & SBAR Communication" actions={<TealButton onClick={openNew} size="sm"><Plus size={14} /> New Transfer</TealButton>} />
        <div className="ncard-body">
          {records.length === 0 ? (
            <EmptyState icon={<ArrowLeftRight />} title="No patient transfer records" action={<TealButton onClick={openNew}><Plus size={14} /> New Transfer</TealButton>} />
          ) : (
            <div className="space-y-4">
              {records.map(r => (
                <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm">{formatDate(r.date)} {r.time}</span>
                        <StatusBadge status={r.status} />
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded font-semibold">{r.fromLocation}</span>
                        <ArrowLeftRight size={14} className="text-slate-400" />
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded font-semibold">{r.toLocation}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1"><b>Reason:</b> {r.reason}</p>
                      <p className="text-xs text-slate-400">By {r.nurseName || 'Demo Nurse'}</p>
                    </div>
                    <SoftButton onClick={() => { setForm({ ...r, vitalsBp: r.vitalsBp, vitalsPulse: r.vitalsPulse, vitalsTemp: r.vitalsTemp, vitalsRr: r.vitalsRr, vitalsSpo2: r.vitalsSpo2, summary: r.summary || '' }); setEditId(r.id); setDrawerOpen(true); }} size="sm"><Edit2 size={12} /> Edit</SoftButton>
                  </div>

                  {/* SBAR Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                    {[
                      { letter: 'S', label: 'Situation', value: r.situation, color: 'bg-blue-50 border-blue-200' },
                      { letter: 'B', label: 'Background', value: r.background, color: 'bg-purple-50 border-purple-200' },
                      { letter: 'A', label: 'Assessment', value: r.assessment, color: 'bg-amber-50 border-amber-200' },
                      { letter: 'R', label: 'Recommendations', value: r.recommendations, color: 'bg-green-50 border-green-200' },
                    ].map(s => (
                      <div key={s.letter} className={`rounded-lg border p-2 ${s.color}`}>
                        <div className="font-bold text-lg leading-none mb-0.5">{s.letter}</div>
                        <div className="text-xs font-semibold text-slate-500 mb-1">{s.label}</div>
                        <p className="text-xs text-slate-700 line-clamp-3">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <FormDrawer open={drawerOpen} title="Patient Transfer & SBAR" subtitle={selectedPatient!.name} onClose={() => setDrawerOpen(false)} onSave={() => save('Completed')} onSaveDraft={() => save('Draft')}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <FormGroup label="Date"><FormInput type="date" value={form.date} onChange={v => setF('date', v)} /></FormGroup>
          <FormGroup label="Time"><FormInput type="time" value={form.time} onChange={v => setF('time', v)} /></FormGroup>
          <FormGroup label="Nurse Name"><FormInput value={form.nurseName} onChange={v => setF('nurseName', v)} /></FormGroup>
        </div>
        <SectionTitle>Transfer Details</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <FormGroup label="From Location" required><FormInput value={form.fromLocation} onChange={v => setF('fromLocation', v)} placeholder="e.g. OT, Emergency, ICU" /></FormGroup>
          <FormGroup label="To Location" required><FormInput value={form.toLocation} onChange={v => setF('toLocation', v)} placeholder="e.g. Ward A, ICU" /></FormGroup>
        </div>
        <FormGroup label="Reason for Transfer" className="mt-3"><FormTextarea value={form.reason} onChange={v => setF('reason', v)} rows={2} /></FormGroup>
        <FormGroup label="Patient Condition at Transfer" className="mt-3"><FormInput value={form.patientCondition} onChange={v => setF('patientCondition', v)} placeholder="Stable / Unstable / Critical..." /></FormGroup>

        <SectionTitle>Vitals at Transfer</SectionTitle>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          <FormGroup label="BP (mmHg)"><FormInput value={form.vitalsBp} onChange={v => setF('vitalsBp', v)} placeholder="120/80" /></FormGroup>
          <FormGroup label="Pulse (bpm)"><FormInput type="number" value={form.vitalsPulse} onChange={v => setF('vitalsPulse', parseInt(v) || 0)} /></FormGroup>
          <FormGroup label="Temp (°F)"><FormInput type="number" step="0.1" value={form.vitalsTemp} onChange={v => setF('vitalsTemp', parseFloat(v) || 0)} /></FormGroup>
          <FormGroup label="RR (/min)"><FormInput type="number" value={form.vitalsRr} onChange={v => setF('vitalsRr', parseInt(v) || 0)} /></FormGroup>
          <FormGroup label="SpO₂ (%)"><FormInput type="number" value={form.vitalsSpo2} onChange={v => setF('vitalsSpo2', parseInt(v) || 0)} /></FormGroup>
        </div>

        <SectionTitle>Ongoing Treatment</SectionTitle>
        <FormGroup label="Ongoing Treatment"><FormTextarea value={form.ongoingTreatment} onChange={v => setF('ongoingTreatment', v)} rows={2} /></FormGroup>
        <FormGroup label="Medications" className="mt-3"><FormTextarea value={form.medications} onChange={v => setF('medications', v)} rows={2} /></FormGroup>
        <FormGroup label="Lines / Tubes / Devices" className="mt-3"><FormInput value={form.lines} onChange={v => setF('lines', v)} placeholder="IV lines, catheter, drain, ETT..." /></FormGroup>

        <SectionTitle>SBAR Communication</SectionTitle>
        <div className="space-y-3">
          {[
            { k: 'situation', label: 'S — Situation', ph: 'Current situation / reason for transfer' },
            { k: 'background', label: 'B — Background', ph: 'Relevant clinical background' },
            { k: 'assessment', label: 'A — Assessment', ph: 'Current assessment of patient condition' },
            { k: 'recommendations', label: 'R — Recommendations', ph: 'Recommended actions for receiving team' },
          ].map(f => (
            <FormGroup key={f.k} label={f.label}>
              <FormTextarea value={(form as unknown as Record<string, string>)[f.k] || ''} onChange={v => setF(f.k, v)} placeholder={f.ph} rows={2} />
            </FormGroup>
          ))}
        </div>

        <SectionTitle>Handover Details</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <FormGroup label="Accompanying Staff"><FormInput value={form.accompanyingStaff} onChange={v => setF('accompanyingStaff', v)} /></FormGroup>
          <FormGroup label="Receiving Staff"><FormInput value={form.receivingStaff} onChange={v => setF('receivingStaff', v)} /></FormGroup>
          <FormGroup label="Patient Belongings"><FormInput value={form.belongingsStatus} onChange={v => setF('belongingsStatus', v)} placeholder="With family / sent with patient..." /></FormGroup>
          <FormGroup label="Pending Reports / Investigations"><FormInput value={form.pendingReports} onChange={v => setF('pendingReports', v)} /></FormGroup>
        </div>
      </FormDrawer>
    </div>
  );
}
