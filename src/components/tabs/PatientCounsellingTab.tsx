'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useEMR } from '@/context/EMRContext';
import { generateId, nowDateStr, nowTimeStr } from '@/lib/store';
import { formatDate, cn } from '@/lib/utils';
import {
  StatusBadge,
  CardHeader,
  TealButton,
  SoftButton,
  FormGroup,
  FormInput,
  FormSelect,
  FormTextarea,
  EmptyState,
} from '@/components/FormDrawer';
import {
  Plus,
  Save,
  Printer,
  FileEdit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  RotateCcw,
  BookOpen,
  Calendar,
  Building,
  User,
  HeartHandshake,
  PenTool,
  Eraser,
  FileText
} from 'lucide-react';
import type {
  PatientCounsellingForm,
  CounsellingTeachingEntry,
  CounsellingProvider,
  TeachingMethodCode,
  OutcomeCode,
  RecordStatus,
} from '@/lib/types';

// ============================================================
// Constants matching PDF specification exactly
// ============================================================

export const BARRIERS_TO_LEARNING = [
  'None',
  'Limited Reading Abilities',
  'Religious / Cultural Factors',
  'Cognitive Limitations – unable to understand and follow directions',
  'Vision/Hearing Limitations',
  'Physical barriers',
  'Language barriers',
  'Low motivation / desire to learning',
] as const;

export const PLAN_TO_ADDRESS_FACTORS = [
  'Use of interpreter',
  'Educate family',
  'Simple language',
  'Written instructions',
] as const;

export const WRITTEN_MATERIAL_OPTIONS = [
  'Patient Guide Book',
  'Room Charges Information',
  'Health Information',
  'Rights & Responsibility',
  'Grievance Handling mechanism',
  'Importance of Infection control & responsibility of visitors',
] as const;

export const PROVIDER_LEARNING_NEEDS: Record<CounsellingProvider, string[]> = {
  Doctor: [
    'Safe use of Medication & Side effects',
    'Disease Specific',
    'Pre-Op Instructions / Implant',
    'Post op/Sedation Instructions',
    'Immunization',
  ],
  Nurse: [
    'Pain Management',
    'Fall Prevention',
    'Safe use of equipment',
    'Hospital Acquired Infections',
  ],
  Dietician: [
    'Dietary Intervention',
    'Food & Drug Interaction',
  ],
  'Floor Co-ordinator': [
    'Delay in Services',
  ],
  Physiotherapy: [
    'Exercises Explanation',
  ],
};

const DEFAULT_PROVIDERS: CounsellingProvider[] = [
  'Doctor',
  'Nurse',
  'Dietician',
  'Floor Co-ordinator',
  'Physiotherapy',
];

// Helper to create empty counselling entry
function createEmptyEntry(provider: CounsellingProvider, defaultDate = nowDateStr(), defaultTime = nowTimeStr()): CounsellingTeachingEntry {
  return {
    id: generateId(),
    provider,
    date: defaultDate,
    time: defaultTime,
    patientOrRelativeName: '',
    relation: 'Self',
    learningNeeds: [],
    customLearningTopic: '',
    teachingMethods: [],
    outcomes: [],
    staffSign: '',
    staffEid: '',
  };
}

// Canvas-based Signature Pad Component
interface SignaturePadProps {
  label: string;
  signName: string;
  onSignNameChange: (name: string) => void;
  signatureDataUrl?: string;
  onSignatureChange: (dataUrl: string) => void;
  placeholder?: string;
}

function SignaturePad({
  label,
  signName,
  onSignNameChange,
  signatureDataUrl,
  onSignatureChange,
  placeholder = 'Type name / initial',
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Load existing signature data URL if present
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (signatureDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasDrawn(true);
      };
      img.src = signatureDataUrl;
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(false);
    }
  }, [signatureDataUrl]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0F766E';
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onSignatureChange(canvas.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setHasDrawn(false);
    onSignatureChange('');
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
          {label}
        </label>
        {hasDrawn && (
          <button
            type="button"
            onClick={clearCanvas}
            className="text-[11px] text-red-500 hover:text-red-700 flex items-center gap-1 no-print"
          >
            <Eraser size={12} /> Clear Draw
          </button>
        )}
      </div>

      <input
        type="text"
        value={signName}
        onChange={(e) => onSignNameChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100"
      />

      <div className="relative border border-dashed border-slate-300 rounded-lg bg-slate-50 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={280}
          height={75}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-[75px] cursor-crosshair touch-none"
        />
        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs italic">
            <PenTool size={13} className="mr-1.5 opacity-60" /> Draw electronic signature here
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Main Patient Counselling Tab Component
// ============================================================

export function PatientCounsellingTab() {
  const { store, selectedPatient, updateStore } = useEMR();

  if (!selectedPatient) return null;
  const patientId = selectedPatient.id;

  // Retrieve all counselling forms for current patient
  const patientForms = (store.patientCounsellingForms || []).filter(
    (f) => f.patientId === patientId
  );

  // Active form ID being viewed or edited
  const [activeFormId, setActiveFormId] = useState<string | null>(
    patientForms[0]?.id || null
  );

  // Success message toast
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Initialize form state
  const getInitialState = useCallback((): PatientCounsellingForm => {
    return {
      id: generateId(),
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      uhid: selectedPatient.uhid,
      department: selectedPatient.department || 'General Medicine',
      assessmentDate: selectedPatient.admissionDate || nowDateStr(),
      ipdNo: selectedPatient.ipdNo || '',
      barriersToLearning: ['None'],
      socialReligiousEducationalNeeds: '',
      mentionBarriers: '',
      religiousCulturalFactors: '',
      planToAddressFactors: ['Simple language'],
      writtenMaterialGiven: ['Patient Guide Book', 'Rights & Responsibility'],
      completedBy: 'Sr. Sampat Jain',
      completedTime: nowTimeStr(),
      admissionStaffSignWithId: 'Sr. Sampat Jain (EID-N742)',
      counsellingEntries: DEFAULT_PROVIDERS.map((p) =>
        createEmptyEntry(p, selectedPatient.admissionDate || nowDateStr(), nowTimeStr())
      ),
      patientNameAndSign: selectedPatient.name,
      patientSignatureDataUrl: '',
      patientRelativeNameAndSign: selectedPatient.emergencyContactName || '',
      relationshipWithPatient: 'Attendant',
      relativeSignatureDataUrl: '',
      signatureDateTime: `${nowDateStr()} ${nowTimeStr()}`,
      status: 'Completed',
      createdAt: new Date().toISOString(),
    };
  }, [selectedPatient]);

  const [formData, setFormData] = useState<PatientCounsellingForm>(() => {
    const existing = patientForms.find((f) => f.id === activeFormId);
    return existing ? { ...existing } : getInitialState();
  });

  // When activeFormId changes or patientForms change, load into formData
  useEffect(() => {
    if (activeFormId) {
      const match = (store.patientCounsellingForms || []).find(
        (f) => f.id === activeFormId && f.patientId === patientId
      );
      if (match) {
        setFormData({ ...match });
        return;
      }
    }
    // If no form selected or current patient has no forms, load new template
    if (patientForms.length > 0) {
      setActiveFormId(patientForms[0].id);
      setFormData({ ...patientForms[0] });
    } else {
      setActiveFormId(null);
      setFormData(getInitialState());
    }
  }, [activeFormId, patientId, store.patientCounsellingForms]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle switching to create a new form
  function handleNewForm() {
    const blank = getInitialState();
    setActiveFormId(null);
    setFormData(blank);
  }

  // Handle Barrier checkbox change with mutual exclusion for "None"
  function handleBarrierToggle(barrier: string) {
    setFormData((prev) => {
      const current = prev.barriersToLearning || [];
      if (barrier === 'None') {
        // If "None" was clicked and is already checked, unchecking it empties list
        if (current.includes('None')) {
          return { ...prev, barriersToLearning: [] };
        }
        // If "None" is checked, clear all other selections
        return { ...prev, barriersToLearning: ['None'] };
      } else {
        // If another barrier is clicked, remove 'None' and toggle this barrier
        const withoutNone = current.filter((b) => b !== 'None');
        if (withoutNone.includes(barrier)) {
          return {
            ...prev,
            barriersToLearning: withoutNone.filter((b) => b !== barrier),
          };
        } else {
          return {
            ...prev,
            barriersToLearning: [...withoutNone, barrier],
          };
        }
      }
    });
  }

  // Handle Plan to Address Factors toggle
  function handlePlanToggle(factor: string) {
    setFormData((prev) => {
      const current = prev.planToAddressFactors || [];
      const updated = current.includes(factor)
        ? current.filter((f) => f !== factor)
        : [...current, factor];
      return { ...prev, planToAddressFactors: updated };
    });
  }

  // Handle Written Material toggle
  function handleMaterialToggle(material: string) {
    setFormData((prev) => {
      const current = prev.writtenMaterialGiven || [];
      const updated = current.includes(material)
        ? current.filter((m) => m !== material)
        : [...current, material];
      return { ...prev, writtenMaterialGiven: updated };
    });
  }

  // Update a specific counselling entry
  function updateEntry(
    id: string,
    field: keyof CounsellingTeachingEntry,
    value: unknown
  ) {
    setFormData((prev) => ({
      ...prev,
      counsellingEntries: prev.counsellingEntries.map((e) =>
        e.id === id ? { ...e, [field]: value } : e
      ),
    }));
  }

  // Toggle learning need in an entry
  function toggleEntryLearningNeed(entryId: string, need: string) {
    setFormData((prev) => ({
      ...prev,
      counsellingEntries: prev.counsellingEntries.map((e) => {
        if (e.id !== entryId) return e;
        const current = e.learningNeeds || [];
        const updated = current.includes(need)
          ? current.filter((n) => n !== need)
          : [...current, need];
        return { ...e, learningNeeds: updated };
      }),
    }));
  }

  // Toggle teaching method in an entry
  function toggleEntryMethod(entryId: string, method: TeachingMethodCode) {
    setFormData((prev) => ({
      ...prev,
      counsellingEntries: prev.counsellingEntries.map((e) => {
        if (e.id !== entryId) return e;
        const current = e.teachingMethods || [];
        const updated = current.includes(method)
          ? current.filter((m) => m !== method)
          : [...current, method];
        return { ...e, teachingMethods: updated };
      }),
    }));
  }

  // Toggle outcome in an entry
  function toggleEntryOutcome(entryId: string, outcome: OutcomeCode) {
    setFormData((prev) => ({
      ...prev,
      counsellingEntries: prev.counsellingEntries.map((e) => {
        if (e.id !== entryId) return e;
        const current = e.outcomes || [];
        const updated = current.includes(outcome)
          ? current.filter((o) => o !== outcome)
          : [...current, outcome];
        return { ...e, outcomes: updated };
      }),
    }));
  }

  // Add custom or additional counselling entry row
  function handleAddCounsellingRow(provider: CounsellingProvider = 'Nurse') {
    const newEntry = createEmptyEntry(
      provider,
      formData.assessmentDate || nowDateStr(),
      nowTimeStr()
    );
    setFormData((prev) => ({
      ...prev,
      counsellingEntries: [...prev.counsellingEntries, newEntry],
    }));
  }

  // Remove a counselling entry
  function handleRemoveEntry(id: string) {
    setFormData((prev) => ({
      ...prev,
      counsellingEntries: prev.counsellingEntries.filter((e) => e.id !== id),
    }));
  }

  // Save the form
  function handleSave(status: RecordStatus = 'Completed') {
    if (!selectedPatient) return;
    const toSave: PatientCounsellingForm = {
      ...formData,
      status,
      patientId,
      patientName: selectedPatient.name,
      uhid: selectedPatient.uhid,
      department: selectedPatient.department || formData.department,
      ipdNo: selectedPatient.ipdNo || formData.ipdNo,
      updatedAt: new Date().toISOString(),
    };

    updateStore((prev) => {
      const existingForms = prev.patientCounsellingForms || [];
      const matchIndex = existingForms.findIndex((f) => f.id === toSave.id);

      let updatedList: PatientCounsellingForm[];
      if (matchIndex >= 0) {
        updatedList = existingForms.map((f, i) => (i === matchIndex ? toSave : f));
      } else {
        updatedList = [...existingForms, toSave];
      }

      return {
        ...prev,
        patientCounsellingForms: updatedList,
      };
    });

    setActiveFormId(toSave.id);
    setSaveSuccessMsg(
      status === 'Completed'
        ? 'Patient & Family Counselling Form saved successfully!'
        : 'Draft saved successfully!'
    );
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  }

  // Handle Print
  function handlePrint() {
    window.print();
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-12">
      {/* Toast Alert */}
      {saveSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm animate-fade-in no-print">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 size={18} className="text-emerald-600" />
            {saveSuccessMsg}
          </div>
          <button
            onClick={() => setSaveSuccessMsg(null)}
            className="text-xs text-emerald-600 hover:text-emerald-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Action Bar & Records History Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs no-print">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
            <HeartHandshake size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Patient &amp; Family Counselling Form
            </h3>
            <p className="text-xs text-slate-500">
              Form Code: <span className="font-semibold text-teal-700">ASH/COU/1</span> • Anand Surgical Hospital
            </p>
          </div>
        </div>

        {/* Existing Record Switcher & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {patientForms.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 mr-2">
              <span className="font-medium">Records:</span>
              <select
                value={activeFormId || ''}
                onChange={(e) => setActiveFormId(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-800 font-medium focus:outline-none focus:border-teal-400"
              >
                {patientForms.map((f, idx) => (
                  <option key={f.id} value={f.id}>
                    Record #{idx + 1} ({formatDate(f.assessmentDate)}) — {f.status}
                  </option>
                ))}
              </select>
            </div>
          )}

          <SoftButton onClick={handleNewForm} size="sm">
            <Plus size={13} /> New Form
          </SoftButton>

          <SoftButton onClick={handlePrint} size="sm">
            <Printer size={13} /> Print Form
          </SoftButton>

          <button
            type="button"
            onClick={() => handleSave('Draft')}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors flex items-center gap-1.5"
          >
            <FileEdit size={13} /> Save Draft
          </button>

          <TealButton onClick={() => handleSave('Completed')} size="sm">
            <Save size={13} /> Save Form
          </TealButton>
        </div>
      </div>

      {/* Main Printable Counselling Document Container */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden print:border-none print:shadow-none print:p-0">
        {/* Document Header matching PDF */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 print:bg-white print:border-b-2 print:border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xl shadow-sm print:border print:border-slate-800">
                ASH
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  ANAND SURGICAL HOSPITAL PVT. LTD.
                </h1>
                <p className="text-xs text-slate-600">
                  Memco Cross Road, Naroda Road, Ahmedabad-382345
                </p>
                <p className="text-[11px] text-slate-500">
                  Mo.: 88662 10666, 88662 12666, 88668 12666
                </p>
              </div>
            </div>

            {/* Addressograph Box matching PDF */}
            <div className="border border-dashed border-slate-300 rounded-lg p-2.5 bg-white text-right min-w-[200px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                ADDRESSOGRAPH / STICKER
              </span>
              <div className="text-xs font-semibold text-slate-800">
                {selectedPatient.name}
              </div>
              <div className="text-[11px] text-slate-500">
                UHID: <span className="font-mono text-slate-700">{selectedPatient.uhid}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                IPD: <span className="font-mono text-slate-700">{selectedPatient.ipdNo || 'IPD-ACTIVE'}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 text-center">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-wide">
              Patient &amp; Family Counselling Form
            </h2>
            <div className="inline-block mt-1 px-3 py-0.5 rounded-full bg-teal-50 text-teal-800 text-xs font-medium border border-teal-200">
              To be filled at the time of Admission. Use Key below.
            </div>
          </div>

          {/* Patient Details Row auto-populated from admission */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3 bg-white p-3 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">
                Name of Patient
              </span>
              <span className="font-bold text-slate-800">{selectedPatient.name}</span>
            </div>

            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">
                UHID No.
              </span>
              <span className="font-mono font-semibold text-slate-800">{selectedPatient.uhid}</span>
            </div>

            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">
                Department
              </span>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData((p) => ({ ...p, department: e.target.value }))}
                className="w-full font-semibold text-slate-800 bg-transparent border-b border-slate-200 focus:outline-none focus:border-teal-400 text-xs"
              />
            </div>

            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">
                Assessment Date
              </span>
              <input
                type="date"
                value={formData.assessmentDate}
                onChange={(e) => setFormData((p) => ({ ...p, assessmentDate: e.target.value }))}
                className="w-full font-semibold text-slate-800 bg-transparent border-b border-slate-200 focus:outline-none focus:border-teal-400 text-xs"
              />
            </div>

            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">
                IPD / Adm. No.
              </span>
              <span className="font-mono font-semibold text-slate-800">
                {selectedPatient.ipdNo || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION 1: ASSESSMENT - BARRIERS & PLAN (GRID MATCHING PDF) */}
        {/* ============================================================ */}
        <div className="p-5 border-b border-slate-200">
          <div className="text-xs font-bold uppercase tracking-wider text-teal-800 mb-3 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-500"></span>
            Assessment: Admission Learning Barriers &amp; Intervention Plan
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left Column: Barriers to learning */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/30 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-2 mb-3 flex items-center justify-between">
                  <span>Barriers to learning</span>
                  <span className="text-[10px] font-normal text-slate-500 lowercase">
                    (select applicable)
                  </span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  {BARRIERS_TO_LEARNING.map((b) => {
                    const isChecked = (formData.barriersToLearning || []).includes(b);
                    return (
                      <label
                        key={b}
                        className={cn(
                          'flex items-start gap-2 p-2 rounded-lg text-xs cursor-pointer border transition-colors select-none',
                          isChecked
                            ? 'bg-teal-50/80 border-teal-300 text-teal-900 font-medium'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleBarrierToggle(b)}
                          className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                        <span className="leading-tight">{b}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Text Fields under Barriers matching PDF */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <FormGroup label="Social / Religious or any other Educational Needs:">
                  <FormInput
                    value={formData.socialReligiousEducationalNeeds}
                    onChange={(v) =>
                      setFormData((p) => ({ ...p, socialReligiousEducationalNeeds: v }))
                    }
                    placeholder="Enter social, religious, or custom educational needs..."
                  />
                </FormGroup>

                <FormGroup label="Mention Barriers:">
                  <FormInput
                    value={formData.mentionBarriers}
                    onChange={(v) =>
                      setFormData((p) => ({ ...p, mentionBarriers: v }))
                    }
                    placeholder="Describe specific learning barriers encountered..."
                  />
                </FormGroup>
              </div>
            </div>

            {/* Right Column: Plan to address Factors & Written Material */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/30 flex flex-col justify-between">
              <div>
                {/* Plan to address factors */}
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-2 mb-3 flex items-center justify-between">
                  <span>Plan to address Factors</span>
                  <span className="text-[10px] font-normal text-slate-500 lowercase">
                    (select applicable)
                  </span>
                </h4>

                <div className="grid grid-cols-2 gap-2 mb-5">
                  {PLAN_TO_ADDRESS_FACTORS.map((f) => {
                    const isChecked = (formData.planToAddressFactors || []).includes(f);
                    return (
                      <label
                        key={f}
                        className={cn(
                          'flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer border transition-colors select-none',
                          isChecked
                            ? 'bg-teal-50/80 border-teal-300 text-teal-900 font-medium'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handlePlanToggle(f)}
                          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                        <span>{f}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Written material given and explained (if any) */}
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-2 mb-3 flex items-center justify-between">
                  <span>Written material given and explained (if any):</span>
                  <span className="text-[10px] font-normal text-slate-500 lowercase">
                    (handed to patient)
                  </span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  {WRITTEN_MATERIAL_OPTIONS.map((m) => {
                    const isChecked = (formData.writtenMaterialGiven || []).includes(m);
                    return (
                      <label
                        key={m}
                        className={cn(
                          'flex items-start gap-2 p-2 rounded-lg text-xs cursor-pointer border transition-colors select-none',
                          isChecked
                            ? 'bg-blue-50/80 border-blue-300 text-blue-900 font-medium'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleMaterialToggle(m)}
                          className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="leading-tight">{m}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Religious / Cultural Factors text field */}
              <div className="pt-3 border-t border-slate-200">
                <FormGroup label="Religious / Cultural Factors:">
                  <FormInput
                    value={formData.religiousCulturalFactors}
                    onChange={(v) =>
                      setFormData((p) => ({ ...p, religiousCulturalFactors: v }))
                    }
                    placeholder="Enter any religious or cultural factors to observe..."
                  />
                </FormGroup>
              </div>
            </div>
          </div>

          {/* Admission Staff Sign-off Row matching PDF */}
          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormGroup label="Completed By:">
              <FormInput
                value={formData.completedBy}
                onChange={(v) => setFormData((p) => ({ ...p, completedBy: v }))}
                placeholder="Staff nurse / coordinator name"
              />
            </FormGroup>

            <FormGroup label="Time:">
              <FormInput
                type="time"
                value={formData.completedTime}
                onChange={(v) => setFormData((p) => ({ ...p, completedTime: v }))}
              />
            </FormGroup>

            <FormGroup label="Admission Staff Sign with ID:">
              <FormInput
                value={formData.admissionStaffSignWithId}
                onChange={(v) =>
                  setFormData((p) => ({ ...p, admissionStaffSignWithId: v }))
                }
                placeholder="e.g. Sr. Sampat Jain (EID-N742)"
              />
            </FormGroup>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION 2: COUNSELLING & TEACHING RECORD TABLE               */}
        {/* ============================================================ */}
        <div className="p-5 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                Counselling and Teaching Record
              </div>
              <p className="text-xs text-slate-500 italic mt-0.5">
                To be filled as and when required. Use Key below (On Admission)
              </p>
            </div>

            {/* Abbreviation Legend Banner matching PDF */}
            <div className="px-3 py-1.5 bg-slate-100 rounded-lg text-[11px] text-slate-700 border border-slate-200">
              <span className="font-bold text-slate-800">Abbreviation: </span>
              <span className="font-semibold text-teal-700">D</span> – Demonstration,{' '}
              <span className="font-semibold text-teal-700">OD</span> – Oral Discussion,{' '}
              <span className="font-semibold text-teal-700">W</span> – Written Material,{' '}
              <span className="font-semibold text-blue-700">RD</span> – Return Demonstration,{' '}
              <span className="font-semibold text-blue-700">VU</span> – Verbal Understanding
            </div>
          </div>

          {/* Counselling Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold uppercase text-[11px]">
                  <th className="p-2.5 w-28">Date &amp; Provider</th>
                  <th className="p-2.5 w-44">Name Patient / Relative (Relation) &amp; Time</th>
                  <th className="p-2.5 min-w-[280px]">
                    Learning Needs <span className="font-normal text-[10px] lowercase">(write down topic if not mentioned)</span>
                  </th>
                  <th className="p-2.5 w-28 text-center">Teaching Method</th>
                  <th className="p-2.5 w-24 text-center">Outcomes</th>
                  <th className="p-2.5 w-36">Sign with EID</th>
                  <th className="p-2.5 w-10 text-center no-print"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {formData.counsellingEntries.map((entry, index) => {
                  const standardNeeds = PROVIDER_LEARNING_NEEDS[entry.provider] || [];

                  return (
                    <tr
                      key={entry.id}
                      className={cn(
                        'hover:bg-slate-50/60 transition-colors align-top',
                        index % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                      )}
                    >
                      {/* 1. Date & Provider */}
                      <td className="p-2.5 border-r border-slate-100">
                        <div className="font-bold text-slate-900 text-xs mb-1">
                          {entry.provider}
                        </div>
                        <input
                          type="date"
                          value={entry.date}
                          onChange={(e) => updateEntry(entry.id, 'date', e.target.value)}
                          className="w-full px-1.5 py-1 text-[11px] border border-slate-200 rounded bg-white text-slate-700 focus:outline-none focus:border-teal-400"
                        />
                      </td>

                      {/* 2. Patient / Relative & Time */}
                      <td className="p-2.5 border-r border-slate-100 space-y-1.5">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-400 uppercase block">
                            Name Patient / Relative:
                          </label>
                          <input
                            type="text"
                            value={entry.patientOrRelativeName}
                            onChange={(e) =>
                              updateEntry(entry.id, 'patientOrRelativeName', e.target.value)
                            }
                            placeholder="Patient or relative name"
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white text-slate-800 focus:outline-none focus:border-teal-400"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <label className="text-[10px] font-semibold text-slate-400 uppercase block">
                              Relation:
                            </label>
                            <input
                              type="text"
                              value={entry.relation}
                              onChange={(e) => updateEntry(entry.id, 'relation', e.target.value)}
                              placeholder="Self, Wife..."
                              className="w-full px-1.5 py-1 text-xs border border-slate-200 rounded bg-white text-slate-800 focus:outline-none focus:border-teal-400"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-semibold text-slate-400 uppercase block">
                              Time:
                            </label>
                            <input
                              type="time"
                              value={entry.time}
                              onChange={(e) => updateEntry(entry.id, 'time', e.target.value)}
                              className="w-full px-1.5 py-1 text-xs border border-slate-200 rounded bg-white text-slate-800 focus:outline-none focus:border-teal-400"
                            />
                          </div>
                        </div>
                      </td>

                      {/* 3. Learning Needs */}
                      <td className="p-2.5 border-r border-slate-100">
                        <div className="space-y-1 mb-2">
                          {standardNeeds.map((need) => {
                            const isChecked = (entry.learningNeeds || []).includes(need);
                            return (
                              <label
                                key={need}
                                className={cn(
                                  'flex items-center gap-1.5 px-2 py-0.5 rounded cursor-pointer text-xs select-none',
                                  isChecked
                                    ? 'bg-teal-50 text-teal-900 font-medium'
                                    : 'text-slate-700 hover:bg-slate-100'
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleEntryLearningNeed(entry.id, need)}
                                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                />
                                <span>{need}</span>
                              </label>
                            );
                          })}
                        </div>

                        {/* Custom Topic Input */}
                        <div className="mt-1.5 pt-1.5 border-t border-slate-100">
                          <label className="text-[10px] text-slate-400 font-medium block mb-0.5">
                            Other / Custom Topic (if not listed above):
                          </label>
                          <input
                            type="text"
                            value={entry.customLearningTopic || ''}
                            onChange={(e) =>
                              updateEntry(entry.id, 'customLearningTopic', e.target.value)
                            }
                            placeholder="Write down topic if not mentioned..."
                            className="w-full px-2 py-1 text-xs border border-dashed border-slate-300 rounded bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-400"
                          />
                        </div>
                      </td>

                      {/* 4. Teaching Method (D, OD, W) */}
                      <td className="p-2.5 border-r border-slate-100 text-center">
                        <div className="flex flex-col gap-1.5 items-center justify-center">
                          {(['D', 'OD', 'W'] as TeachingMethodCode[]).map((method) => {
                            const isChecked = (entry.teachingMethods || []).includes(method);
                            return (
                              <label
                                key={method}
                                className={cn(
                                  'flex items-center gap-1 px-2 py-0.5 rounded border text-xs cursor-pointer select-none font-bold w-16 justify-center',
                                  isChecked
                                    ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleEntryMethod(entry.id, method)}
                                  className="sr-only"
                                />
                                <span>{method}</span>
                              </label>
                            );
                          })}
                        </div>
                      </td>

                      {/* 5. Outcomes (RD, VU) */}
                      <td className="p-2.5 border-r border-slate-100 text-center">
                        <div className="flex flex-col gap-1.5 items-center justify-center">
                          {(['RD', 'VU'] as OutcomeCode[]).map((outcome) => {
                            const isChecked = (entry.outcomes || []).includes(outcome);
                            return (
                              <label
                                key={outcome}
                                className={cn(
                                  'flex items-center gap-1 px-2 py-0.5 rounded border text-xs cursor-pointer select-none font-bold w-16 justify-center',
                                  isChecked
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleEntryOutcome(entry.id, outcome)}
                                  className="sr-only"
                                />
                                <span>{outcome}</span>
                              </label>
                            );
                          })}
                        </div>
                      </td>

                      {/* 6. Sign with EID */}
                      <td className="p-2.5 border-r border-slate-100 space-y-1.5">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-400 uppercase block">
                            Staff Sign / Name:
                          </label>
                          <input
                            type="text"
                            value={entry.staffSign}
                            onChange={(e) => updateEntry(entry.id, 'staffSign', e.target.value)}
                            placeholder="Staff name / sign"
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white text-slate-800 focus:outline-none focus:border-teal-400"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-slate-400 uppercase block">
                            Employee ID (EID):
                          </label>
                          <input
                            type="text"
                            value={entry.staffEid}
                            onChange={(e) => updateEntry(entry.id, 'staffEid', e.target.value)}
                            placeholder="e.g. DOC-104 / NUR-742"
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white text-slate-800 font-mono focus:outline-none focus:border-teal-400"
                          />
                        </div>
                      </td>

                      {/* 7. Action */}
                      <td className="p-2.5 text-center no-print">
                        <button
                          type="button"
                          onClick={() => handleRemoveEntry(entry.id)}
                          title="Remove Entry"
                          className="text-slate-300 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Add Further Counselling Row Button */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 no-print">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Add session for:</span>
              {(['Doctor', 'Nurse', 'Dietician', 'Floor Co-ordinator', 'Physiotherapy'] as CounsellingProvider[]).map(
                (p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleAddCounsellingRow(p)}
                    className="px-2 py-1 border border-slate-200 rounded hover:border-teal-400 hover:text-teal-700 bg-white text-[11px] font-medium transition-colors"
                  >
                    + {p}
                  </button>
                )
              )}
            </div>

            <button
              type="button"
              onClick={() => handleAddCounsellingRow('Nurse')}
              className="text-xs text-teal-600 hover:text-teal-800 font-semibold flex items-center gap-1"
            >
              <Plus size={14} /> Add Row
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION 3: PATIENT & RELATIVE SIGNATURES (MATCHING PDF)     */}
        {/* ============================================================ */}
        <div className="p-5 bg-slate-50/50">
          <div className="text-xs font-bold uppercase tracking-wider text-teal-800 mb-3 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-500"></span>
            Patient &amp; Attendant Sign-off Acknowledgement
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Patient Signature Card */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
              <SignaturePad
                label="Name and Sign of Patient:"
                signName={formData.patientNameAndSign}
                onSignNameChange={(v) =>
                  setFormData((p) => ({ ...p, patientNameAndSign: v }))
                }
                signatureDataUrl={formData.patientSignatureDataUrl}
                onSignatureChange={(url) =>
                  setFormData((p) => ({ ...p, patientSignatureDataUrl: url }))
                }
                placeholder="Patient's Full Name"
              />
            </div>

            {/* Relative Signature Card */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs space-y-3">
              <SignaturePad
                label="Name and Sign of Patient Relative:"
                signName={formData.patientRelativeNameAndSign}
                onSignNameChange={(v) =>
                  setFormData((p) => ({ ...p, patientRelativeNameAndSign: v }))
                }
                signatureDataUrl={formData.relativeSignatureDataUrl}
                onSignatureChange={(url) =>
                  setFormData((p) => ({ ...p, relativeSignatureDataUrl: url }))
                }
                placeholder="Relative / Attendant Full Name"
              />

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <FormGroup label="Relationship with Patient:">
                  <FormInput
                    value={formData.relationshipWithPatient}
                    onChange={(v) =>
                      setFormData((p) => ({ ...p, relationshipWithPatient: v }))
                    }
                    placeholder="e.g. Spouse, Son, Mother..."
                  />
                </FormGroup>

                <FormGroup label="Date and Time:">
                  <FormInput
                    value={formData.signatureDateTime}
                    onChange={(v) =>
                      setFormData((p) => ({ ...p, signatureDateTime: v }))
                    }
                    placeholder="YYYY-MM-DD HH:MM"
                  />
                </FormGroup>
              </div>
            </div>
          </div>

          {/* Form Footer matching PDF */}
          <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
            <span>Page 1 of 2</span>
            <span className="font-semibold text-slate-600 font-mono">ASH/COU/1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
