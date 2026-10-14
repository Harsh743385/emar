'use client';

import { useState } from 'react';
import { useEMR } from '@/context/EMRContext';
import { generateId, nowDateStr, nowTimeStr } from '@/lib/store';
import { getShiftFromTime } from '@/lib/utils';
import {
  FormDrawer, FormGroup, FormInput, FormSelect, FormTextarea,
  SectionTitle, StatusBadge, EmptyState, CardHeader, TealButton, SoftButton, YesNoToggle
} from '@/components/FormDrawer';
import { Plus, Eye, Edit2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NursingAssessment } from '@/lib/types';

interface NursingAssessmentTabProps {
  type: 'initial' | 'reassessment' | 'final';
}

const TITLES = {
  initial: 'Initial Nursing Assessment',
  reassessment: 'Nursing Reassessment',
  final: 'Final Assessment',
};

// ---- Fall Risk Criteria (Morse Fall Scale) ----
const FALL_RISK_CRITERIA: { label: string; score: number }[] = [
  { label: 'History of falling in past 3 months', score: 25 },
  { label: 'Secondary diagnosis (≥2 medical diagnoses)', score: 15 },
  { label: 'Uses ambulatory aid (furniture/crutch/walker)', score: 15 },
  { label: 'IV therapy / heparin lock', score: 20 },
  { label: 'Impaired gait/transfer', score: 10 },
  { label: 'Mental status: forgets limitations', score: 15 },
];
function calcFallRisk(criteria: string[]): { score: number; level: string } {
  const score = FALL_RISK_CRITERIA.filter(c => criteria.includes(c.label)).reduce((s, c) => s + c.score, 0);
  const level = score >= 45 ? 'High' : score >= 25 ? 'Moderate' : 'Low';
  return { score, level };
}

// ---- Pressure Ulcer Risk (Braden Scale) ----
const PU_RISK_CRITERIA: { label: string; score: number }[] = [
  { label: 'Sensory perception impaired', score: 1 },
  { label: 'Moisture: skin often moist', score: 1 },
  { label: 'Activity: bedfast/chairfast', score: 1 },
  { label: 'Mobility: very limited or immobile', score: 1 },
  { label: 'Nutrition: very poor intake', score: 1 },
  { label: 'Friction/shear: problem present', score: 1 },
];
function calcPURisk(criteria: string[]): { score: number; level: string } {
  const score = criteria.length;
  const level = score >= 5 ? 'High' : score >= 3 ? 'Moderate' : 'Low';
  return { score, level };
}

// ---- DVT Risk (simplified Caprini) ----
const DVT_RISK_CRITERIA: { label: string; score: number }[] = [
  { label: 'Age 41–60 years', score: 1 },
  { label: 'Age 61–74 years', score: 2 },
  { label: 'Age ≥75 years', score: 3 },
  { label: 'Minor surgery planned', score: 1 },
  { label: 'Swollen legs currently', score: 1 },
  { label: 'Varicose veins', score: 1 },
  { label: 'Obesity (BMI >25)', score: 1 },
  { label: 'Bed rest >72 hours', score: 2 },
  { label: 'Immobilising plaster cast', score: 2 },
  { label: 'History of DVT/PE', score: 3 },
  { label: 'Active malignancy', score: 3 },
];
function calcDVTRisk(criteria: string[]): { score: number; level: string } {
  const score = DVT_RISK_CRITERIA.filter(c => criteria.includes(c.label)).reduce((s, c) => s + c.score, 0);
  const level = score >= 5 ? 'High' : score >= 3 ? 'Moderate' : score >= 1 ? 'Low' : 'Minimal';
  return { score, level };
}

// ---- MNA-SF options ----
const MNA_FOOD = [
  { value: 0, label: '0 – Severe decrease' },
  { value: 1, label: '1 – Moderate decrease' },
  { value: 2, label: '2 – No decrease' },
];
const MNA_WEIGHT = [
  { value: 0, label: '0 – Loss >3 kg' },
  { value: 1, label: '1 – Does not know' },
  { value: 2, label: '2 – Loss 1–3 kg' },
  { value: 3, label: '3 – No loss' },
];
const MNA_MOBILITY = [
  { value: 0, label: '0 – Bed/chair bound' },
  { value: 1, label: '1 – Able to get out, not outdoors' },
  { value: 2, label: '2 – Goes outdoors' },
];
const MNA_PSYCH = [
  { value: 0, label: '0 – Severe dementia or depression' },
  { value: 1, label: '1 – Mild dementia' },
  { value: 2, label: '2 – No problems' },
];
const MNA_BMI = [
  { value: 0, label: '0 – BMI <19' },
  { value: 1, label: '1 – BMI 19–21' },
  { value: 2, label: '2 – BMI 21–23' },
  { value: 3, label: '3 – BMI ≥23' },
];

function calcMNA(f: {
  mnaFoodIntakeDecline?: number; mnaWeightLoss?: number; mnaMobility?: number;
  mnaAcuteDisease?: number; mnaNeuropsychological?: number; mnaBodyHabitus?: number;
}): { score: number; result: string } {
  const score = (f.mnaFoodIntakeDecline ?? 0) + (f.mnaWeightLoss ?? 0) + (f.mnaMobility ?? 0) +
    (f.mnaAcuteDisease ?? 0) + (f.mnaNeuropsychological ?? 0) + (f.mnaBodyHabitus ?? 0);
  const result = score >= 12 ? 'Normal Nutritional Status' : score >= 8 ? 'At Risk of Malnutrition' : 'Malnourished';
  return { score, result };
}

function defaultForm(): Omit<NursingAssessment, 'id' | 'patientId' | 'createdAt' | 'status'> {
  return {
    date: nowDateStr(),
    time: nowTimeStr(),
    shift: getShiftFromTime(nowTimeStr()),
    nurseName: '',
    arrivalTime: '',
    contactPersonName: '',
    contactPersonRelationship: '',
    contactPersonPhone: '',
    patientUncomfortable: false,
    bloodGroup: '',
    heightCm: 0,
    allergyDetails: '',
    allergyStatus: 'NKDA',
    pastHistory: '',
    // Vitals
    tempF: 98.6,
    pulse: 72,
    bpSys: 120,
    bpDia: 80,
    spo2: 98,
    rr: 16,
    weightKg: 0,
    chiefComplaints: '',
    painIntensity: '',
    painDuration: '',
    painActionTaken: '',
    // Risk — now criteria-driven
    fallRiskCriteria: [],
    fallRiskScore: 0,
    fallRiskLevel: 'Low',
    pressureUlcerRiskCriteria: [],
    pressureUlcerRiskScore: 0,
    pressureUlcerRisk: 'Low',
    dvtRiskCriteria: [],
    dvtRiskScore: 0,
    dvtRisk: 'Low',
    painScore: 0,
    // MNA
    mnaFoodIntakeDecline: 2,
    mnaWeightLoss: 3,
    mnaMobility: 2,
    mnaAcuteDisease: 0,
    mnaNeuropsychological: 2,
    mnaBodyHabitus: 3,
    mnaTotalScore: 12,
    mnaResult: 'Normal Nutritional Status',
    gcs: 15,
    levelOfConsciousness: 'Alert',
    skinCondition: '',
    notes: '',
    interventions: '',
    nurseSignature: '',
  };
}

export function NursingAssessmentTab({ type }: NursingAssessmentTabProps) {
  const { store, selectedPatient, updateStore } = useEMR();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<NursingAssessment | null>(null);
  const [editRecord, setEditRecord] = useState<NursingAssessment | null>(null);
  const [form, setForm] = useState(defaultForm());
  const [activeDate, setActiveDate] = useState(nowDateStr());

  const patientId = selectedPatient!.id;
  const allRecords = store.nursingAssessments.filter(r => r.patientId === patientId);
  const dateRecords = allRecords.filter(r => r.date === activeDate);

  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - 3 + i);
    return d.toISOString().substring(0, 10);
  });

  function setF<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  function openNew() {
    const base = defaultForm();
    // Seamlessly integrate existing Nutritional Assessment without creating duplicate records
    const existingMna = store.miniNutritionalAssessments.filter(r => r.patientId === patientId).slice(-1)[0];
    if (existingMna) {
      base.mnaFoodIntakeDecline = existingMna.foodIntakeDecline;
      base.mnaWeightLoss = existingMna.weightLoss;
      base.mnaMobility = existingMna.mobility;
      base.mnaAcuteDisease = existingMna.acuteDisease;
      base.mnaNeuropsychological = existingMna.neuropsychological;
      base.mnaBodyHabitus = existingMna.bodyHabitus;
      base.mnaTotalScore = existingMna.totalScore;
      base.mnaResult = existingMna.screeningResult;
    }
    setForm(base);
    setEditRecord(null);
    setDrawerOpen(true);
  }

  function openEdit(record: NursingAssessment) {
    setForm({
      date: record.date, time: record.time, shift: record.shift, nurseName: record.nurseName,
      arrivalTime: record.arrivalTime || '',
      contactPersonName: record.contactPersonName || '',
      contactPersonRelationship: record.contactPersonRelationship || '',
      contactPersonPhone: record.contactPersonPhone || '',
      patientUncomfortable: record.patientUncomfortable || false,
      bloodGroup: record.bloodGroup || '',
      heightCm: record.heightCm || 0,
      allergyDetails: record.allergyDetails || '',
      allergyStatus: record.allergyStatus || 'NKDA',
      pastHistory: record.pastHistory || '',
      tempF: record.tempF, pulse: record.pulse,
      bpSys: record.bpSys, bpDia: record.bpDia,
      spo2: record.spo2, rr: record.rr, weightKg: record.weightKg,
      chiefComplaints: record.chiefComplaints,
      painIntensity: (record as {painIntensity?: string}).painIntensity || '',
      painDuration: (record as {painDuration?: string}).painDuration || '',
      painActionTaken: (record as {painActionTaken?: string}).painActionTaken || '',
      fallRiskCriteria: record.fallRiskCriteria || [],
      fallRiskScore: record.fallRiskScore,
      fallRiskLevel: record.fallRiskLevel,
      pressureUlcerRiskCriteria: record.pressureUlcerRiskCriteria || [],
      pressureUlcerRiskScore: record.pressureUlcerRiskScore || 0,
      pressureUlcerRisk: record.pressureUlcerRisk || 'Low',
      dvtRiskCriteria: record.dvtRiskCriteria || [],
      dvtRiskScore: record.dvtRiskScore || 0,
      dvtRisk: record.dvtRisk || 'Low',
      painScore: record.painScore,
      mnaFoodIntakeDecline: record.mnaFoodIntakeDecline ?? 2,
      mnaWeightLoss: record.mnaWeightLoss ?? 3,
      mnaMobility: record.mnaMobility ?? 2,
      mnaAcuteDisease: record.mnaAcuteDisease ?? 0,
      mnaNeuropsychological: record.mnaNeuropsychological ?? 2,
      mnaBodyHabitus: record.mnaBodyHabitus ?? 3,
      mnaTotalScore: record.mnaTotalScore ?? 12,
      mnaResult: record.mnaResult ?? 'Normal Nutritional Status',
      gcs: record.gcs, levelOfConsciousness: record.levelOfConsciousness,
      skinCondition: record.skinCondition, notes: record.notes,
      interventions: record.interventions, nurseSignature: record.nurseSignature,
    });
    setEditRecord(record); setDrawerOpen(true);
  }

  function save(status: 'Completed' | 'Draft') {
    updateStore(prev => {
      if (editRecord) {
        return { ...prev, nursingAssessments: prev.nursingAssessments.map(r => r.id === editRecord.id ? { ...editRecord, ...form, status } : r) };
      }
      const newRecord: NursingAssessment = { id: generateId(), patientId, ...form, status, createdAt: new Date().toISOString() };
      return { ...prev, nursingAssessments: [...prev.nursingAssessments, newRecord] };
    });
    setActiveDate(form.date);
    setDrawerOpen(false);
  }

  if (viewRecord) {
    return <RecordView record={viewRecord} onBack={() => setViewRecord(null)} onEdit={openEdit} />;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="ncard">
        <CardHeader
          title={TITLES[type]}
          actions={<TealButton onClick={openNew} size="sm"><Plus size={14} /> New Assessment</TealButton>}
        />
        <div className="ncard-body">
          <DateStrip days={days} activeDate={activeDate} onChange={setActiveDate} />
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm"><b>{formatDate(activeDate)}</b>&nbsp;<span className="text-slate-500">{dateRecords.length} assessment{dateRecords.length !== 1 ? 's' : ''}</span></div>
          </div>
          {dateRecords.length === 0 ? (
            <EmptyState icon={<Clock />} title={`No assessments for ${formatDate(activeDate)}`} description="Click New Assessment to add one" action={<TealButton onClick={openNew}><Plus size={14} /> New Assessment</TealButton>} />
          ) : (
            <div className="space-y-3">
              {dateRecords.map(record => (
                <AssessmentCard key={record.id} record={record} onView={() => setViewRecord(record)} onEdit={() => openEdit(record)} />
              ))}
            </div>
          )}
        </div>
      </div>

      <FormDrawer open={drawerOpen} title={editRecord ? `Edit ${TITLES[type]}` : `New ${TITLES[type]}`} subtitle={`Patient: ${selectedPatient!.name}`} onClose={() => setDrawerOpen(false)} onSave={() => save('Completed')} onSaveDraft={() => save('Draft')}>
        <AssessmentForm form={form} setF={setF} type={type} />
      </FormDrawer>
    </div>
  );
}

// ---- Date Strip ----
function DateStrip({ days, activeDate, onChange }: { days: string[]; activeDate: string; onChange: (d: string) => void }) {
  const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  return (
    <div className="date-strip">
      {days.map(d => {
        const date = new Date(d);
        return (
          <div key={d} className={`date-day ${d === activeDate ? 'active' : ''}`} onClick={() => onChange(d)}>
            <div className="dow">{DOW[date.getDay()]}</div><div className="dom">{date.getDate()}</div>
          </div>
        );
      })}
      <input type="date" value={activeDate} onChange={e => onChange(e.target.value)} className="px-2 py-1 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-teal-400" />
    </div>
  );
}

function formatDate(d: string) {
  const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [y, mo, da] = d.split('-');
  return `${da}-${m[parseInt(mo) - 1]}-${y}`;
}

// ---- Assessment Card ----
function AssessmentCard({ record, onView, onEdit }: { record: NursingAssessment; onView: () => void; onEdit: () => void }) {
  return (
    <div className="row-item">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <span className="font-semibold text-sm text-slate-800">{record.time}{record.arrivalTime ? ` (Arrival: ${record.arrivalTime})` : ''}</span>
          <StatusBadge status={record.status} />
        </div>
        <div className="vital-grid mb-2">
          <VitalCell label="Temp" value={`${record.tempF}°F`} />
          <VitalCell label="Pulse" value={`${record.pulse} bpm`} />
          <VitalCell label="BP" value={`${record.bpSys}/${record.bpDia}`} />
          <VitalCell label="SpO₂" value={`${record.spo2}%`} />
          <VitalCell label="RR" value={`${record.rr}/min`} />
          <VitalCell label="Pain" value={`${record.painScore}/10`} />
        </div>
        {record.allergyStatus && record.allergyStatus !== 'NKDA' && (
          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full mr-2">⚠ Allergy: {record.allergyDetails || record.allergyStatus}</span>
        )}
        {record.chiefComplaints && (
          <div className="text-xs text-slate-700 mt-1">
            <b>Complaints:</b> {record.chiefComplaints}
            {(record.painIntensity || record.painDuration || record.painActionTaken) && (
              <span className="text-slate-500 ml-1.5 font-medium">
                ({[record.painIntensity && `Intensity: ${record.painIntensity}`, record.painDuration && `Duration: ${record.painDuration}`, record.painActionTaken && `Action: ${record.painActionTaken}`].filter(Boolean).join(' · ')})
              </span>
            )}
          </div>
        )}
        {record.notes && <p className="text-xs text-slate-600 line-clamp-2 mt-1">{record.notes}</p>}
        <div className="text-xs text-slate-400 mt-1.5">By {record.nurseName || 'Demo Nurse'}</div>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <SoftButton onClick={onView} size="sm"><Eye size={12} /> View</SoftButton>
        <SoftButton onClick={onEdit} size="sm"><Edit2 size={12} /> Edit</SoftButton>
      </div>
    </div>
  );
}

function VitalCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="vital-cell">
      <div className="lbl text-slate-400 text-xs uppercase">{label}</div>
      <div className="val text-slate-800 text-sm font-semibold">{value}</div>
    </div>
  );
}

// ---- Assessment Form ----
type FormState = Omit<NursingAssessment, 'id' | 'patientId' | 'createdAt' | 'status'>;
type SetF = <K extends keyof FormState>(k: K, v: FormState[K]) => void;

function RiskCheckboxGroup({
  title, criteria, selected, onChange, calcResult,
}: {
  title: string;
  criteria: { label: string; score: number }[];
  selected: string[];
  onChange: (updated: string[]) => void;
  calcResult: (sel: string[]) => { score: number; level: string };
}) {
  const { score, level } = calcResult(selected);
  const levelColor = level === 'High' ? 'bg-red-100 text-red-700' : level === 'Moderate' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700';

  function toggle(label: string) {
    const next = selected.includes(label) ? selected.filter(s => s !== label) : [...selected, label];
    onChange(next);
  }

  return (
    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-slate-700">{title}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800">Score: {score}</span>
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold', levelColor)}>{level} Risk</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {criteria.map(c => (
          <label key={c.label} className={cn('flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded-lg border text-xs transition-colors',
            selected.includes(c.label) ? 'bg-teal-50 border-teal-300 text-teal-800' : 'border-slate-200 text-slate-600')}>
            <input type="checkbox" checked={selected.includes(c.label)} onChange={() => toggle(c.label)} className="w-3.5 h-3.5 accent-teal-500" />
            <span className="flex-1">{c.label}</span>
            <span className="text-slate-400 font-medium">+{c.score}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function MNAScoreSelector({ label, options, value, onChange }: {
  label: string; options: { value: number; label: string }[]; value: number; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-600 mb-1">{label}</div>
      <div className="space-y-1">
        {options.map(o => (
          <label key={o.value} className={cn('flex items-center gap-2 px-2 py-1.5 rounded-lg border text-xs cursor-pointer transition-colors',
            value === o.value ? 'bg-teal-50 border-teal-300 text-teal-800' : 'border-slate-200 text-slate-600')}>
            <input type="radio" name={label} checked={value === o.value} onChange={() => onChange(o.value)} className="accent-teal-500" />
            {o.label}
          </label>
        ))}
      </div>
    </div>
  );
}

function AssessmentForm({ form, setF, type }: { form: FormState; setF: SetF; type: 'initial' | 'reassessment' | 'final' }) {
  const isInitial = type === 'initial';

  // ---- Risk helpers ----
  function updateFallRisk(criteria: string[]) {
    const { score, level } = calcFallRisk(criteria);
    setF('fallRiskCriteria', criteria);
    setF('fallRiskScore', score);
    setF('fallRiskLevel', level);
  }
  function updatePURisk(criteria: string[]) {
    const { score, level } = calcPURisk(criteria);
    setF('pressureUlcerRiskCriteria', criteria);
    setF('pressureUlcerRiskScore', score);
    setF('pressureUlcerRisk', level);
  }
  function updateDVTRisk(criteria: string[]) {
    const { score, level } = calcDVTRisk(criteria);
    setF('dvtRiskCriteria', criteria);
    setF('dvtRiskScore', score);
    setF('dvtRisk', level);
  }
  function updateMNA(key: keyof FormState, val: number) {
    const updated = { ...form, [key]: val };
    const { score, result } = calcMNA(updated);
    setF(key, val as FormState[typeof key]);
    setF('mnaTotalScore', score);
    setF('mnaResult', result);
  }

  const mnaScore = form.mnaTotalScore ?? 0;
  const mnaColor = mnaScore >= 12 ? 'bg-green-100 text-green-700' : mnaScore >= 8 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';

  return (
    <div className="space-y-1">
      {/* General */}
      <SectionTitle>General</SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {isInitial ? (
          <>
            <FormGroup label="Arrival Time" required>
              <FormInput type="time" value={form.arrivalTime || ''} onChange={v => setF('arrivalTime', v)} />
            </FormGroup>
            <FormGroup label="Assessment Time" required>
              <FormInput type="time" value={form.time} onChange={v => { setF('time', v); setF('shift', getShiftFromTime(v)); }} />
            </FormGroup>
            <FormGroup label="Date" required>
              <FormInput type="date" value={form.date} onChange={v => setF('date', v)} />
            </FormGroup>
            <FormGroup label="Nurse Name" required>
              <FormInput value={form.nurseName} onChange={v => setF('nurseName', v)} placeholder="Nurse name" />
            </FormGroup>
          </>
        ) : (
          <>
            <FormGroup label="Time" required>
              <FormInput type="time" value={form.time} onChange={v => { setF('time', v); setF('shift', getShiftFromTime(v)); }} />
            </FormGroup>
            <FormGroup label="Shift" required>
              <FormSelect value={form.shift} onChange={v => setF('shift', v as NursingAssessment['shift'])} options={['Morning', 'Afternoon', 'Night']} />
            </FormGroup>
            <FormGroup label="Date" required>
              <FormInput type="date" value={form.date} onChange={v => setF('date', v)} />
            </FormGroup>
            <FormGroup label="Nurse Name" required>
              <FormInput value={form.nurseName} onChange={v => setF('nurseName', v)} placeholder="Nurse name" />
            </FormGroup>
          </>
        )}
      </div>

      {/* Contact Person — Only for Initial */}
      {isInitial && (
        <>
          <SectionTitle>Contact Person / Attendant</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <FormGroup label="Contact Person Name">
              <FormInput value={form.contactPersonName || ''} onChange={v => setF('contactPersonName', v)} placeholder="Name" />
            </FormGroup>
            <FormGroup label="Relationship">
              <FormSelect value={form.contactPersonRelationship || ''} onChange={v => setF('contactPersonRelationship', v)} options={['', 'Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Guardian', 'Other']} />
            </FormGroup>
            <FormGroup label="Phone Number">
              <FormInput value={form.contactPersonPhone || ''} onChange={v => setF('contactPersonPhone', v)} placeholder="Contact number" />
            </FormGroup>
          </div>
          <div className="flex items-center gap-3 mt-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
            <span className="text-sm font-medium text-amber-800">Patient feels uncomfortable disclosing information to attendant?</span>
            <YesNoToggle value={form.patientUncomfortable || false} onChange={v => setF('patientUncomfortable', v)} />
          </div>
        </>
      )}

      {/* Patient Profile — Only for Initial */}
      {isInitial && (
        <>
          <SectionTitle>Patient Profile</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <FormGroup label="Blood Group">
              <FormSelect value={form.bloodGroup || ''} onChange={v => setF('bloodGroup', v)} options={['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown']} />
            </FormGroup>
            <FormGroup label="Height (cm)">
              <FormInput type="number" value={form.heightCm || 0} onChange={v => setF('heightCm', parseFloat(v) || 0)} />
            </FormGroup>
            <FormGroup label="Weight (kg)">
              <FormInput type="number" step="0.1" value={form.weightKg} onChange={v => setF('weightKg', parseFloat(v) || 0)} />
            </FormGroup>
            <FormGroup label="Allergy Status">
              <FormSelect value={form.allergyStatus || 'NKDA'} onChange={v => setF('allergyStatus', v)} options={['NKDA', 'Drug Allergy', 'Food Allergy', 'Environmental', 'Unknown']} />
            </FormGroup>
          </div>
          {(form.allergyStatus && form.allergyStatus !== 'NKDA') && (
            <FormGroup label="Allergy Details" className="mt-3">
              <FormInput value={form.allergyDetails || ''} onChange={v => setF('allergyDetails', v)} placeholder="Specify allergen and reaction..." />
            </FormGroup>
          )}
          <FormGroup label="Past Medical History" className="mt-3">
            <FormTextarea value={form.pastHistory || ''} onChange={v => setF('pastHistory', v)} placeholder="Previous conditions, surgeries, hospitalizations..." rows={3} />
          </FormGroup>
        </>
      )}

      {/* Chief Complaints with Intensity, Duration, Action Taken */}
      <SectionTitle>Chief Complaints</SectionTitle>
      <FormGroup label="Chief Complaints">
        <FormTextarea value={form.chiefComplaints} onChange={v => setF('chiefComplaints', v)} placeholder="Patient's chief complaints..." rows={2} />
      </FormGroup>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
        <FormGroup label="Intensity">
          <FormSelect value={(form as {painIntensity?: string}).painIntensity || ''} onChange={v => setF('painIntensity' as keyof FormState, v as FormState[keyof FormState])} options={['', 'Mild', 'Moderate', 'Severe', 'Very Severe']} />
        </FormGroup>
        <FormGroup label="Duration">
          <FormInput value={(form as {painDuration?: string}).painDuration || ''} onChange={v => setF('painDuration' as keyof FormState, v as FormState[keyof FormState])} placeholder="e.g. 2 days, 3 hours" />
        </FormGroup>
        <FormGroup label="Action Taken">
          <FormInput value={(form as {painActionTaken?: string}).painActionTaken || ''} onChange={v => setF('painActionTaken' as keyof FormState, v as FormState[keyof FormState])} placeholder="e.g. Analgesic given" />
        </FormGroup>
      </div>

      {/* Vitals */}
      <SectionTitle>Vitals</SectionTitle>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        <FormGroup label="Temp (°F)"><FormInput type="number" step="0.1" value={form.tempF} onChange={v => setF('tempF', parseFloat(v) || 0)} /></FormGroup>
        <FormGroup label="Pulse (bpm)"><FormInput type="number" value={form.pulse} onChange={v => setF('pulse', parseInt(v) || 0)} /></FormGroup>
        <FormGroup label="BP Sys (mmHg)"><FormInput type="number" value={form.bpSys} onChange={v => setF('bpSys', parseInt(v) || 0)} /></FormGroup>
        <FormGroup label="BP Dia (mmHg)"><FormInput type="number" value={form.bpDia} onChange={v => setF('bpDia', parseInt(v) || 0)} /></FormGroup>
        <FormGroup label="SpO₂ (%)"><FormInput type="number" value={form.spo2} onChange={v => setF('spo2', parseInt(v) || 0)} /></FormGroup>
        <FormGroup label="RR (/min)"><FormInput type="number" value={form.rr} onChange={v => setF('rr', parseInt(v) || 0)} /></FormGroup>
        {!isInitial && <FormGroup label="Weight (kg)"><FormInput type="number" step="0.1" value={form.weightKg} onChange={v => setF('weightKg', parseFloat(v) || 0)} /></FormGroup>}
        <FormGroup label="GCS (3-15)"><FormInput type="number" min={3} max={15} value={form.gcs} onChange={v => setF('gcs', parseInt(v) || 15)} /></FormGroup>
        <FormGroup label="Pain Score (0–10)"><FormInput type="number" min={0} max={10} value={form.painScore} onChange={v => setF('painScore', parseInt(v) || 0)} /></FormGroup>
        <FormGroup label="Consciousness">
          <FormSelect value={form.levelOfConsciousness} onChange={v => setF('levelOfConsciousness', v)} options={['Alert', 'Verbal', 'Pain', 'Unresponsive', 'Sedated', 'Confused']} />
        </FormGroup>
      </div>

      {/* Risk Assessment — criteria-driven */}
      <SectionTitle>Risk Assessment</SectionTitle>
      <div className="space-y-3">
        <RiskCheckboxGroup
          title="Fall Risk (Morse Scale)"
          criteria={FALL_RISK_CRITERIA}
          selected={form.fallRiskCriteria || []}
          onChange={updateFallRisk}
          calcResult={calcFallRisk}
        />
        <RiskCheckboxGroup
          title="Pressure Ulcer Risk (Braden Scale)"
          criteria={PU_RISK_CRITERIA}
          selected={form.pressureUlcerRiskCriteria || []}
          onChange={updatePURisk}
          calcResult={calcPURisk}
        />
        <RiskCheckboxGroup
          title="DVT Risk (Caprini Score)"
          criteria={DVT_RISK_CRITERIA}
          selected={form.dvtRiskCriteria || []}
          onChange={updateDVTRisk}
          calcResult={calcDVTRisk}
        />
      </div>

      {/* MNA-SF Nutritional Assessment */}
      <SectionTitle>Nutritional Assessment (MNA-SF)</SectionTitle>
      <div className="flex items-center justify-between mb-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
        <span className="text-sm font-semibold text-slate-700">MNA-SF Total Score</span>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-slate-800">{mnaScore} / 14</span>
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold', mnaColor)}>{form.mnaResult}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MNAScoreSelector label="A. Food intake decline in past 3 months" options={MNA_FOOD} value={form.mnaFoodIntakeDecline ?? 2} onChange={v => updateMNA('mnaFoodIntakeDecline', v)} />
        <MNAScoreSelector label="B. Weight loss in past 3 months" options={MNA_WEIGHT} value={form.mnaWeightLoss ?? 3} onChange={v => updateMNA('mnaWeightLoss', v)} />
        <MNAScoreSelector label="C. Mobility" options={MNA_MOBILITY} value={form.mnaMobility ?? 2} onChange={v => updateMNA('mnaMobility', v)} />
        <div>
          <div className="text-xs font-semibold text-slate-600 mb-1">D. Acute disease/stress in past 3 months</div>
          <div className="space-y-1">
            {[{ value: 0, label: '0 – Yes' }, { value: 2, label: '2 – No' }].map(o => (
              <label key={o.value} className={cn('flex items-center gap-2 px-2 py-1.5 rounded-lg border text-xs cursor-pointer transition-colors',
                (form.mnaAcuteDisease ?? 0) === o.value ? 'bg-teal-50 border-teal-300 text-teal-800' : 'border-slate-200 text-slate-600')}>
                <input type="radio" name="mnaAcute" checked={(form.mnaAcuteDisease ?? 0) === o.value} onChange={() => updateMNA('mnaAcuteDisease', o.value)} className="accent-teal-500" />
                {o.label}
              </label>
            ))}
          </div>
        </div>
        <MNAScoreSelector label="E. Neuropsychological problems" options={MNA_PSYCH} value={form.mnaNeuropsychological ?? 2} onChange={v => updateMNA('mnaNeuropsychological', v)} />
        <MNAScoreSelector label="F. BMI / Calf circumference" options={MNA_BMI} value={form.mnaBodyHabitus ?? 3} onChange={v => updateMNA('mnaBodyHabitus', v)} />
      </div>

      {/* Skin */}
      <SectionTitle>Skin Assessment</SectionTitle>
      <FormGroup label="Skin Condition">
        <FormTextarea value={form.skinCondition} onChange={v => setF('skinCondition', v)} placeholder="Skin integrity, pressure areas, wounds..." rows={2} />
      </FormGroup>

      {/* Notes */}
      <SectionTitle>Notes</SectionTitle>
      <FormGroup label="Nursing Notes">
        <FormTextarea value={form.notes} onChange={v => setF('notes', v)} placeholder="General nursing notes for this assessment..." rows={3} />
      </FormGroup>

      <SectionTitle>Interventions</SectionTitle>
      <FormGroup label="Nursing Interventions">
        <FormTextarea value={form.interventions} onChange={v => setF('interventions', v)} placeholder="Interventions performed..." rows={3} />
      </FormGroup>

      <SectionTitle>Nurse Signature</SectionTitle>
      <FormGroup label="Nurse Name / Signature">
        <FormInput value={form.nurseSignature} onChange={v => setF('nurseSignature', v)} placeholder="Nurse's name" />
      </FormGroup>
    </div>
  );
}

// ---- Record View ----
function RecordView({ record, onBack, onEdit }: { record: NursingAssessment; onBack: () => void; onEdit: (r: NursingAssessment) => void }) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <SoftButton onClick={onBack} size="sm">← Back</SoftButton>
        <h3 className="font-bold text-slate-800">Assessment — {formatDate(record.date)} {record.time}</h3>
        <div className="ml-auto flex gap-2">
          <SoftButton onClick={() => onEdit(record)} size="sm"><Edit2 size={12} /> Edit</SoftButton>
          <SoftButton onClick={() => window.print()} size="sm">🖨 Print</SoftButton>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <StatusBadge status={record.status} />
          <span className="text-sm text-slate-600">{record.date} {record.time} {record.arrivalTime ? `· Arrived: ${record.arrivalTime}` : ''}</span>
          <span className="text-sm text-slate-600 ml-auto">By: {record.nurseName || 'Demo Nurse'}</span>
        </div>

        {record.allergyStatus && record.allergyStatus !== 'NKDA' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <div className="text-xs font-bold uppercase text-red-500 mb-1">⚠ Allergy Alert</div>
            <p className="text-sm text-red-800"><b>{record.allergyStatus}</b>{record.allergyDetails ? `: ${record.allergyDetails}` : ''}</p>
          </div>
        )}

        {record.contactPersonName && (
          <div>
            <div className="text-xs font-bold uppercase text-slate-400 mb-1">Contact Person</div>
            <p className="text-sm text-slate-700">{record.contactPersonName} ({record.contactPersonRelationship}) — {record.contactPersonPhone}</p>
            {record.patientUncomfortable && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Patient uncomfortable sharing info with attendant</span>}
          </div>
        )}

        {record.chiefComplaints && (
          <div>
            <div className="text-xs font-bold uppercase text-slate-400 mb-1">Chief Complaints</div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{record.chiefComplaints}</p>
            {(record.painIntensity || record.painDuration || record.painActionTaken) && (
              <div className="flex gap-4 text-xs text-slate-600 mt-1.5 p-2 bg-slate-50 rounded-lg flex-wrap">
                {record.painIntensity && <span><b>Intensity:</b> {record.painIntensity}</span>}
                {record.painDuration && <span><b>Duration:</b> {record.painDuration}</span>}
                {record.painActionTaken && <span><b>Action Taken:</b> {record.painActionTaken}</span>}
              </div>
            )}
          </div>
        )}
        {record.pastHistory && <ViewSection title="Past History" value={record.pastHistory} />}

        <div>
          <div className="text-xs font-bold uppercase text-slate-400 mb-2">Vital Signs</div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {[
              ['Temp', `${record.tempF}°F`], ['Pulse', `${record.pulse} bpm`],
              ['BP', `${record.bpSys}/${record.bpDia}`], ['SpO₂', `${record.spo2}%`],
              ['RR', `${record.rr}/min`], ['Weight', `${record.weightKg} kg`],
              ...(record.heightCm ? [['Height', `${record.heightCm} cm`] as [string, string]] : []),
              ['GCS', `${record.gcs}/15`],
            ].map(([l, v]) => (
              <div key={l} className="bg-slate-50 rounded-lg p-2 text-center">
                <div className="text-xs text-slate-400 uppercase">{l}</div>
                <div className="text-sm font-bold text-slate-800">{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs font-bold uppercase text-slate-400 mb-2">Risk Assessment</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'Fall Risk', score: record.fallRiskScore, level: record.fallRiskLevel, criteria: record.fallRiskCriteria },
              { label: 'Pressure Ulcer Risk', score: record.pressureUlcerRiskScore || 0, level: record.pressureUlcerRisk || 'Low', criteria: record.pressureUlcerRiskCriteria },
              { label: 'DVT Risk', score: record.dvtRiskScore || 0, level: record.dvtRisk || 'Low', criteria: record.dvtRiskCriteria },
            ].map(r => {
              const lc = r.level === 'High' ? 'text-red-700' : r.level === 'Moderate' ? 'text-amber-700' : 'text-green-700';
              return (
                <div key={r.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="text-xs text-slate-400 uppercase mb-1">{r.label}</div>
                  <div className={`text-sm font-bold ${lc}`}>Score: {r.score} — {r.level}</div>
                  {r.criteria && r.criteria.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {r.criteria.map(c => <li key={c} className="text-xs text-slate-600">• {c}</li>)}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {record.mnaTotalScore !== undefined && (
          <div>
            <div className="text-xs font-bold uppercase text-slate-400 mb-1">Nutritional Assessment (MNA-SF)</div>
            <p className="text-sm text-slate-700">Score: <b>{record.mnaTotalScore}/14</b> — {record.mnaResult}</p>
          </div>
        )}

        {record.skinCondition && <ViewSection title="Skin Condition" value={record.skinCondition} />}
        {record.notes && <ViewSection title="Nursing Notes" value={record.notes} />}
        {record.interventions && <ViewSection title="Interventions" value={record.interventions} />}
      </div>
    </div>
  );
}

function ViewSection({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-bold uppercase text-slate-400 mb-1">{title}</div>
      <p className="text-sm text-slate-700 whitespace-pre-wrap">{value}</p>
    </div>
  );
}
