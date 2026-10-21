'use client';

import { useState } from 'react';
import { useEMR } from '@/context/EMRContext';
import { generateId, nowDateStr, nowTimeStr } from '@/lib/store';
import { formatDate } from '@/lib/utils';
import {
  FormDrawer, FormGroup, FormInput, FormSelect, FormTextarea,
  SectionTitle, StatusBadge, EmptyState, CardHeader, TealButton, SoftButton
} from '@/components/FormDrawer';
import { Plus, Edit2, UserCheck, Activity, AlertCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RMOHandover } from '@/lib/types';

export function RMOHandoverTab() {
  const { store, selectedPatient, updateStore, updatePatientDiagnosis } = useEMR();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const patientId = selectedPatient!.id;
  const records = store.rmoHandovers.filter(r => r.patientId === patientId);

  // Fetch Nurse Vital Signs & Nursing Assessments for this patient
  const nurseVitals = store.vitalSigns.filter(r => r.patientId === patientId);
  const nurseAssessments = store.nursingAssessments.filter(r => r.patientId === patientId);

  const latestVital = nurseVitals.slice(-1)[0];
  const latestAssessment = nurseAssessments.slice(-1)[0];

  // Derive latest vitals and pain strings
  const latestBp = latestVital ? `${latestVital.bpSys}/${latestVital.bpDia}` : latestAssessment ? `${latestAssessment.bpSys}/${latestAssessment.bpDia}` : '—';
  const latestPulse = latestVital?.pulse ?? latestAssessment?.pulse ?? '—';
  const latestTemp = latestVital?.tempF ?? latestAssessment?.tempF ?? '—';
  const latestSpo2 = latestVital?.spo2 ?? latestAssessment?.spo2 ?? '—';
  const latestRr = latestVital?.rr ?? latestAssessment?.rr ?? '—';
  const latestNurseName = latestVital?.nurseName || latestAssessment?.nurseName || 'Duty Nurse';
  const latestTime = latestVital?.time || latestAssessment?.time || '';

  const latestPainScore = latestAssessment?.painScore ?? latestVital?.painScore ?? 0;
  const latestPainIntensity = latestAssessment?.painIntensity || latestVital?.painIntensity || '';
  const latestPainType = latestAssessment?.painType || 'Acute';
  const latestPainLocation = latestAssessment?.painLocation || latestVital?.painLocation || '';
  const latestPainAction = latestAssessment?.painActionTaken || latestVital?.painActionTaken || '';

  const vitalsSummaryText = `BP: ${latestBp} mmHg, Pulse: ${latestPulse} bpm, Temp: ${latestTemp}°F, SpO2: ${latestSpo2}%, RR: ${latestRr}/min (Recorded at ${latestTime} by Nurse ${latestNurseName})`;
  const painSummaryText = latestPainScore > 0
    ? `Pain Score: ${latestPainScore}/10 (${latestPainType} · ${latestPainIntensity || 'Present'}${latestPainLocation ? `, Location: ${latestPainLocation}` : ''}). Action Taken: ${latestPainAction || 'Monitored'}.`
    : `Pain Score: 0/10 (No pain reported).`;

  const [form, setForm] = useState({
    date: nowDateStr(), time: nowTimeStr(),
    fromConsultant: selectedPatient?.consultantDoctor || '',
    toConsultant: '',
    doctorDiagnosis: selectedPatient?.diagnosis || '',
    patientCondition: '',
    clinicalSummary: '',
    treatmentPlan: '',
    medications: '',
    pendingTasks: '',
    handoverNotes: '',
    acknowledgement: '',
    assessmentType: 'Doctor Assessment' as 'Doctor Assessment' | 'RMO Handover' | 'Doctor Round Note',
    doctorName: selectedPatient?.consultantDoctor || '',
    nurseVitalsSummary: '',
    nursePainRecord: '',
    latestPainScore: 0,
  });

  function setF(k: string, v: unknown) { setForm(p => ({ ...p, [k]: v })); }

  function openNew() {
    // Automatically write nurse vitals and pain into the doctor's assessment!
    const autoWrittenClinical = `[Nurse Vitals Record]: ${vitalsSummaryText}\n[Nurse Pain Record]: ${painSummaryText}\n\n[Doctor Clinical Findings & Evaluation]: Patient reviewed. `;

    setForm({
      date: nowDateStr(), time: nowTimeStr(),
      fromConsultant: selectedPatient?.consultantDoctor || '',
      toConsultant: 'Dr. On Duty / RMO',
      doctorDiagnosis: selectedPatient?.diagnosis || '',
      patientCondition: latestPainScore >= 5 ? `Moderate-Severe Pain (${latestPainScore}/10), Vitals noted` : 'Stable, vitals reviewed',
      clinicalSummary: autoWrittenClinical,
      treatmentPlan: latestPainScore >= 4 ? `1. Continue analgesia as prescribed\n2. Monitor vitals and re-evaluate pain in 2 hours` : '1. Continue current treatment plan\n2. Monitor vitals',
      medications: 'Review inpatient chart & MAR',
      pendingTasks: 'Review lab investigations; consultant review on rounds',
      handoverNotes: `Nurse recorded pain score ${latestPainScore}/10 with vitals BP ${latestBp}, Pulse ${latestPulse}.`,
      acknowledgement: '',
      assessmentType: 'Doctor Assessment',
      doctorName: selectedPatient?.consultantDoctor || '',
      nurseVitalsSummary: vitalsSummaryText,
      nursePainRecord: painSummaryText,
      latestPainScore: latestPainScore,
    });
    setEditId(null);
    setDrawerOpen(true);
  }

  function autoWriteVitalsAndPain() {
    const textToInsert = `\n\n--- AUTO-WRITTEN NURSE VITALS & PAIN (${nowTimeStr()}) ---\n• Vitals: ${vitalsSummaryText}\n• Pain: ${painSummaryText}\n`;
    setForm(p => ({
      ...p,
      clinicalSummary: p.clinicalSummary ? `${p.clinicalSummary}${textToInsert}` : textToInsert.trim(),
      nurseVitalsSummary: vitalsSummaryText,
      nursePainRecord: painSummaryText,
      latestPainScore: latestPainScore,
    }));
  }

  function save(status: 'Completed' | 'Draft') {
    if (form.doctorDiagnosis && form.doctorDiagnosis.trim()) {
      updatePatientDiagnosis(patientId, form.doctorDiagnosis.trim());
    }
    updateStore(prev => {
      const rec = { ...form, status };
      if (editId) return { ...prev, rmoHandovers: prev.rmoHandovers.map(r => r.id === editId ? { ...r, ...rec } : r) };
      return { ...prev, rmoHandovers: [...prev.rmoHandovers, { id: generateId(), patientId, ...rec, createdAt: new Date().toISOString() } as RMOHandover] };
    });
    setDrawerOpen(false);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Live Nurse Vitals & Pain Feed Card for Doctor */}
      <div className="bg-gradient-to-r from-teal-50/90 to-blue-50/90 border border-teal-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-600 text-white rounded-xl shadow-sm">
              <Activity size={18} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-800">Nurse Vital & Pain Records (Live Nursing Feed)</h4>
              <p className="text-xs text-slate-500">Live bedside recordings automatically synchronized into Doctor Assessment</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-medium">
              Last Nurse Entry: {latestTime || 'Today'} by {latestNurseName}
            </span>
            <TealButton onClick={openNew} size="sm">
              <Plus size={14} /> New Doctor Assessment
            </TealButton>
          </div>
        </div>

        {/* Live Vitals Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mb-3">
          <div className="bg-white p-2.5 rounded-xl border border-teal-100 text-center shadow-xs">
            <span className="text-xs text-slate-400 uppercase font-semibold">BP (mmHg)</span>
            <div className="text-base font-bold text-slate-800">{latestBp}</div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-teal-100 text-center shadow-xs">
            <span className="text-xs text-slate-400 uppercase font-semibold">Pulse</span>
            <div className="text-base font-bold text-slate-800">{latestPulse} <span className="text-xs font-normal">bpm</span></div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-teal-100 text-center shadow-xs">
            <span className="text-xs text-slate-400 uppercase font-semibold">Temp</span>
            <div className="text-base font-bold text-slate-800">{latestTemp}°F</div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-teal-100 text-center shadow-xs">
            <span className="text-xs text-slate-400 uppercase font-semibold">SpO₂</span>
            <div className="text-base font-bold text-teal-700">{latestSpo2}%</div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-teal-100 text-center shadow-xs">
            <span className="text-xs text-slate-400 uppercase font-semibold">Resp Rate</span>
            <div className="text-base font-bold text-slate-800">{latestRr}/min</div>
          </div>
          <div className={cn("p-2.5 rounded-xl border text-center shadow-xs",
            latestPainScore >= 7 ? "bg-red-50 border-red-200" :
            latestPainScore >= 4 ? "bg-amber-50 border-amber-200" :
            latestPainScore >= 1 ? "bg-yellow-50 border-yellow-200" : "bg-green-50 border-green-200"
          )}>
            <span className="text-xs text-slate-400 uppercase font-semibold">Pain Score</span>
            <div className="text-base font-bold text-slate-800">{latestPainScore}/10</div>
          </div>
        </div>

        {/* Live Pain Details Bar */}
        <div className="bg-white/90 p-3 rounded-xl border border-teal-100 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-700">Latest Pain Record:</span>
            <span className={cn("px-2 py-0.5 rounded-md font-bold",
              latestPainScore >= 7 ? "bg-red-100 text-red-700" :
              latestPainScore >= 4 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
            )}>
              {latestPainScore}/10 ({latestPainType})
            </span>
            {latestPainIntensity && <span className="text-slate-600">Intensity: <b>{latestPainIntensity}</b></span>}
            {latestPainLocation && <span className="text-slate-600">Location: <b>{latestPainLocation}</b></span>}
            {latestPainAction && <span className="text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded">Nurse Action: {latestPainAction}</span>}
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 text-teal-700 hover:text-teal-800 font-bold bg-teal-50 px-3 py-1 rounded-lg border border-teal-200 transition-colors"
          >
            <Sparkles size={13} />
            Auto-Write into Doctor Assessment
          </button>
        </div>
      </div>

      <div className="ncard">
        <CardHeader
          title="Doctor Assessment & Handover"
          actions={
            <TealButton onClick={openNew} size="sm">
              <Plus size={14} /> New Assessment / Handover
            </TealButton>
          }
        />
        <div className="ncard-body">
          {records.length === 0 ? (
            <EmptyState
              icon={<UserCheck />}
              title="No doctor assessment records"
              description="Click New Assessment to evaluate patient with auto-synchronized nurse vitals and pain"
              action={<TealButton onClick={openNew}><Plus size={14} /> New Assessment</TealButton>}
            />
          ) : (
            <div className="space-y-4">
              {records.map(r => (
                <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-teal-300 transition-colors">
                  <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-sm text-slate-800">{formatDate(r.date)} {r.time}</span>
                        <StatusBadge status={r.status} />
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                          {r.assessmentType || 'Doctor Assessment'}
                        </span>
                        {(r.latestPainScore ?? 0) > 0 && (
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-bold",
                            (r.latestPainScore ?? 0) >= 7 ? "bg-red-100 text-red-700" :
                            (r.latestPainScore ?? 0) >= 4 ? "bg-amber-100 text-amber-700" : "bg-yellow-100 text-yellow-800"
                          )}>
                            Nurse Pain: {r.latestPainScore}/10
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-700">
                        <b>{r.fromConsultant}</b> → <b>{r.toConsultant}</b>
                      </p>
                      <p className="text-xs text-amber-800 mt-1 bg-amber-50 px-2 py-0.5 rounded inline-block font-medium">
                        Patient Condition: {r.patientCondition}
                      </p>
                      {(r.doctorDiagnosis || selectedPatient?.diagnosis) && (
                        <p className="text-xs text-blue-800 mt-1 bg-blue-50 px-2 py-0.5 rounded inline-block font-semibold border border-blue-100">
                          🩺 Dx: {r.doctorDiagnosis || selectedPatient?.diagnosis}
                        </p>
                      )}
                    </div>
                    <SoftButton onClick={() => {
                      setForm({
                        date: r.date, time: r.time,
                        fromConsultant: r.fromConsultant,
                        toConsultant: r.toConsultant,
                        doctorDiagnosis: r.doctorDiagnosis || selectedPatient?.diagnosis || '',
                        patientCondition: r.patientCondition,
                        clinicalSummary: r.clinicalSummary,
                        treatmentPlan: r.treatmentPlan,
                        medications: r.medications,
                        pendingTasks: r.pendingTasks,
                        handoverNotes: r.handoverNotes,
                        acknowledgement: r.acknowledgement,
                        assessmentType: r.assessmentType || 'Doctor Assessment',
                        doctorName: r.doctorName || r.fromConsultant,
                        nurseVitalsSummary: r.nurseVitalsSummary || '',
                        nursePainRecord: r.nursePainRecord || '',
                        latestPainScore: r.latestPainScore ?? 0,
                      });
                      setEditId(r.id);
                      setDrawerOpen(true);
                    }} size="sm">
                      <Edit2 size={12} /> Edit
                    </SoftButton>
                  </div>

                  {/* Synchronized Nurse Vitals Box in Card */}
                  {r.nurseVitalsSummary && (
                    <div className="mb-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                      <div className="font-semibold text-slate-500 uppercase mb-0.5">Nurse Vitals & Pain Record Included:</div>
                      <div className="text-slate-700">{r.nurseVitalsSummary}</div>
                      {r.nursePainRecord && <div className="text-slate-700 font-medium mt-0.5 text-teal-800">{r.nursePainRecord}</div>}
                    </div>
                  )}

                  <div className="space-y-2 text-sm text-slate-700">
                    {r.clinicalSummary && (
                      <div>
                        <b className="text-xs text-slate-400 uppercase">Clinical Summary & Evaluation</b>
                        <p className="whitespace-pre-wrap text-xs bg-slate-50 p-2 rounded-lg mt-0.5">{r.clinicalSummary}</p>
                      </div>
                    )}
                    {r.treatmentPlan && (
                      <div>
                        <b className="text-xs text-slate-400 uppercase">Treatment Plan</b>
                        <p className="text-xs whitespace-pre-wrap">{r.treatmentPlan}</p>
                      </div>
                    )}
                    {r.medications && (
                      <div>
                        <b className="text-xs text-slate-400 uppercase">Medication Orders</b>
                        <p className="text-xs">{r.medications}</p>
                      </div>
                    )}
                    {r.pendingTasks && (
                      <div>
                        <b className="text-xs text-slate-400 uppercase">Pending Tasks</b>
                        <p className="text-xs">{r.pendingTasks}</p>
                      </div>
                    )}
                    {r.acknowledgement && (
                      <div className="bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                        <b className="text-xs text-green-700 uppercase">Doctor Acknowledgement</b>
                        <p className="text-green-800 text-xs">{r.acknowledgement}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <FormDrawer
        open={drawerOpen}
        title={editId ? 'Edit Doctor Assessment' : 'New Doctor Assessment & Handover'}
        subtitle={`Patient: ${selectedPatient!.name}`}
        onClose={() => setDrawerOpen(false)}
        onSave={() => save('Completed')}
        onSaveDraft={() => save('Draft')}
      >
        {/* Live Auto-Written Nurse Vitals & Pain Banner */}
        <div className="p-3.5 bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-xl mb-4">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <Activity size={15} className="text-teal-700" />
              <span className="text-xs font-bold text-teal-900 uppercase">
                Synchronized Nurse Bedside Observations
              </span>
            </div>
            <button
              type="button"
              onClick={autoWriteVitalsAndPain}
              className="text-xs px-2.5 py-1 bg-white border border-teal-300 text-teal-700 hover:bg-teal-100 rounded-lg font-bold flex items-center gap-1 shadow-xs transition-colors"
            >
              <Sparkles size={12} /> Auto-Write Nurse Vitals & Pain into Notes
            </button>
          </div>
          <div className="text-xs text-slate-700 space-y-1">
            <p><b>Vitals:</b> {vitalsSummaryText}</p>
            <p><b>Pain Status:</b> <span className={latestPainScore >= 4 ? "text-amber-800 font-semibold" : "text-slate-700"}>{painSummaryText}</span></p>
          </div>
        </div>

        {/* Doctor's Official Diagnosis (Writes Once -> Reflects Everywhere) */}
        <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl mb-4">
          <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">
              🩺 Official Doctor Diagnosis (Reflects Across All Tabs)
            </span>
            <span className="text-[11px] text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded font-medium">
              Writes once → reflects across whole EMR
            </span>
          </div>
          <input
            type="text"
            value={form.doctorDiagnosis}
            onChange={e => setF('doctorDiagnosis', e.target.value)}
            placeholder="Enter confirmed / provisional doctor's diagnosis..."
            className="w-full px-3 py-2 text-xs border border-blue-300 rounded-lg bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          <FormGroup label="Assessment Type">
            <FormSelect
              value={form.assessmentType}
              onChange={v => setF('assessmentType', v)}
              options={['Doctor Assessment', 'RMO Handover', 'Doctor Round Note']}
            />
          </FormGroup>
          <FormGroup label="Date"><FormInput type="date" value={form.date} onChange={v => setF('date', v)} /></FormGroup>
          <FormGroup label="Time"><FormInput type="time" value={form.time} onChange={v => setF('time', v)} /></FormGroup>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          <FormGroup label="Treating Doctor / Consultant" required>
            <FormInput value={form.fromConsultant} onChange={v => setF('fromConsultant', v)} placeholder="Dr. Name" />
          </FormGroup>
          <FormGroup label="To / Handover Consultant" required>
            <FormInput value={form.toConsultant} onChange={v => setF('toConsultant', v)} placeholder="Dr. Name" />
          </FormGroup>
          <FormGroup label="Patient Condition">
            <FormInput value={form.patientCondition} onChange={v => setF('patientCondition', v)} placeholder="Stable / Pain managed / Critical..." />
          </FormGroup>
        </div>

        <SectionTitle>Clinical Findings & Auto-Written Nurse Notes</SectionTitle>
        <FormGroup label="Clinical Summary (Nurse Vitals & Pain Auto-Included)">
          <FormTextarea
            value={form.clinicalSummary}
            onChange={v => setF('clinicalSummary', v)}
            rows={4}
            placeholder="Review of systems, nurse vitals/pain correlation, clinical findings..."
          />
        </FormGroup>

        <FormGroup label="Treatment Plan" className="mt-3">
          <FormTextarea
            value={form.treatmentPlan}
            onChange={v => setF('treatmentPlan', v)}
            rows={2}
            placeholder="Medication adjustments, diagnostic orders, monitoring instructions..."
          />
        </FormGroup>

        <FormGroup label="Current Medications / Changes" className="mt-3">
          <FormTextarea
            value={form.medications}
            onChange={v => setF('medications', v)}
            rows={2}
            placeholder="Active medications, adjustments made..."
          />
        </FormGroup>

        <FormGroup label="Pending Tasks & Follow-up" className="mt-3">
          <FormTextarea
            value={form.pendingTasks}
            onChange={v => setF('pendingTasks', v)}
            rows={2}
            placeholder="Investigations pending, consults awaited..."
          />
        </FormGroup>

        <FormGroup label="Doctor Notes" className="mt-3">
          <FormTextarea
            value={form.handoverNotes}
            onChange={v => setF('handoverNotes', v)}
            rows={2}
            placeholder="Additional physician observations..."
          />
        </FormGroup>

        <FormGroup label="Doctor Signature / Acknowledgement" className="mt-3">
          <FormInput
            value={form.acknowledgement}
            onChange={v => setF('acknowledgement', v)}
            placeholder="Dr. [Name] — Signed & Acknowledged"
          />
        </FormGroup>
      </FormDrawer>
    </div>
  );
}
