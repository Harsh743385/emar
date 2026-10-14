'use client';
import { useState } from 'react';
import { useEMR } from '@/context/EMRContext';
import { generateId } from '@/lib/store';
import { FormDrawer, FormGroup, FormInput, FormSelect, SectionTitle, CardHeader, TealButton, SoftButton } from '@/components/FormDrawer';
import { Plus, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FieldMaster } from '@/lib/types';

export function FieldMasterTab() {
  const { store, updateStore } = useEMR();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedFormId, setSelectedFormId] = useState('all');
  const [form, setForm] = useState({
    formId: store.formMaster[0]?.id || '',
    fieldKey: '', fieldLabel: '', fieldType: 'text' as FieldMaster['fieldType'],
    section: '', isRequired: false, displayOrder: 1, isActive: true,
    dropdownOptions: [] as string[],
    minValue: '', maxValue: '', placeholder: '',
  });
  const [optionInput, setOptionInput] = useState('');

  const fields = selectedFormId === 'all' ? store.fieldMaster : store.fieldMaster.filter(f => f.formId === selectedFormId);
  const fieldTypes: FieldMaster['fieldType'][] = ['text', 'number', 'date', 'time', 'textarea', 'dropdown', 'checkbox', 'radio', 'yesno'];

  function openNew() {
    setForm({ formId: store.formMaster[0]?.id || '', fieldKey: '', fieldLabel: '', fieldType: 'text', section: '', isRequired: false, displayOrder: fields.length + 1, isActive: true, dropdownOptions: [], minValue: '', maxValue: '', placeholder: '' });
    setOptionInput('');
    setEditId(null); setDrawerOpen(true);
  }

  function openEdit(f: FieldMaster) {
    setForm({ formId: f.formId, fieldKey: f.fieldKey, fieldLabel: f.fieldLabel, fieldType: f.fieldType, section: f.section, isRequired: f.isRequired, displayOrder: f.displayOrder, isActive: f.isActive, dropdownOptions: f.dropdownOptions || [], minValue: String(f.minValue || ''), maxValue: String(f.maxValue || ''), placeholder: f.placeholder || '' });
    setOptionInput('');
    setEditId(f.id); setDrawerOpen(true);
  }

  function toggleActive(id: string) {
    updateStore(prev => ({ ...prev, fieldMaster: prev.fieldMaster.map(f => f.id === id ? { ...f, isActive: !f.isActive } : f) }));
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
    updateStore(prev => {
      const rec = {
        formId: form.formId, fieldKey: form.fieldKey, fieldLabel: form.fieldLabel, fieldType: form.fieldType,
        section: form.section, isRequired: form.isRequired, displayOrder: form.displayOrder, isActive: form.isActive,
        dropdownOptions: form.dropdownOptions.length ? form.dropdownOptions : undefined,
        minValue: form.minValue ? Number(form.minValue) : undefined,
        maxValue: form.maxValue ? Number(form.maxValue) : undefined,
        placeholder: form.placeholder || undefined,
      };
      if (editId) return { ...prev, fieldMaster: prev.fieldMaster.map(f => f.id === editId ? { ...f, ...rec } : f) };
      return { ...prev, fieldMaster: [...prev.fieldMaster, { id: generateId(), ...rec, createdAt: new Date().toISOString() } as FieldMaster] };
    });
    setDrawerOpen(false);
  }

  const typeColor: Record<string, string> = {
    text: 'bg-blue-100 text-blue-700',
    number: 'bg-purple-100 text-purple-700',
    textarea: 'bg-slate-100 text-slate-700',
    dropdown: 'bg-amber-100 text-amber-700',
    checkbox: 'bg-green-100 text-green-700',
    radio: 'bg-teal-100 text-teal-700',
    date: 'bg-orange-100 text-orange-700',
    time: 'bg-cyan-100 text-cyan-700',
    yesno: 'bg-rose-100 text-rose-700',
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-700">
        ⚠ <b>Field Master</b> — Demo configuration module. Fields defined here are linked to forms in the Form Master and can be used to render forms dynamically.
      </div>
      <div className="ncard">
        <CardHeader
          title="Field Master"
          actions={<TealButton onClick={openNew} size="sm"><Plus size={14} /> New Field</TealButton>}
        />
        <div className="ncard-body">
          {/* Form filter */}
          <div className="flex gap-2 flex-wrap mb-4">
            <button onClick={() => setSelectedFormId('all')} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors', selectedFormId === 'all' ? 'bg-teal-500 text-white border-teal-500' : 'bg-white border-slate-200 text-slate-600')}>All Forms ({store.fieldMaster.length})</button>
            {store.formMaster.map(f => {
              const count = store.fieldMaster.filter(fld => fld.formId === f.id).length;
              return (
                <button key={f.id} onClick={() => setSelectedFormId(f.id)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors', selectedFormId === f.id ? 'bg-teal-500 text-white border-teal-500' : 'bg-white border-slate-200 text-slate-600')}>
                  {f.formCode} — {f.formName.substring(0, 20)}{f.formName.length > 20 ? '…' : ''} ({count})
                </button>
              );
            })}
          </div>

          <div className="overflow-x-auto">
            <table className="icu-table">
              <thead>
                <tr>
                  <th className="text-left">Field Label</th>
                  <th className="text-left">Key</th>
                  <th>Type</th>
                  <th>Section</th>
                  <th>Form</th>
                  <th>Required</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fields.sort((a, b) => a.displayOrder - b.displayOrder).map(f => {
                  const fm = store.formMaster.find(m => m.id === f.formId);
                  return (
                    <tr key={f.id} className={cn('hover:bg-slate-50', !f.isActive && 'opacity-50')}>
                      <td className="text-left">
                        <div className="font-semibold text-slate-800 text-sm">{f.fieldLabel}</div>
                        {f.placeholder && <div className="text-xs text-slate-400 italic">{f.placeholder}</div>}
                      </td>
                      <td className="text-left"><span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{f.fieldKey}</span></td>
                      <td><span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold', typeColor[f.fieldType] || 'bg-slate-100 text-slate-600')}>{f.fieldType}</span></td>
                      <td className="text-xs text-slate-600">{f.section}</td>
                      <td className="text-xs"><span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{fm?.formCode || '?'}</span></td>
                      <td>{f.isRequired ? <span className="text-xs text-red-600 font-bold">Yes</span> : <span className="text-xs text-slate-400">No</span>}</td>
                      <td className="text-xs">{f.displayOrder}</td>
                      <td>
                        <button onClick={() => toggleActive(f.id)} className={cn('flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full transition-colors', f.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500')}>
                          {f.isActive ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                          {f.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td><SoftButton onClick={() => openEdit(f)} size="sm"><Edit2 size={12} /> Edit</SoftButton></td>
                    </tr>
                  );
                })}
                {fields.length === 0 && (
                  <tr><td colSpan={9} className="py-8 text-center text-slate-400 text-sm">No fields configured for this form</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-xs text-slate-400">{fields.filter(f => f.isActive).length} active fields / {fields.length} total</div>
        </div>
      </div>

      <FormDrawer open={drawerOpen} title={editId ? 'Edit Field' : 'New Field'} onClose={() => setDrawerOpen(false)} onSave={save} saveLabel="Save Field">
        <div className="grid grid-cols-2 gap-3">
          <FormGroup label="Form" required>
            <FormSelect value={form.formId} onChange={v => setForm(p => ({ ...p, formId: v }))} options={store.formMaster.map(f => ({ value: f.id, label: `${f.formCode} — ${f.formName}` }))} />
          </FormGroup>
          <FormGroup label="Field Type" required>
            <FormSelect value={form.fieldType} onChange={v => setForm(p => ({ ...p, fieldType: v as FieldMaster['fieldType'] }))} options={fieldTypes.map(t => ({ value: t, label: t }))} />
          </FormGroup>
          <FormGroup label="Field Label" required><FormInput value={form.fieldLabel} onChange={v => setForm(p => ({ ...p, fieldLabel: v }))} placeholder="e.g. Temperature (°F)" /></FormGroup>
          <FormGroup label="Field Key" required><FormInput value={form.fieldKey} onChange={v => setForm(p => ({ ...p, fieldKey: v.toLowerCase().replace(/\s+/g, '_') }))} placeholder="e.g. temp_f" /></FormGroup>
          <FormGroup label="Section"><FormInput value={form.section} onChange={v => setForm(p => ({ ...p, section: v }))} placeholder="e.g. Vitals, General, Risk" /></FormGroup>
          <FormGroup label="Placeholder Text"><FormInput value={form.placeholder} onChange={v => setForm(p => ({ ...p, placeholder: v }))} placeholder="Input placeholder..." /></FormGroup>
          <FormGroup label="Display Order"><FormInput type="number" value={form.displayOrder} onChange={v => setForm(p => ({ ...p, displayOrder: parseInt(v) || 1 }))} /></FormGroup>
        </div>
        {(form.fieldType === 'number') && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <FormGroup label="Min Value"><FormInput type="number" value={form.minValue} onChange={v => setForm(p => ({ ...p, minValue: v }))} /></FormGroup>
            <FormGroup label="Max Value"><FormInput type="number" value={form.maxValue} onChange={v => setForm(p => ({ ...p, maxValue: v }))} /></FormGroup>
          </div>
        )}
        {form.fieldType === 'dropdown' && (
          <>
            <SectionTitle>Dropdown Options</SectionTitle>
            <div className="space-y-2">
              {form.dropdownOptions.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm">{opt}</span>
                  <button onClick={() => removeOption(i)} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
                </div>
              ))}
              <div className="flex gap-2">
                <input value={optionInput} onChange={e => setOptionInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addOption()} placeholder="Type option and press Enter..." className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-400" />
                <button onClick={addOption} className="px-3 py-1.5 bg-teal-100 text-teal-700 rounded-lg text-sm hover:bg-teal-200 transition-colors">Add</button>
              </div>
            </div>
          </>
        )}
        <div className="flex items-center gap-4 mt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isRequired} onChange={e => setForm(p => ({ ...p, isRequired: e.target.checked }))} className="w-4 h-4 accent-teal-500" />
            <span className="text-sm font-medium">Required Field</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 accent-teal-500" />
            <span className="text-sm font-medium">Active</span>
          </label>
        </div>
      </FormDrawer>
    </div>
  );
}
