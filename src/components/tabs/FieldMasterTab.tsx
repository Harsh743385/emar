'use client';

import React, { useState, useMemo } from 'react';
import { useEMR } from '@/context/EMRContext';
import { generateId } from '@/lib/store';
import {
  FormDrawer, FormGroup, FormInput, FormSelect, SectionTitle,
  CardHeader, TealButton, SoftButton
} from '@/components/FormDrawer';
import {
  Plus, Edit2, ToggleLeft, ToggleRight, ArrowUp, ArrowDown,
  Eye, EyeOff, Search, Layers, Sparkles, Filter, X, SlidersHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FieldMaster } from '@/lib/types';
import { DynamicNursingFormRenderer } from '@/components/DynamicNursingFormRenderer';

export function FieldMasterTab() {
  const { store, updateStore } = useEMR();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedFormId, setSelectedFormId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showLivePreview, setShowLivePreview] = useState<boolean>(false);
  const [previewFormId, setPreviewFormId] = useState<string | null>(null);

  const [form, setForm] = useState({
    formId: store.formMaster[0]?.id || '',
    fieldKey: '',
    fieldLabel: '',
    fieldType: 'text' as FieldMaster['fieldType'],
    section: '',
    managementSequence: 1,
    isRequired: false,
    displayOrder: 1,
    isActive: true,
    dropdownOptions: [] as string[],
    minValue: '',
    maxValue: '',
    unit: '',
    placeholder: '',
    helpText: '',
  });

  const [optionInput, setOptionInput] = useState('');

  // Selected form object
  const activeFormObj = useMemo(() => {
    if (selectedFormId !== 'all') {
      return store.formMaster.find(f => f.id === selectedFormId);
    }
    return store.formMaster[0];
  }, [store.formMaster, selectedFormId]);

  // Parse available management sequence steps from selected form
  const availableSequences = useMemo(() => {
    const targetForm = store.formMaster.find(f => f.id === form.formId);
    if (!targetForm?.managementSequence) {
      return [
        { seq: 1, label: 'Sequence 1 (Initial / Triage)' },
        { seq: 2, label: 'Sequence 2 (Clinical Evaluation)' },
        { seq: 3, label: 'Sequence 3 (Interventions / Sign-off)' },
      ];
    }
    const parts = targetForm.managementSequence.split('->').map(s => s.trim());
    return parts.map((label, idx) => ({
      seq: idx + 1,
      label: label || `Sequence ${idx + 1}`,
    }));
  }, [store.formMaster, form.formId]);

  // Filtered fields
  const fields = useMemo(() => {
    let list = selectedFormId === 'all'
      ? store.fieldMaster
      : store.fieldMaster.filter(f => f.formId === selectedFormId);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(f =>
        f.fieldLabel.toLowerCase().includes(q) ||
        f.fieldKey.toLowerCase().includes(q) ||
        f.section.toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      // First sort by managementSequence if present, then displayOrder
      const seqA = a.managementSequence || 1;
      const seqB = b.managementSequence || 1;
      if (seqA !== seqB) return seqA - seqB;
      return a.displayOrder - b.displayOrder;
    });
  }, [store.fieldMaster, selectedFormId, searchQuery]);

  const fieldTypes: FieldMaster['fieldType'][] = [
    'text', 'number', 'date', 'time', 'textarea',
    'dropdown', 'radio', 'checkbox', 'multi-select', 'yesno'
  ];

  function openNew() {
    const currentFormId = selectedFormId === 'all' ? (store.formMaster[0]?.id || '') : selectedFormId;
    const formFields = store.fieldMaster.filter(f => f.formId === currentFormId);

    setForm({
      formId: currentFormId,
      fieldKey: '',
      fieldLabel: '',
      fieldType: 'text',
      section: 'General',
      managementSequence: 1,
      isRequired: false,
      displayOrder: formFields.length + 1,
      isActive: true,
      dropdownOptions: [],
      minValue: '',
      maxValue: '',
      unit: '',
      placeholder: '',
      helpText: '',
    });
    setOptionInput('');
    setEditId(null);
    setDrawerOpen(true);
  }

  function openEdit(f: FieldMaster) {
    setForm({
      formId: f.formId,
      fieldKey: f.fieldKey,
      fieldLabel: f.fieldLabel,
      fieldType: f.fieldType,
      section: f.section || '',
      managementSequence: f.managementSequence || 1,
      isRequired: f.isRequired,
      displayOrder: f.displayOrder,
      isActive: f.isActive,
      dropdownOptions: f.dropdownOptions || [],
      minValue: f.minValue !== undefined ? String(f.minValue) : '',
      maxValue: f.maxValue !== undefined ? String(f.maxValue) : '',
      unit: f.unit || '',
      placeholder: f.placeholder || '',
      helpText: f.helpText || '',
    });
    setOptionInput('');
    setEditId(f.id);
    setDrawerOpen(true);
  }

  function toggleActive(id: string) {
    updateStore(prev => ({
      ...prev,
      fieldMaster: prev.fieldMaster.map(f => f.id === id ? { ...f, isActive: !f.isActive } : f),
    }));
  }

  function moveOrder(id: string, direction: 'up' | 'down') {
    const currentField = fields.find(f => f.id === id);
    if (!currentField) return;

    // Only swap within the same form & sequence
    const siblingFields = fields.filter(f =>
      f.formId === currentField.formId &&
      (f.managementSequence || 1) === (currentField.managementSequence || 1)
    );

    const idx = siblingFields.findIndex(f => f.id === id);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === siblingFields.length - 1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const targetField = siblingFields[targetIdx];

    const currentOrder = currentField.displayOrder;
    const targetOrder = targetField.displayOrder;

    updateStore(prev => ({
      ...prev,
      fieldMaster: prev.fieldMaster.map(f => {
        if (f.id === currentField.id) return { ...f, displayOrder: targetOrder };
        if (f.id === targetField.id) return { ...f, displayOrder: currentOrder };
        return f;
      }),
    }));
  }

  function addOption() {
    if (!optionInput.trim()) return;
    setForm(p => ({ ...p, dropdownOptions: [...p.dropdownOptions, optionInput.trim()] }));
    setOptionInput('');
  }

  function removeOption(i: number) {
    setForm(p => ({ ...p, dropdownOptions: p.dropdownOptions.filter((_, idx) => idx !== i) }));
  }

  function save() {
    if (!form.fieldLabel.trim()) return;

    const finalKey = form.fieldKey.trim() || form.fieldLabel.toLowerCase().replace(/[^a-z0-9]+/g, '_');

    updateStore(prev => {
      const rec = {
        formId: form.formId,
        fieldKey: finalKey,
        fieldLabel: form.fieldLabel,
        fieldType: form.fieldType,
        section: form.section || 'General',
        managementSequence: Number(form.managementSequence) || 1,
        isRequired: form.isRequired,
        displayOrder: form.displayOrder,
        isActive: form.isActive,
        dropdownOptions: form.dropdownOptions.length ? form.dropdownOptions : undefined,
        minValue: form.minValue ? Number(form.minValue) : undefined,
        maxValue: form.maxValue ? Number(form.maxValue) : undefined,
        unit: form.unit.trim() || undefined,
        placeholder: form.placeholder.trim() || undefined,
        helpText: form.helpText.trim() || undefined,
      };

      if (editId) {
        return {
          ...prev,
          fieldMaster: prev.fieldMaster.map(f => f.id === editId ? { ...f, ...rec } : f),
        };
      }
      return {
        ...prev,
        fieldMaster: [
          ...prev.fieldMaster,
          {
            id: generateId(),
            ...rec,
            createdAt: new Date().toISOString(),
          } as FieldMaster,
        ],
      };
    });
    setDrawerOpen(false);
  }

  const typeColor: Record<string, string> = {
    text: 'bg-blue-100 text-blue-700 border-blue-200',
    number: 'bg-purple-100 text-purple-700 border-purple-200',
    textarea: 'bg-slate-100 text-slate-700 border-slate-200',
    dropdown: 'bg-amber-100 text-amber-700 border-amber-200',
    checkbox: 'bg-green-100 text-green-700 border-green-200',
    radio: 'bg-teal-100 text-teal-700 border-teal-200',
    date: 'bg-orange-100 text-orange-700 border-orange-200',
    time: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    yesno: 'bg-rose-100 text-rose-700 border-rose-200',
    'yes-no': 'bg-rose-100 text-rose-700 border-rose-200',
    'multi-select': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-teal-900 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold">
            <SlidersHorizontal size={18} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-800">Field Master Configuration</h3>
            <p className="text-slate-600">
              Configure nursing form fields, Management Sequence, field types, labels, dropdown options, and required validation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedFormId !== 'all' && (
            <button
              onClick={() => {
                setPreviewFormId(selectedFormId);
                setShowLivePreview(true);
              }}
              className="px-3 py-1.5 bg-white text-teal-700 border border-teal-300 rounded-lg hover:bg-teal-50 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
            >
              <Eye size={13} />
              Live Dynamic Form Preview
            </button>
          )}
          <TealButton onClick={openNew} size="sm">
            <Plus size={14} /> Add New Field
          </TealButton>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="ncard">
        <CardHeader
          title="Field Master"
          subtitle="All fields dynamically bound to nursing forms with sequence & validation rules"
          actions={
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search fields or keys..."
                  className="pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-teal-400 w-48"
                />
              </div>
              <TealButton onClick={openNew} size="sm">
                <Plus size={14} /> New Field
              </TealButton>
            </div>
          }
        />

        <div className="ncard-body space-y-4">
          {/* Form Tabs Filter Strip */}
          <div className="flex gap-1.5 flex-wrap pb-2 border-b border-slate-100">
            <button
              onClick={() => setSelectedFormId('all')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                selectedFormId === 'all'
                  ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              )}
            >
              All Forms ({store.fieldMaster.length})
            </button>
            {store.formMaster.map(f => {
              const count = store.fieldMaster.filter(fld => fld.formId === f.id).length;
              const isSelected = selectedFormId === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedFormId(f.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5',
                    isSelected
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <span className={cn('font-mono text-[10px] px-1 py-0.2 rounded', isSelected ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700')}>
                    {f.formCode}
                  </span>
                  <span>{f.formName.length > 22 ? `${f.formName.substring(0, 20)}…` : f.formName}</span>
                  <span className={cn('text-[10px] px-1.5 py-0.2 rounded-full font-bold', isSelected ? 'bg-teal-800 text-teal-100' : 'bg-slate-100 text-slate-500')}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="icu-table">
              <thead>
                <tr>
                  <th className="text-center w-12">Seq</th>
                  <th className="text-left">Field Label & Placeholder</th>
                  <th className="text-left">Field Key</th>
                  <th>Type</th>
                  <th>Form</th>
                  <th>Section</th>
                  <th className="text-center">Required</th>
                  <th className="text-center">Order</th>
                  <th>Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((f, idx) => {
                  const fm = store.formMaster.find(m => m.id === f.formId);
                  const isRequired = f.isRequired;

                  return (
                    <tr key={f.id} className={cn('hover:bg-slate-50 transition-colors', !f.isActive && 'opacity-60 bg-slate-50/50')}>
                      {/* Management Sequence Badge */}
                      <td className="text-center">
                        <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold text-[11px] inline-flex items-center justify-center border border-teal-200" title={`Management Sequence Step ${f.managementSequence || 1}`}>
                          {f.managementSequence || 1}
                        </span>
                      </td>

                      {/* Label & Placeholder */}
                      <td className="text-left">
                        <div className="font-bold text-slate-800 text-xs flex items-center gap-1">
                          {f.fieldLabel}
                          {isRequired && <span className="text-red-500 font-bold">*</span>}
                        </div>
                        {f.placeholder && (
                          <div className="text-[11px] text-slate-400 italic">
                            Hint: {f.placeholder}
                          </div>
                        )}
                        {f.dropdownOptions && f.dropdownOptions.length > 0 && (
                          <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-xs">
                            Options ({f.dropdownOptions.length}): {f.dropdownOptions.slice(0, 3).join(', ')}{f.dropdownOptions.length > 3 ? '…' : ''}
                          </div>
                        )}
                      </td>

                      {/* Key */}
                      <td className="text-left">
                        <span className="font-mono text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                          {f.fieldKey}
                        </span>
                      </td>

                      {/* Field Type Badge */}
                      <td>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold border', typeColor[f.fieldType] || 'bg-slate-100 text-slate-600')}>
                          {f.fieldType}
                        </span>
                      </td>

                      {/* Form Code */}
                      <td>
                        <span className="font-mono text-xs bg-teal-50 text-teal-800 font-bold px-1.5 py-0.5 rounded border border-teal-100">
                          {fm?.formCode || '?'}
                        </span>
                      </td>

                      {/* Section */}
                      <td className="text-xs text-slate-600 font-medium">
                        {f.section || 'General'}
                      </td>

                      {/* Required */}
                      <td className="text-center">
                        {isRequired ? (
                          <span className="text-xs text-red-600 font-bold bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                            Yes
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">No</span>
                        )}
                      </td>

                      {/* Display Order & Arrows */}
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1 font-mono text-xs font-bold text-slate-700">
                          <span>{f.displayOrder}</span>
                          <div className="flex flex-col">
                            <button
                              onClick={() => moveOrder(f.id, 'up')}
                              className="text-slate-400 hover:text-teal-600 p-0.5"
                              title="Move Up in Sequence"
                            >
                              <ArrowUp size={10} />
                            </button>
                            <button
                              onClick={() => moveOrder(f.id, 'down')}
                              className="text-slate-400 hover:text-teal-600 p-0.5"
                              title="Move Down in Sequence"
                            >
                              <ArrowDown size={10} />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td>
                        <button
                          onClick={() => toggleActive(f.id)}
                          className={cn(
                            'flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full transition-colors',
                            f.isActive
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          )}
                        >
                          {f.isActive ? <ToggleRight size={13} className="text-emerald-600" /> : <ToggleLeft size={13} />}
                          {f.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="text-center">
                        <SoftButton onClick={() => openEdit(f)} size="sm">
                          <Edit2 size={12} /> Edit
                        </SoftButton>
                      </td>
                    </tr>
                  );
                })}

                {fields.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400 text-sm">
                      No fields found matching your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
            <span>
              Showing {fields.filter(f => f.isActive).length} active fields / {fields.length} matching filter
            </span>
            <span>Total fields across system: {store.fieldMaster.length}</span>
          </div>
        </div>
      </div>

      {/* Field Configuration Drawer */}
      <FormDrawer
        open={drawerOpen}
        title={editId ? 'Edit Form Field Definition' : 'Add New Field to Form'}
        onClose={() => setDrawerOpen(false)}
        onSave={save}
        saveLabel={editId ? 'Save Field Changes' : 'Create Field'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Target Nursing Form" required>
              <FormSelect
                value={form.formId}
                onChange={v => setForm(p => ({ ...p, formId: v }))}
                options={store.formMaster.map(f => ({
                  value: f.id,
                  label: `${f.formCode} — ${f.formName}`,
                }))}
              />
            </FormGroup>

            <FormGroup label="Field Input Type" required>
              <FormSelect
                value={form.fieldType}
                onChange={v => setForm(p => ({ ...p, fieldType: v as FieldMaster['fieldType'] }))}
                options={fieldTypes.map(t => ({ value: t, label: t }))}
              />
            </FormGroup>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Field Label (Human Readable)" required>
              <FormInput
                value={form.fieldLabel}
                onChange={v => {
                  setForm(p => ({
                    ...p,
                    fieldLabel: v,
                    fieldKey: p.fieldKey || v.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
                  }));
                }}
                placeholder="e.g. Pain Score (0-10)"
              />
            </FormGroup>

            <FormGroup label="Field Key (Internal Slug)" required>
              <FormInput
                value={form.fieldKey}
                onChange={v => setForm(p => ({ ...p, fieldKey: v.toLowerCase().replace(/[^a-z0-9_]+/g, '') }))}
                placeholder="e.g. pain_score"
              />
            </FormGroup>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormGroup
              label="Management Sequence Step"
              hint="Controls the clinical workflow order (Step 1, Step 2, Step 3...)"
            >
              <select
                value={form.managementSequence}
                onChange={e => setForm(p => ({ ...p, managementSequence: Number(e.target.value) }))}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
              >
                {availableSequences.map(item => (
                  <option key={item.seq} value={item.seq}>
                    Step {item.seq}: {item.label}
                  </option>
                ))}
              </select>
            </FormGroup>

            <FormGroup label="Form Section / Category">
              <FormInput
                value={form.section}
                onChange={v => setForm(p => ({ ...p, section: v }))}
                placeholder="e.g. Vitals, Airway, Assessment"
              />
            </FormGroup>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Placeholder Text">
              <FormInput
                value={form.placeholder}
                onChange={v => setForm(p => ({ ...p, placeholder: v }))}
                placeholder="e.g. 120/80 or Score 0-10"
              />
            </FormGroup>

            <FormGroup label="Unit of Measurement (Optional)">
              <FormInput
                value={form.unit}
                onChange={v => setForm(p => ({ ...p, unit: v }))}
                placeholder="e.g. °F, bpm, mmHg, mL, sec, /10"
              />
            </FormGroup>
          </div>

          {/* Number specific min/max */}
          {form.fieldType === 'number' && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-purple-50 rounded-xl border border-purple-200">
              <FormGroup label="Minimum Value">
                <FormInput
                  type="number"
                  value={form.minValue}
                  onChange={v => setForm(p => ({ ...p, minValue: v }))}
                  placeholder="e.g. 0"
                />
              </FormGroup>
              <FormGroup label="Maximum Value">
                <FormInput
                  type="number"
                  value={form.maxValue}
                  onChange={v => setForm(p => ({ ...p, maxValue: v }))}
                  placeholder="e.g. 100"
                />
              </FormGroup>
            </div>
          )}

          {/* Dropdown / Radio / Multi-select options editor */}
          {(form.fieldType === 'dropdown' || form.fieldType === 'radio' || form.fieldType === 'multi-select') && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <SectionTitle>Configured Selectable Options</SectionTitle>
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                {form.dropdownOptions.map((opt, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-2xs"
                  >
                    {opt}
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={optionInput}
                  onChange={e => setOptionInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addOption();
                    }
                  }}
                  placeholder="Type new option label and press Add or Enter..."
                  className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-400 bg-white"
                />
                <button
                  type="button"
                  onClick={addOption}
                  className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 transition"
                >
                  Add Option
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <FormGroup label="Display Order Within Sequence">
              <FormInput
                type="number"
                value={form.displayOrder}
                onChange={v => setForm(p => ({ ...p, displayOrder: parseInt(v) || 1 }))}
              />
            </FormGroup>

            <div className="flex flex-col justify-center space-y-2 pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isRequired}
                  onChange={e => setForm(p => ({ ...p, isRequired: e.target.checked }))}
                  className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                />
                <span className="text-xs font-bold text-red-700">Required Field (*)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
                  className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-800">Active (Visible in Form)</span>
              </label>
            </div>
          </div>
        </div>
      </FormDrawer>

      {/* Live Form Preview Modal */}
      {showLivePreview && previewFormId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-100 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-teal-600 text-white rounded-md text-xs font-bold uppercase tracking-wider">
                  Live Dynamic Form Preview
                </span>
                <span className="text-xs text-slate-500">
                  Real-time preview of form layout, Management Sequence steps, and validation
                </span>
              </div>
              <button
                onClick={() => setShowLivePreview(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <DynamicNursingFormRenderer
                formId={previewFormId}
                isSandbox={true}
                onClose={() => setShowLivePreview(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
