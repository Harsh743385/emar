'use client';

import { useState } from 'react';
import { useEMR } from '@/context/EMRContext';
import { generateId, nowDateStr, nowTimeStr } from '@/lib/store';
import { getShiftFromTime } from '@/lib/utils';
import {
  FormDrawer, FormGroup, FormInput, FormSelect, FormTextarea,
  SectionTitle, StatusBadge, EmptyState, CardHeader, TealButton, SoftButton, YesNoToggle
} from '@/components/FormDrawer';
import { Plus, Eye, Edit2, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NursingAssessment, PastMedicationEntry } from '@/lib/types';

interface NursingAssessmentTabProps {
  type: 'initial' | 'reassessment' | 'final';
}

const TITLES = {
  initial: 'Initial Nursing Assessment',
  reassessment: 'Nursing Reassessment',
  final: 'Final Assessment',
};

// ---- Clinical Action Taken Dropdown Options ----
const ACTION_TAKEN_OPTIONS = [
  '',
  'Analgesic Administered as Prescribed',
  'Repositioned / Position Changed',
  'Ice / Cold Compress Applied',
  'Warm Compress Applied',
  'Treating Doctor / Consultant Informed',
  'Non-Pharmacological Comfort / Breathing',
  'Vital Signs Monitored & Rechecked',
  'Dressing / Wound Care Checked',
  'Splint / Support Provided',
  'Reassessed after 30 Minutes',
  'Other (Specify in notes)',
];

// ---- Pain Expression Checkboxes ----
const PAIN_EXPRESSIONS = [
  'Relaxed / Calm',
  'Frowning / Furrowed brow',
  'Grimacing',
  'Clenched teeth / Jaw tightening',
  'Tearful / Crying',
  'Guarding / Protective posture',
  'Restless / Moaning',
];


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
    // Past medications history
    pastMedications: [],
    // Vitals
    tempF: 98.6,
    pulse: 72,
    bpSys: 120,
    bpDia: 80,
    spo2: 98,
    rr: 16,
    weightKg: 0,
    chiefComplaints: '',
    // Pain Assessment fields
    painScore: 0,
    painType: 'Acute',
    painIntensity: '',
    painDuration: '',
    painActionTaken: '',
    painLocation: '',
    painExpressions: [],
    // Patient Counseling
    patientCounselingTopics: [],
    counseledBy: '',
    counseledTo: 'Patient',
    counselingUnderstood: true,
    counselingNotes: '',
    // Initial Mental Health Assessment
    mentalAppearanceBehavior: 'Calm & Cooperative',
    mentalMoodAffect: 'Normal / Euthymic',
    mentalOrientation: true,
    mentalMemory: 'Intact',
    mentalSleepPattern: 'Normal',
    mentalSpeechThought: 'Coherent & Clear',
    mentalSuicidalRisk: 'None',
    mentalSubstanceHistory: 'None',
    mentalNotes: '',
    // Risk — criteria-driven
    fallRiskCriteria: [],
    fallRiskScore: 0,
    fallRiskLevel: 'Low',
    pressureUlcerRiskCriteria: [],
    pressureUlcerRiskScore: 0,
    pressureUlcerRisk: 'Low',
    dvtRiskCriteria: [],
    dvtRiskScore: 0,
    dvtRisk: 'Low',
    // Previous risk comparison (in Reassessment)
    previousFallRiskScore: 0,
    previousFallRiskLevel: '',
    previousPressureUlcerScore: 0,
    previousPressureUlcerRisk: '',
    previousDVTScore: 0,
    previousDVTRisk: '',
    previousRiskAssessedDate: '',
    // MNA (Initial only)
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

  // Find previous assessment for this patient to show in Reassessment
  const priorAssessment = allRecords.slice(-1)[0];

  function openNew() {
    const base = defaultForm();

    // If Reassessment, carry baseline / previous risk info so staff know previous risk
    if (type === 'reassessment' && priorAssessment) {
      base.previousFallRiskScore = priorAssessment.fallRiskScore;
      base.previousFallRiskLevel = priorAssessment.fallRiskLevel;
      base.previousPressureUlcerScore = priorAssessment.pressureUlcerRiskScore ?? 0;
      base.previousPressureUlcerRisk = priorAssessment.pressureUlcerRisk ?? 'Low';
      base.previousDVTScore = priorAssessment.dvtRiskScore ?? 0;
      base.previousDVTRisk = priorAssessment.dvtRisk ?? 'Low';
      base.previousRiskAssessedDate = `${priorAssessment.date} ${priorAssessment.time} (${priorAssessment.nurseName || 'Nurse'})`;
      // By default pre-populate with previous criteria so staff can easily reassess
      base.fallRiskCriteria = [...(priorAssessment.fallRiskCriteria || [])];
      base.fallRiskScore = priorAssessment.fallRiskScore;
      base.fallRiskLevel = priorAssessment.fallRiskLevel;
      base.pressureUlcerRiskCriteria = [...(priorAssessment.pressureUlcerRiskCriteria || [])];
      base.pressureUlcerRiskScore = priorAssessment.pressureUlcerRiskScore ?? 0;
      base.pressureUlcerRisk = priorAssessment.pressureUlcerRisk ?? 'Low';
      base.dvtRiskCriteria = [...(priorAssessment.dvtRiskCriteria || [])];
      base.dvtRiskScore = priorAssessment.dvtRiskScore ?? 0;
      base.dvtRisk = priorAssessment.dvtRisk ?? 'Low';
    }

    // Seamlessly integrate existing Nutritional Assessment (only for initial)
    if (type === 'initial') {
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
      pastMedications: record.pastMedications || [],
      tempF: record.tempF, pulse: record.pulse,
      bpSys: record.bpSys, bpDia: record.bpDia,
      spo2: record.spo2, rr: record.rr, weightKg: record.weightKg,
      chiefComplaints: record.chiefComplaints,
      // Pain
      painScore: record.painScore ?? 0,
      painType: record.painType || 'Acute',
      painIntensity: record.painIntensity || '',
      painDuration: record.painDuration || '',
      painActionTaken: record.painActionTaken || '',
      painLocation: record.painLocation || '',
      painExpressions: record.painExpressions || [],
      // Counseling
      patientCounselingTopics: record.patientCounselingTopics || [],
      counseledBy: record.counseledBy || '',
      counseledTo: record.counseledTo || 'Patient',
      counselingUnderstood: record.counselingUnderstood ?? true,
      counselingNotes: record.counselingNotes || '',
      // Mental Health
      mentalAppearanceBehavior: record.mentalAppearanceBehavior || 'Calm & Cooperative',
      mentalMoodAffect: record.mentalMoodAffect || 'Normal / Euthymic',
      mentalOrientation: record.mentalOrientation ?? true,
      mentalMemory: record.mentalMemory || 'Intact',
      mentalSleepPattern: record.mentalSleepPattern || 'Normal',
      mentalSpeechThought: record.mentalSpeechThought || 'Coherent & Clear',
      mentalSuicidalRisk: record.mentalSuicidalRisk || 'None',
      mentalSubstanceHistory: record.mentalSubstanceHistory || 'None',
      mentalNotes: record.mentalNotes || '',
      // Risks
      fallRiskCriteria: record.fallRiskCriteria || [],
      fallRiskScore: record.fallRiskScore,
      fallRiskLevel: record.fallRiskLevel,
      pressureUlcerRiskCriteria: record.pressureUlcerRiskCriteria || [],
      pressureUlcerRiskScore: record.pressureUlcerRiskScore || 0,
      pressureUlcerRisk: record.pressureUlcerRisk || 'Low',
      dvtRiskCriteria: record.dvtRiskCriteria || [],
      dvtRiskScore: record.dvtRiskScore || 0,
      dvtRisk: record.dvtRisk || 'Low',
      // Previous risk
      previousFallRiskScore: record.previousFallRiskScore ?? 0,
      previousFallRiskLevel: record.previousFallRiskLevel || '',
      previousPressureUlcerScore: record.previousPressureUlcerScore ?? 0,
      previousPressureUlcerRisk: record.previousPressureUlcerRisk || '',
      previousDVTScore: record.previousDVTScore ?? 0,
      previousDVTRisk: record.previousDVTRisk || '',
      previousRiskAssessedDate: record.previousRiskAssessedDate || '',
      // MNA
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
    return <RecordView record={viewRecord} onBack={() => setViewRecord(null)} onEdit={openEdit} type={type} />;
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
        <AssessmentForm form={form} setF={setF} type={type} priorAssessment={priorAssessment} />
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
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <span className="font-semibold text-sm text-slate-800">{record.time}{record.arrivalTime ? ` (Arrival: ${record.arrivalTime})` : ''}</span>
          <StatusBadge status={record.status} />
          {record.painScore > 0 && (
            <span className={cn("text-xs px-2.5 py-0.5 rounded-full font-bold",
              record.painScore >= 7 ? "bg-red-100 text-red-700" :
              record.painScore >= 4 ? "bg-amber-100 text-amber-700" : "bg-yellow-100 text-yellow-800"
            )}>
              Pain: {record.painScore}/10 ({record.painType || 'Acute'}{record.painIntensity ? ` · ${record.painIntensity}` : ''})
            </span>
          )}
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
          </div>
        )}
        {record.painActionTaken && (
          <div className="text-xs text-teal-700 mt-1">
            <b>Action Taken:</b> {record.painActionTaken}
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
            selected.includes(c.label) ? 'bg-teal-50 border-teal-300 text-teal-800' : 'border-slate-200 text-slate-600 bg-white')}>
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
            value === o.value ? 'bg-teal-50 border-teal-300 text-teal-800' : 'border-slate-200 text-slate-600 bg-white')}>
            <input type="radio" name={label} checked={value === o.value} onChange={() => onChange(o.value)} className="accent-teal-500" />
            {o.label}
          </label>
        ))}
      </div>
    </div>
  );
}

// ---- Pain Assessment Component (Reused in Initial and at top of Reassessment) ----
function PainAssessmentSection({
  form, setF, isTop = false
}: {
  form: FormState;
  setF: SetF;
  isTop?: boolean;
}) {
  function toggleExpression(expr: string) {
    const current = form.painExpressions || [];
    const next = current.includes(expr) ? current.filter(e => e !== expr) : [...current, expr];
    setF('painExpressions', next);
  }

  const painScore = form.painScore ?? 0;
  const painColor = painScore >= 7 ? 'text-red-700 bg-red-100 border-red-300' :
                    painScore >= 4 ? 'text-amber-700 bg-amber-100 border-amber-300' :
                    painScore >= 1 ? 'text-yellow-800 bg-yellow-100 border-yellow-300' :
                    'text-green-700 bg-green-100 border-green-300';

  return (
    <div className={cn("p-4 rounded-xl border transition-all", isTop ? "bg-amber-50/70 border-amber-300 shadow-sm mb-4" : "bg-slate-50 border-slate-200 mb-4")}>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-slate-800">Pain Assessment</span>
          {isTop && <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold uppercase tracking-wider">Top Priority Reassessment</span>}
        </div>
        <div className={cn("px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-2", painColor)}>
          <span>Pain Score: {painScore}/10</span>
          <span>·</span>
          <span>{painScore === 0 ? 'No Pain' : painScore <= 3 ? 'Mild' : painScore <= 6 ? 'Moderate' : 'Severe'}</span>
        </div>
      </div>

      {/* Pain Score Buttons (0 to 10) */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
          <span>0 (No Pain)</span>
          <span>5 (Moderate)</span>
          <span>10 (Worst Pain)</span>
        </div>
        <div className="grid grid-cols-11 gap-1">
          {Array.from({ length: 11 }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setF('painScore', i);
                if (!form.painIntensity || form.painIntensity === '') {
                  setF('painIntensity', i === 0 ? '' : i <= 3 ? 'Mild' : i <= 6 ? 'Moderate' : i <= 8 ? 'Severe' : 'Very Severe');
                }
              }}
              className={cn(
                "h-8 rounded-lg text-xs font-bold transition-all text-center",
                painScore === i
                  ? "bg-teal-600 text-white shadow-md scale-105"
                  : "bg-white border border-slate-200 text-slate-700 hover:border-teal-400"
              )}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      {/* Pain Type: Acute or Chronic & Intensity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Pain Type</label>
          <div className="grid grid-cols-2 gap-2">
            {(['Acute', 'Chronic'] as const).map(pt => (
              <button
                key={pt}
                type="button"
                onClick={() => setF('painType', pt)}
                className={cn(
                  "py-2 px-3 rounded-lg border text-xs font-bold transition-all text-center",
                  (form.painType || 'Acute') === pt
                    ? "bg-teal-600 border-teal-600 text-white shadow-sm"
                    : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                )}
              >
                {pt} Pain
              </button>
            ))}
          </div>
        </div>

        <FormGroup label="Pain Intensity">
          <FormSelect
            value={form.painIntensity || ''}
            onChange={v => setF('painIntensity', v)}
            options={['', 'Mild', 'Moderate', 'Severe', 'Very Severe']}
          />
        </FormGroup>
      </div>

      {/* Location, Duration, and Action Taken Dropdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <FormGroup label="Pain Location">
          <FormInput
            value={form.painLocation || ''}
            onChange={v => setF('painLocation', v)}
            placeholder="e.g. Abdomen, surgical wound, head"
          />
        </FormGroup>
        <FormGroup label="Duration">
          <FormInput
            value={form.painDuration || ''}
            onChange={v => setF('painDuration', v)}
            placeholder="e.g. 2 hours, 3 days"
          />
        </FormGroup>
        <FormGroup label="Action Taken (Dropdown)">
          <FormSelect
            value={form.painActionTaken || ''}
            onChange={v => setF('painActionTaken', v)}
            options={ACTION_TAKEN_OPTIONS}
          />
        </FormGroup>
      </div>

      {/* Expression Checkboxes */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Expression Checkboxes (Facial / Behavioral Signs)</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PAIN_EXPRESSIONS.map(expr => {
            const isChecked = (form.painExpressions || []).includes(expr);
            return (
              <label
                key={expr}
                className={cn(
                  "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition-colors",
                  isChecked ? "bg-teal-50 border-teal-300 text-teal-800 font-semibold" : "border-slate-200 text-slate-600 bg-white"
                )}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleExpression(expr)}
                  className="w-3.5 h-3.5 accent-teal-600 rounded"
                />
                <span className="truncate">{expr}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AssessmentForm({ form, setF, type, priorAssessment }: {
  form: FormState;
  setF: SetF;
  type: 'initial' | 'reassessment' | 'final';
  priorAssessment?: NursingAssessment;
}) {
  const isInitial = type === 'initial';
  const isReassessment = type === 'reassessment';

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
    <div className="space-y-3">
      {/* General Information */}
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

      {/* REASSESSMENT REQUIREMENT: In reassessment, change position of pain score and intensity to TOP */}
      {isReassessment && (
        <>
          <PainAssessmentSection form={form} setF={setF} isTop={true} />
        </>
      )}

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
          <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
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
            <FormTextarea value={form.pastHistory || ''} onChange={v => setF('pastHistory', v)} placeholder="Previous conditions, surgeries, hospitalizations..." rows={2} />
          </FormGroup>

          {/* Past Medications History (Initial Assessment) */}
          <SectionTitle>Past Medications History</SectionTitle>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            {(form.pastMedications || []).length === 0 ? (
              <p className="text-xs text-slate-500 italic py-1">No past medications added yet.</p>
            ) : (
              <div className="space-y-2">
                {(form.pastMedications || []).map((med, idx) => (
                  <div key={med.id || idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-lg border border-slate-200">
                    <input
                      type="text"
                      placeholder="Medicine Name"
                      value={med.medicineName}
                      onChange={e => {
                        const updated = [...(form.pastMedications || [])];
                        updated[idx] = { ...updated[idx], medicineName: e.target.value };
                        setF('pastMedications', updated);
                      }}
                      className="sm:col-span-4 px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-400"
                    />
                    <input
                      type="text"
                      placeholder="Dose"
                      value={med.dosage}
                      onChange={e => {
                        const updated = [...(form.pastMedications || [])];
                        updated[idx] = { ...updated[idx], dosage: e.target.value };
                        setF('pastMedications', updated);
                      }}
                      className="sm:col-span-2 px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-400"
                    />
                    <input
                      type="text"
                      placeholder="Freq"
                      value={med.frequency}
                      onChange={e => {
                        const updated = [...(form.pastMedications || [])];
                        updated[idx] = { ...updated[idx], frequency: e.target.value };
                        setF('pastMedications', updated);
                      }}
                      className="sm:col-span-2 px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-400"
                    />
                    <input
                      type="text"
                      placeholder="Reason / Indication"
                      value={med.indication}
                      onChange={e => {
                        const updated = [...(form.pastMedications || [])];
                        updated[idx] = { ...updated[idx], indication: e.target.value };
                        setF('pastMedications', updated);
                      }}
                      className="sm:col-span-3 px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-400"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (form.pastMedications || []).filter((_, i) => i !== idx);
                        setF('pastMedications', updated);
                      }}
                      className="sm:col-span-1 text-xs text-red-500 hover:text-red-700 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                const newMed: PastMedicationEntry = {
                  id: generateId(),
                  medicineName: '',
                  dosage: '',
                  frequency: 'OD',
                  route: 'Oral',
                  duration: '',
                  indication: '',
                };
                setF('pastMedications', [...(form.pastMedications || []), newMed]);
              }}
              className="text-xs px-3 py-1.5 border border-dashed border-teal-400 text-teal-700 bg-teal-50/60 rounded-lg hover:bg-teal-100 font-medium transition-colors"
            >
              + Add Past Medication
            </button>
          </div>
        </>
      )}

      {/* Chief Complaints */}
      <SectionTitle>Chief Complaints</SectionTitle>
      <FormGroup label="Chief Complaints">
        <FormTextarea value={form.chiefComplaints} onChange={v => setF('chiefComplaints', v)} placeholder="Patient's chief complaints..." rows={2} />
      </FormGroup>

      {/* PAIN ASSESSMENT SECTION (Shown here for Initial, or for Reassessment if not at top) */}
      {!isReassessment && (
        <PainAssessmentSection form={form} setF={setF} isTop={false} />
      )}

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
        <FormGroup label="Consciousness">
          <FormSelect value={form.levelOfConsciousness} onChange={v => setF('levelOfConsciousness', v)} options={['Alert', 'Verbal', 'Pain', 'Unresponsive', 'Sedated', 'Confused']} />
        </FormGroup>
      </div>

      {/* Initial Mental Health Assessment — Only for Initial */}
      {isInitial && (
        <>
          <SectionTitle>Initial Mental Health Assessment</SectionTitle>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormGroup label="General Appearance & Behavior">
                <FormSelect
                  value={form.mentalAppearanceBehavior || 'Calm & Cooperative'}
                  onChange={v => setF('mentalAppearanceBehavior', v)}
                  options={['Calm & Cooperative', 'Restless / Fidgety', 'Agitated', 'Withdrawn', 'Anxious', 'Aggressive']}
                />
              </FormGroup>
              <FormGroup label="Mood & Affect">
                <FormSelect
                  value={form.mentalMoodAffect || 'Normal / Euthymic'}
                  onChange={v => setF('mentalMoodAffect', v)}
                  options={['Normal / Euthymic', 'Depressed / Sad', 'Anxious / Fearful', 'Irritable', 'Labile (Fluctuating)', 'Flat / Blunted']}
                />
              </FormGroup>
              <div className="flex flex-col justify-end">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Orientation (Time, Place, Person)</label>
                <div className="flex items-center gap-2 h-10">
                  <YesNoToggle value={form.mentalOrientation ?? true} onChange={v => setF('mentalOrientation', v)} />
                  <span className="text-xs text-slate-600">{form.mentalOrientation ? 'Oriented' : 'Disoriented'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormGroup label="Memory">
                <FormSelect
                  value={form.mentalMemory || 'Intact'}
                  onChange={v => setF('mentalMemory', v)}
                  options={['Intact', 'Impaired (Recent)', 'Impaired (Remote)', 'Generalized Confusion']}
                />
              </FormGroup>
              <FormGroup label="Sleep Pattern">
                <FormSelect
                  value={form.mentalSleepPattern || 'Normal'}
                  onChange={v => setF('mentalSleepPattern', v)}
                  options={['Normal', 'Insomnia / Difficulty sleeping', 'Disturbed / Intermittent', 'Excessive Daytime Somnolence']}
                />
              </FormGroup>
              <FormGroup label="Thought & Speech">
                <FormSelect
                  value={form.mentalSpeechThought || 'Coherent & Clear'}
                  onChange={v => setF('mentalSpeechThought', v)}
                  options={['Coherent & Clear', 'Slow / Retarded', 'Rapid / Pressured', 'Confused', 'Irrelevant / Incoherent']}
                />
              </FormGroup>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormGroup label="Suicidal Ideation / Self-Harm Risk">
                <FormSelect
                  value={form.mentalSuicidalRisk || 'None'}
                  onChange={v => setF('mentalSuicidalRisk', v)}
                  options={['None', 'Low Risk', 'Moderate Risk', 'High Risk (Doctor notified immediately)']}
                />
              </FormGroup>
              <FormGroup label="Past Psychiatric / Substance History">
                <FormSelect
                  value={form.mentalSubstanceHistory || 'None'}
                  onChange={v => setF('mentalSubstanceHistory', v)}
                  options={['None', 'Depression / Anxiety History', 'Substance / Alcohol Dependency', 'Psychiatric Medication History', 'Other']}
                />
              </FormGroup>
            </div>
            <FormGroup label="Mental Health Observations / Remarks">
              <FormTextarea
                value={form.mentalNotes || ''}
                onChange={v => setF('mentalNotes', v)}
                placeholder="Psychological observation, behavioral notes..."
                rows={2}
              />
            </FormGroup>
          </div>
        </>
      )}

      {/* REASSESSMENT REQUIREMENT: In every reassessment, staff should know previous risk assessment */}
      {isReassessment && (
        <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-xl">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle size={15} className="text-indigo-700" />
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                Previous Risk Assessment (Baseline for Reassessment)
              </span>
            </div>
            {form.previousRiskAssessedDate && (
              <span className="text-xs text-indigo-600 font-medium">Assessed: {form.previousRiskAssessedDate}</span>
            )}
            {priorAssessment && (
              <button
                type="button"
                onClick={() => {
                  setF('fallRiskCriteria', priorAssessment.fallRiskCriteria || []);
                  setF('fallRiskScore', priorAssessment.fallRiskScore || 0);
                  setF('fallRiskLevel', priorAssessment.fallRiskLevel || 'Low');
                  setF('pressureUlcerRiskCriteria', priorAssessment.pressureUlcerRiskCriteria || []);
                  setF('pressureUlcerRiskScore', priorAssessment.pressureUlcerRiskScore || 0);
                  setF('pressureUlcerRisk', priorAssessment.pressureUlcerRisk || 'Low');
                  setF('dvtRiskCriteria', priorAssessment.dvtRiskCriteria || []);
                  setF('dvtRiskScore', priorAssessment.dvtRiskScore || 0);
                  setF('dvtRisk', priorAssessment.dvtRisk || 'Low');
                }}
                className="text-xs px-2.5 py-1 bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-100 rounded-lg font-semibold transition-colors"
              >
                📋 Carry Forward Previous Criteria
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="bg-white p-2 rounded-lg border border-indigo-100">
              <div className="text-slate-500 font-medium">Previous Fall Risk:</div>
              <div className="font-bold text-slate-800">
                Score {form.previousFallRiskScore ?? 0} — {form.previousFallRiskLevel || 'Low'} Risk
              </div>
            </div>
            <div className="bg-white p-2 rounded-lg border border-indigo-100">
              <div className="text-slate-500 font-medium">Previous Pressure Ulcer Risk:</div>
              <div className="font-bold text-slate-800">
                Score {form.previousPressureUlcerScore ?? 0} — {form.previousPressureUlcerRisk || 'Low'} Risk
              </div>
            </div>
            <div className="bg-white p-2 rounded-lg border border-indigo-100">
              <div className="text-slate-500 font-medium">Previous DVT Risk:</div>
              <div className="font-bold text-slate-800">
                Score {form.previousDVTScore ?? 0} — {form.previousDVTRisk || 'Low'} Risk
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Risk Assessment — criteria-driven */}
      <SectionTitle>{isReassessment ? 'Reassessed Risk Assessment' : 'Risk Assessment'}</SectionTitle>
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

      {/* REASSESSMENT REQUIREMENT: Remove nutrition assessment in reassessment! Only rendered on Initial Assessment */}
      {isInitial && (
        <>
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
                    (form.mnaAcuteDisease ?? 0) === o.value ? 'bg-teal-50 border-teal-300 text-teal-800' : 'border-slate-200 text-slate-600 bg-white')}>
                    <input type="radio" name="mnaAcute" checked={(form.mnaAcuteDisease ?? 0) === o.value} onChange={() => updateMNA('mnaAcuteDisease', o.value)} className="accent-teal-500" />
                    {o.label}
                  </label>
                ))}
              </div>
            </div>
            <MNAScoreSelector label="E. Neuropsychological problems" options={MNA_PSYCH} value={form.mnaNeuropsychological ?? 2} onChange={v => updateMNA('mnaNeuropsychological', v)} />
            <MNAScoreSelector label="F. BMI / Calf circumference" options={MNA_BMI} value={form.mnaBodyHabitus ?? 3} onChange={v => updateMNA('mnaBodyHabitus', v)} />
          </div>
        </>
      )}

      {/* Skin */}
      <SectionTitle>Skin Assessment</SectionTitle>
      <FormGroup label="Skin Condition">
        <FormTextarea value={form.skinCondition} onChange={v => setF('skinCondition', v)} placeholder="Skin integrity, pressure areas, wounds..." rows={2} />
      </FormGroup>

      {/* Notes */}
      <SectionTitle>Notes</SectionTitle>
      <FormGroup label="Nursing Notes">
        <FormTextarea value={form.notes} onChange={v => setF('notes', v)} placeholder="General nursing notes for this assessment..." rows={2} />
      </FormGroup>

      <SectionTitle>Interventions</SectionTitle>
      <FormGroup label="Nursing Interventions">
        <FormTextarea value={form.interventions} onChange={v => setF('interventions', v)} placeholder="Interventions performed..." rows={2} />
      </FormGroup>

      <SectionTitle>Nurse Signature</SectionTitle>
      <FormGroup label="Nurse Name / Signature">
        <FormInput value={form.nurseSignature} onChange={v => setF('nurseSignature', v)} placeholder="Nurse's name" />
      </FormGroup>
    </div>
  );
}

// ---- Record View ----
function RecordView({ record, onBack, onEdit, type }: {
  record: NursingAssessment;
  onBack: () => void;
  onEdit: (r: NursingAssessment) => void;
  type: 'initial' | 'reassessment' | 'final';
}) {
  const isInitial = type === 'initial';
  const isReassessment = type === 'reassessment';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <SoftButton onClick={onBack} size="sm">← Back</SoftButton>
        <h3 className="font-bold text-slate-800">{TITLES[type]} — {formatDate(record.date)} {record.time}</h3>
        <div className="ml-auto flex gap-2">
          <SoftButton onClick={() => onEdit(record)} size="sm"><Edit2 size={12} /> Edit</SoftButton>
          <SoftButton onClick={() => window.print()} size="sm">🖨 Print</SoftButton>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 flex-wrap">
          <StatusBadge status={record.status} />
          <span className="text-sm text-slate-600">{record.date} {record.time} {record.arrivalTime ? `· Arrived: ${record.arrivalTime}` : ''}</span>
          <span className="text-sm text-slate-600 ml-auto">By: {record.nurseName || 'Demo Nurse'}</span>
        </div>

        {/* Priority Pain Summary at Top for Reassessment */}
        {record.painScore > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900">Pain Assessment</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900">Score: {record.painScore}/10</span>
            </div>
            <div className="text-xs text-slate-700 flex flex-wrap gap-x-4 gap-y-1">
              <span><b>Type:</b> {record.painType || 'Acute'} Pain</span>
              {record.painIntensity && <span><b>Intensity:</b> {record.painIntensity}</span>}
              {record.painLocation && <span><b>Location:</b> {record.painLocation}</span>}
              {record.painDuration && <span><b>Duration:</b> {record.painDuration}</span>}
              {record.painActionTaken && <span><b>Action:</b> {record.painActionTaken}</span>}
            </div>
            {record.painExpressions && record.painExpressions.length > 0 && (
              <div className="mt-2 flex gap-1 flex-wrap">
                {record.painExpressions.map(e => (
                  <span key={e} className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">✓ {e}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {record.allergyStatus && record.allergyStatus !== 'NKDA' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <div className="text-xs font-bold uppercase text-red-500 mb-1">⚠ Allergy Alert</div>
            <p className="text-sm text-red-800"><b>{record.allergyStatus}</b>{record.allergyDetails ? `: ${record.allergyDetails}` : ''}</p>
          </div>
        )}

        {isInitial && record.contactPersonName && (
          <div>
            <div className="text-xs font-bold uppercase text-slate-400 mb-1">Contact Person</div>
            <p className="text-sm text-slate-700">{record.contactPersonName} ({record.contactPersonRelationship}) — {record.contactPersonPhone}</p>
            {record.patientUncomfortable && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Patient uncomfortable sharing info with attendant</span>}
          </div>
        )}

        {isInitial && record.pastMedications && record.pastMedications.length > 0 && (
          <div>
            <div className="text-xs font-bold uppercase text-slate-400 mb-1">Past Medications History</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="bg-slate-50 text-slate-500"><th className="p-1.5 text-left">Medicine</th><th className="p-1.5 text-left">Dose</th><th className="p-1.5 text-left">Freq</th><th className="p-1.5 text-left">Indication</th></tr></thead>
                <tbody>
                  {record.pastMedications.map(m => (
                    <tr key={m.id} className="border-t border-slate-100">
                      <td className="p-1.5 font-medium">{m.medicineName}</td>
                      <td className="p-1.5">{m.dosage}</td>
                      <td className="p-1.5">{m.frequency}</td>
                      <td className="p-1.5">{m.indication}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {record.chiefComplaints && (
          <div>
            <div className="text-xs font-bold uppercase text-slate-400 mb-1">Chief Complaints</div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{record.chiefComplaints}</p>
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

        {/* Previous Risk in Reassessment View */}
        {isReassessment && record.previousFallRiskLevel && (
          <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl">
            <div className="text-xs font-bold uppercase text-indigo-900 mb-1">Previous Risk Baseline</div>
            <div className="grid grid-cols-3 gap-2 text-xs text-slate-700">
              <span><b>Fall:</b> Score {record.previousFallRiskScore} ({record.previousFallRiskLevel})</span>
              <span><b>Pressure Ulcer:</b> Score {record.previousPressureUlcerScore} ({record.previousPressureUlcerRisk})</span>
              <span><b>DVT:</b> Score {record.previousDVTScore} ({record.previousDVTRisk})</span>
            </div>
          </div>
        )}

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


        {isInitial && record.mentalAppearanceBehavior && (
          <div>
            <div className="text-xs font-bold uppercase text-slate-400 mb-1">Initial Mental Health Assessment</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <div><span className="text-slate-400">Behavior:</span> <b>{record.mentalAppearanceBehavior}</b></div>
              <div><span className="text-slate-400">Mood:</span> <b>{record.mentalMoodAffect}</b></div>
              <div><span className="text-slate-400">Orientation:</span> <b>{record.mentalOrientation ? 'Oriented' : 'Disoriented'}</b></div>
              <div><span className="text-slate-400">Suicidal Risk:</span> <b>{record.mentalSuicidalRisk || 'None'}</b></div>
            </div>
          </div>
        )}

        {/* Nutrition Assessment ONLY for Initial Assessment */}
        {isInitial && record.mnaTotalScore !== undefined && (
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
