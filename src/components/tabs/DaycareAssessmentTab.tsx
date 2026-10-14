'use client';
import { useState } from 'react';
import { useEMR } from '@/context/EMRContext';
import { generateId, nowDateStr, nowTimeStr } from '@/lib/store';
import { formatDate } from '@/lib/utils';
import { FormDrawer, FormGroup, FormInput, FormSelect, FormTextarea, SectionTitle, StatusBadge, EmptyState, CardHeader, TealButton, SoftButton } from '@/components/FormDrawer';
import { Plus, Edit2, Sun } from 'lucide-react';
import type { DaycareAssessment } from '@/lib/types';

export function DaycareAssessmentTab() {
  const { store, selectedPatient, updateStore } = useEMR();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: nowDateStr(), time: nowTimeStr(), nurseName: '',
    procedurePlanned: '', bpSys: 0, bpDia: 0, pulse: 0, tempF: 98.6, rr: 16, spo2: 98,
    allergyStatus: 'NKDA', fastingStatus: '', premedication: '',
    ivAccessSite: '', consentObtained: false,
    postProcedureCondition: '', dischargeFitness: '', dischargeInstructions: '', escortName: '',
    notes: '',
  });

  const patientId = selectedPatient!.id;
  const records = store.daycareAssessments.filter(r => r.patientId === patientId);

  function setF(k: string, v: unknown) { setForm(p => ({ ...p, [k]: v })); }

  function openNew() {
    setForm({ date: nowDateStr(), time: nowTimeStr(), nurseName: '', procedurePlanned: '', bpSys: 0, bpDia: 0, pulse: 0, tempF: 98.6, rr: 16, spo2: 98, allergyStatus: 'NKDA', fastingStatus: '', premedication: '', ivAccessSite: '', consentObtained: false, postProcedureCondition: '', dischargeFitness: '', dischargeInstructions: '', escortName: '', notes: '' });
    setEditId(null); setDrawerOpen(true);
  }

  function save(status: 'Completed' | 'Draft') {
    updateStore(prev => {
      const rec: DaycareAssessment = { id: editId || generateId(), patientId, ...form, status, createdAt: new Date().toISOString() };
      if (editId) return { ...prev, daycareAssessments: prev.daycareAssessments.map(r => r.id === editId ? { ...r, ...rec } : r) };
      return { ...prev, daycareAssessments: [...prev.daycareAssessments, rec] };
    });
    setDrawerOpen(false);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="ncard">
        <CardHeader title="Daycare / Day Surgery Assessment" actions={<TealButton onClick={openNew} size="sm"><Plus size={14} /> New Assessment</TealButton>} />
        <div className="ncard-body">
          {records.length === 0 ? (
            <EmptyState icon={<Sun />} title="No daycare assessments" action={<TealButton onClick={openNew}><Plus size={14} /> New Assessment</TealButton>} />
          ) : (
            <div className="space-y-3">
              {records.map(r => (
                <div key={r.id} className="row-item">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm">{formatDate(r.date)} {r.time}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="text-sm text-slate-700"><b>Procedure:</b> {r.procedurePlanned}</p>
                    <p className="text-xs text-slate-400 mt-1">By {r.nurseName || 'Demo Nurse'}</p>
                  </div>
                  <SoftButton onClick={() => {
                    setForm({
                      date: r.date, time: r.time, nurseName: r.nurseName, procedurePlanned: r.procedurePlanned,
                      bpSys: r.bpSys, bpDia: r.bpDia, pulse: r.pulse, tempF: r.tempF, rr: r.rr, spo2: r.spo2,
                      allergyStatus: r.allergyStatus, fastingStatus: r.fastingStatus, premedication: r.premedication,
                      ivAccessSite: r.ivAccessSite, consentObtained: r.consentObtained,
                      postProcedureCondition: r.postProcedureCondition, dischargeFitness: r.dischargeFitness,
                      dischargeInstructions: r.dischargeInstructions, escortName: r.escortName, notes: r.notes
                    });
                    setEditId(r.id);
                    setDrawerOpen(true);
                  }} size="sm"><Edit2 size={12} /> Edit</SoftButton>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <FormDrawer open={drawerOpen} title="Daycare Assessment" subtitle={selectedPatient!.name} onClose={() => setDrawerOpen(false)} onSave={() => save('Completed')} onSaveDraft={() => save('Draft')}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <FormGroup label="Date"><FormInput type="date" value={form.date} onChange={v => setF('date', v)} /></FormGroup>
          <FormGroup label="Time"><FormInput type="time" value={form.time} onChange={v => setF('time', v)} /></FormGroup>
          <FormGroup label="Nurse Name"><FormInput value={form.nurseName} onChange={v => setF('nurseName', v)} /></FormGroup>
        </div>
        <FormGroup label="Planned Procedure / Surgery" required className="mt-3"><FormInput value={form.procedurePlanned} onChange={v => setF('procedurePlanned', v)} /></FormGroup>
        <SectionTitle>Pre-Procedure Assessment</SectionTitle>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          <FormGroup label="BP Sys"><FormInput type="number" value={form.bpSys} onChange={v => setF('bpSys', parseInt(v) || 0)} /></FormGroup>
          <FormGroup label="BP Dia"><FormInput type="number" value={form.bpDia} onChange={v => setF('bpDia', parseInt(v) || 0)} /></FormGroup>
          <FormGroup label="Pulse"><FormInput type="number" value={form.pulse} onChange={v => setF('pulse', parseInt(v) || 0)} /></FormGroup>
          <FormGroup label="SpO₂ (%)"><FormInput type="number" value={form.spo2} onChange={v => setF('spo2', parseInt(v) || 0)} /></FormGroup>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <FormGroup label="Allergy Status"><FormInput value={form.allergyStatus} onChange={v => setF('allergyStatus', v)} /></FormGroup>
          <FormGroup label="Fasting Status"><FormInput value={form.fastingStatus} onChange={v => setF('fastingStatus', v)} placeholder="Fasting since..." /></FormGroup>
          <FormGroup label="Pre-medication"><FormInput value={form.premedication} onChange={v => setF('premedication', v)} /></FormGroup>
          <FormGroup label="IV Access Site"><FormInput value={form.ivAccessSite} onChange={v => setF('ivAccessSite', v)} /></FormGroup>
        </div>
        <label className="flex items-center gap-2 cursor-pointer mt-3">
          <input type="checkbox" checked={form.consentObtained} onChange={e => setF('consentObtained', e.target.checked)} className="w-4 h-4 accent-teal-500" />
          <span className="text-sm font-medium">Consent Obtained</span>
        </label>
        <SectionTitle>Post-Procedure</SectionTitle>
        <FormGroup label="Post-Procedure Condition"><FormTextarea value={form.postProcedureCondition} onChange={v => setF('postProcedureCondition', v)} rows={2} /></FormGroup>
        <FormGroup label="Discharge Fitness" className="mt-3"><FormSelect value={form.dischargeFitness} onChange={v => setF('dischargeFitness', v)} options={['', 'Fit for discharge', 'Delayed discharge - monitoring', 'Admitted for observation', 'Transferred']} /></FormGroup>
        <FormGroup label="Discharge Instructions" className="mt-3"><FormTextarea value={form.dischargeInstructions} onChange={v => setF('dischargeInstructions', v)} rows={2} /></FormGroup>
        <FormGroup label="Escort Name" className="mt-3"><FormInput value={form.escortName} onChange={v => setF('escortName', v)} placeholder="Name of accompanying person" /></FormGroup>
      </FormDrawer>
    </div>
  );
}
