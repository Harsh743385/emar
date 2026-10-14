'use client';
import { useState } from 'react';
import { useEMR } from '@/context/EMRContext';
import { generateId } from '@/lib/store';
import { FormDrawer, FormGroup, FormInput, FormSelect, CardHeader, TealButton, SoftButton } from '@/components/FormDrawer';
import { Plus, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FormMaster } from '@/lib/types';

export function FormMasterTab() {
  const { store, updateStore } = useEMR();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    formName: '', formCode: '', nursingModule: '', sectionName: '', displayOrder: 1, isActive: true,
  });

  const forms = store.formMaster;

  function openNew() {
    setForm({ formName: '', formCode: '', nursingModule: '', sectionName: '', displayOrder: forms.length + 1, isActive: true });
    setEditId(null); setDrawerOpen(true);
  }

  function openEdit(f: FormMaster) {
    setForm({ formName: f.formName, formCode: f.formCode, nursingModule: f.nursingModule, sectionName: f.sectionName, displayOrder: f.displayOrder, isActive: f.isActive });
    setEditId(f.id); setDrawerOpen(true);
  }

  function toggleActive(id: string) {
    updateStore(prev => ({
      ...prev, formMaster: prev.formMaster.map(f => f.id === id ? { ...f, isActive: !f.isActive } : f)
    }));
  }

  function save() {
    updateStore(prev => {
      if (editId) return { ...prev, formMaster: prev.formMaster.map(f => f.id === editId ? { ...f, ...form } : f) };
      return {
        ...prev, formMaster: [...prev.formMaster, {
          id: generateId(), ...form, createdAt: new Date().toISOString()
        } as FormMaster]
      };
    });
    setDrawerOpen(false);
  }

  const modules = ['Assessment', 'Clinical Monitoring', 'Skin Assessment', 'Safety', 'Monitoring', 'Procedures', 'Handovers', 'Physiotherapy', 'Medications', 'Administration'];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-700">
        ⚠ <b>Form Master</b> — Demo configuration module. Forms listed here can be associated with dynamic field definitions in the Field Master.
      </div>
      <div className="ncard">
        <CardHeader title="Form Master" actions={<TealButton onClick={openNew} size="sm"><Plus size={14} /> New Form</TealButton>} />
        <div className="ncard-body">
          <div className="overflow-x-auto">
            <table className="icu-table">
              <thead>
                <tr>
                  <th className="text-left">Form Name</th>
                  <th>Code</th>
                  <th>Module</th>
                  <th>Section</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {forms.map(f => (
                  <tr key={f.id} className={cn('hover:bg-slate-50', !f.isActive && 'opacity-50')}>
                    <td className="text-left">
                      <div className="font-semibold text-slate-800">{f.formName}</div>
                    </td>
                    <td><span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{f.formCode}</span></td>
                    <td className="text-xs">{f.nursingModule}</td>
                    <td className="text-xs">{f.sectionName}</td>
                    <td>{f.displayOrder}</td>
                    <td>
                      <button onClick={() => toggleActive(f.id)} className={cn('flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full transition-colors', f.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500')}>
                        {f.isActive ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                        {f.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td>
                      <SoftButton onClick={() => openEdit(f)} size="sm"><Edit2 size={12} /> Edit</SoftButton>
                    </td>
                  </tr>
                ))}
                {forms.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-slate-400 text-sm">No forms configured</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-xs text-slate-400">{forms.filter(f => f.isActive).length} active forms / {forms.length} total</div>
        </div>
      </div>

      <FormDrawer open={drawerOpen} title={editId ? 'Edit Form' : 'New Form'} onClose={() => setDrawerOpen(false)} onSave={save} saveLabel="Save Form">
        <div className="grid grid-cols-2 gap-3">
          <FormGroup label="Form Name" required><FormInput value={form.formName} onChange={v => setForm(p => ({ ...p, formName: v }))} placeholder="e.g. Initial Nursing Assessment" /></FormGroup>
          <FormGroup label="Form Code" required><FormInput value={form.formCode} onChange={v => setForm(p => ({ ...p, formCode: v }))} placeholder="e.g. INA" /></FormGroup>
          <FormGroup label="Nursing Module" required>
            <FormSelect value={form.nursingModule} onChange={v => setForm(p => ({ ...p, nursingModule: v }))} options={['', ...modules]} />
          </FormGroup>
          <FormGroup label="Section Name"><FormInput value={form.sectionName} onChange={v => setForm(p => ({ ...p, sectionName: v }))} placeholder="e.g. Vitals, General" /></FormGroup>
          <FormGroup label="Display Order"><FormInput type="number" value={form.displayOrder} onChange={v => setForm(p => ({ ...p, displayOrder: parseInt(v) || 1 }))} /></FormGroup>
          <FormGroup label="Status">
            <label className="flex items-center gap-2 cursor-pointer mt-1">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 accent-teal-500" />
              <span className="text-sm">Active</span>
            </label>
          </FormGroup>
        </div>
      </FormDrawer>
    </div>
  );
}
