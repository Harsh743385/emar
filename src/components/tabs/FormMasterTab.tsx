'use client';

import React, { useState } from 'react';
import { useEMR } from '@/context/EMRContext';
import { generateId } from '@/lib/store';
import { FormDrawer, FormGroup, FormInput, FormSelect, CardHeader, TealButton, SoftButton } from '@/components/FormDrawer';
import {
  Plus, Edit2, ToggleLeft, ToggleRight, Eye, ArrowUp, ArrowDown,
  Sparkles, Layers, Sliders, CheckCircle2, X, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FormMaster } from '@/lib/types';
import { DynamicNursingFormRenderer } from '@/components/DynamicNursingFormRenderer';

interface FormMasterTabProps {
  onNavigateToFieldMaster?: (formId: string) => void;
}

export function FormMasterTab({ onNavigateToFieldMaster }: FormMasterTabProps) {
  const { store, updateStore } = useEMR();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [previewFormId, setPreviewFormId] = useState<string | null>(null);

  const [form, setForm] = useState({
    formName: '',
    formCode: '',
    nursingModule: '',
    sectionName: '',
    managementSequence: '',
    description: '',
    displayOrder: 1,
    isActive: true,
  });

  const forms = [...store.formMaster].sort((a, b) => a.displayOrder - b.displayOrder);

  function openNew() {
    setForm({
      formName: '',
      formCode: '',
      nursingModule: 'Assessment',
      sectionName: 'General',
      managementSequence: '1. Initial Triage -> 2. Clinical Assessment -> 3. Action & Sign-off',
      description: '',
      displayOrder: forms.length + 1,
      isActive: true,
    });
    setEditId(null);
    setDrawerOpen(true);
  }

  function openEdit(f: FormMaster) {
    setForm({
      formName: f.formName,
      formCode: f.formCode,
      nursingModule: f.nursingModule,
      sectionName: f.sectionName || '',
      managementSequence: f.managementSequence || '1. Assessment -> 2. Interventions -> 3. Sign-off',
      description: f.description || '',
      displayOrder: f.displayOrder,
      isActive: f.isActive,
    });
    setEditId(f.id);
    setDrawerOpen(true);
  }

  function toggleActive(id: string) {
    updateStore(prev => ({
      ...prev,
      formMaster: prev.formMaster.map(f => f.id === id ? { ...f, isActive: !f.isActive } : f),
    }));
  }

  function moveOrder(id: string, direction: 'up' | 'down') {
    const idx = forms.findIndex(f => f.id === id);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === forms.length - 1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const current = forms[idx];
    const target = forms[targetIdx];

    const currentOrder = current.displayOrder;
    const targetOrder = target.displayOrder;

    updateStore(prev => ({
      ...prev,
      formMaster: prev.formMaster.map(f => {
        if (f.id === current.id) return { ...f, displayOrder: targetOrder };
        if (f.id === target.id) return { ...f, displayOrder: currentOrder };
        return f;
      }),
    }));
  }

  function save() {
    if (!form.formName.trim() || !form.formCode.trim()) return;

    updateStore(prev => {
      if (editId) {
        return {
          ...prev,
          formMaster: prev.formMaster.map(f => f.id === editId ? { ...f, ...form } : f),
        };
      }
      return {
        ...prev,
        formMaster: [
          ...prev.formMaster,
          {
            id: generateId(),
            ...form,
            createdAt: new Date().toISOString(),
          } as FormMaster,
        ],
      };
    });
    setDrawerOpen(false);
  }

  const modules = [
    'Assessment', 'Clinical Monitoring', 'Skin Assessment', 'Safety',
    'Monitoring', 'Procedures', 'Handovers', 'Physiotherapy', 'Medications', 'Administration',
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Banner */}
      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-teal-900 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold">
            <Sliders size={18} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-800">Form Master & Dynamic Form Engine</h3>
            <p className="text-slate-600">
              Configure nursing forms, Management Sequence workflows, labels, and display order.
              Forms configured here are dynamically rendered across the EMR.
            </p>
          </div>
        </div>
        <TealButton onClick={openNew} size="sm">
          <Plus size={14} /> Create New Form
        </TealButton>
      </div>

      {/* Forms Table Card */}
      <div className="ncard">
        <CardHeader
          title="Configured Nursing Forms"
          subtitle="Manage form definitions, management sequence workflows, and active status"
          actions={
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">
                {forms.filter(f => f.isActive).length} Active / {forms.length} Total
              </span>
              <TealButton onClick={openNew} size="sm">
                <Plus size={14} /> New Form
              </TealButton>
            </div>
          }
        />
        <div className="ncard-body">
          <div className="overflow-x-auto">
            <table className="icu-table">
              <thead>
                <tr>
                  <th className="text-center w-14">Order</th>
                  <th className="text-left">Form Name & Code</th>
                  <th>Nursing Module</th>
                  <th>Management Sequence Workflow</th>
                  <th className="text-center">Fields Count</th>
                  <th>Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {forms.map((f, idx) => {
                  const fieldCount = store.fieldMaster.filter(fld => fld.formId === f.id && fld.isActive).length;
                  const totalFields = store.fieldMaster.filter(fld => fld.formId === f.id).length;

                  return (
                    <tr key={f.id} className={cn('hover:bg-slate-50 transition-colors', !f.isActive && 'opacity-60 bg-slate-50/50')}>
                      {/* Order & Reorder Arrows */}
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1 font-mono text-xs font-bold text-slate-700">
                          <span>{f.displayOrder}</span>
                          <div className="flex flex-col">
                            <button
                              onClick={() => moveOrder(f.id, 'up')}
                              disabled={idx === 0}
                              className="text-slate-400 hover:text-teal-600 disabled:opacity-20 p-0.5"
                              title="Move Up"
                            >
                              <ArrowUp size={11} />
                            </button>
                            <button
                              onClick={() => moveOrder(f.id, 'down')}
                              disabled={idx === forms.length - 1}
                              className="text-slate-400 hover:text-teal-600 disabled:opacity-20 p-0.5"
                              title="Move Down"
                            >
                              <ArrowDown size={11} />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Form Name & Code */}
                      <td className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
                            {f.formCode}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">{f.formName}</span>
                        </div>
                        {f.description && (
                          <div className="text-xs text-slate-500 mt-0.5 max-w-md line-clamp-1">
                            {f.description}
                          </div>
                        )}
                      </td>

                      {/* Nursing Module */}
                      <td>
                        <span className="text-xs font-semibold px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                          {f.nursingModule}
                        </span>
                      </td>

                      {/* Management Sequence */}
                      <td>
                        {f.managementSequence ? (
                          <div className="flex items-center gap-1 text-xs text-teal-800 font-medium bg-teal-50/80 px-2.5 py-1 rounded-lg border border-teal-100 max-w-sm truncate">
                            <Layers size={13} className="text-teal-600 shrink-0" />
                            <span className="truncate">{f.managementSequence}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Default Sequence</span>
                        )}
                      </td>

                      {/* Configured Fields */}
                      <td className="text-center">
                        <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                          {fieldCount} active / {totalFields} total
                        </span>
                      </td>

                      {/* Status Toggle */}
                      <td>
                        <button
                          onClick={() => toggleActive(f.id)}
                          className={cn(
                            'flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors',
                            f.isActive
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          )}
                        >
                          {f.isActive ? <ToggleRight size={14} className="text-emerald-600" /> : <ToggleLeft size={14} />}
                          {f.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setPreviewFormId(f.id)}
                            className="px-2.5 py-1 text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 rounded-lg transition flex items-center gap-1"
                            title="Interactive dynamic form preview"
                          >
                            <Eye size={12} /> Preview Form
                          </button>
                          <SoftButton onClick={() => openEdit(f)} size="sm">
                            <Edit2 size={12} /> Edit
                          </SoftButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit / New Form Drawer */}
      <FormDrawer
        open={drawerOpen}
        title={editId ? 'Edit Nursing Form Definition' : 'Configure New Nursing Form'}
        onClose={() => setDrawerOpen(false)}
        onSave={save}
        saveLabel={editId ? 'Save Changes' : 'Create Form'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Form Name" required>
              <FormInput
                value={form.formName}
                onChange={v => setForm(p => ({ ...p, formName: v }))}
                placeholder="e.g. Post-Operative Recovery Assessment"
              />
            </FormGroup>
            <FormGroup label="Form Code" required>
              <FormInput
                value={form.formCode}
                onChange={v => setForm(p => ({ ...p, formCode: v.toUpperCase() }))}
                placeholder="e.g. PORA"
              />
            </FormGroup>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Nursing Module" required>
              <FormSelect
                value={form.nursingModule}
                onChange={v => setForm(p => ({ ...p, nursingModule: v }))}
                options={['', ...modules]}
              />
            </FormGroup>
            <FormGroup label="Default Primary Section">
              <FormInput
                value={form.sectionName}
                onChange={v => setForm(p => ({ ...p, sectionName: v }))}
                placeholder="e.g. PACU Recovery, Vitals"
              />
            </FormGroup>
          </div>

          <FormGroup
            label="Clinical Management Sequence"
            hint="Defines the clinical step-by-step workflow sequence for nursing care (separated by ->)"
          >
            <FormInput
              value={form.managementSequence}
              onChange={v => setForm(p => ({ ...p, managementSequence: v }))}
              placeholder="e.g. 1. OT Arrival & Airway -> 2. Surgical Site & Drains -> 3. Recovery Interventions"
            />
          </FormGroup>

          <FormGroup label="Form Clinical Description & Scope">
            <textarea
              rows={2}
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="NABH documentation standard, frequency of monitoring, and clinical objectives..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-teal-500"
            />
          </FormGroup>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <FormGroup label="Display Order Sequence">
              <FormInput
                type="number"
                value={form.displayOrder}
                onChange={v => setForm(p => ({ ...p, displayOrder: parseInt(v) || 1 }))}
              />
            </FormGroup>
            <FormGroup label="Form Status">
              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
                  className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-800">Active (Visible in EMR)</span>
              </label>
            </FormGroup>
          </div>
        </div>
      </FormDrawer>

      {/* Live Dynamic Form Preview Modal */}
      {previewFormId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-100 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-teal-600 text-white rounded-md text-xs font-bold uppercase tracking-wider">
                  Live Dynamic Form Preview
                </span>
                <span className="text-xs text-slate-500">
                  Interactive testing sandbox for form fields and management sequences
                </span>
              </div>
              <button
                onClick={() => setPreviewFormId(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <DynamicNursingFormRenderer
                formId={previewFormId}
                isSandbox={true}
                onClose={() => setPreviewFormId(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
