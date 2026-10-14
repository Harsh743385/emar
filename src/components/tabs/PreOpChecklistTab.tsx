'use client';
import { useState } from 'react';
import { useEMR } from '@/context/EMRContext';
import { generateId, nowDateStr, nowTimeStr } from '@/lib/store';
import { formatDate } from '@/lib/utils';
import { FormDrawer, FormGroup, FormInput, FormTextarea, SectionTitle, StatusBadge, EmptyState, CardHeader, TealButton, SoftButton } from '@/components/FormDrawer';
import { Plus, Edit2, ClipboardList, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PreOpChecklist, PreOpChecklistItem } from '@/lib/types';

const DEFAULT_ITEMS: PreOpChecklistItem[] = [
  { id: 'po1', label: '1. Patient identification verified (wristband matches)', checked: false, details: '' },
  { id: 'po2', label: '2. Planned surgery confirmed with patient / guardian', checked: false, details: '' },
  { id: 'po3', label: '3. Pre-operative assessment completed', checked: false, details: '' },
  { id: 'po4', label: '4. Pre-operative diagnosis documented in chart', checked: false, details: '' },
  { id: 'po5', label: '5. Surgical consent obtained and signed', checked: false, details: '' },
  { id: 'po6', label: '6. Anaesthesia assessment and consent obtained', checked: false, details: '' },
  { id: 'po7', label: '7. Allergy status checked and documented', checked: false, details: '' },
  { id: 'po8', label: '8. Fasting status confirmed', checked: false, details: '' },
  { id: 'po9', label: '9. Investigations and reports available', checked: false, details: '' },
  { id: 'po10', label: '10. Medication review and high-risk medication check done', checked: false, details: '' },
  { id: 'po11', label: '11. Surgical site marking done (if applicable)', checked: false, details: '' },
  { id: 'po12', label: '12. Blood availability confirmed (if applicable)', checked: false, details: '' },
  { id: 'po13', label: '13. Jewellery, dentures, prosthetics removed', checked: false, details: '' },
  { id: 'po14', label: '14. Patient preparation completed (prepped and draped)', checked: false, details: '' },
  { id: 'po15', label: '15. Patient transferred to OT', checked: false, details: '' },
];

export function PreOpChecklistTab() {
  const { store, selectedPatient, updateStore } = useEMR();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [items, setItems] = useState<PreOpChecklistItem[]>(DEFAULT_ITEMS.map(i => ({ ...i })));
  const [meta, setMeta] = useState({ date: nowDateStr(), time: nowTimeStr(), nurseName: '', plannedSurgery: '', remarks: '' });

  const patientId = selectedPatient!.id;
  const records = store.preOpChecklists.filter(r => r.patientId === patientId);

  function toggleItem(id: string) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  }

  function setItemDetails(id: string, details: string) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, details } : i));
  }

  function openNew() {
    setItems(DEFAULT_ITEMS.map(i => ({ ...i })));
    setMeta({ date: nowDateStr(), time: nowTimeStr(), nurseName: '', plannedSurgery: '', remarks: '' });
    setEditId(null); setDrawerOpen(true);
  }

  function save(status: 'Completed' | 'Draft') {
    updateStore(prev => {
      const rec = { ...meta, items, status };
      if (editId) return { ...prev, preOpChecklists: prev.preOpChecklists.map(r => r.id === editId ? { ...r, ...rec } : r) };
      return { ...prev, preOpChecklists: [...prev.preOpChecklists, { id: generateId(), patientId, ...rec, createdAt: new Date().toISOString() } as PreOpChecklist] };
    });
    setDrawerOpen(false);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="ncard">
        <CardHeader title="Pre-Operative Checklist" actions={<TealButton onClick={openNew} size="sm"><Plus size={14} /> New Checklist</TealButton>} />
        <div className="ncard-body">
          {records.length === 0 ? (
            <EmptyState icon={<ClipboardList />} title="No pre-operative checklists" action={<TealButton onClick={openNew}><Plus size={14} /> New Checklist</TealButton>} />
          ) : (
            <div className="space-y-3">
              {records.map(r => {
                const done = r.items.filter(i => i.checked).length;
                return (
                  <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm">{formatDate(r.date)} {r.time}</span>
                          <StatusBadge status={r.status} />
                          <span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold', done === r.items.length ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700')}>
                            {done}/{r.items.length} Complete
                          </span>
                        </div>
                        <p className="text-sm text-slate-600"><b>Planned Surgery:</b> {r.plannedSurgery}</p>
                        <p className="text-xs text-slate-400">By {r.nurseName || 'Demo Nurse'}</p>
                      </div>
                      <SoftButton onClick={() => { setItems(r.items.map(i => ({ ...i }))); setMeta({ date: r.date, time: r.time, nurseName: r.nurseName, plannedSurgery: r.plannedSurgery, remarks: r.remarks }); setEditId(r.id); setDrawerOpen(true); }} size="sm"><Edit2 size={12} /> Edit</SoftButton>
                    </div>
                    <div className="space-y-1">
                      {r.items.map(item => (
                        <div key={item.id} className={cn('flex items-start gap-2 px-3 py-1.5 rounded-lg text-sm', item.checked ? 'bg-green-50' : 'bg-red-50')}>
                          {item.checked ? <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" /> : <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />}
                          <span className={item.checked ? 'text-green-800' : 'text-red-700'}>{item.label}</span>
                          {item.details && <span className="text-slate-500 text-xs ml-auto">({item.details})</span>}
                        </div>
                      ))}
                    </div>
                    {r.remarks && <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100"><b>Remarks:</b> {r.remarks}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <FormDrawer open={drawerOpen} title="Pre-Operative Checklist" subtitle={selectedPatient!.name} onClose={() => setDrawerOpen(false)} onSave={() => save('Completed')} onSaveDraft={() => save('Draft')}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <FormGroup label="Date"><FormInput type="date" value={meta.date} onChange={v => setMeta(p => ({ ...p, date: v }))} /></FormGroup>
          <FormGroup label="Time"><FormInput type="time" value={meta.time} onChange={v => setMeta(p => ({ ...p, time: v }))} /></FormGroup>
          <FormGroup label="Nurse Name"><FormInput value={meta.nurseName} onChange={v => setMeta(p => ({ ...p, nurseName: v }))} /></FormGroup>
        </div>
        <FormGroup label="Planned Surgery / Procedure" required>
          <FormInput value={meta.plannedSurgery} onChange={v => setMeta(p => ({ ...p, plannedSurgery: v }))} placeholder="e.g. Right femur ORIF under spinal anaesthesia" className="mb-3" />
        </FormGroup>

        <SectionTitle>Checklist Items — Tap to verify</SectionTitle>
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className={cn('checklist-item cursor-pointer', item.checked ? 'checked' : '')} onClick={() => toggleItem(item.id)}>
              <div className="flex-shrink-0 mt-0.5">
                {item.checked ? <CheckCircle size={18} className="text-teal-500" /> : <div className="w-4.5 h-4.5 rounded-full border-2 border-slate-300 w-[18px] h-[18px]" />}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-800">{item.label}</div>
                <div onClick={e => e.stopPropagation()}>
                  <input
                    type="text"
                    placeholder="Add details..."
                    value={item.details}
                    onChange={e => setItemDetails(item.id, e.target.value)}
                    className="mt-1 w-full px-2 py-1 border border-slate-200 rounded text-xs focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <SectionTitle>Remarks</SectionTitle>
        <FormGroup label="Remarks"><FormTextarea value={meta.remarks} onChange={v => setMeta(p => ({ ...p, remarks: v }))} rows={2} /></FormGroup>

        {/* Progress indicator */}
        <div className="mt-4 p-3 bg-slate-50 rounded-xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-600">Checklist Progress</span>
            <span className="text-xs font-bold text-teal-600">{items.filter(i => i.checked).length}/{items.length} items verified</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div className="bg-teal-500 h-2 rounded-full transition-all" style={{ width: `${(items.filter(i => i.checked).length / items.length) * 100}%` }} />
          </div>
        </div>
      </FormDrawer>
    </div>
  );
}
