'use client';

import { useState } from 'react';
import { useEMR } from '@/context/EMRContext';
import { generateId, nowDateStr, nowTimeStr } from '@/lib/store';
import { getShiftFromTime } from '@/lib/utils';
import {
  FormDrawer, FormGroup, FormInput, FormSelect, FormTextarea,
  SectionTitle, StatusBadge, EmptyState, CardHeader, TealButton, SoftButton, YesNoToggle
} from '@/components/FormDrawer';
import {
  Plus, Eye, Edit2, Clock, AlertCircle, ShieldAlert, Activity, HeartPulse,
  Zap, ShieldCheck, Check, Sparkles, AlertTriangle, Shield, CheckCircle2, UserCheck,
  TrendingUp, Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NursingAssessment, PastMedicationEntry, ShiftPainLog } from '@/lib/types';

interface NursingAssessmentTabProps {
  type: 'initial' | 'reassessment' | 'final';
}

const TITLES = {
  initial: 'Initial Nursing Assessment',
  reassessment: 'Nursing Re-Assessment',
  final: 'Final Assessment',
};

// ---- Clinical Action Taken Standard Dropdown Options ----
const ACTION_TAKEN_OPTIONS = [
  '',
  'Analgesic Administered as Prescribed',
  'Repositioned / Position Changed',
  'Ice / Cold Compress Applied (15-20 mins)',
  'Warm Compress Applied',
  'Treating Doctor / Consultant Informed',
  'Non-Pharmacological Comfort / Deep Breathing',
  'Vital Signs Monitored & Rechecked',
  'Dressing / Wound Care Checked',
  'Splint / Limb Support Provided',
  'Reassessed after 30 Minutes',
  'Other / Custom Clinical Action',
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

// ---- Pain Location Dropdown Options ----
export const PAIN_LOCATION_OPTIONS = [
  '',
  'Abdomen - Upper / Epigastric',
  'Abdomen - Lower / Pelvic',
  'Surgical Wound / Incision Site',
  'Chest / Retrosternal',
  'Head / Forehead / Migraine',
  'Neck / Cervical Spine',
  'Back - Lumbar / Spine',
  'Right Upper Limb / Arm / Hand',
  'Left Upper Limb / Arm / Hand',
  'Right Lower Limb / Leg / Foot',
  'Left Lower Limb / Leg / Foot',
  'Flank / Renal Angle',
  'Generalized Body Ache',
  'Other (Custom specify)',
];

// ---- Wong-Baker FACES Pain Rating Scale ----
export const WONG_BAKER_FACES = [
  { score: 0, face: '😊', label: 'No Hurt', desc: 'No pain', color: 'text-emerald-600 bg-emerald-50 border-emerald-300 ring-emerald-500' },
  { score: 1, face: '🙂', label: 'Hurts Little Bit', desc: 'Mild', color: 'text-lime-600 bg-lime-50 border-lime-300 ring-lime-500' },
  { score: 2, face: '🙂', label: 'Hurts Little Bit', desc: 'Mild', color: 'text-lime-600 bg-lime-50 border-lime-300 ring-lime-500' },
  { score: 3, face: '😐', label: 'Hurts Little More', desc: 'Mild-Mod', color: 'text-yellow-700 bg-yellow-50 border-yellow-300 ring-yellow-500' },
  { score: 4, face: '😐', label: 'Hurts Little More', desc: 'Moderate', color: 'text-amber-700 bg-amber-50 border-amber-300 ring-amber-500' },
  { score: 5, face: '🙁', label: 'Hurts Even More', desc: 'Moderate', color: 'text-amber-800 bg-amber-100 border-amber-400 ring-amber-600' },
  { score: 6, face: '🙁', label: 'Hurts Even More', desc: 'Mod-Severe', color: 'text-orange-700 bg-orange-50 border-orange-300 ring-orange-500' },
  { score: 7, face: '😣', label: 'Hurts Whole Lot', desc: 'Severe', color: 'text-orange-800 bg-orange-100 border-orange-400 ring-orange-600' },
  { score: 8, face: '😣', label: 'Hurts Whole Lot', desc: 'Very Severe', color: 'text-red-700 bg-red-50 border-red-300 ring-red-500' },
  { score: 9, face: '😭', label: 'Hurts Worst', desc: 'Intense Pain', color: 'text-red-800 bg-red-100 border-red-400 ring-red-600' },
  { score: 10, face: '😭', label: 'Hurts Worst', desc: 'Worst Pain', color: 'text-rose-900 bg-rose-100 border-rose-500 ring-rose-600' },
];

// ---- Vulnerable Patient Criteria (NABH Standard - 13 Identifications from Hospital Poster) ----
export const VULNERABLE_CRITERIA_LIST = [
  { id: 'v1', labelEn: 'Elderly (>65 years) / Children (<12 years)', labelGu: 'વૃદ્ધો > ૬૫ અને બાળકો < ૧૨' },
  { id: 'v2', labelEn: 'Pregnant Woman', labelGu: 'ગર્ભસ્થ સ્ત્રી' },
  { id: 'v3', labelEn: 'Dialysis Patient', labelGu: 'ડાયાલીસ વાળા દર્દી' },
  { id: 'v4', labelEn: 'Mentally Challenged / Psychiatric Condition', labelGu: 'માનસિક રીતે અક્ષમ' },
  { id: 'v5', labelEn: 'Physically Challenged / Physically Disabled / Amputee', labelGu: 'વિકલાંગ અથવા ખોડ ખાંપણ વાળા દર્દી' },
  { id: 'v6', labelEn: 'ICU / CCU Critical Care Patient', labelGu: 'ICU વાળા દર્દી' },
  { id: 'v7', labelEn: 'Chemotherapy & Cancer / Oncology Patient', labelGu: 'કિમોથેરાપી તથા કેન્સરના દર્દી' },
  { id: 'v8', labelEn: 'Patient with Chronic / Long-term Illness', labelGu: 'લાંબા સમય થી બીમારી થી પીડાતા દર્દી' },
  { id: 'v9', labelEn: 'Language Barrier / Communication Impaired', labelGu: 'ભાષા ન સમજી શકતા હોય તેવા દર્દી' },
  { id: 'v10', labelEn: 'Suicide Attempt / Poisoning / MLC Case', labelGu: 'આત્મહત્યા / પોઇસનીંગ વાળા દર્દી' },
  { id: 'v11', labelEn: 'Road Traffic Accident (RTA) / Polytrauma', labelGu: 'રોડ ટ્રાફિક, એક્સિડન્ટ વાળા દર્દી' },
  { id: 'v12', labelEn: 'Unattended / Abandoned / No Attendants', labelGu: 'જેની સાથે કોઈ સગા ન હોય તેવા દર્દી' },
  { id: 'v13', labelEn: 'Sexual Assault / Rape Victim / High Sensitivity', labelGu: 'બળાત્કાર (રેપ) વાળા દર્દી' },
];

// ---- Care Interventions for Vulnerable Patients (from Hospital Poster) ----
export const VULNERABLE_CARE_INTERVENTIONS = [
  { id: 'vi1', labelEn: 'Red ID Alert Band tied on patient wrist', labelGu: 'રેડ ID BAND બાંધીશું', icon: '🔴' },
  { id: 'vi2', labelEn: 'First Priority Care & Immediate Attention allotted', labelGu: 'પ્રથમ પ્રાથમિકતા આપીશું', icon: '⚡' },
  { id: 'vi3', labelEn: 'Fall Prevention vigilance active (Bed rails up, assist on move)', labelGu: 'પડી ન જાય તેનું ધ્યાન રાખીશું', icon: '🛏️' },
  { id: 'vi4', labelEn: 'Room / Bed allotted close to Nursing Station', labelGu: 'નર્સિંગ સ્ટેશન પાસેનો રૂમ / બેડ આપીશું', icon: '🏥' },
  { id: 'vi5', labelEn: 'Dedicated Staff / Attendant kept alongside at all times', labelGu: 'સ્ટાફ / સગાને જોડે રાખીશું', icon: '👥' },
  { id: 'vi6', labelEn: 'Extra Vigilance & Intensive Monitoring (Frequent Rounds)', labelGu: 'વધારે ધ્યાન આપીશું', icon: '👁️' },
  { id: 'vi7', labelEn: 'Hospital Acquired Infection (HAI) Prevention Bundle active', labelGu: 'HAI ન થાય તેની કાળજી રાખીશું', icon: '🧼' },
];

// ---- ADL (Activities of Daily Living) Assessment Criteria ----
export const ADL_ITEMS = [
  {
    key: 'adlBathing',
    label: '1. Bathing & Personal Hygiene',
    options: [
      { value: 0, label: '0 – Independent (Complete self-bath)' },
      { value: 1, label: '1 – Assisted (Needs help for back/feet)' },
      { value: 2, label: '2 – Dependent (Full bed-bath by nurse)' },
    ],
  },
  {
    key: 'adlDressing',
    label: '2. Dressing & Grooming',
    options: [
      { value: 0, label: '0 – Independent (Dresses self completely)' },
      { value: 1, label: '1 – Assisted (Help with buttons/socks)' },
      { value: 2, label: '2 – Dependent (Dressed entirely by nurse)' },
    ],
  },
  {
    key: 'adlToileting',
    label: '3. Toileting',
    options: [
      { value: 0, label: '0 – Independent (Uses commode/toilet)' },
      { value: 1, label: '1 – Assisted (Bedpan/commode support)' },
      { value: 2, label: '2 – Dependent (Diaper/incontinent care)' },
    ],
  },
  {
    key: 'adlTransfer',
    label: '4. Transfer & Bed Mobility',
    options: [
      { value: 0, label: '0 – Independent (Moves in bed/chair)' },
      { value: 1, label: '1 – Assisted (1-person assist to move)' },
      { value: 2, label: '2 – Dependent (Bedridden / 2-person lift)' },
    ],
  },
  {
    key: 'adlFeeding',
    label: '5. Feeding / Eating',
    options: [
      { value: 0, label: '0 – Independent (Eats meal unassisted)' },
      { value: 1, label: '1 – Assisted (Needs feeding help)' },
      { value: 2, label: '2 – Dependent (Fed via Ryle\'s tube / TPN)' },
    ],
  },
  {
    key: 'adlContinence',
    label: '6. Bowel & Bladder Continence',
    options: [
      { value: 0, label: '0 – Fully Continent (Normal control)' },
      { value: 1, label: '1 – Occasional Incontinence' },
      { value: 2, label: '2 – Incontinent / Foley Catheter in situ' },
    ],
  },
];

export function calcADLScore(f: {
  adlBathing?: number; adlDressing?: number; adlToileting?: number;
  adlTransfer?: number; adlFeeding?: number; adlContinence?: number;
}): { score: number; category: string } {
  const score = (f.adlBathing ?? 0) + (f.adlDressing ?? 0) + (f.adlToileting ?? 0) +
    (f.adlTransfer ?? 0) + (f.adlFeeding ?? 0) + (f.adlContinence ?? 0);
  const category = score <= 2 ? 'Independent' : score <= 5 ? 'Mildly Dependent' : score <= 8 ? 'Moderately Dependent' : 'Totally Dependent';
  return { score, category };
}

// ---- Pressure Ulcer Integration Options ----
export const PU_LOCATIONS = [
  '',
  'Sacrum / Coccyx',
  'Right Heel',
  'Left Heel',
  'Ischial Tuberosity',
  'Greater Trochanter (Right)',
  'Greater Trochanter (Left)',
  'Occiput (Back of head)',
  'Elbow (Right / Left)',
  'Scapula',
  'Lateral Malleolus (Ankle)',
  'Other Anatomical Site',
];

export const PU_STAGES = [
  '',
  'Stage 1 – Non-blanchable erythema of intact skin',
  'Stage 2 – Partial thickness skin loss with exposed dermis',
  'Stage 3 – Full thickness skin loss (subcutaneous fat visible)',
  'Stage 4 – Full thickness tissue loss (muscle/bone exposed)',
  'Unstageable – Obscured by slough or eschar',
  'Deep Tissue Injury – Persistent deep red/maroon discoloration',
];

export const PU_PREVENTIVE_ACTIONS = [
  'Air / Ripple Mattress (Alpha Bed) active',
  '2-Hourly Position Change Schedule & Turn Chart maintained',
  'Back Care & Skin Barrier Cream / Moisturizer applied',
  'Hydrocolloid / Foam / Silicone Dressing applied',
  'Heel Protectors / Off-loading Pillows in place',
  'High-Protein Nutritional Supplementation started',
];

// ---- Phlebitis (VIP Score) Options ----
export const VIP_GRADES = [
  { grade: 0, label: 'Grade 0: IV site appears healthy / No symptoms', color: 'bg-green-100 text-green-800 border-green-300' },
  { grade: 1, label: 'Grade 1: Slight pain near IV site OR slight erythema (Possible phlebitis)', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { grade: 2, label: 'Grade 2: Two of: Pain, Erythema, Swelling (Early phlebitis → Resite)', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { grade: 3, label: 'Grade 3: Pain along cannula path, Erythema, Induration (Medium phlebitis → Resite & treat)', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { grade: 4, label: 'Grade 4: Pain, Erythema, Induration, Palpable venous cord (Advanced phlebitis)', color: 'bg-red-100 text-red-800 border-red-300' },
  { grade: 5, label: 'Grade 5: Grade 4 signs with pyrexia / Frank purulent discharge (Severe thrombophlebitis)', color: 'bg-rose-200 text-rose-900 border-rose-400' },
];

export const PHLEBITIS_SYMPTOMS_LIST = [
  'Pain or Tenderness along IV cannula',
  'Erythema / Redness around puncture site',
  'Swelling / Local Oedema',
  'Local Warmth / Heat',
  'Streak formation along vein',
  'Palpable Venous Cord',
  'Purulent drainage / Pyrexia',
];

export const PHLEBITIS_INTERVENTIONS_LIST = [
  'IV Cannula discontinued & resited to opposite limb',
  'Cold / Ice Compress applied for 15-20 mins',
  'Warm Compress applied',
  'Thrombophob / Heparinoid Ointment applied locally',
  'Limb elevated above heart level',
  'Treating Doctor / Consultant notified immediately',
  'Cannula site monitored 2-hourly',
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
    pastMedications: [],
    // Aligned Vitals
    tempF: 98.6,
    pulse: 72,
    bpSys: 120,
    bpDia: 80,
    spo2: 98,
    rr: 16,
    weightKg: 0,
    bloodSugarMgDl: 110,
    chiefComplaints: '',
    // Pain Assessment & Reassessment fields
    painScore: 0,
    painType: 'Acute',
    painIntensity: '',
    painDuration: '',
    painActionTaken: '',
    painActionTakenFreeText: '',
    painReliefStatus: 'Pending Recheck (30 mins)',
    painLocation: '',
    painExpressions: [],
    shiftPainLogs: [],
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
    // Risks
    fallRiskCriteria: [],
    fallRiskScore: 0,
    fallRiskLevel: 'Low',
    pressureUlcerRiskCriteria: [],
    pressureUlcerRiskScore: 0,
    pressureUlcerRisk: 'Low',
    dvtRiskCriteria: [],
    dvtRiskScore: 0,
    dvtRisk: 'Low',
    previousFallRiskScore: 0,
    previousFallRiskLevel: '',
    previousPressureUlcerScore: 0,
    previousPressureUlcerRisk: '',
    previousDVTScore: 0,
    previousDVTRisk: '',
    previousRiskAssessedDate: '',
    // Vulnerable Patient Criteria & Care (NABH Standard)
    vulnerableCriteria: [],
    isVulnerableHighRisk: false,
    vulnerableInterventions: [
      'Red ID Alert Band tied on patient wrist',
      'First Priority Care & Immediate Attention allotted',
      'Fall Prevention vigilance active (Bed rails up, assist on move)',
      'Hospital Acquired Infection (HAI) Prevention Bundle active',
    ],
    vulnerableNotes: '',
    // ADL (Activities of Daily Living) Assessment
    adlBathing: 0,
    adlDressing: 0,
    adlToileting: 0,
    adlTransfer: 0,
    adlFeeding: 0,
    adlContinence: 0,
    adlScore: 0,
    adlCategory: 'Independent',
    adlInterventions: [],
    // Pressure Ulcer Integration
    puPresent: false,
    puBeforeAfter: 'Before Admission' as const,
    puStage: '',
    puLocation: '',
    puLengthCm: 0,
    puWidthCm: 0,
    puDepthCm: 0,
    puWoundBed: '',
    puExudate: '',
    puPreventiveMeasures: [
      'Air / Ripple Mattress (Alpha Bed) active',
      '2-Hourly Position Change Schedule & Turn Chart maintained',
      'Back Care & Skin Barrier Cream / Moisturizer applied',
    ],
    puInterventions: '',
    // Phlebitis (VIP Score) Integration
    phlebitisAssessed: true,
    phlebitisIvSite: 'Right Forearm (20G)',
    phlebitisVipScore: 0,
    phlebitisSymptoms: [],
    phlebitisInterventions: [],
    phlebitisNotes: '',
    phlebitisInsertionDate: nowDateStr(),
    phlebitisCannulaGauge: '20G (Pink)',
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

type FormState = Omit<NursingAssessment, 'id' | 'patientId' | 'createdAt' | 'status'>;
type SetF = <K extends keyof FormState>(k: K, v: FormState[K]) => void;

export function NursingAssessmentTab({ type }: NursingAssessmentTabProps) {
  const { store, selectedPatient, updateStore, updatePatientDiagnosis, updatePatientVulnerable } = useEMR();
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

  function setF<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm(prev => {
      const next = { ...prev, [k]: v };
      // Auto-evaluate High Risk / Vulnerable Status if criteria, fall risk, PU, or pain is high
      if (k === 'vulnerableCriteria') {
        const crit = v as string[];
        next.isVulnerableHighRisk = crit.length > 0 || next.fallRiskLevel === 'High' || next.pressureUlcerRisk === 'High' || (next.painScore ?? 0) >= 7;
      }
      return next;
    });
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
      base.fallRiskCriteria = [...(priorAssessment.fallRiskCriteria || [])];
      base.fallRiskScore = priorAssessment.fallRiskScore;
      base.fallRiskLevel = priorAssessment.fallRiskLevel;
      base.pressureUlcerRiskCriteria = [...(priorAssessment.pressureUlcerRiskCriteria || [])];
      base.pressureUlcerRiskScore = priorAssessment.pressureUlcerRiskScore ?? 0;
      base.pressureUlcerRisk = priorAssessment.pressureUlcerRisk ?? 'Low';
      base.dvtRiskCriteria = [...(priorAssessment.dvtRiskCriteria || [])];
      base.dvtRiskScore = priorAssessment.dvtRiskScore ?? 0;
      base.dvtRisk = priorAssessment.dvtRisk ?? 'Low';
      // Carry forward vulnerable criteria if present
      if (priorAssessment.vulnerableCriteria && priorAssessment.vulnerableCriteria.length > 0) {
        base.vulnerableCriteria = [...priorAssessment.vulnerableCriteria];
        base.isVulnerableHighRisk = true;
      }
      if (priorAssessment.vulnerableInterventions && priorAssessment.vulnerableInterventions.length > 0) {
        base.vulnerableInterventions = [...priorAssessment.vulnerableInterventions];
      }
      if (priorAssessment.puPresent) {
        base.puPresent = true;
        base.puStage = priorAssessment.puStage || '';
        base.puLocation = priorAssessment.puLocation || '';
      }
    } else if (selectedPatient?.isVulnerable || selectedPatient?.vulnerableCriteria?.length) {
      base.isVulnerableHighRisk = true;
      base.vulnerableCriteria = [...(selectedPatient.vulnerableCriteria || [])];
    }

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
      bloodSugarMgDl: record.bloodSugarMgDl ?? 110,
      chiefComplaints: record.chiefComplaints,
      // Pain
      painScore: record.painScore ?? 0,
      painType: record.painType || 'Acute',
      painIntensity: record.painIntensity || '',
      painDuration: record.painDuration || '',
      painActionTaken: record.painActionTaken || '',
      painActionTakenFreeText: record.painActionTakenFreeText || '',
      painReliefStatus: record.painReliefStatus || 'Pending Recheck (30 mins)',
      painLocation: record.painLocation || '',
      painExpressions: record.painExpressions || [],
      shiftPainLogs: record.shiftPainLogs || [],
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
      // Vulnerable
      vulnerableCriteria: record.vulnerableCriteria || [],
      isVulnerableHighRisk: record.isVulnerableHighRisk || (record.vulnerableCriteria && record.vulnerableCriteria.length > 0) || false,
      vulnerableInterventions: record.vulnerableInterventions || [],
      vulnerableNotes: record.vulnerableNotes || '',
      // ADL
      adlBathing: record.adlBathing ?? 0,
      adlDressing: record.adlDressing ?? 0,
      adlToileting: record.adlToileting ?? 0,
      adlTransfer: record.adlTransfer ?? 0,
      adlFeeding: record.adlFeeding ?? 0,
      adlContinence: record.adlContinence ?? 0,
      adlScore: record.adlScore ?? 0,
      adlCategory: record.adlCategory || 'Independent',
      adlInterventions: record.adlInterventions || [],
      // Pressure Ulcer
      puPresent: record.puPresent || false,
      puBeforeAfter: record.puBeforeAfter || 'Before Admission',
      puStage: record.puStage || '',
      puLocation: record.puLocation || '',
      puLengthCm: record.puLengthCm || 0,
      puWidthCm: record.puWidthCm || 0,
      puDepthCm: record.puDepthCm || 0,
      puWoundBed: record.puWoundBed || '',
      puExudate: record.puExudate || '',
      puPreventiveMeasures: record.puPreventiveMeasures || [],
      puInterventions: record.puInterventions || '',
      // Phlebitis
      phlebitisAssessed: record.phlebitisAssessed ?? true,
      phlebitisIvSite: record.phlebitisIvSite || 'Right Forearm (20G)',
      phlebitisVipScore: record.phlebitisVipScore ?? 0,
      phlebitisSymptoms: record.phlebitisSymptoms || [],
      phlebitisInterventions: record.phlebitisInterventions || [],
      phlebitisNotes: record.phlebitisNotes || '',
      phlebitisInsertionDate: record.phlebitisInsertionDate || record.date,
      phlebitisCannulaGauge: record.phlebitisCannulaGauge || '20G (Pink)',
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
    // If high risk or vulnerable criteria present, flag patient master record
    if (form.isVulnerableHighRisk || (form.vulnerableCriteria && form.vulnerableCriteria.length > 0)) {
      updatePatientVulnerable(patientId, true, form.vulnerableCriteria);
    }

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
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Doctor Diagnosis Live Banner */}
      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl p-4 shadow-xs flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            Dx
          </div>
          <div>
            <div className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
              Confirmed Doctor Diagnosis (Reflects Across All EMR Records)
            </div>
            <div className="text-sm font-bold text-slate-800">
              {selectedPatient!.diagnosis || 'No Diagnosis recorded by doctor yet'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedPatient?.isVulnerable && (
            <span className="px-2.5 py-1 rounded-full bg-red-100 border border-red-300 text-red-800 text-xs font-bold flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-600"></span>
              🔴 RED ID BAND ALLOTTED
            </span>
          )}
          <span className="text-xs text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
            Consultant: <b>{selectedPatient!.consultantDoctor}</b>
          </span>
        </div>
      </div>

      <div className="ncard">
        <CardHeader
          title={TITLES[type]}
          subtitle={type === 'reassessment' ? 'Shift-wise Re-Assessment, Pain & Risk Monitoring' : undefined}
          actions={<TealButton onClick={openNew} size="sm"><Plus size={14} /> New Assessment</TealButton>}
        />
        <div className="ncard-body">
          <DateStrip days={days} activeDate={activeDate} onChange={setActiveDate} />
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm">
              <b>{formatDate(activeDate)}</b>&nbsp;
              <span className="text-slate-500">{dateRecords.length} assessment{dateRecords.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          {dateRecords.length === 0 ? (
            <EmptyState
              icon={<Clock />}
              title={`No assessments for ${formatDate(activeDate)}`}
              description="Click New Assessment to add one"
              action={<TealButton onClick={openNew}><Plus size={14} /> New Assessment</TealButton>}
            />
          ) : (
            <div className="space-y-3">
              {dateRecords.map(record => (
                <AssessmentCard key={record.id} record={record} onView={() => setViewRecord(record)} onEdit={() => openEdit(record)} />
              ))}
            </div>
          )}
        </div>
      </div>

      <FormDrawer
        open={drawerOpen}
        title={editRecord ? `Edit ${TITLES[type]}` : `New ${TITLES[type]}`}
        subtitle={`Patient: ${selectedPatient!.name} · ${selectedPatient!.uhid} · Bed ${selectedPatient!.bed}`}
        onClose={() => setDrawerOpen(false)}
        onSave={() => save('Completed')}
        onSaveDraft={() => save('Draft')}
      >
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

// ---- Pain Assessment Component with Wong-Baker Faces, Dropdown Location, Free Text Action, and Shift Multi-Entry ----
function PainAssessmentSection({
  form, setF, isTop = false
}: {
  form: FormState;
  setF: SetF;
  isTop?: boolean;
}) {
  const [customLocation, setCustomLocation] = useState(
    form.painLocation && !PAIN_LOCATION_OPTIONS.includes(form.painLocation) ? form.painLocation : ''
  );

  function toggleExpression(expr: string) {
    const current = form.painExpressions || [];
    const next = current.includes(expr) ? current.filter(e => e !== expr) : [...current, expr];
    setF('painExpressions', next);
  }

  const painScore = form.painScore ?? 0;
  const isHighPain = painScore >= 4;

  const currentFace = WONG_BAKER_FACES[painScore] || WONG_BAKER_FACES[0];

  function addShiftPainEntry() {
    const newEntry: ShiftPainLog = {
      id: generateId(),
      time: nowTimeStr(),
      painScore: form.painScore,
      painLocation: form.painLocation,
      actionTaken: form.painActionTaken,
      actionTakenFreeText: form.painActionTakenFreeText,
      reliefStatus: form.painReliefStatus || 'Pending Recheck (30 mins)',
      nurseName: form.nurseName || 'Nurse',
    };
    setF('shiftPainLogs', [...(form.shiftPainLogs || []), newEntry]);
  }

  function removeShiftPainEntry(id: string) {
    setF('shiftPainLogs', (form.shiftPainLogs || []).filter(e => e.id !== id));
  }

  return (
    <div className={cn(
      "p-4 rounded-2xl border transition-all space-y-4",
      isTop ? "bg-amber-50/70 border-amber-300 shadow-sm mb-4" : "bg-slate-50 border-slate-200 mb-4"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
            <span>Pain Assessment & Shift Monitoring</span>
            <span className="text-xl">{currentFace.face}</span>
          </span>
          {isTop && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold uppercase tracking-wider">
              Top Priority Reassessment
            </span>
          )}
        </div>
        <div className={cn("px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-2", currentFace.color)}>
          <span className="text-base">{currentFace.face}</span>
          <span>Pain Score: {painScore}/10</span>
          <span>·</span>
          <span>{currentFace.label}</span>
        </div>
      </div>

      {/* Wong-Baker FACES Pain Scale Buttons (0 to 10 with face symbols) */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
          <span className="flex items-center gap-1">😊 0 (No Hurt)</span>
          <span className="flex items-center gap-1">😐 5 (Hurts Even More)</span>
          <span className="flex items-center gap-1">😭 10 (Hurts Worst)</span>
        </div>
        <div className="grid grid-cols-11 gap-1">
          {WONG_BAKER_FACES.map(f => (
            <button
              key={f.score}
              type="button"
              onClick={() => {
                setF('painScore', f.score);
                if (!form.painIntensity || form.painIntensity === '') {
                  setF('painIntensity', f.score === 0 ? '' : f.score <= 3 ? 'Mild' : f.score <= 6 ? 'Moderate' : f.score <= 8 ? 'Severe' : 'Very Severe');
                }
              }}
              className={cn(
                "py-1.5 px-0.5 rounded-xl text-center transition-all flex flex-col items-center justify-center border",
                painScore === f.score
                  ? "bg-teal-600 text-white border-teal-600 shadow-md scale-105 ring-2 ring-teal-400"
                  : "bg-white border-slate-200 text-slate-700 hover:border-teal-400 hover:bg-teal-50/50"
              )}
            >
              <span className="text-base leading-none mb-0.5">{f.face}</span>
              <span className="text-xs font-bold">{f.score}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Pain Type & Intensity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

      {/* Pain Location Dropdown & Duration */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormGroup label="Pain Location (Dropdown)">
          <FormSelect
            value={PAIN_LOCATION_OPTIONS.includes(form.painLocation || '') ? form.painLocation || '' : 'Other (Custom specify)'}
            onChange={v => {
              if (v === 'Other (Custom specify)') {
                setF('painLocation', customLocation || 'Other');
              } else {
                setF('painLocation', v);
              }
            }}
            options={PAIN_LOCATION_OPTIONS}
          />
        </FormGroup>
        <FormGroup label="Pain Duration">
          <FormInput
            value={form.painDuration || ''}
            onChange={v => setF('painDuration', v)}
            placeholder="e.g. 2 hours, 3 days, since morning"
          />
        </FormGroup>
      </div>

      {/* If Custom Location Selected, Show Free Text */}
      {(form.painLocation === 'Other (Custom specify)' || form.painLocation === 'Other' || (!PAIN_LOCATION_OPTIONS.includes(form.painLocation || '') && form.painLocation)) && (
        <FormGroup label="Specify Anatomical Location / Wound Site">
          <FormInput
            value={customLocation || form.painLocation || ''}
            onChange={v => {
              setCustomLocation(v);
              setF('painLocation', v);
            }}
            placeholder="e.g. Right subcostal drain site, epigastrium, lumbar L4-L5..."
          />
        </FormGroup>
      )}

      {/* HIGH PAIN ALERT & MANDATORY ACTION TAKEN */}
      {isHighPain && (
        <div className="p-3 bg-red-50 border-2 border-red-300 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-red-800 font-bold text-xs uppercase tracking-wide">
            <AlertCircle size={15} className="text-red-600 flex-shrink-0" />
            <span>⚠️ High Pain Score ({painScore}/10) — Clinical Action Required & Documented</span>
          </div>
          <p className="text-xs text-red-700">
            NABH Standard: Immediate pain relief intervention, re-evaluation at 30 minutes, and treating doctor notification are mandatory for pain score ≥4.
          </p>
        </div>
      )}

      {/* Clinical Action Taken (Standard Dropdown + Free Text Input) */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormGroup label="Action Taken (Standard Protocol Dropdown)" required={isHighPain}>
            <FormSelect
              value={form.painActionTaken || ''}
              onChange={v => setF('painActionTaken', v)}
              options={ACTION_TAKEN_OPTIONS}
            />
          </FormGroup>

          <FormGroup label="Pain Relief Status (Post-Action Evaluation)">
            <FormSelect
              value={form.painReliefStatus || 'Pending Recheck (30 mins)'}
              onChange={v => setF('painReliefStatus', v)}
              options={[
                'Pending Recheck (30 mins)',
                'Complete Pain Relief (Score 0)',
                'Partial Pain Relief (Manageable)',
                'No Relief / Persistent Pain (Doctor Notified)',
              ]}
            />
          </FormGroup>
        </div>

        {/* FREE TEXT ACTION TAKEN */}
        <FormGroup label="Action Taken (Free Text / Detailed Clinical Note)">
          <FormTextarea
            value={form.painActionTakenFreeText || ''}
            onChange={v => setF('painActionTakenFreeText', v)}
            placeholder="Type free text clinical action taken (e.g. Inj. Paracetamol 1g IV infused over 15 mins, patient positioned in semi-Fowler's, re-check planned after 30 mins)..."
            rows={2}
          />
        </FormGroup>
      </div>

      {/* SHIFT PAIN REASSESSMENT TRACKER (Done Multiple Times per Shift) */}
      <div className="bg-white p-3 rounded-xl border border-teal-200 space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900 uppercase">
            <TrendingUp size={14} className="text-teal-600" />
            <span>Shift Pain Re-assessment Log (Multiple Times in Shift)</span>
          </div>
          <button
            type="button"
            onClick={addShiftPainEntry}
            className="text-xs px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold flex items-center gap-1 shadow-xs transition-colors"
          >
            <Plus size={12} /> Log Pain Reassessment Now ({nowTimeStr()})
          </button>
        </div>

        {(form.shiftPainLogs || []).length === 0 ? (
          <p className="text-xs text-slate-500 italic py-1">
            No multiple shift pain logs recorded yet. Click &quot;Log Pain Reassessment Now&quot; to timestamp repeat evaluations in this shift.
          </p>
        ) : (
          <div className="space-y-1.5 mt-2">
            {(form.shiftPainLogs || []).map((entry, idx) => {
              const face = WONG_BAKER_FACES[entry.painScore] || WONG_BAKER_FACES[0];
              return (
                <div key={entry.id || idx} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                      ⏰ {entry.time}
                    </span>
                    <span className={cn("px-2 py-0.5 rounded font-bold border", face.color)}>
                      {face.face} Score {entry.painScore}/10
                    </span>
                    {entry.painLocation && <span className="text-slate-600">📍 {entry.painLocation}</span>}
                  </div>
                  <div className="flex-1 min-w-[200px] text-slate-700 truncate">
                    <span><b>Action:</b> {entry.actionTaken || entry.actionTakenFreeText || 'Monitored'}</span>
                    {entry.reliefStatus && <span className="ml-2 text-teal-700 font-semibold">({entry.reliefStatus})</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeShiftPainEntry(entry.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Remove entry"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
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

// ---- Assessment Form ----
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

function AssessmentForm({ form, setF, type, priorAssessment }: {
  form: FormState;
  setF: SetF;
  type: 'initial' | 'reassessment' | 'final';
  priorAssessment?: NursingAssessment;
}) {
  const { selectedPatient, updatePatientDiagnosis } = useEMR();
  const isInitial = type === 'initial';
  const isReassessment = type === 'reassessment';

  // Toggle helpers
  function toggleVulnerableCriterion(critLabel: string) {
    const cur = form.vulnerableCriteria || [];
    const updated = cur.includes(critLabel) ? cur.filter(c => c !== critLabel) : [...cur, critLabel];
    setF('vulnerableCriteria', updated);
  }

  function toggleVulnerableIntervention(intLabel: string) {
    const cur = form.vulnerableInterventions || [];
    const updated = cur.includes(intLabel) ? cur.filter(i => i !== intLabel) : [...cur, intLabel];
    setF('vulnerableInterventions', updated);
  }

  function togglePUPreventive(meas: string) {
    const cur = form.puPreventiveMeasures || [];
    const updated = cur.includes(meas) ? cur.filter(m => m !== meas) : [...cur, meas];
    setF('puPreventiveMeasures', updated);
  }

  function togglePhlebitisSymptom(symp: string) {
    const cur = form.phlebitisSymptoms || [];
    const updated = cur.includes(symp) ? cur.filter(s => s !== symp) : [...cur, symp];
    setF('phlebitisSymptoms', updated);
    // Auto calculate VIP Score based on count of symptoms
    const count = updated.length;
    const grade = count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : count === 3 ? 3 : count >= 5 ? 5 : 4;
    setF('phlebitisVipScore', grade);
  }

  function togglePhlebitisIntervention(intv: string) {
    const cur = form.phlebitisInterventions || [];
    const updated = cur.includes(intv) ? cur.filter(i => i !== intv) : [...cur, intv];
    setF('phlebitisInterventions', updated);
  }

  // Risk helpers
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

  // Calculate ADL score
  const adlResult = calcADLScore(form);

  // High Risk / Vulnerable Detection
  const hasVulnerableCriteria = (form.vulnerableCriteria || []).length > 0;
  const isHighRiskVulnerable = form.isVulnerableHighRisk ||
    hasVulnerableCriteria ||
    form.fallRiskLevel === 'High' ||
    form.pressureUlcerRisk === 'High' ||
    form.dvtRisk === 'High' ||
    (form.painScore ?? 0) >= 7;

  const mnaScore = form.mnaTotalScore ?? 0;
  const mnaColor = mnaScore >= 12 ? 'bg-green-100 text-green-700' : mnaScore >= 8 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';

  return (
    <div className="space-y-4">
      {/* 1. Doctor's Diagnosis Headline (Writes once -> Reflects all over) */}
      <div className="p-3 bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-xl flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-teal-900 uppercase tracking-wide">
            🩺 Doctor Diagnosis:
          </span>
          <span className="text-sm font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-teal-100">
            {selectedPatient?.diagnosis || 'No Diagnosis recorded'}
          </span>
        </div>
        <span className="text-[11px] text-teal-700 font-medium">
          Written once by Doctor → Reflects across all 27 EMR tabs
        </span>
      </div>

      {/* 2. General Information */}
      <SectionTitle>General Information</SectionTitle>
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
            <FormGroup label="Assessment Time" required>
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

      {/* 3. REASSESSMENT REQUIREMENT: In reassessment, pain score & shift monitoring at TOP */}
      {isReassessment && (
        <PainAssessmentSection form={form} setF={setF} isTop={true} />
      )}

      {/* 4. Contact Person — Only for Initial */}
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

      {/* 5. Patient Profile — Only for Initial */}
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

          {/* Past Medications History */}
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

      {/* 6. Chief Complaints */}
      <SectionTitle>Chief Complaints</SectionTitle>
      <FormGroup label="Chief Complaints">
        <FormTextarea value={form.chiefComplaints} onChange={v => setF('chiefComplaints', v)} placeholder="Patient's chief complaints..." rows={2} />
      </FormGroup>

      {/* 7. PAIN ASSESSMENT (Shown here for Initial, or if not at top) */}
      {!isReassessment && (
        <PainAssessmentSection form={form} setF={setF} isTop={false} />
      )}

      {/* 8. ALIGNED VITAL SIGNS (Clean Structured Medical Card Alignment) */}
      <SectionTitle>Vital Signs (Aligned Clinical Layout)</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: Temp & Pulse */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-1 border-b border-slate-200">
            <span>🌡️ Temperature & Pulse</span>
            <span className={cn("text-[11px] px-2 py-0.5 rounded font-bold", form.tempF >= 99.5 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700")}>
              {form.tempF >= 99.5 ? 'Febrile' : 'Normal'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FormGroup label="Temp (°F)">
              <FormInput type="number" step="0.1" value={form.tempF} onChange={v => setF('tempF', parseFloat(v) || 0)} />
            </FormGroup>
            <FormGroup label="Pulse (bpm)">
              <FormInput type="number" value={form.pulse} onChange={v => setF('pulse', parseInt(v) || 0)} />
            </FormGroup>
          </div>
          <div className="text-[11px] text-slate-500 flex justify-between">
            <span>Ref: 98.4–98.6°F</span>
            <span>Ref: 60–100 bpm</span>
          </div>
        </div>

        {/* Card 2: Blood Pressure & MAP */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-1 border-b border-slate-200">
            <span>💓 Blood Pressure</span>
            <span className="text-[11px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
              MAP: {Math.round((form.bpDia || 80) + ((form.bpSys || 120) - (form.bpDia || 80)) / 3)} mmHg
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FormGroup label="BP Systolic (mmHg)">
              <FormInput type="number" value={form.bpSys} onChange={v => setF('bpSys', parseInt(v) || 0)} />
            </FormGroup>
            <FormGroup label="BP Diastolic (mmHg)">
              <FormInput type="number" value={form.bpDia} onChange={v => setF('bpDia', parseInt(v) || 0)} />
            </FormGroup>
          </div>
          <div className="text-[11px] text-slate-500 flex justify-between">
            <span>{form.bpSys}/{form.bpDia} mmHg</span>
            <span className={cn(form.bpSys > 140 || form.bpDia > 90 ? "text-amber-700 font-bold" : "text-green-700 font-bold")}>
              {form.bpSys > 140 || form.bpDia > 90 ? 'Hypertensive' : 'Normotensive'}
            </span>
          </div>
        </div>

        {/* Card 3: Respiration & SpO2 */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-1 border-b border-slate-200">
            <span>🫁 Respiration & Oxygen</span>
            <span className={cn("text-[11px] px-2 py-0.5 rounded font-bold", form.spo2 < 95 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700")}>
              {form.spo2 < 95 ? 'Hypoxia Alert' : 'Normal'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FormGroup label="RR (/min)">
              <FormInput type="number" value={form.rr} onChange={v => setF('rr', parseInt(v) || 0)} />
            </FormGroup>
            <FormGroup label="SpO₂ (%)">
              <FormInput type="number" value={form.spo2} onChange={v => setF('spo2', parseInt(v) || 0)} />
            </FormGroup>
          </div>
          <div className="text-[11px] text-slate-500 flex justify-between">
            <span>Ref: 12–20 /min</span>
            <span>Ref: 95–100%</span>
          </div>
        </div>

        {/* Card 4: Neurological & GCS */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-1 border-b border-slate-200">
            <span>🧠 Neurological / GCS</span>
            <span className="text-[11px] font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded">
              Score: {form.gcs || 15}/15
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FormGroup label="GCS (3–15)">
              <FormInput type="number" min={3} max={15} value={form.gcs} onChange={v => setF('gcs', parseInt(v) || 15)} />
            </FormGroup>
            <FormGroup label="Consciousness">
              <FormSelect value={form.levelOfConsciousness} onChange={v => setF('levelOfConsciousness', v)} options={['Alert', 'Verbal', 'Pain', 'Unresponsive', 'Sedated', 'Confused']} />
            </FormGroup>
          </div>
          <div className="text-[11px] text-slate-500">
            Level: <b className="text-slate-800">{form.levelOfConsciousness}</b>
          </div>
        </div>

        {/* Card 5: Blood Sugar & Anthropometry */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-1 border-b border-slate-200">
            <span>🩸 Metabolic & Weight</span>
            <span className="text-[11px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
              GRBS: {form.bloodSugarMgDl || 110} mg/dL
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FormGroup label="Blood Sugar (mg/dL)">
              <FormInput type="number" value={form.bloodSugarMgDl || 110} onChange={v => setF('bloodSugarMgDl', parseInt(v) || 0)} />
            </FormGroup>
            <FormGroup label="Weight (kg)">
              <FormInput type="number" step="0.1" value={form.weightKg} onChange={v => setF('weightKg', parseFloat(v) || 0)} />
            </FormGroup>
          </div>
          <div className="text-[11px] text-slate-500 flex justify-between">
            <span>Random Blood Sugar</span>
            <span>Ref: 70–140 mg/dL</span>
          </div>
        </div>
      </div>

      {/* 9. ADL (ACTIVITIES OF DAILY LIVING) ASSESSMENT */}
      <SectionTitle>ADL (Activities of Daily Living) Functional Assessment</SectionTitle>
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-200">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Functional Independence Evaluation (Katz / Barthel Scale)
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">Total ADL Score:</span>
            <span className="text-sm font-bold text-slate-800">{adlResult.score} / 12</span>
            <span className={cn(
              "text-xs px-2.5 py-0.5 rounded-full font-bold",
              adlResult.category === 'Independent' ? "bg-green-100 text-green-800" :
              adlResult.category === 'Mildly Dependent' ? "bg-lime-100 text-lime-800" :
              adlResult.category === 'Moderately Dependent' ? "bg-amber-100 text-amber-800" :
              "bg-red-100 text-red-800"
            )}>
              {adlResult.category}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ADL_ITEMS.map(item => (
            <div key={item.key} className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
              <div className="text-xs font-bold text-slate-700">{item.label}</div>
              <div className="space-y-1 mt-1">
                {item.options.map(opt => {
                  const currentVal = (form[item.key as keyof FormState] as number) ?? 0;
                  return (
                    <label key={opt.value} className={cn(
                      "flex items-center gap-1.5 px-2 py-1 rounded border text-[11px] cursor-pointer transition-colors",
                      currentVal === opt.value ? "bg-teal-50 border-teal-300 text-teal-900 font-semibold" : "border-slate-100 text-slate-600 hover:bg-slate-50"
                    )}>
                      <input
                        type="radio"
                        name={item.key}
                        checked={currentVal === opt.value}
                        onChange={() => setF(item.key as keyof FormState, opt.value as FormState[keyof FormState])}
                        className="w-3 h-3 accent-teal-600"
                      />
                      <span>{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 10. VULNERABLE PATIENT CRITERIA (NABH STANDARD - Image 2 Poster) */}
      <SectionTitle>Vulnerable Patient Identification (NABH Standard)</SectionTitle>
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            વલ્નરેબલ દર્દીની ઓળખ (Select Applicable Vulnerable Criteria)
          </div>
          <span className="text-[11px] text-slate-500">
            {(form.vulnerableCriteria || []).length} criteria matched
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {VULNERABLE_CRITERIA_LIST.map(crit => {
            const isChecked = (form.vulnerableCriteria || []).includes(crit.labelEn);
            return (
              <label
                key={crit.id}
                className={cn(
                  "flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors",
                  isChecked ? "bg-red-50 border-red-300 text-red-900 font-semibold" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                )}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleVulnerableCriterion(crit.labelEn)}
                  className="mt-0.5 w-3.5 h-3.5 accent-red-600 rounded"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold leading-tight">{crit.labelEn}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{crit.labelGu}</div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* 11. DEDICATED HIGH RISK & VULNERABLE PATIENT CARE SECTION (Activates on High Risk / Vulnerable) */}
      {isHighRiskVulnerable && (
        <div className="p-4 bg-gradient-to-br from-red-50 via-rose-50 to-amber-50 border-2 border-red-300 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-red-200">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-600 animate-ping"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-red-950 flex items-center gap-1.5">
                🔴 વલ્નરેબલ દર્દીની કાળજી & High-Risk Interventions (Mandatory Protocol)
              </span>
            </div>
            <span className="px-3 py-0.5 rounded-full bg-red-600 text-white text-xs font-bold shadow-xs">
              RED ALERT ID BAND MANDATORY
            </span>
          </div>

          <p className="text-xs text-red-900 leading-relaxed font-medium">
            This patient is identified as <b>HIGH RISK / VULNERABLE</b>. Standard hospital protocols require active implementation of the following mandatory care bundles:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {VULNERABLE_CARE_INTERVENTIONS.map(intv => {
              const isChecked = (form.vulnerableInterventions || []).includes(intv.labelEn);
              return (
                <label
                  key={intv.id}
                  className={cn(
                    "flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors",
                    isChecked ? "bg-white border-red-400 text-red-900 font-bold shadow-xs" : "bg-white/70 border-red-200 text-slate-700"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleVulnerableIntervention(intv.labelEn)}
                    className="mt-0.5 w-4 h-4 accent-red-600 rounded"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span>{intv.icon}</span>
                      <span className="font-bold">{intv.labelEn}</span>
                    </div>
                    <div className="text-[11px] text-red-700/80 mt-0.5">{intv.labelGu}</div>
                  </div>
                </label>
              );
            })}
          </div>

          <FormGroup label="Special Vulnerable Patient Care Notes / Attendant Instructions">
            <FormTextarea
              value={form.vulnerableNotes || ''}
              onChange={v => setF('vulnerableNotes', v)}
              placeholder="e.g. Bed near nursing station bed 3, 24x7 attendant Sahil present, side rails up, assisted ambulation only..."
              rows={2}
            />
          </FormGroup>
        </div>
      )}

      {/* 12. PRESSURE ULCER INTEGRATION IN REASSESSMENT */}
      <SectionTitle>Pressure Ulcer Assessment & Monitoring (Integrated)</SectionTitle>
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
        <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200">
          <div>
            <div className="text-xs font-bold text-slate-800">Pressure Ulcer / Bedsore Present?</div>
            <div className="text-[11px] text-slate-500">Document any skin breakdown, pressure injury or active bedsore</div>
          </div>
          <YesNoToggle value={form.puPresent || false} onChange={v => setF('puPresent', v)} />
        </div>

        {form.puPresent && (
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormGroup label="Documentation Timing">
                <FormSelect
                  value={form.puBeforeAfter || 'Before Admission'}
                  onChange={v => setF('puBeforeAfter', v as 'Before Admission' | 'After Admission')}
                  options={['Before Admission', 'After Admission']}
                />
              </FormGroup>
              <FormGroup label="Ulcer Location">
                <FormSelect
                  value={form.puLocation || ''}
                  onChange={v => setF('puLocation', v)}
                  options={PU_LOCATIONS}
                />
              </FormGroup>
              <FormGroup label="Ulcer Stage">
                <FormSelect
                  value={form.puStage || ''}
                  onChange={v => setF('puStage', v)}
                  options={PU_STAGES}
                />
              </FormGroup>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <FormGroup label="Length (cm)">
                <FormInput type="number" step="0.1" value={form.puLengthCm || 0} onChange={v => setF('puLengthCm', parseFloat(v) || 0)} />
              </FormGroup>
              <FormGroup label="Width (cm)">
                <FormInput type="number" step="0.1" value={form.puWidthCm || 0} onChange={v => setF('puWidthCm', parseFloat(v) || 0)} />
              </FormGroup>
              <FormGroup label="Depth (cm)">
                <FormInput type="number" step="0.1" value={form.puDepthCm || 0} onChange={v => setF('puDepthCm', parseFloat(v) || 0)} />
              </FormGroup>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Preventive & Curative Measures Active</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PU_PREVENTIVE_ACTIONS.map(action => {
                  const isChecked = (form.puPreventiveMeasures || []).includes(action);
                  return (
                    <label
                      key={action}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors",
                        isChecked ? "bg-teal-50 border-teal-300 text-teal-900 font-semibold" : "bg-white border-slate-200 text-slate-600"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePUPreventive(action)}
                        className="w-3.5 h-3.5 accent-teal-600 rounded"
                      />
                      <span>{action}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <FormGroup label="Pressure Ulcer Dressing & Treatment Notes">
              <FormTextarea
                value={form.puInterventions || ''}
                onChange={v => setF('puInterventions', v)}
                placeholder="e.g. Cleaned with normal saline, hydrocolloid dressing applied, alpha bed maintained on pressure level 3..."
                rows={2}
              />
            </FormGroup>
          </div>
        )}
      </div>

      {/* 13. PHLEBITIS (VIP SCORE) ASSESSMENT & MONITORING */}
      <SectionTitle>Phlebitis Assessment (VIP Scale / IV Cannula Care)</SectionTitle>
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
        <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200">
          <div>
            <div className="text-xs font-bold text-slate-800">Peripheral IV Cannula / Line in Situ?</div>
            <div className="text-[11px] text-slate-500">Monitor IV site for pain, erythema, swelling and cord formation</div>
          </div>
          <YesNoToggle value={form.phlebitisAssessed ?? true} onChange={v => setF('phlebitisAssessed', v)} />
        </div>

        {form.phlebitisAssessed && (
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormGroup label="Cannula Site">
                <FormSelect
                  value={form.phlebitisIvSite || 'Right Forearm (20G)'}
                  onChange={v => setF('phlebitisIvSite', v)}
                  options={['Left Forearm', 'Right Forearm', 'Left Hand Dorsum', 'Right Hand Dorsum', 'Antecubital Fossa (L)', 'Antecubital Fossa (R)', 'CVC Line', 'Other Site']}
                />
              </FormGroup>
              <FormGroup label="Cannula Gauge">
                <FormSelect
                  value={form.phlebitisCannulaGauge || '20G (Pink)'}
                  onChange={v => setF('phlebitisCannulaGauge', v)}
                  options={['18G (Green)', '20G (Pink)', '22G (Blue)', '24G (Yellow)', 'Central Venous Catheter']}
                />
              </FormGroup>
              <FormGroup label="Insertion Date">
                <FormInput
                  type="date"
                  value={form.phlebitisInsertionDate || form.date}
                  onChange={v => setF('phlebitisInsertionDate', v)}
                />
              </FormGroup>
            </div>

            {/* VIP Grade Badge */}
            {(() => {
              const gradeInfo = VIP_GRADES[form.phlebitisVipScore ?? 0] || VIP_GRADES[0];
              return (
                <div className={cn("p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between", gradeInfo.color)}>
                  <div className="flex items-center gap-2">
                    <Zap size={14} />
                    <span>Visual Infusion Phlebitis (VIP) Score: Grade {form.phlebitisVipScore ?? 0}</span>
                  </div>
                  <span>{gradeInfo.label}</span>
                </div>
              );
            })()}

            {/* Symptoms checkboxes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">IV Puncture Site Signs / Symptoms</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PHLEBITIS_SYMPTOMS_LIST.map(symp => {
                  const isChecked = (form.phlebitisSymptoms || []).includes(symp);
                  return (
                    <label
                      key={symp}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors",
                        isChecked ? "bg-amber-50 border-amber-300 text-amber-900 font-semibold" : "bg-white border-slate-200 text-slate-600"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePhlebitisSymptom(symp)}
                        className="w-3.5 h-3.5 accent-amber-600 rounded"
                      />
                      <span>{symp}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Phlebitis Interventions */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phlebitis Care Actions & Interventions</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PHLEBITIS_INTERVENTIONS_LIST.map(intv => {
                  const isChecked = (form.phlebitisInterventions || []).includes(intv);
                  return (
                    <label
                      key={intv}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors",
                        isChecked ? "bg-teal-50 border-teal-300 text-teal-900 font-semibold" : "bg-white border-slate-200 text-slate-600"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePhlebitisIntervention(intv)}
                        className="w-3.5 h-3.5 accent-teal-600 rounded"
                      />
                      <span>{intv}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <FormGroup label="Phlebitis Clinical Remarks">
              <FormInput
                value={form.phlebitisNotes || ''}
                onChange={v => setF('phlebitisNotes', v)}
                placeholder="Site condition, resiting details, ointment applied..."
              />
            </FormGroup>
          </div>
        )}
      </div>

      {/* 14. Previous Risk Comparison (In Reassessment) */}
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

      {/* 15. Risk Assessment (Criteria-driven: Fall, Braden PU, Caprini DVT) */}
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

      {/* 16. Nutrition Assessment (Initial only) */}
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

      {/* 17. Skin */}
      <SectionTitle>Skin Assessment</SectionTitle>
      <FormGroup label="Skin Condition">
        <FormTextarea value={form.skinCondition} onChange={v => setF('skinCondition', v)} placeholder="Skin integrity, pressure areas, wounds, turgor..." rows={2} />
      </FormGroup>

      {/* 18. Notes & Interventions */}
      <SectionTitle>Nursing Notes & Interventions</SectionTitle>
      <FormGroup label="Nursing Notes">
        <FormTextarea value={form.notes} onChange={v => setF('notes', v)} placeholder="Shift observations, patient progress, doctor interactions..." rows={2} />
      </FormGroup>

      <FormGroup label="Nursing Interventions Performed">
        <FormTextarea value={form.interventions} onChange={v => setF('interventions', v)} placeholder="All clinical nursing interventions performed during this shift..." rows={2} />
      </FormGroup>

      <SectionTitle>Nurse Signature</SectionTitle>
      <FormGroup label="Nurse Name / Signature" required>
        <FormInput value={form.nurseSignature} onChange={v => setF('nurseSignature', v)} placeholder="Nurse's full name" />
      </FormGroup>
    </div>
  );
}

// ---- Assessment Card in List View ----
function AssessmentCard({ record, onView, onEdit }: { record: NursingAssessment; onView: () => void; onEdit: () => void }) {
  const { selectedPatient } = useEMR();
  const face = WONG_BAKER_FACES[record.painScore] || WONG_BAKER_FACES[0];
  const isVulnerable = record.isVulnerableHighRisk || (record.vulnerableCriteria && record.vulnerableCriteria.length > 0);

  return (
    <div className="row-item hover:shadow-xs transition-shadow">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="font-bold text-sm text-slate-800">{record.time}</span>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">{record.shift} Shift</span>
          <StatusBadge status={record.status} />

          {/* Red Alert Vulnerable Badge */}
          {isVulnerable && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
              🔴 Vulnerable Patient (Red Band)
            </span>
          )}

          {/* Pain Badge with Face Emoji */}
          <span className={cn("text-xs px-2.5 py-0.5 rounded-full border font-bold flex items-center gap-1", face.color)}>
            <span>{face.face}</span>
            <span>Pain: {record.painScore}/10 ({face.label})</span>
          </span>

          {record.puPresent && (
            <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold border border-amber-200">
              PU: {record.puStage?.split('–')[0] || 'Present'}
            </span>
          )}

          {record.phlebitisAssessed && (
            <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-medium border border-blue-200">
              VIP Grade {record.phlebitisVipScore ?? 0}
            </span>
          )}
        </div>

        {/* Doctor Diagnosis Reflection */}
        <div className="text-xs text-slate-600 mb-1 flex items-center gap-2">
          <span className="font-bold text-teal-800">Dx:</span>
          <span className="text-slate-800 font-medium truncate max-w-md">
            {selectedPatient?.diagnosis || 'No Diagnosis recorded'}
          </span>
          <span className="text-slate-400">·</span>
          <span>Nurse: <b>{record.nurseName || 'Duty Nurse'}</b></span>
        </div>

        {/* Aligned Vitals Strip */}
        <div className="flex flex-wrap gap-2 text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
          <span><b>T:</b> {record.tempF}°F</span>
          <span>·</span>
          <span><b>P:</b> {record.pulse} bpm</span>
          <span>·</span>
          <span><b>BP:</b> {record.bpSys}/{record.bpDia} mmHg</span>
          <span>·</span>
          <span><b>SpO₂:</b> {record.spo2}%</span>
          <span>·</span>
          <span><b>RR:</b> {record.rr}/min</span>
          {record.bloodSugarMgDl && (
            <>
              <span>·</span>
              <span><b>Sugar:</b> {record.bloodSugarMgDl} mg/dL</span>
            </>
          )}
          <span>·</span>
          <span><b>GCS:</b> {record.gcs}/15</span>
        </div>

        {/* Action Taken Display */}
        {(record.painActionTaken || record.painActionTakenFreeText) && (
          <div className="mt-2 text-xs bg-amber-50/80 p-2 rounded-lg border border-amber-200 text-amber-900">
            <b>Action Taken:</b> {record.painActionTaken || ''}
            {record.painActionTakenFreeText ? ` — ${record.painActionTakenFreeText}` : ''}
            {record.painReliefStatus && <span className="ml-2 font-bold text-amber-800">({record.painReliefStatus})</span>}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 ml-2">
        <SoftButton onClick={onView} size="sm"><Eye size={12} /> View</SoftButton>
        <SoftButton onClick={onEdit} size="sm"><Edit2 size={12} /> Edit</SoftButton>
      </div>
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
  const { selectedPatient } = useEMR();
  const isInitial = type === 'initial';
  const isReassessment = type === 'reassessment';
  const face = WONG_BAKER_FACES[record.painScore] || WONG_BAKER_FACES[0];
  const isVulnerable = record.isVulnerableHighRisk || (record.vulnerableCriteria && record.vulnerableCriteria.length > 0);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
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
          <span className="text-sm text-slate-600 ml-auto">Nurse: <b>{record.nurseName || 'Duty Nurse'}</b></span>
        </div>

        {/* Doctor Diagnosis Reflection */}
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl">
          <div className="text-xs font-bold uppercase text-teal-800 mb-0.5">Doctor&apos;s Confirmed Diagnosis</div>
          <div className="text-sm font-bold text-slate-900">{selectedPatient?.diagnosis || 'No Diagnosis recorded'}</div>
        </div>

        {/* Vulnerable Patient Alert */}
        {isVulnerable && (
          <div className="p-3.5 bg-red-50 border-2 border-red-300 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-900 uppercase">🔴 Vulnerable Patient Protocols Active</span>
              <span className="text-xs px-2.5 py-0.5 bg-red-600 text-white rounded-full font-bold">RED ID ALERT BAND</span>
            </div>
            {record.vulnerableCriteria && record.vulnerableCriteria.length > 0 && (
              <div>
                <div className="text-xs text-slate-600 font-semibold mb-1">Identified Criteria:</div>
                <div className="flex flex-wrap gap-1">
                  {record.vulnerableCriteria.map(c => (
                    <span key={c} className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-800 font-medium">✓ {c}</span>
                  ))}
                </div>
              </div>
            )}
            {record.vulnerableInterventions && record.vulnerableInterventions.length > 0 && (
              <div>
                <div className="text-xs text-slate-600 font-semibold mb-1">Care Protocols Active:</div>
                <div className="flex flex-wrap gap-1">
                  {record.vulnerableInterventions.map(i => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded bg-white border border-red-200 text-red-900 font-medium">✓ {i}</span>
                  ))}
                </div>
              </div>
            )}
            {record.vulnerableNotes && (
              <p className="text-xs text-slate-700 bg-white p-2 rounded border border-red-100">
                <b>Notes:</b> {record.vulnerableNotes}
              </p>
            )}
          </div>
        )}

        {/* Pain Assessment with Wong-Baker Faces and Shift Logs */}
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <span>{face.face}</span>
              <span>Pain Assessment & Score</span>
            </span>
            <span className={cn("text-xs font-bold px-2.5 py-0.5 rounded-full border", face.color)}>
              Score: {record.painScore}/10 — {face.label}
            </span>
          </div>

          <div className="text-xs text-slate-700 flex flex-wrap gap-x-4 gap-y-1">
            <span><b>Type:</b> {record.painType || 'Acute'} Pain</span>
            {record.painIntensity && <span><b>Intensity:</b> {record.painIntensity}</span>}
            {record.painLocation && <span><b>Location:</b> {record.painLocation}</span>}
            {record.painDuration && <span><b>Duration:</b> {record.painDuration}</span>}
          </div>

          {(record.painActionTaken || record.painActionTakenFreeText) && (
            <div className="p-2 bg-white rounded-lg border border-amber-200 text-xs text-slate-800 space-y-1">
              <div><b>Action Taken:</b> {record.painActionTaken || 'Standard nursing care'}</div>
              {record.painActionTakenFreeText && <div><b>Clinical Notes:</b> {record.painActionTakenFreeText}</div>}
              {record.painReliefStatus && <div className="text-teal-800 font-bold">Relief Status: {record.painReliefStatus}</div>}
            </div>
          )}

          {/* Shift Pain Logs in View */}
          {record.shiftPainLogs && record.shiftPainLogs.length > 0 && (
            <div className="mt-2 pt-2 border-t border-amber-200">
              <div className="text-xs font-bold text-amber-900 mb-1">Shift Pain Re-Assessment History:</div>
              <div className="space-y-1">
                {record.shiftPainLogs.map(l => (
                  <div key={l.id} className="text-xs bg-white p-1.5 rounded border border-amber-100 flex items-center justify-between">
                    <span>⏰ {l.time} · Score: <b>{l.painScore}/10</b> ({l.painLocation || 'General'})</span>
                    <span>{l.actionTaken || l.actionTakenFreeText} · <b className="text-teal-700">{l.reliefStatus}</b></span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Aligned Vital Signs */}
        <div>
          <div className="text-xs font-bold uppercase text-slate-400 mb-2">Vital Signs (Aligned Clinical Record)</div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {[
              ['Temp', `${record.tempF}°F`],
              ['Pulse', `${record.pulse} bpm`],
              ['BP', `${record.bpSys}/${record.bpDia} mmHg`],
              ['SpO₂', `${record.spo2}%`],
              ['RR', `${record.rr}/min`],
              ['Blood Sugar', `${record.bloodSugarMgDl ?? 110} mg/dL`],
              ['Weight', `${record.weightKg} kg`],
              ['GCS', `${record.gcs}/15`],
            ].map(([l, v]) => (
              <div key={l} className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                <div className="text-[10px] text-slate-400 uppercase">{l}</div>
                <div className="text-xs font-bold text-slate-800">{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ADL Assessment in View */}
        {record.adlScore !== undefined && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase text-slate-700">Activities of Daily Living (ADL) Status</span>
              <span className="text-xs font-bold text-teal-800">Score {record.adlScore}/12 — {record.adlCategory || 'Independent'}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs text-slate-600 mt-2">
              <div>Bathing: <b>{record.adlBathing === 0 ? 'Indep.' : record.adlBathing === 1 ? 'Assist.' : 'Depend.'}</b></div>
              <div>Dressing: <b>{record.adlDressing === 0 ? 'Indep.' : record.adlDressing === 1 ? 'Assist.' : 'Depend.'}</b></div>
              <div>Toileting: <b>{record.adlToileting === 0 ? 'Indep.' : record.adlToileting === 1 ? 'Assist.' : 'Depend.'}</b></div>
              <div>Transfer: <b>{record.adlTransfer === 0 ? 'Indep.' : record.adlTransfer === 1 ? 'Assist.' : 'Depend.'}</b></div>
              <div>Feeding: <b>{record.adlFeeding === 0 ? 'Indep.' : record.adlFeeding === 1 ? 'Assist.' : 'Depend.'}</b></div>
              <div>Continence: <b>{record.adlContinence === 0 ? 'Cont.' : 'Incont.'}</b></div>
            </div>
          </div>
        )}

        {/* Pressure Ulcer Assessment in View */}
        {record.puPresent && (
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1 text-xs">
            <div className="font-bold text-amber-900 uppercase">Pressure Ulcer Documentation</div>
            <p><b>Location:</b> {record.puLocation} · <b>Stage:</b> {record.puStage} ({record.puBeforeAfter})</p>
            {record.puLengthCm ? <p><b>Size:</b> {record.puLengthCm}cm × {record.puWidthCm}cm × {record.puDepthCm}cm</p> : null}
            {record.puInterventions && <p><b>Treatment:</b> {record.puInterventions}</p>}
          </div>
        )}

        {/* Phlebitis in View */}
        {record.phlebitisAssessed && (
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1 text-xs">
            <div className="font-bold text-blue-900 uppercase">VIP Phlebitis Monitoring</div>
            <p><b>Site:</b> {record.phlebitisIvSite} ({record.phlebitisCannulaGauge}) · <b>VIP Score:</b> Grade {record.phlebitisVipScore ?? 0}</p>
            {record.phlebitisNotes && <p><b>Remarks:</b> {record.phlebitisNotes}</p>}
          </div>
        )}

        {/* Risk Scores */}
        <div>
          <div className="text-xs font-bold uppercase text-slate-400 mb-2">Risk Assessment Summary</div>
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
                </div>
              );
            })}
          </div>
        </div>

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
