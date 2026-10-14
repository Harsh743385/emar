import type { HospitalBed, VentilatorDevice, HospitalStaff, ClinicalAlert, PatientLabReport, InfusionRecord, ProcedureEvent, ClinicalScoreRecord, ICUChart, Patient } from './types';

// ============================================================
// Hospital Beds Mock Data
// ============================================================
export const INITIAL_BEDS: HospitalBed[] = [
  { id: 'BED-ICU-1', bedNo: 'ICU-1', ward: 'ICU', status: 'Occupied', patientId: 'P006', ventilatorId: 'VENT-01', hasVentilator: true, hasDialysis: true },
  { id: 'BED-ICU-2', bedNo: 'ICU-2', ward: 'ICU', status: 'Occupied', patientId: 'P007', ventilatorId: 'VENT-02', hasVentilator: true, hasDialysis: false },
  { id: 'BED-ICU-3', bedNo: 'ICU-3', ward: 'ICU', status: 'Occupied', patientId: 'P003', ventilatorId: 'VENT-03', hasVentilator: true, hasDialysis: true },
  { id: 'BED-ICU-4', bedNo: 'ICU-4', ward: 'ICU', status: 'Available', hasVentilator: true, hasDialysis: false },
  { id: 'BED-ICU-5', bedNo: 'ICU-5', ward: 'ICU', status: 'Available', hasVentilator: true, hasDialysis: false },
  { id: 'BED-ICU-6', bedNo: 'ICU-6', ward: 'ICU', status: 'Cleaning', hasVentilator: true, hasDialysis: true },
  { id: 'BED-CCU-1', bedNo: 'CCU-1', ward: 'CCU', status: 'Occupied', patientId: 'P008', hasVentilator: false, hasDialysis: false },
  { id: 'BED-CCU-2', bedNo: 'CCU-2', ward: 'CCU', status: 'Occupied', patientId: 'P009', hasVentilator: false, hasDialysis: false },
  { id: 'BED-CCU-3', bedNo: 'CCU-3', ward: 'CCU', status: 'Available', hasVentilator: false, hasDialysis: false },
  { id: 'BED-CCU-4', bedNo: 'CCU-4', ward: 'CCU', status: 'Available', hasVentilator: false, hasDialysis: false },
  { id: 'BED-ER-1', bedNo: 'ER-1', ward: 'Emergency', status: 'Occupied', patientId: 'P010', ventilatorId: 'VENT-04', hasVentilator: true, hasDialysis: false },
  { id: 'BED-ER-2', bedNo: 'ER-2', ward: 'Emergency', status: 'Occupied', patientId: 'P005', hasVentilator: false, hasDialysis: false },
  { id: 'BED-ER-3', bedNo: 'ER-3', ward: 'Emergency', status: 'Available', hasVentilator: true, hasDialysis: false },
  { id: 'BED-ER-4', bedNo: 'ER-4', ward: 'Emergency', status: 'Available', hasVentilator: false, hasDialysis: false },
];

// ============================================================
// Ventilator Devices
// ============================================================
export const INITIAL_VENTILATORS: VentilatorDevice[] = [
  { id: 'VENT-01', deviceCode: 'VENT-ICU-01', model: 'Dräger Evita V800', ward: 'ICU', bedNo: 'ICU-1', patientId: 'P006', status: 'In Use', mode: 'PRVC', fio2: 65, peep: 10, tv: 420, rr: 20, peakPressure: 28, etco2: 38 },
  { id: 'VENT-02', deviceCode: 'VENT-ICU-02', model: 'Hamilton G5', ward: 'ICU', bedNo: 'ICU-2', patientId: 'P007', status: 'In Use', mode: 'SIMV-PS', fio2: 45, peep: 6, tv: 460, rr: 14, peakPressure: 22, etco2: 35 },
  { id: 'VENT-03', deviceCode: 'VENT-ICU-03', model: 'Maquet Servo-i', ward: 'ICU', bedNo: 'ICU-3', patientId: 'P003', status: 'In Use', mode: 'Volume Control', fio2: 60, peep: 8, tv: 450, rr: 18, peakPressure: 26, etco2: 40 },
  { id: 'VENT-04', deviceCode: 'VENT-ER-01', model: 'Mindray SV300', ward: 'Emergency', bedNo: 'ER-1', patientId: 'P010', status: 'In Use', mode: 'AC/VC', fio2: 100, peep: 12, tv: 480, rr: 22, peakPressure: 32, etco2: 44 },
  { id: 'VENT-05', deviceCode: 'VENT-ICU-04', model: 'Philips Respironics V60', ward: 'ICU', status: 'Available', mode: 'NIV-BiPAP', fio2: 40, peep: 5, tv: 500, rr: 14 },
  { id: 'VENT-06', deviceCode: 'VENT-CCU-01', model: 'Dräger Oxylog 3000+', ward: 'CCU', status: 'Available', mode: 'CPAP', fio2: 35, peep: 5, tv: 450, rr: 12 },
  { id: 'VENT-07', deviceCode: 'VENT-ICU-05', model: 'Maquet Servo-u', ward: 'ICU', status: 'Standby', mode: 'SIMV', fio2: 40, peep: 5, tv: 450, rr: 16 },
  { id: 'VENT-08', deviceCode: 'VENT-SPARE', model: 'Hamilton-C1', ward: 'Emergency', status: 'Maintenance', mode: 'Off', fio2: 21, peep: 0, tv: 0, rr: 0 },
];

// ============================================================
// Hospital Staff
// ============================================================
export const INITIAL_STAFF: HospitalStaff[] = [
  { id: 'STF-01', name: 'Dr. Sagar Dhonde', role: 'Consultant', department: 'Critical Care / Intensivist', shift: 'Morning', phone: '9820011223', onDuty: true, assignedBeds: ['ICU-1', 'ICU-2', 'ICU-3'] },
  { id: 'STF-02', name: 'Dr. Anand Bhanushali', role: 'Doctor', department: 'Internal Medicine / Cardiology', shift: 'Morning', phone: '9820033445', onDuty: true, assignedBeds: ['CCU-1', 'CCU-2'] },
  { id: 'STF-03', name: 'Dr. Deepak Yadav', role: 'Doctor', department: 'Emergency Medicine', shift: 'Morning', phone: '9820055667', onDuty: true, assignedBeds: ['ER-1', 'ER-2'] },
  { id: 'STF-04', name: 'Dr. Manoj Chawla', role: 'RMO', department: 'ICU Resident', shift: 'Morning', phone: '9820077889', onDuty: true, assignedBeds: ['ICU-1', 'ICU-3'] },
  { id: 'STF-05', name: 'Sr. Sampat Jain', role: 'Nurse', department: 'ICU Nursing Incharge', shift: 'Morning', phone: '9820099001', onDuty: true, assignedBeds: ['ICU-3'] },
  { id: 'STF-06', name: 'Sr. Kavita Bhosale', role: 'Nurse', department: 'ICU Staff Nurse', shift: 'Morning', phone: '9820022334', onDuty: true, assignedBeds: ['ICU-1', 'ICU-2'] },
  { id: 'STF-07', name: 'Sr. Neha Sharma', role: 'Nurse', department: 'CCU Staff Nurse', shift: 'Morning', phone: '9820044556', onDuty: true, assignedBeds: ['CCU-1', 'CCU-2'] },
  { id: 'STF-08', name: 'Sr. Sunita Gaikwad', role: 'Nurse', department: 'Emergency Triage Nurse', shift: 'Morning', phone: '9820066778', onDuty: true, assignedBeds: ['ER-1', 'ER-2'] },
  { id: 'STF-09', name: 'Pooja Kulkarni', role: 'Reception', department: 'Admission Desk', shift: 'General', phone: '9820088990', onDuty: true },
  { id: 'STF-10', name: 'Admin User', role: 'Admin', department: 'Hospital Administration', shift: 'General', phone: '9820000111', onDuty: true },
];

// ============================================================
// Clinical Alerts
// ============================================================
export const INITIAL_ALERTS: ClinicalAlert[] = [
  { id: 'ALT-01', patientId: 'P003', patientName: 'Mohammed Irfan Sheikh', bedNo: 'ICU-3', ward: 'ICU', parameter: 'SpO₂ Low', value: '91%', threshold: '< 92%', severity: 'Critical', timestamp: '10 mins ago', acknowledged: false },
  { id: 'ALT-02', patientId: 'P003', patientName: 'Mohammed Irfan Sheikh', bedNo: 'ICU-3', ward: 'ICU', parameter: 'Blood Pressure', value: '88/54 mmHg', threshold: 'SBP < 90', severity: 'Critical', timestamp: '25 mins ago', acknowledged: false },
  { id: 'ALT-03', patientId: 'P006', patientName: 'Vikramaditya Solanki', bedNo: 'ICU-1', ward: 'ICU', parameter: 'Heart Rate High', value: '136 bpm', threshold: '> 130 bpm', severity: 'Warning', timestamp: '40 mins ago', acknowledged: true, acknowledgedBy: 'Sr. Kavita Bhosale', acknowledgedAt: '2026-10-14 09:15' },
  { id: 'ALT-04', patientId: 'P010', patientName: 'Gurpreet Singh', bedNo: 'ER-1', ward: 'Emergency', parameter: 'Temperature High', value: '102.6 °F', threshold: '> 102 °F', severity: 'Warning', timestamp: '1 hour ago', acknowledged: true, acknowledgedBy: 'Dr. Deepak Yadav', acknowledgedAt: '2026-10-14 08:30' },
];

// ============================================================
// Additional Patients for ICU & CCU
// ============================================================
export const ADDITIONAL_PATIENTS: Patient[] = [
  {
    id: 'P006',
    uhid: 'NHC/2026-27/006',
    ipdNo: 'IPD/2026-27/0201',
    name: 'Vikramaditya Solanki',
    age: 62,
    gender: 'Male',
    ward: 'ICU',
    bed: 'ICU-1',
    department: 'Critical Care',
    admissionDate: '2026-10-12',
    admissionTime: '02:15',
    consultantDoctor: 'Dr. Sagar Dhonde',
    diagnosis: 'Severe Sepsis with ARDS & Multiorgan Dysfunction',
    bloodGroup: 'B+',
    contactNo: '9811223344',
    address: '42, C.G. Road, Ahmedabad - 380009',
    emergencyContact: '9811223355',
    emergencyContactName: 'Bhavna Solanki (Wife)',
    status: 'Active',
  },
  {
    id: 'P007',
    uhid: 'NHC/2026-27/007',
    ipdNo: 'IPD/2026-27/0205',
    name: 'Ananya Sen',
    age: 54,
    gender: 'Female',
    ward: 'ICU',
    bed: 'ICU-2',
    department: 'Cardiothoracic Surgery',
    admissionDate: '2026-10-13',
    admissionTime: '11:45',
    consultantDoctor: 'Dr. Sagar Dhonde',
    diagnosis: 'Post-CABG Day 2, S/P Triple Vessel Bypass',
    bloodGroup: 'O+',
    contactNo: '9822334455',
    address: '15, Satellite, Ahmedabad - 380015',
    emergencyContact: '9822334466',
    emergencyContactName: 'Subhash Sen (Husband)',
    status: 'Active',
  },
  {
    id: 'P008',
    uhid: 'NHC/2026-27/008',
    ipdNo: 'IPD/2026-27/0211',
    name: 'Harishchandra Dave',
    age: 67,
    gender: 'Male',
    ward: 'CCU',
    bed: 'CCU-1',
    department: 'Cardiology',
    admissionDate: '2026-10-14',
    admissionTime: '06:10',
    consultantDoctor: 'Dr. Anand Bhanushali',
    diagnosis: 'Non-ST Elevation MI with High Troponin-I',
    bloodGroup: 'A-',
    contactNo: '9833445566',
    address: '88, Maninagar, Ahmedabad - 380008',
    emergencyContact: '9833445577',
    emergencyContactName: 'Nirav Dave (Son)',
    status: 'Active',
  },
  {
    id: 'P009',
    uhid: 'NHC/2026-27/009',
    ipdNo: 'IPD/2026-27/0214',
    name: 'Meenakshi Sundaram',
    age: 71,
    gender: 'Female',
    ward: 'CCU',
    bed: 'CCU-2',
    department: 'Cardiology',
    admissionDate: '2026-10-13',
    admissionTime: '21:30',
    consultantDoctor: 'Dr. Anand Bhanushali',
    diagnosis: 'Complete Heart Block with Temporary Pacemaker in situ',
    bloodGroup: 'AB+',
    contactNo: '9844556677',
    address: '102, Ashram Road, Ahmedabad - 380006',
    emergencyContact: '9844556688',
    emergencyContactName: 'Karthik Sundaram (Son)',
    status: 'Active',
  },
  {
    id: 'P010',
    uhid: 'NHC/2026-27/010',
    ipdNo: 'IPD/2026-27/0220',
    name: 'Gurpreet Singh',
    age: 38,
    gender: 'Male',
    ward: 'Emergency',
    bed: 'ER-1',
    department: 'Trauma & Critical Care',
    admissionDate: '2026-10-14',
    admissionTime: '07:25',
    consultantDoctor: 'Dr. Deepak Yadav',
    diagnosis: 'Severe Polytrauma, Hemorrhagic Shock, Pelvic Fracture',
    bloodGroup: 'O-',
    contactNo: '9855667788',
    address: '5, SG Highway, Ahmedabad - 380054',
    emergencyContact: '9855667799',
    emergencyContactName: 'Manpreet Singh (Brother)',
    status: 'Active',
  },
];

// ============================================================
// Lab Reports Mock Data
// ============================================================
export const INITIAL_LAB_REPORTS: PatientLabReport[] = [
  {
    id: 'LAB-01',
    patientId: 'P003',
    testCategory: 'ABG',
    orderedBy: 'Dr. Sagar Dhonde',
    dateTime: '2026-10-14 07:30',
    status: 'Completed',
    findings: 'Metabolic acidosis with partial respiratory compensation. Lactate elevated.',
    items: [
      { parameter: 'pH', value: '7.31', numericValue: 7.31, unit: '', referenceRange: '7.35 - 7.45', flag: 'Low' },
      { parameter: 'PaO₂', value: '82', numericValue: 82, unit: 'mmHg', referenceRange: '80 - 100', flag: 'Normal' },
      { parameter: 'PaCO₂', value: '34', numericValue: 34, unit: 'mmHg', referenceRange: '35 - 45', flag: 'Low' },
      { parameter: 'HCO₃⁻', value: '17.2', numericValue: 17.2, unit: 'mEq/L', referenceRange: '22 - 26', flag: 'Low' },
      { parameter: 'Base Excess', value: '-6.4', numericValue: -6.4, unit: 'mEq/L', referenceRange: '-2 to +2', flag: 'Low' },
      { parameter: 'Lactate', value: '3.4', numericValue: 3.4, unit: 'mmol/L', referenceRange: '0.5 - 2.0', flag: 'Critical' },
      { parameter: 'FiO₂ at test', value: '60', numericValue: 60, unit: '%', referenceRange: '21%', flag: 'High' },
    ],
  },
  {
    id: 'LAB-02',
    patientId: 'P003',
    testCategory: 'RFT',
    orderedBy: 'Dr. Sagar Dhonde',
    dateTime: '2026-10-14 06:00',
    status: 'Completed',
    findings: 'Acute kidney injury stage 2 secondary to cardiogenic shock.',
    items: [
      { parameter: 'Blood Urea', value: '68', numericValue: 68, unit: 'mg/dL', referenceRange: '15 - 45', flag: 'High' },
      { parameter: 'Serum Creatinine', value: '2.4', numericValue: 2.4, unit: 'mg/dL', referenceRange: '0.7 - 1.3', flag: 'Critical' },
      { parameter: 'eGFR', value: '28', numericValue: 28, unit: 'mL/min/1.73m²', referenceRange: '> 90', flag: 'Low' },
      { parameter: 'Sodium (Na⁺)', value: '136', numericValue: 136, unit: 'mEq/L', referenceRange: '135 - 145', flag: 'Normal' },
      { parameter: 'Potassium (K⁺)', value: '4.8', numericValue: 4.8, unit: 'mEq/L', referenceRange: '3.5 - 5.0', flag: 'Normal' },
      { parameter: 'Chloride (Cl⁻)', value: '102', numericValue: 102, unit: 'mEq/L', referenceRange: '98 - 107', flag: 'Normal' },
    ],
  },
  {
    id: 'LAB-03',
    patientId: 'P003',
    testCategory: 'CBC',
    orderedBy: 'Dr. Manoj Chawla',
    dateTime: '2026-10-14 06:00',
    status: 'Completed',
    findings: 'Leukocytosis with neutrophilia.',
    items: [
      { parameter: 'Hemoglobin', value: '11.8', numericValue: 11.8, unit: 'g/dL', referenceRange: '13.0 - 17.0', flag: 'Low' },
      { parameter: 'Total WBC Count', value: '14,200', numericValue: 14200, unit: '/µL', referenceRange: '4,000 - 11,000', flag: 'High' },
      { parameter: 'Neutrophils', value: '84', numericValue: 84, unit: '%', referenceRange: '40 - 75', flag: 'High' },
      { parameter: 'Platelet Count', value: '1,85,000', numericValue: 185000, unit: '/µL', referenceRange: '1,50,000 - 4,50,000', flag: 'Normal' },
      { parameter: 'Hematocrit (PCV)', value: '35.4', numericValue: 35.4, unit: '%', referenceRange: '40 - 50', flag: 'Low' },
    ],
  },
  {
    id: 'LAB-04',
    patientId: 'P003',
    testCategory: 'ECG',
    orderedBy: 'Dr. Anand Bhanushali',
    dateTime: '2026-10-14 08:00',
    status: 'Completed',
    findings: 'Sinus Tachycardia, ST elevation in leads V1-V4 with Q waves, consistent with Acute Anterior Wall MI.',
    items: [
      { parameter: 'Heart Rhythm', value: 'Sinus Tachycardia', unit: '', referenceRange: 'Normal Sinus', flag: 'High' },
      { parameter: 'Ventricular Rate', value: '108 bpm', unit: 'bpm', referenceRange: '60 - 100', flag: 'High' },
      { parameter: 'PR Interval', value: '164 ms', unit: 'ms', referenceRange: '120 - 200', flag: 'Normal' },
      { parameter: 'QRS Duration', value: '98 ms', unit: 'ms', referenceRange: '80 - 120', flag: 'Normal' },
      { parameter: 'QTc Interval', value: '452 ms', unit: 'ms', referenceRange: '< 450', flag: 'High' },
    ],
  },
];

// ============================================================
// Infusion Orders Mock Data
// ============================================================
export const INITIAL_INFUSIONS: InfusionRecord[] = [
  {
    id: 'INF-01',
    patientId: 'P003',
    drugName: 'Noradrenaline (Norepinephrine)',
    dose: '4 mg in 50 mL NS',
    dilution: '80 mcg/mL',
    rateMlHr: 7.5,
    doseRateMcgKgMin: 0.14,
    route: 'Central Line (Triple Lumen CVC)',
    startedAt: '2026-10-13 14:00',
    nurseName: 'Sr. Sampat Jain',
    status: 'Active',
    notes: 'Titrate to keep MAP > 65 mmHg. Currently weaned down from 0.20 to 0.14 mcg/kg/min.',
  },
  {
    id: 'INF-02',
    patientId: 'P003',
    drugName: 'Fentanyl Citrate',
    dose: '1000 mcg in 50 mL NS',
    dilution: '20 mcg/mL',
    rateMlHr: 2.5,
    doseRateMcgKgMin: 0.7,
    route: 'IV Infusion Pump',
    startedAt: '2026-10-13 16:30',
    nurseName: 'Sr. Sampat Jain',
    status: 'Active',
    notes: 'Analgesia for mechanical ventilation. Target CPOT score 0-2.',
  },
  {
    id: 'INF-03',
    patientId: 'P003',
    drugName: 'Regular Insulin (Actrapid)',
    dose: '50 Units in 50 mL NS',
    dilution: '1 Unit/mL',
    rateMlHr: 2.0,
    route: 'IV Syringe Pump',
    startedAt: '2026-10-14 06:00',
    nurseName: 'Sr. Sampat Jain',
    status: 'Active',
    notes: 'Sliding scale infusion. Target BSL: 140 - 180 mg/dL.',
  },
  {
    id: 'INF-04',
    patientId: 'P003',
    drugName: 'Pantoprazole Infusion',
    dose: '80 mg in 100 mL NS',
    dilution: '0.8 mg/mL',
    rateMlHr: 8.0,
    route: 'Peripheral IV',
    startedAt: '2026-10-14 07:00',
    nurseName: 'Sr. Sampat Jain',
    status: 'Active',
    notes: 'Stress ulcer prophylaxis for critically ill patient.',
  },
];

// ============================================================
// Procedure Events
// ============================================================
export const INITIAL_PROCEDURES: ProcedureEvent[] = [
  {
    id: 'PROC-01',
    patientId: 'P003',
    dateTime: '2026-10-11 04:30',
    procedureType: 'Intubation',
    performerName: 'Dr. Sagar Dhonde',
    assistingNurse: 'Sr. Sampat Jain',
    site: 'Oral, ETT size 7.5 cuffed',
    notes: 'Endotracheal intubation under RSI with Propofol and Succinylcholine. Fixed at 21 cm mark. Bilateral air entry equal.',
  },
  {
    id: 'PROC-02',
    patientId: 'P003',
    dateTime: '2026-10-11 05:15',
    procedureType: 'Central Line',
    performerName: 'Dr. Sagar Dhonde',
    assistingNurse: 'Sr. Sampat Jain',
    site: 'Right Internal Jugular Vein (7 Fr Triple Lumen 20 cm)',
    notes: 'USG guided catheterization under sterile precautions. Free venous return in all 3 ports. Post-procedure CXR confirmed tip at cavoatrial junction.',
  },
  {
    id: 'PROC-03',
    patientId: 'P003',
    dateTime: '2026-10-11 06:00',
    procedureType: 'Arterial Line',
    performerName: 'Dr. Manoj Chawla',
    assistingNurse: 'Sr. Kavita Bhosale',
    site: 'Left Radial Artery (20G Arterial Cannula)',
    notes: 'Allen test positive. Connected to invasive transducer for continuous arterial BP monitoring. Good waveform with dicrotic notch.',
  },
];

// ============================================================
// Clinical Scores
// ============================================================
export const INITIAL_SCORES: ClinicalScoreRecord[] = [
  {
    id: 'SCR-01',
    patientId: 'P003',
    dateTime: '2026-10-14 08:00',
    scoreType: 'GCS',
    totalScore: 11,
    riskLevel: 'Moderate',
    components: { eyes: 3, verbal: 3, motor: 5 },
    evaluatedBy: 'Sr. Sampat Jain',
  },
  {
    id: 'SCR-02',
    patientId: 'P003',
    dateTime: '2026-10-14 08:00',
    scoreType: 'SOFA',
    totalScore: 9,
    riskLevel: 'High',
    components: { respiration: 3, coagulation: 0, liver: 1, cardiovascular: 3, cns: 1, renal: 1 },
    evaluatedBy: 'Dr. Manoj Chawla',
  },
  {
    id: 'SCR-03',
    patientId: 'P003',
    dateTime: '2026-10-14 08:00',
    scoreType: 'NEWS2',
    totalScore: 8,
    riskLevel: 'Critical',
    components: { rr: 2, spo2: 2, oxygen: 2, sbp: 1, pulse: 1, consciousness: 0, temp: 0 },
    evaluatedBy: 'Sr. Sampat Jain',
  },
];

// ============================================================
// ============================================================
// Clinical Score Calculators
// ============================================================
export function calculateGCS(eyes: number, verbal: number, motor: number): { score: number; interpretation: string; risk: 'Low' | 'Moderate' | 'High' | 'Critical' } {
  const score = (eyes || 0) + (verbal || 0) + (motor || 0);
  if (score <= 8) return { score, interpretation: 'Severe Head Injury / Coma (GCS ≤ 8)', risk: 'Critical' };
  if (score <= 12) return { score, interpretation: 'Moderate Brain Injury (GCS 9-12)', risk: 'High' };
  if (score <= 14) return { score, interpretation: 'Mild Brain Injury (GCS 13-14)', risk: 'Moderate' };
  return { score, interpretation: 'Fully Conscious & Alert (GCS 15)', risk: 'Low' };
}

export function calculateNEWS2(params: {
  rr: number;
  spo2: number;
  onOxygen: boolean;
  sbp: number;
  pulse: number;
  consciousness: 'Alert' | 'CVPU';
  tempF: number;
}): { score: number; risk: 'Low' | 'Moderate' | 'High' | 'Critical' } {
  let score = 0;
  if (params.rr <= 8 || params.rr >= 25) score += 3;
  else if (params.rr >= 21) score += 2;
  else if (params.rr >= 9 && params.rr <= 11) score += 1;

  if (params.spo2 <= 91) score += 3;
  else if (params.spo2 <= 93) score += 2;
  else if (params.spo2 <= 95) score += 1;

  if (params.onOxygen) score += 2;

  if (params.sbp <= 90 || params.sbp >= 220) score += 3;
  else if (params.sbp <= 100) score += 2;
  else if (params.sbp <= 110) score += 1;

  if (params.pulse <= 40 || params.pulse >= 131) score += 3;
  else if (params.pulse >= 111 || (params.pulse >= 41 && params.pulse <= 50)) score += 1;

  if (params.consciousness !== 'Alert') score += 3;

  if (params.tempF <= 95.0) score += 3;
  else if (params.tempF >= 102.4) score += 2;
  else if ((params.tempF >= 95.1 && params.tempF <= 96.8) || (params.tempF >= 100.5 && params.tempF <= 102.3)) score += 1;

  if (score >= 7) return { score, risk: 'Critical' };
  if (score >= 5) return { score, risk: 'High' };
  if (score >= 1) return { score, risk: 'Moderate' };
  return { score, risk: 'Low' };
}

// ============================================================
// Web Audio Alert Synthesizer
// ============================================================
export function playAlertSound(type: 'critical' | 'warning' = 'critical') {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'critical') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.45);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch {
    // Ignore audio autoplay restrictions
  }
}

// ============================================================
// Export to CSV Utility
// ============================================================
export function exportToCSV(filename: string, rows: Record<string, unknown>[]) {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows
      .map(row => {
        return keys
          .map(k => {
            const val = row[k];
            let cellStr = val === null || val === undefined ? '' : val instanceof Date ? val.toLocaleString() : String(val);
            cellStr = cellStr.replace(/"/g, '""');
            if (cellStr.search(/("|,|\n)/g) >= 0) cellStr = `"${cellStr}"`;
            return cellStr;
          })
          .join(separator);
      })
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
