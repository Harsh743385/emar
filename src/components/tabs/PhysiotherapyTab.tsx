'use client';
import { useState } from 'react';
import { useEMR } from '@/context/EMRContext';
import { generateId, nowDateStr, nowTimeStr } from '@/lib/store';
import { formatDate } from '@/lib/utils';
import { FormDrawer, FormGroup, FormInput, FormSelect, FormTextarea, SectionTitle, StatusBadge, EmptyState, CardHeader, TealButton, SoftButton } from '@/components/FormDrawer';
import { Plus, Edit2, Dumbbell, FileText } from 'lucide-react';
import type { PhysiotherapyAssessment, PhysiotherapySession } from '@/lib/types';

interface PhysiotherapyTabProps { type: 'assessment' | 'sessions'; }

export function PhysiotherapyTab({ type }: PhysiotherapyTabProps) {
  const { store, selectedPatient, updateStore } = useEMR();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const patientId = selectedPatient!.id;
  const assessments = store.physiotherapyAssessments.filter(r => r.patientId === patientId);
  const sessions = store.physiotherapySessions.filter(r => r.patientId === patientId);

  // ---- Assessment Form ----
  const [aForm, setAForm] = useState({
    date: nowDateStr(), time: nowTimeStr(), physiotherapistName: '', referringDoctor: '', referralDate: nowDateStr(),
    diagnosis: '', chiefComplaints: '', painScore: 0, painLocation: '',
    bpSys: 0, bpDia: 0, pulse: 0, tempF: 98.6, rr: 16, spo2: 98,
    precautions: '', functionalStatus: '', mobilityStatus: '',
    musculoskeletalAssessment: '', neurologicalAssessment: '', cardiopulmonaryAssessment: '',
    fallRiskScore: 0, consentRecorded: false,
    clinicalImpression: '', shortTermGoals: '', longTermGoals: '', treatmentPlan: '', patientEducation: '',
  });

  // ---- Session Form ----
  const [sForm, setSForm] = useState({
    assessmentId: assessments[0]?.id || '',
    date: nowDateStr(), time: nowTimeStr(), physiotherapistName: '',
    treatmentGiven: '', patientResponse: '', painScore: 0,
    progressTowardsGoals: '', treatmentPlanChange: '', dischargeAdvice: '',
  });

  function setAF(k: string, v: unknown) { setAForm(p => ({ ...p, [k]: v })); }
  function setSF(k: string, v: unknown) { setSForm(p => ({ ...p, [k]: v })); }

  function openNew() {
    if (type === 'assessment') {
      setAForm({ date: nowDateStr(), time: nowTimeStr(), physiotherapistName: '', referringDoctor: '', referralDate: nowDateStr(), diagnosis: '', chiefComplaints: '', painScore: 0, painLocation: '', bpSys: 0, bpDia: 0, pulse: 0, tempF: 98.6, rr: 16, spo2: 98, precautions: '', functionalStatus: '', mobilityStatus: '', musculoskeletalAssessment: '', neurologicalAssessment: '', cardiopulmonaryAssessment: '', fallRiskScore: 0, consentRecorded: false, clinicalImpression: '', shortTermGoals: '', longTermGoals: '', treatmentPlan: '', patientEducation: '' });
    } else {
      setSForm({ assessmentId: assessments[0]?.id || '', date: nowDateStr(), time: nowTimeStr(), physiotherapistName: '', treatmentGiven: '', patientResponse: '', painScore: 0, progressTowardsGoals: '', treatmentPlanChange: '', dischargeAdvice: '' });
    }
    setEditId(null); setDrawerOpen(true);
  }

  function saveAssessment(status: 'Completed' | 'Draft') {
    updateStore(prev => {
      if (editId) return { ...prev, physiotherapyAssessments: prev.physiotherapyAssessments.map(r => r.id === editId ? { ...r, ...aForm, status } : r) };
      return { ...prev, physiotherapyAssessments: [...prev.physiotherapyAssessments, { id: generateId(), patientId, ...aForm, status, createdAt: new Date().toISOString() } as PhysiotherapyAssessment] };
    });
    setDrawerOpen(false);
  }

  function saveSession(status: 'Completed' | 'Draft') {
    updateStore(prev => {
      if (editId) return { ...prev, physiotherapySessions: prev.physiotherapySessions.map(r => r.id === editId ? { ...r, ...sForm, status } : r) };
      return { ...prev, physiotherapySessions: [...prev.physiotherapySessions, { id: generateId(), patientId, ...sForm, status, createdAt: new Date().toISOString() } as PhysiotherapySession] };
    });
    setDrawerOpen(false);
  }

  if (type === 'sessions') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="ncard">
          <CardHeader title="Physiotherapy Session Notes" actions={<TealButton onClick={openNew} size="sm"><Plus size={14} /> New Session</TealButton>} />
          <div className="ncard-body">
            {sessions.length === 0 ? (
              <EmptyState icon={<FileText />} title="No PT session notes" action={<TealButton onClick={openNew}><Plus size={14} /> New Session</TealButton>} />
            ) : (
              <div className="space-y-3">
                {sessions.map((s, i) => (
                  <div key={s.id} className="row-item">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm">Session {i + 1} — {formatDate(s.date)} {s.time}</span>
                        <StatusBadge status={s.status} />
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Pain: {s.painScore}/10</span>
                      </div>
                      <p className="text-sm text-slate-700 mb-1">{s.treatmentGiven}</p>
                      <p className="text-xs text-slate-600"><b>Response:</b> {s.patientResponse}</p>
                      <p className="text-xs text-slate-600"><b>Progress:</b> {s.progressTowardsGoals}</p>
                      <div className="text-xs text-slate-400 mt-1">By {s.physiotherapistName || 'Demo PT'}</div>
                    </div>
                    <SoftButton onClick={() => { setSForm({ assessmentId: s.assessmentId, date: s.date, time: s.time, physiotherapistName: s.physiotherapistName, treatmentGiven: s.treatmentGiven, patientResponse: s.patientResponse, painScore: s.painScore, progressTowardsGoals: s.progressTowardsGoals, treatmentPlanChange: s.treatmentPlanChange, dischargeAdvice: s.dischargeAdvice || '' }); setEditId(s.id); setDrawerOpen(true); }} size="sm"><Edit2 size={12} /> Edit</SoftButton>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <FormDrawer open={drawerOpen} title="PT Session Note" subtitle={selectedPatient!.name} onClose={() => setDrawerOpen(false)} onSave={() => saveSession('Completed')} onSaveDraft={() => saveSession('Draft')}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <FormGroup label="Date"><FormInput type="date" value={sForm.date} onChange={v => setSF('date', v)} /></FormGroup>
            <FormGroup label="Time"><FormInput type="time" value={sForm.time} onChange={v => setSF('time', v)} /></FormGroup>
            <FormGroup label="Physiotherapist"><FormInput value={sForm.physiotherapistName} onChange={v => setSF('physiotherapistName', v)} /></FormGroup>
          </div>
          {assessments.length > 0 && (
            <FormGroup label="Linked Assessment" className="mt-3">
              <FormSelect value={sForm.assessmentId} onChange={v => setSF('assessmentId', v)} options={assessments.map(a => ({ value: a.id, label: `${formatDate(a.date)} — ${a.diagnosis.substring(0, 40)}` }))} />
            </FormGroup>
          )}
          <FormGroup label="Pain Score (0-10)" className="mt-3"><FormInput type="number" min={0} max={10} value={sForm.painScore} onChange={v => setSF('painScore', parseInt(v) || 0)} /></FormGroup>
          <FormGroup label="Treatment Given" className="mt-3"><FormTextarea value={sForm.treatmentGiven} onChange={v => setSF('treatmentGiven', v)} rows={3} /></FormGroup>
          <FormGroup label="Patient Response" className="mt-3"><FormTextarea value={sForm.patientResponse} onChange={v => setSF('patientResponse', v)} rows={2} /></FormGroup>
          <FormGroup label="Progress Towards Goals" className="mt-3"><FormTextarea value={sForm.progressTowardsGoals} onChange={v => setSF('progressTowardsGoals', v)} rows={2} /></FormGroup>
          <FormGroup label="Treatment Plan Changes" className="mt-3"><FormTextarea value={sForm.treatmentPlanChange} onChange={v => setSF('treatmentPlanChange', v)} rows={2} /></FormGroup>
          <FormGroup label="Discharge Advice (if applicable)" className="mt-3"><FormTextarea value={sForm.dischargeAdvice} onChange={v => setSF('dischargeAdvice', v)} rows={2} /></FormGroup>
        </FormDrawer>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="ncard">
        <CardHeader title="Physiotherapy Assessment" actions={<TealButton onClick={openNew} size="sm"><Plus size={14} /> New Assessment</TealButton>} />
        <div className="ncard-body">
          {assessments.length === 0 ? (
            <EmptyState icon={<Dumbbell />} title="No physiotherapy assessments" action={<TealButton onClick={openNew}><Plus size={14} /> New Assessment</TealButton>} />
          ) : (
            <div className="space-y-3">
              {assessments.map(a => (
                <div key={a.id} className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm">{formatDate(a.date)} {a.time}</span>
                        <StatusBadge status={a.status} />
                      </div>
                      <p className="text-sm text-slate-700"><b>Diagnosis:</b> {a.diagnosis}</p>
                      <p className="text-xs text-slate-600"><b>Referring Dr:</b> {a.referringDoctor}</p>
                      <p className="text-xs text-slate-400">By {a.physiotherapistName || 'Demo PT'}</p>
                    </div>
                    <SoftButton onClick={() => { setAForm({ ...a, consentRecorded: a.consentRecorded }); setEditId(a.id); setDrawerOpen(true); }} size="sm"><Edit2 size={12} /> Edit</SoftButton>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                    <div><b>Short Term Goals:</b> {a.shortTermGoals}</div>
                    <div><b>Long Term Goals:</b> {a.longTermGoals}</div>
                    <div><b>Treatment Plan:</b> {a.treatmentPlan}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <FormDrawer open={drawerOpen} title="Physiotherapy Assessment" subtitle={selectedPatient!.name} onClose={() => setDrawerOpen(false)} onSave={() => saveAssessment('Completed')} onSaveDraft={() => saveAssessment('Draft')}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <FormGroup label="Date"><FormInput type="date" value={aForm.date} onChange={v => setAF('date', v)} /></FormGroup>
          <FormGroup label="Time"><FormInput type="time" value={aForm.time} onChange={v => setAF('time', v)} /></FormGroup>
          <FormGroup label="Physiotherapist" required><FormInput value={aForm.physiotherapistName} onChange={v => setAF('physiotherapistName', v)} /></FormGroup>
          <FormGroup label="Referring Doctor"><FormInput value={aForm.referringDoctor} onChange={v => setAF('referringDoctor', v)} /></FormGroup>
          <FormGroup label="Referral Date"><FormInput type="date" value={aForm.referralDate} onChange={v => setAF('referralDate', v)} /></FormGroup>
        </div>
        <SectionTitle>Clinical Details</SectionTitle>
        <FormGroup label="Diagnosis"><FormTextarea value={aForm.diagnosis} onChange={v => setAF('diagnosis', v)} rows={2} /></FormGroup>
        <FormGroup label="Chief Complaints" className="mt-3"><FormTextarea value={aForm.chiefComplaints} onChange={v => setAF('chiefComplaints', v)} rows={2} /></FormGroup>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
          <FormGroup label="Pain Score (0-10)"><FormInput type="number" min={0} max={10} value={aForm.painScore} onChange={v => setAF('painScore', parseInt(v) || 0)} /></FormGroup>
          <FormGroup label="Pain Location"><FormInput value={aForm.painLocation} onChange={v => setAF('painLocation', v)} /></FormGroup>
          <FormGroup label="Fall Risk Score"><FormInput type="number" value={aForm.fallRiskScore} onChange={v => setAF('fallRiskScore', parseInt(v) || 0)} /></FormGroup>
        </div>
        <SectionTitle>Vitals</SectionTitle>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          <FormGroup label="BP Sys"><FormInput type="number" value={aForm.bpSys} onChange={v => setAF('bpSys', parseInt(v) || 0)} /></FormGroup>
          <FormGroup label="BP Dia"><FormInput type="number" value={aForm.bpDia} onChange={v => setAF('bpDia', parseInt(v) || 0)} /></FormGroup>
          <FormGroup label="Pulse"><FormInput type="number" value={aForm.pulse} onChange={v => setAF('pulse', parseInt(v) || 0)} /></FormGroup>
          <FormGroup label="Temp (°F)"><FormInput type="number" step="0.1" value={aForm.tempF} onChange={v => setAF('tempF', parseFloat(v) || 0)} /></FormGroup>
          <FormGroup label="RR"><FormInput type="number" value={aForm.rr} onChange={v => setAF('rr', parseInt(v) || 0)} /></FormGroup>
          <FormGroup label="SpO₂"><FormInput type="number" value={aForm.spo2} onChange={v => setAF('spo2', parseInt(v) || 0)} /></FormGroup>
        </div>
        <SectionTitle>Assessment Details</SectionTitle>
        <FormGroup label="Precautions"><FormTextarea value={aForm.precautions} onChange={v => setAF('precautions', v)} rows={2} /></FormGroup>
        <FormGroup label="Functional Status" className="mt-3"><FormTextarea value={aForm.functionalStatus} onChange={v => setAF('functionalStatus', v)} rows={2} /></FormGroup>
        <FormGroup label="Musculoskeletal Assessment" className="mt-3"><FormTextarea value={aForm.musculoskeletalAssessment} onChange={v => setAF('musculoskeletalAssessment', v)} rows={2} /></FormGroup>
        <FormGroup label="Neurological Assessment" className="mt-3"><FormTextarea value={aForm.neurologicalAssessment} onChange={v => setAF('neurologicalAssessment', v)} rows={2} /></FormGroup>
        <SectionTitle>Goals & Treatment Plan</SectionTitle>
        <FormGroup label="Short Term Goals"><FormTextarea value={aForm.shortTermGoals} onChange={v => setAF('shortTermGoals', v)} rows={2} /></FormGroup>
        <FormGroup label="Long Term Goals" className="mt-3"><FormTextarea value={aForm.longTermGoals} onChange={v => setAF('longTermGoals', v)} rows={2} /></FormGroup>
        <FormGroup label="Treatment Plan" className="mt-3"><FormTextarea value={aForm.treatmentPlan} onChange={v => setAF('treatmentPlan', v)} rows={3} /></FormGroup>
        <FormGroup label="Patient Education" className="mt-3"><FormTextarea value={aForm.patientEducation} onChange={v => setAF('patientEducation', v)} rows={2} /></FormGroup>
        <label className="flex items-center gap-2 cursor-pointer mt-3">
          <input type="checkbox" checked={aForm.consentRecorded} onChange={e => setAF('consentRecorded', e.target.checked)} className="w-4 h-4 accent-teal-500" />
          <span className="text-sm font-medium">Consent Recorded</span>
        </label>
      </FormDrawer>
    </div>
  );
}
