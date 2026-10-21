'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useEMR } from '@/context/EMRContext';
import { generateId, nowDateStr, nowTimeStr } from '@/lib/store';
import type { FieldMaster, DynamicFormSubmission } from '@/lib/types';
import {
  FileText, CheckCircle2, Clock, AlertCircle, Save, Sparkles,
  RotateCcw, History, Eye, UserCheck, ChevronRight, X, Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TealButton, SoftButton } from '@/components/FormDrawer';

interface DynamicNursingFormRendererProps {
  formId: string;
  patientId?: string;
  onSaved?: (submission: DynamicFormSubmission) => void;
  onClose?: () => void;
  isSandbox?: boolean;
  showHistory?: boolean;
}

export function DynamicNursingFormRenderer({
  formId,
  patientId,
  onSaved,
  onClose,
  isSandbox = false,
  showHistory = true,
}: DynamicNursingFormRendererProps) {
  const { store, updateStore, selectedPatient } = useEMR();

  // Find form & fields
  const form = useMemo(() => store.formMaster.find(f => f.id === formId), [store.formMaster, formId]);
  const fields = useMemo(() => {
    return store.fieldMaster
      .filter(f => f.formId === formId && f.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [store.fieldMaster, formId]);

  // Target patient
  const targetPatient = useMemo(() => {
    if (patientId) return store.patients.find(p => p.id === patientId) || selectedPatient;
    return selectedPatient;
  }, [store.patients, patientId, selectedPatient]);

  // Form State
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [nurseName, setNurseName] = useState<string>('Sr. Staff Nurse');
  const [nurseSignature, setNurseSignature] = useState<string>('Sr. Staff Nurse (EMP-1024)');
  const [formDate, setFormDate] = useState<string>(nowDateStr());
  const [formTime, setFormTime] = useState<string>(nowTimeStr());
  const [formNotes, setFormNotes] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeStep, setActiveStep] = useState<number>(0);
  const [historyTabOpen, setHistoryTabOpen] = useState<boolean>(false);
  const [selectedSubmission, setSelectedSubmission] = useState<DynamicFormSubmission | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Group fields by management sequence or section
  const sequences = useMemo(() => {
    const map = new Map<number, { title: string; fields: FieldMaster[] }>();

    // Determine workflow sequence names from form definition if available
    let parsedSequences: string[] = [];
    if (form?.managementSequence) {
      parsedSequences = form.managementSequence.split('->').map(s => s.trim());
    }

    fields.forEach(f => {
      const seqNo = f.managementSequence || 1;
      if (!map.has(seqNo)) {
        let seqTitle = `Sequence ${seqNo}`;
        if (parsedSequences[seqNo - 1]) {
          seqTitle = parsedSequences[seqNo - 1];
        } else if (f.section) {
          seqTitle = f.section;
        }
        map.set(seqNo, { title: seqTitle, fields: [] });
      }
      map.get(seqNo)!.fields.push(f);
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([seqNo, val]) => ({ seqNo, ...val }));
  }, [fields, form]);

  // Filter historical submissions for this form and patient
  const pastSubmissions = useMemo(() => {
    const all = store.dynamicFormSubmissions || [];
    if (!targetPatient?.id) return all.filter(s => s.formId === formId);
    return all.filter(s => s.formId === formId && s.patientId === targetPatient.id);
  }, [store.dynamicFormSubmissions, formId, targetPatient]);

  // Field change handler
  const handleFieldChange = (key: string, val: any) => {
    setFormData(prev => ({ ...prev, [key]: val }));
    if (errors[key]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  // Multi-select toggle helper
  const handleMultiSelectToggle = (fieldKey: string, option: string) => {
    const current = Array.isArray(formData[fieldKey]) ? formData[fieldKey] : [];
    if (current.includes(option)) {
      handleFieldChange(fieldKey, current.filter((x: string) => x !== option));
    } else {
      handleFieldChange(fieldKey, [...current, option]);
    }
  };

  // Validate required fields
  const validate = () => {
    const newErrors: Record<string, string> = {};
    fields.forEach(f => {
      if (f.isRequired) {
        const val = formData[f.fieldKey];
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
          newErrors[f.fieldKey] = `${f.fieldLabel} is required`;
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Quick fill sample data
  const handleAutofillDemo = () => {
    const demo: Record<string, any> = {};
    fields.forEach(f => {
      switch (f.fieldType) {
        case 'text':
          demo[f.fieldKey] = f.placeholder || `${f.fieldLabel} verified`;
          break;
        case 'number':
          demo[f.fieldKey] = f.minValue !== undefined ? Math.round((f.minValue + (f.maxValue || f.minValue + 20)) / 2) : 25;
          break;
        case 'textarea':
          demo[f.fieldKey] = 'Evaluated and verified according to standard hospital clinical nursing protocol. Patient stable.';
          break;
        case 'dropdown':
        case 'radio':
          if (f.dropdownOptions && f.dropdownOptions.length > 0) {
            demo[f.fieldKey] = f.dropdownOptions[0];
          }
          break;
        case 'yesno':
        case 'yes-no':
          demo[f.fieldKey] = 'yes';
          break;
        case 'checkbox':
          demo[f.fieldKey] = true;
          break;
        case 'multi-select':
          if (f.dropdownOptions && f.dropdownOptions.length > 0) {
            demo[f.fieldKey] = [f.dropdownOptions[0]];
          }
          break;
        case 'date':
          demo[f.fieldKey] = nowDateStr();
          break;
        case 'time':
          demo[f.fieldKey] = nowTimeStr();
          break;
      }
    });
    setFormData(demo);
    setErrors({});
  };

  // Save submission
  const handleSave = (status: 'Completed' | 'Draft') => {
    if (status === 'Completed' && !validate()) {
      return;
    }

    const submission: DynamicFormSubmission = {
      id: generateId(),
      formId: form?.id || formId,
      formName: form?.formName || 'Dynamic Nursing Form',
      formCode: form?.formCode || 'DNF',
      patientId: targetPatient?.id || 'P_DEMO',
      patientName: targetPatient?.name || 'Demo Patient',
      uhid: targetPatient?.uhid || 'NHC/DEMO/001',
      bed: targetPatient?.bed || 'ICU-Bed',
      date: formDate,
      time: formTime,
      nurseName: nurseName || 'Staff Nurse',
      nurseSignature: nurseSignature || `${nurseName} (Verified)`,
      data: formData,
      status,
      notes: formNotes,
      createdAt: new Date().toISOString(),
    };

    updateStore(prev => ({
      ...prev,
      dynamicFormSubmissions: [
        submission,
        ...(prev.dynamicFormSubmissions || []),
      ],
    }));

    setSaveSuccessMsg(`Form successfully saved as ${status} for ${targetPatient?.name || 'Patient'}!`);
    setTimeout(() => setSaveSuccessMsg(null), 4000);

    if (onSaved) onSaved(submission);
  };

  if (!form) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
        <h3 className="font-semibold text-slate-800">Form Not Found</h3>
        <p className="text-sm text-slate-500">The requested form (ID: {formId}) could not be located in Form Master.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sandbox / Preview Mode Banner */}
      {isSandbox && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-center justify-between text-xs text-amber-800">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded font-mono font-bold bg-amber-200 text-amber-900">SANDBOX PREVIEW</span>
            <span>Testing dynamically configured fields for <b>{form.formName}</b>. Any additions/edits made in Field Master will update live here.</span>
          </div>
          <button
            onClick={handleAutofillDemo}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition"
          >
            <Sparkles size={12} /> Autofill Test Values
          </button>
        </div>
      )}

      {/* Success alert */}
      {saveSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            {saveSuccessMsg}
          </div>
          <button onClick={() => setSaveSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Dynamic Form Card */}
      <div className="ncard">
        {/* Form Title & Meta Header */}
        <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-teal-50 via-slate-50 to-white flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold bg-teal-600 text-white px-2 py-0.5 rounded shadow-sm">
                {form.formCode}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded">
                {form.nursingModule}
              </span>
              <span className="text-xs text-slate-400">Order: #{form.displayOrder}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              {form.formName}
            </h2>
            {form.description && (
              <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">{form.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {showHistory && pastSubmissions.length > 0 && (
              <button
                onClick={() => setHistoryTabOpen(prev => !prev)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition',
                  historyTabOpen
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                )}
              >
                <History size={14} />
                Submissions History ({pastSubmissions.length})
              </button>
            )}
            <button
              onClick={handleAutofillDemo}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition"
              title="Populate test values for instant trial"
            >
              <Sparkles size={13} />
              Fill Demo Data
            </button>
            <button
              onClick={() => {
                setFormData({});
                setErrors({});
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition"
              title="Clear all fields"
            >
              <RotateCcw size={13} />
              Reset
            </button>
            {onClose && (
              <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Patient & Nurse Context Strip */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-400 font-medium">Patient:</span>{' '}
              <span className="font-semibold text-slate-800">{targetPatient?.name || 'Unspecified Patient'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium">UHID:</span>{' '}
              <span className="font-mono font-medium text-slate-700">{targetPatient?.uhid || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Bed:</span>{' '}
              <span className="font-semibold text-teal-700">{targetPatient?.bed || 'General'}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Calendar size={13} className="text-slate-400" />
              <input
                type="date"
                value={formDate}
                onChange={e => setFormDate(e.target.value)}
                className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700 focus:outline-none focus:border-teal-400"
              />
            </div>
            <div className="flex items-center gap-1">
              <Clock size={13} className="text-slate-400" />
              <input
                type="time"
                value={formTime}
                onChange={e => setFormTime(e.target.value)}
                className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700 focus:outline-none focus:border-teal-400"
              />
            </div>
          </div>
        </div>

        {/* Clinical Management Sequence Stepper */}
        {sequences.length > 1 && (
          <div className="px-4 py-3 bg-white border-b border-slate-100">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {sequences.map((seq, idx) => {
                const isSelected = activeStep === idx;
                const hasFilledInSequence = seq.fields.some(f => formData[f.fieldKey] !== undefined && formData[f.fieldKey] !== '');
                return (
                  <button
                    key={seq.seqNo}
                    onClick={() => setActiveStep(idx)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border',
                      isSelected
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    )}
                  >
                    <span className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                      isSelected ? 'bg-white text-teal-700' : hasFilledInSequence ? 'bg-teal-100 text-teal-700' : 'bg-slate-200 text-slate-600'
                    )}>
                      {seq.seqNo}
                    </span>
                    <span>{seq.title}</span>
                    <span className="text-[10px] opacity-75 font-normal">({seq.fields.length})</span>
                    {idx < sequences.length - 1 && <ChevronRight size={12} className="opacity-40" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Validation Error Summary */}
        {Object.keys(errors).length > 0 && (
          <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Please complete the required fields marked with * before saving:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-red-700">
                {Object.values(errors).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Dynamic Fields Body */}
        <div className="p-5 space-y-6">
          {fields.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="font-medium text-slate-600">No fields configured for this form yet.</p>
              <p className="text-xs text-slate-400 mt-1">Open <b>Field Master</b> in Administration to define form inputs, labels, and dropdowns.</p>
            </div>
          ) : (
            // Render either active sequence or all sequences
            sequences.map((seq, seqIdx) => {
              // In stepper mode, show active step; if only 1 sequence, show all
              const isVisible = sequences.length <= 1 || activeStep === seqIdx;
              if (!isVisible) return null;

              return (
                <div key={seq.seqNo} className="bg-slate-50/60 p-4 rounded-xl border border-slate-200/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
                        {seq.seqNo}
                      </span>
                      <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">
                        {seq.title}
                      </h3>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      Management Sequence #{seq.seqNo}
                    </span>
                  </div>

                  {/* Fields Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {seq.fields.map(f => {
                      const isFieldRequired = f.isRequired;
                      const hasError = !!errors[f.fieldKey];
                      const val = formData[f.fieldKey] ?? '';

                      return (
                        <div
                          key={f.id}
                          className={cn(
                            'p-3 bg-white rounded-lg border transition-all',
                            hasError ? 'border-red-400 ring-1 ring-red-300' : 'border-slate-200 hover:border-slate-300',
                            f.fieldType === 'textarea' || (f.dropdownOptions && f.dropdownOptions.length > 4 && f.fieldType === 'multi-select') ? 'md:col-span-2 lg:col-span-3' : ''
                          )}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                              {f.fieldLabel}
                              {isFieldRequired && <span className="text-red-500 font-bold">*</span>}
                            </label>
                            {f.unit && (
                              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                {f.unit}
                              </span>
                            )}
                          </div>

                          {/* Render control by fieldType */}
                          {f.fieldType === 'text' && (
                            <input
                              type="text"
                              value={val}
                              placeholder={f.placeholder || `Enter ${f.fieldLabel.toLowerCase()}...`}
                              onChange={e => handleFieldChange(f.fieldKey, e.target.value)}
                              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-teal-500 transition"
                            />
                          )}

                          {f.fieldType === 'number' && (
                            <div className="relative">
                              <input
                                type="number"
                                min={f.minValue}
                                max={f.maxValue}
                                value={val}
                                placeholder={f.placeholder || (f.minValue !== undefined && f.maxValue !== undefined ? `${f.minValue} - ${f.maxValue}` : '0')}
                                onChange={e => handleFieldChange(f.fieldKey, e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-teal-500 transition pr-12"
                              />
                              {f.unit && (
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                                  {f.unit}
                                </span>
                              )}
                            </div>
                          )}

                          {f.fieldType === 'textarea' && (
                            <textarea
                              rows={3}
                              value={val}
                              placeholder={f.placeholder || `Enter detailed ${f.fieldLabel.toLowerCase()} notes...`}
                              onChange={e => handleFieldChange(f.fieldKey, e.target.value)}
                              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-teal-500 transition resize-y"
                            />
                          )}

                          {f.fieldType === 'dropdown' && (
                            <select
                              value={val}
                              onChange={e => handleFieldChange(f.fieldKey, e.target.value)}
                              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-teal-500 transition"
                            >
                              <option value="">-- Select {f.fieldLabel} --</option>
                              {(f.dropdownOptions || []).map((opt, i) => (
                                <option key={i} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          )}

                          {f.fieldType === 'radio' && (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {(f.dropdownOptions || ['Option 1', 'Option 2']).map((opt, i) => {
                                const isChecked = val === opt;
                                return (
                                  <button
                                    type="button"
                                    key={i}
                                    onClick={() => handleFieldChange(f.fieldKey, opt)}
                                    className={cn(
                                      'px-2.5 py-1 text-xs rounded-lg border font-medium transition',
                                      isChecked
                                        ? 'bg-teal-500 text-white border-teal-500 shadow-xs'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                    )}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {(f.fieldType === 'yesno' || f.fieldType === 'yes-no') && (
                            <div className="grid grid-cols-2 gap-2 mt-1">
                              <button
                                type="button"
                                onClick={() => handleFieldChange(f.fieldKey, 'yes')}
                                className={cn(
                                  'py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border',
                                  val === 'yes' || val === true
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                    : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                                )}
                              >
                                <CheckCircle2 size={13} /> YES
                              </button>
                              <button
                                type="button"
                                onClick={() => handleFieldChange(f.fieldKey, 'no')}
                                className={cn(
                                  'py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border',
                                  val === 'no' || val === false
                                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                    : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                                )}
                              >
                                <X size={13} /> NO
                              </button>
                            </div>
                          )}

                          {f.fieldType === 'checkbox' && (
                            <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!val}
                                onChange={e => handleFieldChange(f.fieldKey, e.target.checked)}
                                className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                              />
                              <span className="text-xs text-slate-700 font-medium">
                                {f.placeholder || `Check if verified`}
                              </span>
                            </label>
                          )}

                          {f.fieldType === 'multi-select' && (
                            <div className="space-y-1.5 mt-1">
                              <div className="flex flex-wrap gap-1.5">
                                {(f.dropdownOptions || []).map((opt, i) => {
                                  const selectedList = Array.isArray(val) ? val : [];
                                  const isSelected = selectedList.includes(opt);
                                  return (
                                    <button
                                      type="button"
                                      key={i}
                                      onClick={() => handleMultiSelectToggle(f.fieldKey, opt)}
                                      className={cn(
                                        'px-2.5 py-1 text-xs rounded-lg border font-medium transition flex items-center gap-1',
                                        isSelected
                                          ? 'bg-teal-600 text-white border-teal-600'
                                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                      )}
                                    >
                                      {isSelected && <CheckCircle2 size={11} />}
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>
                              {(!f.dropdownOptions || f.dropdownOptions.length === 0) && (
                                <p className="text-xs text-slate-400 italic">No multi-select options configured in Field Master.</p>
                              )}
                            </div>
                          )}

                          {f.fieldType === 'date' && (
                            <input
                              type="date"
                              value={val}
                              onChange={e => handleFieldChange(f.fieldKey, e.target.value)}
                              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-teal-500 transition"
                            />
                          )}

                          {f.fieldType === 'time' && (
                            <input
                              type="time"
                              value={val}
                              onChange={e => handleFieldChange(f.fieldKey, e.target.value)}
                              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-teal-500 transition"
                            />
                          )}

                          {/* Help / Validation Text */}
                          {hasError ? (
                            <p className="text-[11px] text-red-600 font-medium mt-1">{errors[f.fieldKey]}</p>
                          ) : f.helpText ? (
                            <p className="text-[11px] text-slate-400 mt-1">{f.helpText}</p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}

          {/* Nurse Sign-off & Overall Notes */}
          {fields.length > 0 && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <UserCheck size={14} className="text-teal-600" />
                Documentation Verification & Nurse Sign-off
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Nurse Name & Designation</label>
                  <input
                    type="text"
                    value={nurseName}
                    onChange={e => setNurseName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
                    placeholder="Sr. Staff Nurse Name"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Digital Signature Stamp</label>
                  <input
                    type="text"
                    value={nurseSignature}
                    onChange={e => setNurseSignature(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono text-teal-800 focus:outline-none focus:border-teal-500"
                    placeholder="Nurse EID / Stamp"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Overall Clinical Shift Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Additional observations, doctor instructions, or handoff notes..."
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          )}

          {/* Stepper Navigation & Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200">
            <div className="flex items-center gap-2">
              {sequences.length > 1 && activeStep > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                >
                  ← Previous Step
                </button>
              )}
              {sequences.length > 1 && activeStep < sequences.length - 1 && (
                <button
                  type="button"
                  onClick={() => setActiveStep(prev => Math.min(sequences.length - 1, prev + 1))}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition flex items-center gap-1.5 shadow-sm"
                >
                  Next: {sequences[activeStep + 1]?.title || 'Next Step'} <ChevronRight size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <SoftButton
                onClick={() => handleSave('Draft')}
                size="md"
              >
                <Clock size={14} />
                Save as Draft
              </SoftButton>
              <TealButton
                onClick={() => handleSave('Completed')}
                size="md"
              >
                <Save size={14} />
                Save to Patient Record
              </TealButton>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Submissions Section */}
      {showHistory && pastSubmissions.length > 0 && historyTabOpen && (
        <div className="ncard">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History size={16} className="text-teal-600" />
              <h3 className="text-sm font-bold text-slate-800">
                Past Submissions for {form.formName} ({pastSubmissions.length})
              </h3>
            </div>
            <button
              onClick={() => setHistoryTabOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Hide History
            </button>
          </div>
          <div className="p-4 overflow-x-auto">
            <table className="icu-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Patient</th>
                  <th>Nurse Signature</th>
                  <th>Status</th>
                  <th>Summary of Recorded Fields</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pastSubmissions.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap font-mono text-xs text-slate-700">
                      {sub.date} {sub.time}
                    </td>
                    <td className="text-xs font-semibold text-slate-800">
                      {sub.patientName || sub.patientId}
                    </td>
                    <td className="text-xs font-medium text-slate-600">
                      {sub.nurseSignature || sub.nurseName}
                    </td>
                    <td>
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-[11px] font-bold',
                        sub.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      )}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="text-xs text-slate-500 max-w-xs truncate">
                      {Object.entries(sub.data || {})
                        .slice(0, 3)
                        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
                        .join(' | ')}
                      {Object.keys(sub.data || {}).length > 3 ? '…' : ''}
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedSubmission(sub)}
                        className="px-2.5 py-1 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded border border-teal-200 transition flex items-center gap-1"
                      >
                        <Eye size={12} /> View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold bg-teal-600 text-white px-2 py-0.5 rounded">
                    {selectedSubmission.formCode}
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    {selectedSubmission.formName}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Recorded on {selectedSubmission.date} at {selectedSubmission.time} by {selectedSubmission.nurseSignature}
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div><span className="text-slate-400">Patient:</span> <span className="font-semibold">{selectedSubmission.patientName}</span></div>
                <div><span className="text-slate-400">UHID:</span> <span className="font-mono">{selectedSubmission.uhid}</span></div>
                <div><span className="text-slate-400">Bed:</span> <span className="font-semibold text-teal-700">{selectedSubmission.bed}</span></div>
                <div><span className="text-slate-400">Status:</span> <span className="font-bold text-emerald-700">{selectedSubmission.status}</span></div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Recorded Form Fields</h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {Object.entries(selectedSubmission.data || {}).map(([key, value]) => {
                    const fieldDef = fields.find(f => f.fieldKey === key);
                    const label = fieldDef?.fieldLabel || key;
                    const displayVal = Array.isArray(value) ? value.join(', ') : typeof value === 'boolean' ? (value ? 'YES' : 'NO') : String(value || '-');
                    return (
                      <div key={key} className="p-2.5 bg-white flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-600">{label}</span>
                        <span className="font-semibold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 text-right max-w-sm">
                          {displayVal}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedSubmission.notes && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                  <span className="font-bold block mb-1">Clinical Shift Notes:</span>
                  <p>{selectedSubmission.notes}</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-end">
              <TealButton onClick={() => setSelectedSubmission(null)} size="sm">
                Close Preview
              </TealButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
