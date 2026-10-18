// ============================================================
// Digital Nursing Care EMR - Core Types
// DEMO APPLICATION - Not for clinical use
// ============================================================

export type Gender = 'Male' | 'Female' | 'Other';
export type Ward = 'General' | 'ICU' | 'CCU' | 'Emergency' | 'Daycare' | 'OT';
export type Shift = 'Morning' | 'Afternoon' | 'Night';
export type Status = 'draft' | 'completed' | 'pending';
export type RecordStatus = 'Draft' | 'Completed' | 'Pending';

export interface Patient {
  id: string;
  uhid: string;
  ipdNo: string;
  name: string;
  age: number;
  gender: Gender;
  ward: Ward;
  bed: string;
  department: string;
  admissionDate: string;
  admissionTime: string;
  consultantDoctor: string;
  diagnosis: string;
  bloodGroup: string;
  contactNo: string;
  address: string;
  emergencyContact: string;
  emergencyContactName: string;
  status: 'Active' | 'Discharged';
}

export interface NursingAssessment {
  id: string;
  patientId: string;
  date: string;
  time: string;
  shift: Shift;
  nurseName: string;
  // Initial assessment specific
  arrivalTime?: string;
  contactPersonName?: string;
  contactPersonRelationship?: string;
  contactPersonPhone?: string;
  patientUncomfortable?: boolean;
  bloodGroup?: string;
  heightCm?: number;
  allergyStatus?: string;
  allergyDetails?: string;
  pastHistory?: string;
  // Vitals
  tempF: number;
  pulse: number;
  bpSys: number;
  bpDia: number;
  spo2: number;
  rr: number;
  weightKg: number;
  // Chief complaints with intensity/duration/action
  chiefComplaints: string;
  painIntensity?: string;
  painDuration?: string;
  painActionTaken?: string;
  // Pain Assessment enhancements
  painScore: number;
  painType?: 'Acute' | 'Chronic';
  painLocation?: string;
  painExpressions?: string[];
  // Patient Counseling (Initial Assessment)
  patientCounselingTopics?: string[];
  counseledBy?: string;
  counseledTo?: string;
  counselingUnderstood?: boolean;
  counselingNotes?: string;
  // Initial Mental Health Assessment
  mentalAppearanceBehavior?: string;
  mentalMoodAffect?: string;
  mentalOrientation?: boolean;
  mentalMemory?: string;
  mentalSleepPattern?: string;
  mentalSpeechThought?: string;
  mentalSuicidalRisk?: string;
  mentalSubstanceHistory?: string;
  mentalNotes?: string;
  // Past Medications History
  pastMedications?: PastMedicationEntry[];
  // Risk Assessment — structured criteria
  fallRiskCriteria?: string[];   // Selected Morse/STRATIFY criteria labels
  fallRiskScore: number;
  fallRiskLevel: string;
  pressureUlcerRiskCriteria?: string[];  // Braden scale items
  pressureUlcerRiskScore?: number;
  pressureUlcerRisk?: string;
  dvtRiskCriteria?: string[];
  dvtRiskScore?: number;
  dvtRisk?: string;
  // Previous Risk tracking in Reassessment
  previousFallRiskScore?: number;
  previousFallRiskLevel?: string;
  previousPressureUlcerRisk?: string;
  previousPressureUlcerScore?: number;
  previousDVTRisk?: string;
  previousDVTScore?: number;
  previousRiskAssessedDate?: string;
  // Nutritional Assessment (MNA-SF embedded — Initial only)
  mnaFoodIntakeDecline?: 0 | 1 | 2;
  mnaWeightLoss?: 0 | 1 | 2 | 3;
  mnaMobility?: 0 | 1 | 2;
  mnaAcuteDisease?: 0 | 2;
  mnaNeuropsychological?: 0 | 1 | 2;
  mnaBodyHabitus?: 0 | 1 | 2 | 3;
  mnaTotalScore?: number;
  mnaResult?: string;
  // Consciousness
  gcs: number;
  levelOfConsciousness: string;
  // Skin
  skinCondition: string;
  // Notes
  notes: string;
  interventions: string;
  nurseSignature: string;
  status: RecordStatus;
  createdAt: string;
}

export interface PastMedicationEntry {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  route: string;
  duration: string;
  indication: string;
}

export interface VitalSigns {
  id: string;
  patientId: string;
  date: string;
  time: string;
  shift: Shift;
  nurseName: string;
  tempF: number;
  pulse: number;
  bpSys: number;
  bpDia: number;
  spo2: number;
  rr: number;
  weightKg: number;
  painScore?: number;
  painIntensity?: string;
  painLocation?: string;
  painActionTaken?: string;
  status: RecordStatus;
  createdAt: string;
}

export interface IOChartEntry {
  id: string;
  patientId: string;
  date: string;
  time: string;
  shift: Shift;
  nurseName: string;
  // Intake
  oralIntake: number;
  rtIntake: number;
  infusion: number;
  antibiotic: number;
  ivFluids: number;
  intakeOther: number;
  intakeOtherLabel: string;
  // Output
  urineOutput: number;
  drainOutput: number;
  vomit: number;
  stool: number;
  rtAspiration: number;
  outputOther: number;
  // Remarks
  remarks: string;
  status: RecordStatus;
  createdAt: string;
}

export interface NursingNote {
  id: string;
  patientId: string;
  date: string;
  time: string;
  shift: Shift;
  noteType: 'Progress' | 'Nursing' | 'Observation';
  note: string;
  nurseName: string;
  status: RecordStatus;
  createdAt: string;
}

export interface PressureUlcerAssessment {
  id: string;
  patientId: string;
  date: string;
  time: string;
  nurseName: string;
  ulcerPresent: boolean;
  location: string;
  stage: string;
  length: number;
  width: number;
  depth: number;
  // Predisposing factors
  beforeAfter?: 'Before Admission' | 'After Admission';
  obesity: boolean;
  obesityWeight?: number;
  underweight: boolean;
  underweightWeight?: number;
  poorGlycaemicControl: boolean;
  bloodSugar?: number;
  thrombocytopenia: boolean;
  plateletCount?: number;
  hypoproteinemia: boolean;
  proteinLevel?: number;
  otherFactor: boolean;
  otherFactorDetail?: string;
  // Preventive measures
  airBed: boolean;
  positionChange: boolean;
  dressingApplied: boolean;
  backCare?: boolean;
  preventiveOther: boolean;
  preventiveOtherDetail?: string;
  noPreventiveReason?: string;
  status: RecordStatus;
  createdAt: string;
}

export interface PressureUlcerMonitoring {
  id: string;
  assessmentId: string;
  patientId: string;
  date: string;
  time: string;
  nurseName: string;
  location: string;
  stage: string;
  length: number;
  width: number;
  depth: number;
  woundBedCondition: string;
  surroundingSkinCondition: string;
  discharge: string;
  dressingTreatment: string;
  progress: 'Improving' | 'Unchanged' | 'Worsening' | 'Healed';
  actions: string;
  remarks: string;
  status: RecordStatus;
  createdAt: string;
}

export interface CatheterCare {
  id: string;
  patientId: string;
  date: string;
  time: string;
  nurseName: string;
  catheterType: string;
  catheterPosition?: 'Inside' | 'Outside';
  safetyChecklist?: (boolean | null)[];
  insertionDate: string;
  insertionTime: string;
  siteCondition: string;
  patency: string;
  urineCharacteristics: string;
  urineOutputMl: number;
  carePerformed: string;
  complications: string;
  complicationUTI?: string;
  complicationBlockage?: string;
  complicationLeakage?: string;
  actionTaken: string;
  removalDate?: string;
  removalTime?: string;
  removalReason?: string;
  status: RecordStatus;
  createdAt: string;
}

export interface BundleCare {
  id: string;
  patientId: string;
  date: string;
  time: string;
  nurseName: string;
  bundleType: 'Urinary Catheter Care' | 'Central Catheter Care' | 'Critical Care' | 'Ventilator Care';
  tubeType?: string;           // Selected tube/device from category options
  insertionDate?: string;
  insertionTime?: string;
  removalDate?: string;
  removalTime?: string;
  items: BundleItem[];
  remarks: string;
  correctiveAction: string;
  status: RecordStatus;
  createdAt: string;
}

export interface BundleItem {
  id: string;
  label: string;
  value: 'Yes' | 'No' | 'N/A';
  remarks?: string;
}

export interface PatientTransfer {
  id: string;
  patientId: string;
  date: string;
  time: string;
  nurseName: string;
  fromLocation: string;
  toLocation: string;
  reason: string;
  patientCondition: string;
  vitalsBp: string;
  vitalsPulse: number;
  vitalsTemp: number;
  vitalsRr: number;
  vitalsSpo2: number;
  ongoingTreatment: string;
  medications: string;
  lines: string;
  summary: string;
  accompanyingStaff: string;
  belongingsStatus: string;
  pendingReports: string;
  receivingStaff: string;
  // SBAR
  situation: string;
  background: string;
  assessment: string;
  recommendations: string;
  status: RecordStatus;
  createdAt: string;
}

export interface PreOpChecklist {
  id: string;
  patientId: string;
  date: string;
  time: string;
  nurseName: string;
  plannedSurgery: string;
  items: PreOpChecklistItem[];
  remarks: string;
  status: RecordStatus;
  createdAt: string;
}

// Alias for backwards compat
export type PreOpItem = PreOpChecklistItem;

export interface PreOpChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  details?: string;
}

export interface ValuableItem {
  id: string;
  patientId: string;
  handoverDate: string;
  handoverTime: string;
  staffName: string;
  receiverName: string;
  receiverRelationship: string;
  items: ValuableItemEntry[];
  nurseSignature?: string;     // Nurse signature
  receiverSignature?: string;  // Receiver signature
  status: RecordStatus;
  createdAt: string;
}

export interface ValuableItemEntry {
  id: string;
  name: string;
  quantity: number;
  description: string;
}

export interface EmergencyAssessment {
  id: string;
  patientId: string;
  date: string;
  time: string;
  nurseName: string;
  triageCategory: 'Red (Immediate)' | 'Yellow (Urgent)' | 'Green (Non-Urgent)' | 'Black (Expectant)';
  chiefComplaints: string;
  painIntensity?: string;
  painDuration?: string;
  painActionTaken?: string;
  bpSys: number;
  bpDia: number;
  pulse: number;
  tempF: number;
  rr: number;
  spo2: number;
  gcs: number;
  levelOfConsciousness: string;
  painScore: number;
  painLocation: string;
  allergyStatus: string;
  allergyDetails?: string;
  immediateInterventions: string;
  abnormalFindings: string;
  escalation: string;
  status: RecordStatus;
  createdAt: string;
}

export interface DaycareAssessment {
  id: string;
  patientId: string;
  date: string;
  time: string;
  nurseName: string;
  procedurePlanned: string;
  bpSys: number;
  bpDia: number;
  pulse: number;
  tempF: number;
  rr: number;
  spo2: number;
  allergyStatus: string;
  fastingStatus: string;
  premedication: string;
  ivAccessSite: string;
  consentObtained: boolean;
  postProcedureCondition: string;
  dischargeFitness: string;
  dischargeInstructions: string;
  escortName: string;
  notes: string;
  status: RecordStatus;
  createdAt: string;
}

export interface RMOHandover {
  id: string;
  patientId: string;
  date: string;
  time: string;
  fromConsultant: string;
  toConsultant: string;
  patientCondition: string;
  clinicalSummary: string;
  treatmentPlan: string;
  medications: string;
  pendingTasks: string;
  handoverNotes: string;
  acknowledgement: string;
  // Doctor assessment additions & auto-filled nurse vitals/pain
  assessmentType?: 'Doctor Assessment' | 'RMO Handover' | 'Doctor Round Note';
  doctorName?: string;
  nurseVitalsSummary?: string;
  nursePainRecord?: string;
  latestPainScore?: number;
  status: RecordStatus;
  createdAt: string;
}

export interface ShiftHandover {
  id: string;
  patientId: string;
  date: string;
  fromShift: Shift;
  toShift: Shift;
  outgoingNurse: string;
  incomingNurse: string;
  patientCondition: string;
  pendingTasks: string;
  medicationsGiven: string;
  specialInstructions: string;
  vitalsAtHandover: string;
  incidentsReported: string;
  status: RecordStatus;
  createdAt: string;
}

export interface PhysiotherapyAssessment {
  id: string;
  patientId: string;
  date: string;
  time: string;
  physiotherapistName: string;
  referringDoctor: string;
  referralDate: string;
  diagnosis: string;
  chiefComplaints: string;
  painScore: number;
  painLocation: string;
  bpSys: number;
  bpDia: number;
  pulse: number;
  tempF: number;
  rr: number;
  spo2: number;
  precautions: string;
  functionalStatus: string;
  mobilityStatus: string;
  musculoskeletalAssessment: string;
  neurologicalAssessment: string;
  cardiopulmonaryAssessment: string;
  fallRiskScore: number;
  consentRecorded: boolean;
  clinicalImpression: string;
  shortTermGoals: string;
  longTermGoals: string;
  treatmentPlan: string;
  patientEducation: string;
  status: RecordStatus;
  createdAt: string;
}

export interface PhysiotherapySession {
  id: string;
  assessmentId: string;
  patientId: string;
  date: string;
  time: string;
  physiotherapistName: string;
  treatmentGiven: string;
  patientResponse: string;
  painScore: number;
  progressTowardsGoals: string;
  treatmentPlanChange: string;
  dischargeAdvice: string;
  status: RecordStatus;
  createdAt: string;
}

export interface MedicationReconciliation {
  id: string;
  patientId: string;
  date: string;
  time: string;
  outgoingNurse: string;
  incomingNurse: string;
  medications: MedReconciliationEntry[];
  // Reconciliation Type: Transfer, Discharge, or Shift Count
  reconciliationType?: 'Shift Count' | 'Transfer' | 'Discharge' | 'Admission';
  transferFrom?: string;
  transferTo?: string;
  doctorOrderVerified?: boolean;
  transferRecalculatedBy?: string;
  dischargeSummaryVerified?: boolean;
  counseledToPatient?: boolean;
  consultantName?: string;
  status: RecordStatus;
  createdAt: string;
}

export interface MedReconciliationEntry {
  id: string;
  medicineName: string;
  previousBalance: number;
  quantityReceived: number;
  quantityAdministered: number;
  remainingQuantity: number;
  discrepancyRemarks?: string;
  // Transfer & Discharge additions
  dosage?: string;
  frequency?: string;
  route?: string;
  actionDecision?: 'Continue' | 'Continue at Home' | 'Stop / Discontinue' | 'Discontinued / Stopped' | 'Dose Changed' | 'Dose Modified' | 'New Order Added' | 'Modified';
  source?: 'Inpatient Medication' | 'Home Medication' | 'Discharge Rx';
  dischargeInstructions?: string;
  daysPrescribed?: string;
}
// Alias for components that import under the longer name
export type MedicationReconciliationEntry = MedReconciliationEntry;

export interface PatientOwnMedication {
  id: string;
  patientId: string;
  date: string;
  nurseName: string;
  medications: OwnMedicationEntry[];
  status: RecordStatus;
  createdAt: string;
}

export interface OwnMedicationEntry {
  id: string;
  medicineName: string;
  strength: string;
  dosage: string;
  frequency: string;
  duration: string;
  approvalStatus: 'Pending Approval' | 'Approved' | 'Not Approved' | 'Rejected' | 'Discontinued';
  verificationStatus: 'Unverified' | 'Verified' | 'Pending';
  consultantApproval?: string;
  changes?: string;
}
// Alias
export type PatientOwnMedicationEntry = OwnMedicationEntry;
export type HomeMedication = PatientOwnMedication;
export type HomeMedicationEntry = OwnMedicationEntry;

export interface HospitalBed {
  id: string;
  bedNo: string;
  ward: 'ICU' | 'CCU' | 'Emergency' | 'General';
  status: 'Occupied' | 'Available' | 'Maintenance' | 'Cleaning';
  patientId?: string;
  ventilatorId?: string;
  hasVentilator: boolean;
  hasDialysis: boolean;
}

export interface VentilatorDevice {
  id: string;
  deviceCode: string;
  model: string;
  ward: 'ICU' | 'CCU' | 'Emergency';
  bedNo?: string;
  patientId?: string;
  status: 'In Use' | 'Available' | 'Standby' | 'Maintenance';
  mode: string;
  fio2: number;
  peep: number;
  tv: number;
  rr: number;
  peakPressure?: number;
  etco2?: number;
}

export interface HospitalStaff {
  id: string;
  name: string;
  role: 'Doctor' | 'Nurse' | 'RMO' | 'Consultant' | 'Technician' | 'Admin' | 'Reception';
  department: string;
  shift: 'Morning' | 'Evening' | 'Night' | 'General';
  phone: string;
  onDuty: boolean;
  assignedBeds?: string[];
}

export interface ClinicalAlert {
  id: string;
  patientId: string;
  patientName: string;
  bedNo: string;
  ward: string;
  parameter: string;
  value: string | number;
  threshold: string;
  severity: 'Critical' | 'Warning' | 'Watch';
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface LabReportItem {
  parameter: string;
  value: string;
  numericValue?: number;
  unit: string;
  referenceRange: string;
  flag: 'Normal' | 'High' | 'Low' | 'Critical';
}

export interface PatientLabReport {
  id: string;
  patientId: string;
  testCategory: 'CBC' | 'RFT' | 'LFT' | 'Electrolytes' | 'Coagulation' | 'ABG' | 'Blood Culture' | 'Chest X-Ray' | 'ECG';
  orderedBy: string;
  dateTime: string;
  status: 'Completed' | 'Pending' | 'Sample Collected';
  items: LabReportItem[];
  findings?: string;
  attachmentName?: string;
}

export interface InfusionRecord {
  id: string;
  patientId: string;
  drugName: string;
  dose: string;
  dilution: string;
  rateMlHr: number;
  doseRateMcgKgMin?: number;
  route: string;
  startedAt: string;
  endedAt?: string;
  nurseName: string;
  status: 'Active' | 'Paused' | 'Completed' | 'Titrated';
  notes?: string;
}

export interface ProcedureEvent {
  id: string;
  patientId: string;
  dateTime: string;
  procedureType: 'Intubation' | 'Central Line' | 'Arterial Line' | 'Hemodialysis' | 'CPR' | 'Extubation' | 'Chest Tube / Drain' | 'Tracheostomy' | 'Other';
  performerName: string;
  assistingNurse: string;
  site?: string;
  complications?: string;
  notes: string;
}

export interface ClinicalScoreRecord {
  id: string;
  patientId: string;
  dateTime: string;
  scoreType: 'GCS' | 'SOFA' | 'NEWS2';
  totalScore: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  components: Record<string, number | string>;
  evaluatedBy: string;
}

export interface ICUChart {
  id: string;
  patientId: string;
  date: string;
  time: string;
  shift?: string;
  nurseName: string;
  ioSourceId?: string; // Links to IOChartEntry — auto-populated when created from I/O chart
  
  // Vitals matching ICU.pdf
  bpSys: number;
  bpDia: number;
  map?: number;
  pulse: number;
  tempF: number;
  rr: number;
  spo2: number;
  cvp?: number;
  painScore?: number;
  gcs: number;
  levelOfConsciousness: string;
  bloodSugar?: number;
  
  // Additional Monitoring Rows (ICU.pdf below graph)
  heartRhythm?: string;
  rhythm?: string;
  sedationScore?: string;
  sedation?: string;
  abdominalGirthCm?: number; // A.G. (c.m.)
  positionSuction?: string; // POS/SUCT
  
  // Drugs & Infusions (ICU.pdf)
  insulinMoa?: string; // M.O.A. / INSULIN
  medicationInfusion?: string;
  infusion1Name?: string;
  infusion1Rate?: string;
  infusion2Name?: string;
  infusion2Rate?: string;
  infusion3Name?: string;
  infusion3Rate?: string;
  infusion4Name?: string;
  infusion4Rate?: string;

  // Intake Section (ICU.pdf)
  bolusIntake?: number; // BOLUS
  hourlyIvIntake?: number; // HOURLY I.V.
  cumulativeIvIntake?: number; // CUMULATIVE I.V.
  oralRtFeedType?: string; // ORAL / R.T.
  oralRtAmount?: number; // AMOUNT
  cumulativeOralRt?: number; // CUMULATIVE
  hourlyTotalIntake?: number; // TOTAL INTAKE (hourly)
  intakeTotal?: number; // Cumulative or slot intake
  totalIntake?: number;
  oralIntake?: number;
  ivFluids?: number;

  // Output Section (ICU.pdf)
  vomitAspirate?: number; // VOMIT / ASPIRATE
  hourlyUrine?: number; // HOURLY URINE
  cumulativeUrine?: number; // CUMULATIVE URINE
  bowels?: string; // BOWELS
  drain1Name?: string;
  drain1Amount?: number; // DRAIN - I
  drain2Name?: string;
  drain2Amount?: number; // DRAIN - II
  hourlyTotalOutput?: number; // TOTAL OUTPUT (hourly)
  outputTotal?: number; // Cumulative or slot output
  totalOutput?: number;
  urineOutput?: number;
  drainOutput?: number;
  ioBalance?: number;
  hourlyBalance?: number;

  // Ventilator & Respiratory (ICU.pdf Page 2)
  ventilatorStatus?: string;
  ventilatorMode?: string;
  fio2?: number;
  fiO2?: number;
  peep?: number;
  tv?: number;
  ventRate?: number;
  pressSupport?: number;
  tubeSize?: string;
  tubeTiedAt?: string;

  // ABG fields
  abgPh?: number;
  abgPao2?: number;
  abgPaco2?: number;
  abgHco3?: number;
  lactate?: number;
  peakPressure?: number;
  etco2?: number;

  // GCS components & Pupils (Page 2)
  gcsEyes?: number;
  gcsVerbal?: number;
  gcsMotor?: number;
  pupilSizeRight?: number;
  pupilReactRight?: 'Normal' | 'Sluggish' | 'Fixed';
  pupilSizeLeft?: number;
  pupilReactLeft?: 'Normal' | 'Sluggish' | 'Fixed';

  // Observations & Audit
  nursingObservations?: string;
  abnormalFindings?: string;
  remarks?: string;
  doctorInformed?: boolean;
  doctorName?: string;
  escalationTime?: string;
  status: RecordStatus;
  createdAt: string;
}

export interface DiabeticFlowChart {
  id: string;
  patientId: string;
  date: string;
  time: string;
  nurseName: string;
  glucoseMgDl: number;
  testType: 'Fasting' | 'Post-Prandial' | 'Random' | 'Bedside';
  mealStatus: 'Fasting' | 'Post-Meal' | 'Pre-Meal' | 'Random';
  insulinGiven: boolean;
  insulinType?: string;
  dose?: number;
  isHypoglycaemia: boolean;
  isHyperglycaemia: boolean;
  actionTaken: string;
  remarks: string;
  status: RecordStatus;
  createdAt: string;
}

export interface PhlebitisAssessment {
  id: string;
  patientId: string;
  date: string;
  time: string;
  nurseName: string;
  ivSite: string;
  insertionDate?: string;
  insertionTime?: string;
  removalDate?: string;
  removalTime?: string;
  pain: 'None' | 'Mild' | 'Moderate' | 'Severe';
  redness: boolean;
  swelling: boolean;
  warmth: boolean;
  phlebitisGrade: 0 | 1 | 2 | 3 | 4 | 5;  // Grade 0-5 (Grade 5: Severe phlebitis)
  actionTaken: string;
  remarks: string;
  status: RecordStatus;
  createdAt: string;
}

export interface MiniNutritionalAssessment {
  id: string;
  patientId: string;
  date: string;
  nurseName: string;
  foodIntakeDecline: 0 | 1 | 2;
  weightLoss: 0 | 1 | 2 | 3;
  mobility: 0 | 1 | 2;
  acuteDisease: 0 | 2;
  neuropsychological: 0 | 1 | 2;
  bodyHabitus: 0 | 1 | 2 | 3;
  totalScore: number;
  screeningResult: 'Normal Nutritional Status' | 'At Risk of Malnutrition' | 'Malnourished';
  status: RecordStatus;
  createdAt: string;
}

// Form Master & Field Master
export interface FormMaster {
  id: string;
  formName: string;
  formCode: string;
  nursingModule: string;
  sectionName: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface FieldMaster {
  id: string;
  formId: string;
  fieldKey: string;
  fieldLabel: string;
  fieldType: 'text' | 'textarea' | 'number' | 'date' | 'time' | 'dropdown' | 'radio' | 'checkbox' | 'multi-select' | 'yes-no' | 'yesno';
  section: string;
  isRequired: boolean;
  dropdownOptions?: string[];
  placeholder?: string;
  minValue?: number;
  maxValue?: number;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

// ============================================================
// Patient & Family Counselling Form Types (ASH/COU/1)
// ============================================================
export type CounsellingProvider = 'Doctor' | 'Nurse' | 'Dietician' | 'Floor Co-ordinator' | 'Physiotherapy';
export type TeachingMethodCode = 'D' | 'OD' | 'W';
export type OutcomeCode = 'RD' | 'VU';

export interface CounsellingTeachingEntry {
  id: string;
  provider: CounsellingProvider;
  date: string;
  time: string;
  patientOrRelativeName: string;
  relation: string;
  learningNeeds: string[];
  customLearningTopic?: string;
  teachingMethods: TeachingMethodCode[];
  outcomes: OutcomeCode[];
  staffSign: string;
  staffEid: string;
}

export interface PatientCounsellingForm {
  id: string;
  patientId: string;
  patientName: string;
  uhid: string;
  department: string;
  assessmentDate: string;
  ipdNo: string;
  // Barriers to learning
  barriersToLearning: string[];
  socialReligiousEducationalNeeds: string;
  mentionBarriers: string;
  religiousCulturalFactors: string;
  // Plan to address factors
  planToAddressFactors: string[];
  // Written material given and explained
  writtenMaterialGiven: string[];
  // Admission assessment sign-off
  completedBy: string;
  completedTime: string;
  admissionStaffSignWithId: string;
  // Counselling entries
  counsellingEntries: CounsellingTeachingEntry[];
  // Patient & Relative Signatures
  patientNameAndSign: string;
  patientSignatureDataUrl?: string;
  patientRelativeNameAndSign: string;
  relationshipWithPatient: string;
  relativeSignatureDataUrl?: string;
  signatureDateTime: string;
  // Status and metadata
  status: RecordStatus;
  createdAt: string;
  updatedAt?: string;
}

// ============================================================
// Family Education Module Types
// ============================================================
export interface FamilyEducationRecord {
  id: string;
  patientId: string;
  date: string;
  time: string;
  educationTopics: string[];
  customTopic?: string;
  instructionsGiven: string;
  educatedPersonName: string;
  relationship: string;
  teachingMethods: string[];
  understandingFeedback: string;
  additionalRemarks: string;
  educatorName: string;
  educatorDesignation?: string;
  educatorSignature: string;
  status: RecordStatus;
  createdAt: string;
  updatedAt?: string;
}

// Store all data
export interface EMRStore {
  patients: Patient[];
  nursingAssessments: NursingAssessment[];
  vitalSigns: VitalSigns[];
  ioChart: IOChartEntry[];
  nursingNotes: NursingNote[];
  pressureUlcerAssessments: PressureUlcerAssessment[];
  pressureUlcerMonitoring: PressureUlcerMonitoring[];
  catheterCare: CatheterCare[];
  bundleCare: BundleCare[];
  patientTransfers: PatientTransfer[];
  preOpChecklists: PreOpChecklist[];
  valuableItems: ValuableItem[];
  emergencyAssessments: EmergencyAssessment[];
  daycareAssessments: DaycareAssessment[];
  rmoHandovers: RMOHandover[];
  shiftHandovers: ShiftHandover[];
  physiotherapyAssessments: PhysiotherapyAssessment[];
  physiotherapySessions: PhysiotherapySession[];
  medicationReconciliations: MedicationReconciliation[];
  patientOwnMedications: PatientOwnMedication[];
  icuCharts: ICUChart[];
  diabeticFlowCharts: DiabeticFlowChart[];
  phlebitisAssessments: PhlebitisAssessment[];
  miniNutritionalAssessments: MiniNutritionalAssessment[];
  patientCounsellingForms?: PatientCounsellingForm[];
  familyEducationRecords?: FamilyEducationRecord[];
  formMaster: FormMaster[];
  fieldMaster: FieldMaster[];
  beds?: HospitalBed[];
  ventilators?: VentilatorDevice[];
  staff?: HospitalStaff[];
  alerts?: ClinicalAlert[];
  labReports?: PatientLabReport[];
  infusions?: InfusionRecord[];
  procedures?: ProcedureEvent[];
  clinicalScores?: ClinicalScoreRecord[];
}
