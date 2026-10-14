'use client';

import { useState } from 'react';
import { useEMR } from '@/context/EMRContext';
import { generateId, nowDateStr, nowTimeStr } from '@/lib/store';
import { formatDate } from '@/lib/utils';
import { FormDrawer, FormGroup, FormInput, FormSelect, FormTextarea, SectionTitle, StatusBadge, EmptyState, CardHeader, TealButton, SoftButton, YesNoToggle } from '@/components/FormDrawer';
import { Plus, Edit2, Shield } from 'lucide-react';
import type { PressureUlcerAssessment, PressureUlcerMonitoring } from '@/lib/types';
import { cn } from '@/lib/utils';

// ===== PRESSURE ULCER TAB =====
export function PressureUlcerTab() {
  const { store, selectedPatient, updateStore } = useEMR();
  const [selectedAssessment, setSelectedAssessment] = useState<PressureUlcerAssessment | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [monDrawerOpen, setMonDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const patientId = selectedPatient!.id;
  const assessments = store.pressureUlcerAssessments.filter(r => r.patientId === patientId);

  const [form, setForm] = useState({
    date: nowDateStr(), time: nowTimeStr(), nurseName: '',
    ulcerPresent: false,
    beforeAfter: 'Before Admission' as 'Before Admission' | 'After Admission', // Documentation timing
    location: '', stage: '', length: 0, width: 0, depth: 0,
    obesity: false, obesityWeight: 0,
    underweight: false, underweightWeight: 0,
    poorGlycaemicControl: false, bloodSugar: 0,
    thrombocytopenia: false, plateletCount: 0,
    hypoproteinemia: false, proteinLevel: 0,
    otherFactor: false, otherFactorDetail: '',
    // Preventive Measures
    airBed: false, positionChange: false, dressingApplied: false,
    backCare: false, // NEW: Back Care
    preventiveOther: false, preventiveOtherDetail: '',
    noPreventiveReason: '',
  });

  const [monForm, setMonForm] = useState({
    date: nowDateStr(), time: nowTimeStr(), nurseName: '',
    location: '', stage: '', length: 0, width: 0, depth: 0,
    woundBedCondition: '', surroundingSkinCondition: '', discharge: '',
    dressingTreatment: '', progress: 'Unchanged' as const,
    actions: '', remarks: '',
  });

  function setF(k: string, v: unknown) { setForm(prev => ({ ...prev, [k]: v })); }
  function setMF(k: string, v: unknown) { setMonForm(prev => ({ ...prev, [k]: v })); }

  function openNew() {
    setForm({ date: nowDateStr(), time: nowTimeStr(), nurseName: '', ulcerPresent: false, beforeAfter: 'Before Admission', location: '', stage: '', length: 0, width: 0, depth: 0, obesity: false, obesityWeight: 0, underweight: false, underweightWeight: 0, poorGlycaemicControl: false, bloodSugar: 0, thrombocytopenia: false, plateletCount: 0, hypoproteinemia: false, proteinLevel: 0, otherFactor: false, otherFactorDetail: '', airBed: false, positionChange: false, dressingApplied: false, backCare: false, preventiveOther: false, preventiveOtherDetail: '', noPreventiveReason: '' });
    setEditId(null); setDrawerOpen(true);
  }

  function saveAssessment(status: 'Completed' | 'Draft') {
    updateStore(prev => {
      if (editId) return { ...prev, pressureUlcerAssessments: prev.pressureUlcerAssessments.map(r => r.id === editId ? { ...r, ...form, status } : r) };
      return { ...prev, pressureUlcerAssessments: [...prev.pressureUlcerAssessments, { id: generateId(), patientId, ...form, status, createdAt: new Date().toISOString() } as PressureUlcerAssessment] };
    });
    setDrawerOpen(false);
  }

  function openMonitoring(assessment: PressureUlcerAssessment) {
    setSelectedAssessment(assessment);
    setMonForm({ date: nowDateStr(), time: nowTimeStr(), nurseName: '', location: assessment.location, stage: assessment.stage, length: assessment.length, width: assessment.width, depth: assessment.depth, woundBedCondition: '', surroundingSkinCondition: '', discharge: '', dressingTreatment: '', progress: 'Unchanged', actions: '', remarks: '' });
    setMonDrawerOpen(true);
  }

  function saveMonitoring(status: 'Completed' | 'Draft') {
    if (!selectedAssessment) return;
    updateStore(prev => ({
      ...prev, pressureUlcerMonitoring: [...prev.pressureUlcerMonitoring, {
        id: generateId(), assessmentId: selectedAssessment.id, patientId, ...monForm, status, createdAt: new Date().toISOString()
      } as PressureUlcerMonitoring]
    }));
    setMonDrawerOpen(false);
  }

  const stageColor: Record<string, string> = {
    'Stage 1': 'bg-yellow-100 text-yellow-700',
    'Stage 2': 'bg-orange-100 text-orange-700',
    'Stage 3': 'bg-red-100 text-red-700',
    'Stage 4': 'bg-red-200 text-red-800',
    'Unstageable': 'bg-slate-200 text-slate-700',
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="ncard">
        <CardHeader title="Pressure Ulcer Assessment & Monitoring" actions={<TealButton onClick={openNew} size="sm"><Plus size={14} /> New Assessment</TealButton>} />
        <div className="ncard-body">
          {assessments.length === 0 ? (
            <EmptyState icon={<Shield />} title="No pressure ulcer assessments" description="Click New Assessment to add one" action={<TealButton onClick={openNew}><Plus size={14} /> New Assessment</TealButton>} />
          ) : (
            <div className="space-y-3">
              {assessments.map(a => {
                const monitorings = store.pressureUlcerMonitoring.filter(m => m.assessmentId === a.id);
                return (
                  <div key={a.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-teal-200 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm text-slate-800">{formatDate(a.date)} {a.time}</span>
                          <StatusBadge status={a.status} />
                          {a.beforeAfter && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">{a.beforeAfter}</span>
                          )}
                          {a.ulcerPresent ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">Ulcer Present</span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">No Ulcer</span>
                          )}
                        </div>
                        {a.ulcerPresent && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-slate-600">{a.location}</span>
                            {a.stage && <span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold', stageColor[a.stage] || 'bg-slate-100 text-slate-600')}>{a.stage}</span>}
                            {a.length > 0 && <span className="text-xs text-slate-500">{a.length}×{a.width}×{a.depth} cm</span>}
                          </div>
                        )}
                        <div className="text-xs text-slate-400 mt-1">By {a.nurseName || 'Demo Nurse'} · {monitorings.length} monitoring record{monitorings.length !== 1 ? 's' : ''}</div>
                      </div>
                      <div className="flex gap-2">
                        <SoftButton onClick={() => openMonitoring(a)} size="sm">
                          <Plus size={12} /> Add Monitoring
                        </SoftButton>
                        <SoftButton onClick={() => {
                          setEditId(a.id);
                          setForm({
                            date: a.date, time: a.time, nurseName: a.nurseName,
                            ulcerPresent: a.ulcerPresent,
                            beforeAfter: a.beforeAfter || 'Before Admission',
                            location: a.location, stage: a.stage, length: a.length, width: a.width, depth: a.depth,
                            obesity: a.obesity, obesityWeight: a.obesityWeight || 0,
                            underweight: a.underweight, underweightWeight: a.underweightWeight || 0,
                            poorGlycaemicControl: a.poorGlycaemicControl, bloodSugar: a.bloodSugar || 0,
                            thrombocytopenia: a.thrombocytopenia, plateletCount: a.plateletCount || 0,
                            hypoproteinemia: a.hypoproteinemia, proteinLevel: a.proteinLevel || 0,
                            otherFactor: a.otherFactor, otherFactorDetail: a.otherFactorDetail || '',
                            airBed: a.airBed, positionChange: a.positionChange, dressingApplied: a.dressingApplied,
                            backCare: a.backCare || false,
                            preventiveOther: a.preventiveOther, preventiveOtherDetail: a.preventiveOtherDetail || '',
                            noPreventiveReason: a.noPreventiveReason || '',
                          });
                          setDrawerOpen(true);
                        }} size="sm">
                          <Edit2 size={12} /> Edit
                        </SoftButton>
                      </div>
                    </div>

                    {/* Monitoring records */}
                    {monitorings.length > 0 && (
                      <div className="border-t border-slate-100 pt-3 mt-2">
                        <div className="text-xs font-bold text-slate-400 uppercase mb-2">Monitoring History</div>
                        <div className="space-y-2">
                          {monitorings.map(m => (
                            <div key={m.id} className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-lg text-sm">
                              <span className="font-medium text-slate-700">{formatDate(m.date)} {m.time}</span>
                              <span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold',
                                m.progress === 'Improving' ? 'bg-green-100 text-green-700' :
                                m.progress === 'Worsening' ? 'bg-red-100 text-red-700' :
                                m.progress === 'Healed' ? 'bg-teal-100 text-teal-700' :
                                'bg-slate-100 text-slate-600'
                              )}>{m.progress}</span>
                              <span className="text-slate-500 text-xs">{m.stage} · {m.length}×{m.width} cm</span>
                              <span className="text-slate-400 text-xs ml-auto">{m.nurseName || 'Demo Nurse'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Assessment Form Drawer */}
      <FormDrawer open={drawerOpen} title={editId ? 'Edit Assessment' : 'New Pressure Ulcer Assessment'} subtitle={selectedPatient!.name} onClose={() => setDrawerOpen(false)} onSave={() => saveAssessment('Completed')} onSaveDraft={() => saveAssessment('Draft')}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <FormGroup label="Date"><FormInput type="date" value={form.date} onChange={v => setF('date', v)} /></FormGroup>
          <FormGroup label="Time"><FormInput type="time" value={form.time} onChange={v => setF('time', v)} /></FormGroup>
          <FormGroup label="Nurse Name"><FormInput value={form.nurseName} onChange={v => setF('nurseName', v)} placeholder="Nurse name" /></FormGroup>
        </div>
        {/* Before / After documentation selector */}
        <SectionTitle>Documentation Timing</SectionTitle>
        <div className="flex gap-3">
          {(['Before Admission', 'After Admission'] as const).map(opt => (
            <button key={opt} onClick={() => setF('beforeAfter', opt)} className={cn('flex-1 py-2 rounded-xl border-2 text-sm font-semibold transition-colors', form.beforeAfter === opt ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300')}>{opt}</button>
          ))}
        </div>
        <SectionTitle>Ulcer Status</SectionTitle>
        <FormGroup label="Pressure Ulcer Present?">
          <YesNoToggle value={form.ulcerPresent} onChange={v => setF('ulcerPresent', v)} />
        </FormGroup>
        {form.ulcerPresent && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
              <FormGroup label="Location" required><FormInput value={form.location} onChange={v => setF('location', v)} placeholder="Sacral, heel, etc." /></FormGroup>
              <FormGroup label="Stage/Category">
                <FormSelect value={form.stage} onChange={v => setF('stage', v)} options={['', 'Stage 1', 'Stage 2', 'Stage 3', 'Stage 4', 'Unstageable', 'DTPI']} />
              </FormGroup>
              <FormGroup label="Length (cm)"><FormInput type="number" step="0.1" value={form.length} onChange={v => setF('length', parseFloat(v) || 0)} /></FormGroup>
              <FormGroup label="Width (cm)"><FormInput type="number" step="0.1" value={form.width} onChange={v => setF('width', parseFloat(v) || 0)} /></FormGroup>
              <FormGroup label="Depth (cm)"><FormInput type="number" step="0.1" value={form.depth} onChange={v => setF('depth', parseFloat(v) || 0)} /></FormGroup>
            </div>
          </>
        )}
        <SectionTitle>Predisposing Factors</SectionTitle>
        <div className="space-y-2">
          {[
            { key: 'obesity', label: 'Obesity', detailKey: 'obesityWeight', detailLabel: 'Weight (kg)' },
            { key: 'underweight', label: 'Underweight', detailKey: 'underweightWeight', detailLabel: 'Weight (kg)' },
            { key: 'poorGlycaemicControl', label: 'Poor Glycaemic Control', detailKey: 'bloodSugar', detailLabel: 'Blood Sugar (mg/dL)' },
            { key: 'thrombocytopenia', label: 'Thrombocytopenia', detailKey: 'plateletCount', detailLabel: 'Platelet Count' },
            { key: 'hypoproteinemia', label: 'Hypoproteinemia', detailKey: 'proteinLevel', detailLabel: 'Protein (g/dL)' },
          ].map(({ key, label, detailKey, detailLabel }) => (
            <div key={key} className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!(form as Record<string, unknown>)[key]} onChange={e => setF(key, e.target.checked)} className="w-4 h-4 accent-teal-500" />
                <span className="text-sm text-slate-700">{label}</span>
              </label>
              {Boolean((form as Record<string, unknown>)[key]) && (
                <FormInput type="number" step="0.1" value={(form as unknown as Record<string, number>)[detailKey] || 0} onChange={v => setF(detailKey, parseFloat(v) || 0)} placeholder={detailLabel} className="w-40" />
              )}
            </div>
          ))}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.otherFactor} onChange={e => setF('otherFactor', e.target.checked)} className="w-4 h-4 accent-teal-500" />
            <span className="text-sm text-slate-700">Other</span>
          </label>
          {form.otherFactor && <FormInput value={form.otherFactorDetail} onChange={v => setF('otherFactorDetail', v)} placeholder="Specify..." />}
        </div>
        <SectionTitle>Preventive Measures</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'airBed', label: 'Air Bed / Pressure-Relieving Mattress' },
            { key: 'positionChange', label: 'Position Change (2-hourly)' },
            { key: 'dressingApplied', label: 'Dressing Applied' },
            { key: 'backCare', label: 'Back Care' },
          ].map(({ key, label }) => (
            <label key={key} className={cn('flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border transition-colors', (form as Record<string, unknown>)[key] ? 'bg-teal-50 border-teal-300' : 'border-slate-200')}>
              <input type="checkbox" checked={!!(form as Record<string, unknown>)[key]} onChange={e => setF(key, e.target.checked)} className="w-4 h-4 accent-teal-500" />
              <span className="text-sm">{label}</span>
            </label>
          ))}
          <label className={cn('flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border transition-colors col-span-2 sm:col-span-1', form.preventiveOther ? 'bg-teal-50 border-teal-300' : 'border-slate-200')}>
            <input type="checkbox" checked={form.preventiveOther} onChange={e => setF('preventiveOther', e.target.checked)} className="w-4 h-4 accent-teal-500" />
            <span className="text-sm">Other</span>
          </label>
        </div>
        {form.preventiveOther && <FormInput value={form.preventiveOtherDetail} onChange={v => setF('preventiveOtherDetail', v)} placeholder="Specify other preventive measure..." className="mt-2" />}
        {!form.airBed && !form.positionChange && !form.dressingApplied && !form.backCare && !form.preventiveOther && (
          <FormGroup label="Reason for No Preventive Action" className="mt-3">
            <FormTextarea value={form.noPreventiveReason} onChange={v => setF('noPreventiveReason', v)} placeholder="Reason..." rows={2} />
          </FormGroup>
        )}
      </FormDrawer>

      {/* Monitoring Form Drawer */}
      <FormDrawer open={monDrawerOpen} title="Add Monitoring Record" subtitle={selectedAssessment ? `Assessment: ${formatDate(selectedAssessment.date)} — ${selectedAssessment.location}` : ''} onClose={() => setMonDrawerOpen(false)} onSave={() => saveMonitoring('Completed')} onSaveDraft={() => saveMonitoring('Draft')}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <FormGroup label="Date"><FormInput type="date" value={monForm.date} onChange={v => setMF('date', v)} /></FormGroup>
          <FormGroup label="Time"><FormInput type="time" value={monForm.time} onChange={v => setMF('time', v)} /></FormGroup>
          <FormGroup label="Nurse Name"><FormInput value={monForm.nurseName} onChange={v => setMF('nurseName', v)} placeholder="Nurse name" /></FormGroup>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
          <FormGroup label="Location"><FormInput value={monForm.location} onChange={v => setMF('location', v)} /></FormGroup>
          <FormGroup label="Stage"><FormSelect value={monForm.stage} onChange={v => setMF('stage', v)} options={['', 'Stage 1', 'Stage 2', 'Stage 3', 'Stage 4', 'Unstageable', 'DTPI']} /></FormGroup>
          <FormGroup label="Length (cm)"><FormInput type="number" step="0.1" value={monForm.length} onChange={v => setMF('length', parseFloat(v) || 0)} /></FormGroup>
          <FormGroup label="Width (cm)"><FormInput type="number" step="0.1" value={monForm.width} onChange={v => setMF('width', parseFloat(v) || 0)} /></FormGroup>
          <FormGroup label="Depth (cm)"><FormInput type="number" step="0.1" value={monForm.depth} onChange={v => setMF('depth', parseFloat(v) || 0)} /></FormGroup>
          <FormGroup label="Progress">
            <FormSelect value={monForm.progress} onChange={v => setMF('progress', v)} options={['Improving', 'Unchanged', 'Worsening', 'Healed']} />
          </FormGroup>
        </div>
        <SectionTitle>Wound Assessment</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <FormGroup label="Wound Bed Condition"><FormTextarea value={monForm.woundBedCondition} onChange={v => setMF('woundBedCondition', v)} placeholder="Slough, granulation, etc." rows={2} /></FormGroup>
          <FormGroup label="Surrounding Skin"><FormTextarea value={monForm.surroundingSkinCondition} onChange={v => setMF('surroundingSkinCondition', v)} placeholder="Intact, macerated, etc." rows={2} /></FormGroup>
          <FormGroup label="Discharge"><FormInput value={monForm.discharge} onChange={v => setMF('discharge', v)} placeholder="None, serous, purulent" /></FormGroup>
          <FormGroup label="Dressing / Treatment"><FormTextarea value={monForm.dressingTreatment} onChange={v => setMF('dressingTreatment', v)} placeholder="Treatment applied..." rows={2} /></FormGroup>
        </div>
        <FormGroup label="Actions" className="mt-3"><FormTextarea value={monForm.actions} onChange={v => setMF('actions', v)} placeholder="Actions taken..." rows={2} /></FormGroup>
        <FormGroup label="Remarks" className="mt-3"><FormTextarea value={monForm.remarks} onChange={v => setMF('remarks', v)} placeholder="Remarks..." rows={2} /></FormGroup>
      </FormDrawer>
    </div>
  );
}
