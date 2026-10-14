'use client';
import { useState } from 'react';
import { useEMR } from '@/context/EMRContext';
import { generateId, nowDateStr, nowTimeStr } from '@/lib/store';
import { formatDate } from '@/lib/utils';
import { FormDrawer, FormGroup, FormInput, SectionTitle, StatusBadge, EmptyState, CardHeader, TealButton, SoftButton } from '@/components/FormDrawer';
import { Plus, Edit2, ShoppingBag, Trash2 } from 'lucide-react';
import type { ValuableItem, ValuableItemEntry } from '@/lib/types';

export function ValuablesTab() {
  const { store, selectedPatient, updateStore } = useEMR();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [items, setItems] = useState<ValuableItemEntry[]>([]);
  const [meta, setMeta] = useState({ handoverDate: nowDateStr(), handoverTime: nowTimeStr(), staffName: '', receiverName: '', receiverRelationship: '', nurseSignature: '', receiverSignature: '' });

  const patientId = selectedPatient!.id;
  const records = store.valuableItems.filter(r => r.patientId === patientId);

  function openNew() {
    setItems([{ id: generateId(), name: '', quantity: 1, description: '' }]);
    setMeta({ handoverDate: nowDateStr(), handoverTime: nowTimeStr(), staffName: '', receiverName: '', receiverRelationship: '', nurseSignature: '', receiverSignature: '' });
    setEditId(null); setDrawerOpen(true);
  }

  function addItem() { setItems(prev => [...prev, { id: generateId(), name: '', quantity: 1, description: '' }]); }
  function removeItem(id: string) { setItems(prev => prev.filter(i => i.id !== id)); }
  function updateItem(id: string, k: keyof ValuableItemEntry, v: string | number) { setItems(prev => prev.map(i => i.id === id ? { ...i, [k]: v } : i)); }

  function save(status: 'Completed' | 'Draft') {
    updateStore(prev => {
      const rec = { ...meta, items, status };
      if (editId) return { ...prev, valuableItems: prev.valuableItems.map(r => r.id === editId ? { ...r, ...rec } : r) };
      return { ...prev, valuableItems: [...prev.valuableItems, { id: generateId(), patientId, ...rec, createdAt: new Date().toISOString() } as ValuableItem] };
    });
    setDrawerOpen(false);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="ncard">
        <CardHeader title="Valuable Items Handover" actions={<TealButton onClick={openNew} size="sm"><Plus size={14} /> New Handover</TealButton>} />
        <div className="ncard-body">
          {records.length === 0 ? (
            <EmptyState icon={<ShoppingBag />} title="No valuable items records" action={<TealButton onClick={openNew}><Plus size={14} /> New Handover</TealButton>} />
          ) : (
            <div className="space-y-3">
              {records.map(r => (
                <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm">{formatDate(r.handoverDate)} {r.handoverTime}</span>
                        <StatusBadge status={r.status} />
                      </div>
                      <p className="text-sm text-slate-600"><b>Handed to:</b> {r.receiverName} ({r.receiverRelationship})</p>
                      <p className="text-xs text-slate-400">By {r.staffName || 'Demo Nurse'}</p>
                    </div>
                    <SoftButton onClick={() => { setItems(r.items.map(i => ({ ...i }))); setMeta({ handoverDate: r.handoverDate, handoverTime: r.handoverTime, staffName: r.staffName, receiverName: r.receiverName, receiverRelationship: r.receiverRelationship, nurseSignature: r.nurseSignature || '', receiverSignature: r.receiverSignature || '' }); setEditId(r.id); setDrawerOpen(true); }} size="sm"><Edit2 size={12} /> Edit</SoftButton>
                  </div>
                  <table className="w-full text-sm">
                    <thead><tr className="bg-slate-50"><th className="text-left px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase">Item</th><th className="text-center px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase">Qty</th><th className="text-left px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase">Description</th></tr></thead>
                    <tbody>{r.items.map(item => <tr key={item.id} className="border-t border-slate-100"><td className="px-3 py-2">{item.name}</td><td className="px-3 py-2 text-center">{item.quantity}</td><td className="px-3 py-2 text-slate-600">{item.description}</td></tr>)}</tbody>
                  </table>
                  {(r.nurseSignature || r.receiverSignature) && (
                    <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs text-slate-600">
                      {r.nurseSignature && <span><b>Nurse Sig:</b> {r.nurseSignature}</span>}
                      {r.receiverSignature && <span><b>Receiver Sig:</b> {r.receiverSignature}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <FormDrawer open={drawerOpen} title="Valuable Items Handover" subtitle={selectedPatient!.name} onClose={() => setDrawerOpen(false)} onSave={() => save('Completed')} onSaveDraft={() => save('Draft')}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <FormGroup label="Date"><FormInput type="date" value={meta.handoverDate} onChange={v => setMeta(p => ({ ...p, handoverDate: v }))} /></FormGroup>
          <FormGroup label="Time"><FormInput type="time" value={meta.handoverTime} onChange={v => setMeta(p => ({ ...p, handoverTime: v }))} /></FormGroup>
          <FormGroup label="Staff Name"><FormInput value={meta.staffName} onChange={v => setMeta(p => ({ ...p, staffName: v }))} /></FormGroup>
          <FormGroup label="Receiver Name" required><FormInput value={meta.receiverName} onChange={v => setMeta(p => ({ ...p, receiverName: v }))} /></FormGroup>
          <FormGroup label="Relationship"><FormInput value={meta.receiverRelationship} onChange={v => setMeta(p => ({ ...p, receiverRelationship: v }))} placeholder="Spouse, Child, etc." /></FormGroup>
        </div>
        <SectionTitle>Signatures</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <FormGroup label="Nurse Signature" required>
            <FormInput value={meta.nurseSignature} onChange={v => setMeta(p => ({ ...p, nurseSignature: v }))} placeholder="Nurse name / initials" />
          </FormGroup>
          <FormGroup label="Receiver Signature" required>
            <FormInput value={meta.receiverSignature} onChange={v => setMeta(p => ({ ...p, receiverSignature: v }))} placeholder="Receiver name / initials" />
          </FormGroup>
        </div>
        <SectionTitle>Items List</SectionTitle>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <FormInput value={item.name} onChange={v => updateItem(item.id, 'name', v)} placeholder="Item name" className="flex-1" />
              <input type="number" min={1} value={item.quantity} onChange={e => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)} className="w-16 px-2 py-2 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:border-teal-400" />
              <FormInput value={item.description} onChange={v => updateItem(item.id, 'description', v)} placeholder="Description" className="flex-1" />
              <button onClick={() => removeItem(item.id)} className="p-1.5 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
            </div>
          ))}
          <button onClick={addItem} className="w-full py-2 border border-dashed border-teal-300 text-teal-600 text-sm rounded-lg hover:bg-teal-50 transition-colors">
            + Add Item
          </button>
        </div>
      </FormDrawer>
    </div>
  );
}
