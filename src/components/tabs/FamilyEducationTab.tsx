'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useEMR } from '@/context/EMRContext';
import { generateId, nowDateStr, nowTimeStr } from '@/lib/store';
import { formatDate, cn } from '@/lib/utils';
import {
  FormDrawer,
  FormGroup,
  FormInput,
  FormSelect,
  FormTextarea,
  SectionTitle,
  StatusBadge,
  EmptyState,
  CardHeader,
  TealButton,
  SoftButton,
} from '@/components/FormDrawer';
import {
  Plus,
  Edit2,
  Trash2,
  GraduationCap,
  Calendar,
  Clock,
  User,
  Users,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  BookOpen,
  Printer,
  PenTool,
  Eraser,
  Heart,
  ShieldCheck,
  FileText
} from 'lucide-react';
import type { FamilyEducationRecord, RecordStatus } from '@/lib/types';

// ============================================================
// Standard Clinical Education Topics (Caregiver/Family Care)
// ============================================================
export const FAMILY_EDUCATION_TOPICS = [
  'Patient care instructions and daily care needs',
  'Medication usage and precautions',
  'Diet and nutrition',
  'Personal hygiene and infection prevention',
  'Fall prevention and patient safety',
  'Wound, catheter, or device care',
  'Warning signs and when to contact hospital staff',
  'Follow-up care and discharge instructions',
];

export const TEACHING_METHODS = [
  'Oral Discussion',
  'Demonstration',
  'Written Material / Pamphlet',
  'Audio-Visual Guide',
  'Return Demonstration',
];

export const UNDERSTANDING_FEEDBACK_OPTIONS = [
  'Understood completely',
  'Understood with queries clarified',
  'Return demonstration successful',
  'Needs re-education / Reinforcement',
  'Caregiver hesitant / Needs further support',
];

export const RELATIONSHIP_OPTIONS = [
  'Spouse',
  'Son',
  'Daughter',
  'Mother',
  'Father',
  'Brother',
  'Sister',
  'Primary Caregiver',
  'Guardian',
  'Attendant',
  'Other',
];

export function FamilyEducationTab() {
  const { store, selectedPatient, updateStore } = useEMR();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [activeDateFilter, setActiveDateFilter] = useState<string>('all');
  const [selectedRecordForView, setSelectedRecordForView] = useState<FamilyEducationRecord | null>(null);

  // Form State
  const [form, setForm] = useState<{
    date: string;
    time: string;
    educationTopics: string[];
    customTopic: string;
    instructionsGiven: string;
    educatedPersonName: string;
    relationship: string;
    teachingMethods: string[];
    understandingFeedback: string;
    additionalRemarks: string;
    educatorName: string;
    educatorDesignation: string;
    educatorSignature: string;
  }>({
    date: nowDateStr(),
    time: nowTimeStr(),
    educationTopics: ['Patient care instructions and daily care needs'],
    customTopic: '',
    instructionsGiven: '',
    educatedPersonName: selectedPatient?.emergencyContactName || '',
    relationship: 'Spouse',
    teachingMethods: ['Oral Discussion', 'Demonstration'],
    understandingFeedback: 'Understood completely',
    additionalRemarks: '',
    educatorName: 'Sr. Sampat Jain',
    educatorDesignation: 'Staff Nurse',
    educatorSignature: 'Sr. Sampat Jain',
  });

  if (!selectedPatient) return null;
  const patientId = selectedPatient.id;

  const records = (store.familyEducationRecords || []).filter(
    (r) => r.patientId === patientId
  );

  const filteredRecords = activeDateFilter === 'all'
    ? records
    : records.filter((r) => r.date === activeDateFilter);

  // Dates available for filtering
  const availableDates = Array.from(new Set(records.map((r) => r.date))).sort().reverse();

  function openNew() {
    setForm({
      date: nowDateStr(),
      time: nowTimeStr(),
      educationTopics: ['Patient care instructions and daily care needs'],
      customTopic: '',
      instructionsGiven: '',
      educatedPersonName: selectedPatient?.emergencyContactName || '',
      relationship: 'Spouse',
      teachingMethods: ['Oral Discussion', 'Demonstration'],
      understandingFeedback: 'Understood completely',
      additionalRemarks: '',
      educatorName: 'Sr. Sampat Jain',
      educatorDesignation: 'Staff Nurse',
      educatorSignature: 'Sr. Sampat Jain',
    });
    setEditId(null);
    setDrawerOpen(true);
  }

  function openEdit(record: FamilyEducationRecord) {
    setForm({
      date: record.date,
      time: record.time,
      educationTopics: record.educationTopics || [],
      customTopic: record.customTopic || '',
      instructionsGiven: record.instructionsGiven || '',
      educatedPersonName: record.educatedPersonName || '',
      relationship: record.relationship || 'Spouse',
      teachingMethods: record.teachingMethods || ['Oral Discussion'],
      understandingFeedback: record.understandingFeedback || 'Understood completely',
      additionalRemarks: record.additionalRemarks || '',
      educatorName: record.educatorName || '',
      educatorDesignation: record.educatorDesignation || 'Staff Nurse',
      educatorSignature: record.educatorSignature || record.educatorName || '',
    });
    setEditId(record.id);
    setDrawerOpen(true);
  }

  function toggleTopic(topic: string) {
    setForm((prev) => {
      const current = prev.educationTopics || [];
      const updated = current.includes(topic)
        ? current.filter((t) => t !== topic)
        : [...current, topic];
      return { ...prev, educationTopics: updated };
    });
  }

  function toggleTeachingMethod(method: string) {
    setForm((prev) => {
      const current = prev.teachingMethods || [];
      const updated = current.includes(method)
        ? current.filter((m) => m !== method)
        : [...current, method];
      return { ...prev, teachingMethods: updated };
    });
  }

  function handleDelete(id: string) {
    if (!window.confirm('Are you sure you want to delete this family education record?')) return;
    updateStore((prev) => ({
      ...prev,
      familyEducationRecords: (prev.familyEducationRecords || []).filter((r) => r.id !== id),
    }));
    if (selectedRecordForView?.id === id) {
      setSelectedRecordForView(null);
    }
  }

  function save(status: RecordStatus) {
    const recordPayload: FamilyEducationRecord = {
      id: editId || generateId(),
      patientId,
      date: form.date,
      time: form.time,
      educationTopics: form.educationTopics,
      customTopic: form.customTopic,
      instructionsGiven: form.instructionsGiven,
      educatedPersonName: form.educatedPersonName,
      relationship: form.relationship,
      teachingMethods: form.teachingMethods,
      understandingFeedback: form.understandingFeedback,
      additionalRemarks: form.additionalRemarks,
      educatorName: form.educatorName,
      educatorDesignation: form.educatorDesignation,
      educatorSignature: form.educatorSignature || form.educatorName,
      status,
      createdAt: editId
        ? (records.find((r) => r.id === editId)?.createdAt || new Date().toISOString())
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    updateStore((prev) => {
      const existing = prev.familyEducationRecords || [];
      if (editId) {
        return {
          ...prev,
          familyEducationRecords: existing.map((r) => (r.id === editId ? recordPayload : r)),
        };
      }
      return {
        ...prev,
        familyEducationRecords: [recordPayload, ...existing],
      };
    });

    setDrawerOpen(false);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Informational Guidance Banner */}
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-3.5 flex items-start gap-3 no-print">
        <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0 mt-0.5">
          <GraduationCap size={18} />
        </div>
        <div className="flex-1 text-xs text-slate-700">
          <div className="font-bold text-teal-900 text-sm mb-0.5">
            Family &amp; Caregiver Education Module
          </div>
          <p className="leading-relaxed">
            Document comprehensive education provided to the patient&apos;s family or primary caregivers, including daily care routines, medication administration, fall prevention, nutrition, and emergency red-flags.
          </p>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="ncard">
        <CardHeader
          title={`Family Education Records (${records.length})`}
          actions={
            <div className="flex items-center gap-2">
              <SoftButton onClick={() => window.print()} size="sm">
                <Printer size={13} /> Print
              </SoftButton>
              <TealButton onClick={openNew} size="sm">
                <Plus size={14} /> New Education Record
              </TealButton>
            </div>
          }
        />

        <div className="ncard-body">
          {/* Date Filter Strip */}
          {availableDates.length > 0 && (
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 text-xs">
              <span className="font-semibold text-slate-500 mr-1">Filter Date:</span>
              <button
                type="button"
                onClick={() => setActiveDateFilter('all')}
                className={cn(
                  'px-3 py-1 rounded-full border transition-colors font-medium',
                  activeDateFilter === 'all'
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                )}
              >
                All Dates ({records.length})
              </button>
              {availableDates.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setActiveDateFilter(d)}
                  className={cn(
                    'px-3 py-1 rounded-full border transition-colors font-medium',
                    activeDateFilter === d
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                  )}
                >
                  {formatDate(d)}
                </button>
              ))}
            </div>
          )}

          {/* List of Education Records */}
          {filteredRecords.length === 0 ? (
            <EmptyState
              icon={<GraduationCap />}
              title="No family education records found"
              description="Record instructions provided to the patient's family, attendant, or caregivers."
              action={
                <TealButton onClick={openNew}>
                  <Plus size={14} /> Record Education Session
                </TealButton>
              }
            />
          ) : (
            <div className="space-y-4">
              {filteredRecords.map((r) => (
                <div
                  key={r.id}
                  className="bg-white border border-slate-200 rounded-xl p-4.5 hover:shadow-xs transition-shadow"
                >
                  {/* Card Top Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="flex items-center gap-1.5 font-bold text-sm text-slate-800">
                        <Calendar size={14} className="text-teal-600" />
                        <span>{formatDate(r.date)}</span>
                        <span className="text-slate-400 font-normal">at</span>
                        <Clock size={13} className="text-slate-400" />
                        <span>{r.time}</span>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>

                    <div className="flex items-center gap-1.5 no-print">
                      <SoftButton onClick={() => openEdit(r)} size="sm">
                        <Edit2 size={12} /> Edit
                      </SoftButton>
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-slate-400 font-semibold block uppercase text-[10px] mb-1">
                        Caregiver / Attendant Educated
                      </span>
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <User size={13} className="text-slate-500" />
                        <span>{r.educatedPersonName || 'Attendant'}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                          {r.relationship}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-slate-400 font-semibold block uppercase text-[10px] mb-1">
                        Teaching Method &amp; Evaluation
                      </span>
                      <div className="font-medium text-slate-800">
                        <span className="text-teal-700 font-semibold">
                          {(r.teachingMethods || []).join(', ') || 'Oral Discussion'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Outcome: <b className="text-emerald-700">{r.understandingFeedback}</b>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-slate-400 font-semibold block uppercase text-[10px] mb-1">
                        Educator &amp; Sign-off
                      </span>
                      <div className="font-semibold text-slate-800">
                        {r.educatorName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {r.educatorDesignation || 'Staff Nurse'} • <span className="italic">Sig: {r.educatorSignature}</span>
                      </div>
                    </div>
                  </div>

                  {/* Topics Covered Badges */}
                  <div className="mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Topics Covered
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(r.educationTopics || []).map((t) => (
                        <span
                          key={t}
                          className="px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-xs font-medium flex items-center gap-1"
                        >
                          <CheckCircle2 size={12} className="text-teal-600" />
                          <span>{t}</span>
                        </span>
                      ))}
                      {r.customTopic && (
                        <span className="px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                          ✦ {r.customTopic}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Instructions Given Box */}
                  {r.instructionsGiven && (
                    <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-3 text-xs mb-2">
                      <div className="font-semibold text-slate-700 mb-1">
                        Specific Clinical Instructions Provided:
                      </div>
                      <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {r.instructionsGiven}
                      </p>
                    </div>
                  )}

                  {/* Additional Remarks */}
                  {r.additionalRemarks && (
                    <div className="text-xs text-slate-500 italic pt-1">
                      <span className="font-semibold not-italic text-slate-600">Remarks / Feedback: </span>
                      {r.additionalRemarks}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* FORM DRAWER: Create / Edit Family Education Record          */}
      {/* ============================================================ */}
      <FormDrawer
        open={drawerOpen}
        title={editId ? 'Edit Family Education Record' : 'New Family Education Record'}
        subtitle={`Patient: ${selectedPatient.name} (UHID: ${selectedPatient.uhid})`}
        onClose={() => setDrawerOpen(false)}
        onSave={() => save('Completed')}
        onSaveDraft={() => save('Draft')}
        saveLabel="Save Record"
      >
        <div className="space-y-4">
          {/* Date, Time & Caregiver Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormGroup label="Education Date" required>
              <FormInput
                type="date"
                value={form.date}
                onChange={(v) => setForm((p) => ({ ...p, date: v }))}
              />
            </FormGroup>

            <FormGroup label="Session Time" required>
              <FormInput
                type="time"
                value={form.time}
                onChange={(v) => setForm((p) => ({ ...p, time: v }))}
              />
            </FormGroup>

            <FormGroup label="Educated Person / Attendant Name" required>
              <FormInput
                value={form.educatedPersonName}
                onChange={(v) => setForm((p) => ({ ...p, educatedPersonName: v }))}
                placeholder="Full name of family member / caregiver"
              />
            </FormGroup>

            <FormGroup label="Relationship to Patient" required>
              <FormSelect
                value={form.relationship}
                onChange={(v) => setForm((p) => ({ ...p, relationship: v }))}
                options={RELATIONSHIP_OPTIONS}
              />
            </FormGroup>
          </div>

          {/* Education Topics Checkboxes */}
          <SectionTitle>Education Topics Covered</SectionTitle>
          <div className="space-y-1.5">
            <div className="grid grid-cols-1 gap-2">
              {FAMILY_EDUCATION_TOPICS.map((topic) => {
                const isChecked = form.educationTopics.includes(topic);
                return (
                  <label
                    key={topic}
                    className={cn(
                      'flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer select-none transition-colors',
                      isChecked
                        ? 'bg-teal-50/80 border-teal-300 text-teal-900 font-medium'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleTopic(topic)}
                      className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                    />
                    <span className="leading-snug">{topic}</span>
                  </label>
                );
              })}
            </div>

            <FormGroup label="Additional / Custom Topic (if any):" className="mt-2">
              <FormInput
                value={form.customTopic}
                onChange={(v) => setForm((p) => ({ ...p, customTopic: v }))}
                placeholder="e.g. Tracheostomy suctioning, PICC line shower protection..."
              />
            </FormGroup>
          </div>

          {/* Instructions Given */}
          <SectionTitle>Instructions Given to Family / Caregiver</SectionTitle>
          <FormGroup label="Clinical Care Instructions:" required>
            <FormTextarea
              value={form.instructionsGiven}
              onChange={(v) => setForm((p) => ({ ...p, instructionsGiven: v }))}
              placeholder="Document the exact guidance provided: medication schedules, diet restrictions, posture changes, red flags to report..."
              rows={4}
            />
          </FormGroup>

          {/* Teaching Method & Understanding */}
          <SectionTitle>Teaching Method &amp; Evaluation</SectionTitle>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Teaching Method(s) Used <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TEACHING_METHODS.map((method) => {
                const isChecked = form.teachingMethods.includes(method);
                return (
                  <label
                    key={method}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-colors',
                      isChecked
                        ? 'bg-teal-50 border-teal-300 text-teal-900 font-semibold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleTeachingMethod(method)}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span>{method}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <FormGroup label="Caregiver Understanding / Feedback" required>
              <FormSelect
                value={form.understandingFeedback}
                onChange={(v) => setForm((p) => ({ ...p, understandingFeedback: v }))}
                options={UNDERSTANDING_FEEDBACK_OPTIONS}
              />
            </FormGroup>

            <FormGroup label="Additional Remarks / Caregiver Queries">
              <FormInput
                value={form.additionalRemarks}
                onChange={(v) => setForm((p) => ({ ...p, additionalRemarks: v }))}
                placeholder="Caregiver questions addressed, concerns noted..."
              />
            </FormGroup>
          </div>

          {/* Educator Sign-off */}
          <SectionTitle>Educator Staff Sign-off</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormGroup label="Educator Staff Name" required>
              <FormInput
                value={form.educatorName}
                onChange={(v) => setForm((p) => ({ ...p, educatorName: v, educatorSignature: v }))}
                placeholder="Staff Nurse / Educator"
              />
            </FormGroup>

            <FormGroup label="Designation / Role">
              <FormInput
                value={form.educatorDesignation}
                onChange={(v) => setForm((p) => ({ ...p, educatorDesignation: v }))}
                placeholder="e.g. ICU Staff Nurse"
              />
            </FormGroup>

            <FormGroup label="Staff Signature / ID" required>
              <FormInput
                value={form.educatorSignature}
                onChange={(v) => setForm((p) => ({ ...p, educatorSignature: v }))}
                placeholder="Staff name / EID"
              />
            </FormGroup>
          </div>
        </div>
      </FormDrawer>
    </div>
  );
}
