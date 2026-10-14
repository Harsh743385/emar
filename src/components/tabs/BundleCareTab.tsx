'use client';

import { useState } from 'react';
import { useEMR } from '@/context/EMRContext';
import { generateId, nowDateStr, nowTimeStr } from '@/lib/store';
import { formatDate } from '@/lib/utils';
import { FormDrawer, FormGroup, FormInput, FormSelect, FormTextarea, SectionTitle, StatusBadge, EmptyState, CardHeader, TealButton, SoftButton } from '@/components/FormDrawer';
import { Plus, Edit2, GitBranch, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BundleCare, BundleItem } from '@/lib/types';

// ── Category → Tube Options ──────────────────────────────────────────────────
const TUBE_OPTIONS: Record<BundleCare['bundleType'], string[]> = {
  'Urinary Catheter Care': [
    'Foley Catheter',
    'Nelaton Catheter',
    'Suprapubic Catheter',
  ],
  'Central Catheter Care': [
    'Central Venous Catheter (CVC)',
    'PICC Line (Peripherally Inserted Central Catheter)',
    'Hemodialysis Catheter',
    'Hickman Catheter',
    'Implanted Port (Port-a-Cath)',
  ],
  'Critical Care': [
    'Endotracheal Tube (ET Tube)',
    'Tracheostomy Tube',
    'Nasogastric Tube (Ryle\'s Tube)',
    'Orogastric Tube (OG Tube)',
    'Chest Tube (Intercostal Drainage Tube)',
  ],
  'Ventilator Care': [
    'Endotracheal Tube (ET Tube)',
    'Tracheostomy Tube',
  ],
};

// ── Checklist Items per Category ─────────────────────────────────────────────
const BUNDLE_ITEMS: Record<BundleCare['bundleType'], string[]> = {
  'Urinary Catheter Care': [
    'Closed drainage system maintained',
    'Catheter secured properly',
    'Drainage bag below bladder level and off the floor',
    'Hand hygiene performed',
    'Meatal and perineal care performed',
    'Gloves used during catheter handling',
    'Need for catheter removal reviewed',
    'Single-use gloves worn while handling or emptying the drainage bag',
    'No contact between drainage container and drainage bag outlet',
    'A separate container used for collecting urine',
    'Assessment of readiness to remove catheter documented',
  ],
  'Central Catheter Care': [
    'Hand hygiene performed',
    'Catheter hub disinfected',
    'Dressing condition checked',
    'Insertion site checked for signs of infection',
    'Dressing changed when required',
    'Caps replaced on all ports after each use',
    'Need for central line removal reviewed',
  ],
  'Critical Care': [
    'Head end elevation checked (30–45°)',
    'Hand hygiene performed',
    'Oral care performed per protocol',
    'Tube position verified',
    'Cuff pressure checked (if applicable)',
    'Tube secured and marked',
    'Suctioning performed as needed',
  ],
  'Ventilator Care': [
    'Head end elevation checked (30–45°)',
    'Hand hygiene performed',
    'Oral care performed per protocol',
    'PUD prophylaxis assessed',
    'DVT prophylaxis assessed',
    'Readiness for ventilator removal reviewed',
    'Ventilator circuit checked',
    'Cuff pressure verified',
  ],
};

const CATEGORY_COLOR: Record<BundleCare['bundleType'], string> = {
  'Urinary Catheter Care': 'bg-blue-100 text-blue-700',
  'Central Catheter Care': 'bg-purple-100 text-purple-700',
  'Critical Care': 'bg-rose-100 text-rose-700',
  'Ventilator Care': 'bg-red-100 text-red-700',
};

type BundleVal = 'Yes' | 'No' | 'N/A';

export function BundleCareTab() {
  const { store, selectedPatient, updateStore } = useEMR();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [bundleType, setBundleType] = useState<BundleCare['bundleType']>('Urinary Catheter Care');
  const [tubeType, setTubeType] = useState('');
  const [items, setItems] = useState<BundleItem[]>([]);
  const [meta, setMeta] = useState({
    date: nowDateStr(), time: nowTimeStr(), nurseName: '', remarks: '', correctiveAction: '',
    insertionDate: '', insertionTime: '', removalDate: '', removalTime: '',
  });

  const patientId = selectedPatient!.id;
  const records = store.bundleCare.filter(r => r.patientId === patientId);

  function initItems(type: BundleCare['bundleType']) {
    return (BUNDLE_ITEMS[type] || []).map((label, i) => ({
      id: `item-${i}`, label, value: 'N/A' as BundleVal
    }));
  }

  function openNew(type: BundleCare['bundleType'] = 'Urinary Catheter Care') {
    setBundleType(type);
    setTubeType(TUBE_OPTIONS[type][0] || '');
    setItems(initItems(type));
    setMeta({ date: nowDateStr(), time: nowTimeStr(), nurseName: '', remarks: '', correctiveAction: '', insertionDate: '', insertionTime: '', removalDate: '', removalTime: '' });
    setEditId(null);
    setDrawerOpen(true);
  }

  function changeBundleType(type: BundleCare['bundleType']) {
    setBundleType(type);
    setTubeType(TUBE_OPTIONS[type][0] || '');
    setItems(initItems(type));
  }

  function setItemValue(id: string, val: BundleVal) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, value: val } : i));
  }

  function setItemRemarks(id: string, remarks: string) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, remarks } : i));
  }

  function validateDates(): string | null {
    if (meta.removalDate && meta.insertionDate) {
      const ins = new Date(`${meta.insertionDate}T${meta.insertionTime || '00:00'}`);
      const rem = new Date(`${meta.removalDate}T${meta.removalTime || '00:00'}`);
      if (rem < ins) return 'Removal date/time cannot be earlier than insertion date/time.';
    }
    return null;
  }

  function save(status: 'Completed' | 'Draft') {
    const err = validateDates();
    if (err) { alert(err); return; }
    updateStore(prev => {
      const rec = { ...meta, bundleType, tubeType, items, status };
      if (editId) return { ...prev, bundleCare: prev.bundleCare.map(r => r.id === editId ? { ...r, ...rec } : r) };
      return {
        ...prev, bundleCare: [...prev.bundleCare, {
          id: generateId(), patientId, ...rec, createdAt: new Date().toISOString()
        } as BundleCare]
      };
    });
    setDrawerOpen(false);
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="ncard">
        <CardHeader
          title="Bundle Care Checklists"
          actions={
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(BUNDLE_ITEMS) as BundleCare['bundleType'][]).map(type => (
                <TealButton key={type} onClick={() => openNew(type)} size="sm">
                  <Plus size={12} /> {type}
                </TealButton>
              ))}
            </div>
          }
        />
        <div className="ncard-body">
          {records.length === 0 ? (
            <EmptyState icon={<GitBranch />} title="No bundle care records" action={<TealButton onClick={() => openNew()}><Plus size={14} /> Add Bundle Care</TealButton>} />
          ) : (
            <div className="space-y-4">
              {records.map(r => {
                const yes = r.items.filter(i => i.value === 'Yes').length;
                const no = r.items.filter(i => i.value === 'No').length;
                return (
                  <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold text-sm">{formatDate(r.date)} {r.time}</span>
                          <span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold', CATEGORY_COLOR[r.bundleType] || 'bg-slate-100 text-slate-600')}>{r.bundleType}</span>
                          {(r as { tubeType?: string }).tubeType && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{(r as { tubeType?: string }).tubeType}</span>}
                          <StatusBadge status={r.status} />
                        </div>
                        <div className="flex gap-3 text-xs">
                          <span className="text-green-600 font-semibold">✓ {yes} Done</span>
                          {no > 0 && <span className="text-red-600 font-semibold">✗ {no} Not Done</span>}
                          <span className="text-slate-400">By {r.nurseName || 'Demo Nurse'}</span>
                        </div>
                        {((r as { insertionDate?: string }).insertionDate) && (
                          <div className="text-xs text-slate-500 mt-1">
                            📅 Inserted: {(r as { insertionDate?: string }).insertionDate} {(r as { insertionTime?: string }).insertionTime}
                            {(r as { removalDate?: string }).removalDate && ` → Removed: ${(r as { removalDate?: string }).removalDate} ${(r as { removalTime?: string }).removalTime}`}
                          </div>
                        )}
                      </div>
                      <SoftButton onClick={() => {
                        const rec = r as BundleCare & { tubeType?: string };
                        setBundleType(r.bundleType);
                        setTubeType(rec.tubeType || '');
                        setItems(r.items);
                        setMeta({ date: r.date, time: r.time, nurseName: r.nurseName, remarks: r.remarks, correctiveAction: r.correctiveAction, insertionDate: rec.insertionDate || '', insertionTime: rec.insertionTime || '', removalDate: rec.removalDate || '', removalTime: rec.removalTime || '' });
                        setEditId(r.id); setDrawerOpen(true);
                      }} size="sm">
                        <Edit2 size={12} /> Edit
                      </SoftButton>
                    </div>
                    <div className="space-y-1.5">
                      {r.items.map(item => (
                        <div key={item.id} className="flex items-center gap-2 text-sm">
                          {item.value === 'Yes' ? <CheckCircle size={14} className="text-green-500 flex-shrink-0" /> :
                           item.value === 'No' ? <XCircle size={14} className="text-red-500 flex-shrink-0" /> :
                           <span className="w-3.5 h-3.5 rounded-full border border-slate-300 flex-shrink-0" />}
                          <span className={item.value === 'No' ? 'text-red-700' : 'text-slate-700'}>{item.label}</span>
                          {item.value === 'No' && item.remarks && <span className="text-red-500 text-xs">({item.remarks})</span>}
                        </div>
                      ))}
                    </div>
                    {r.remarks && <p className="text-xs text-slate-600 mt-2 pt-2 border-t border-slate-100"><b>Remarks:</b> {r.remarks}</p>}
                    {r.correctiveAction && <p className="text-xs text-amber-700 mt-1"><b>Corrective Action:</b> {r.correctiveAction}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <FormDrawer open={drawerOpen} title="Bundle Care Checklist" subtitle={selectedPatient!.name} onClose={() => setDrawerOpen(false)} onSave={() => save('Completed')} onSaveDraft={() => save('Draft')}>
        {/* Category & Tube selection */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <FormGroup label="Care Category" required>
            <FormSelect value={bundleType} onChange={v => changeBundleType(v as BundleCare['bundleType'])} options={Object.keys(BUNDLE_ITEMS) as BundleCare['bundleType'][]} />
          </FormGroup>
          <FormGroup label="Tube / Device Type" required>
            <FormSelect value={tubeType} onChange={setTubeType} options={TUBE_OPTIONS[bundleType] || []} />
          </FormGroup>
          <FormGroup label="Date"><FormInput type="date" value={meta.date} onChange={v => setMeta(p => ({ ...p, date: v }))} /></FormGroup>
          <FormGroup label="Time"><FormInput type="time" value={meta.time} onChange={v => setMeta(p => ({ ...p, time: v }))} /></FormGroup>
          <FormGroup label="Nurse Name"><FormInput value={meta.nurseName} onChange={v => setMeta(p => ({ ...p, nurseName: v }))} placeholder="Nurse name" /></FormGroup>
        </div>

        {/* Insertion & Removal Dates */}
        <SectionTitle>Device Insertion & Removal</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <FormGroup label="Insertion Date"><FormInput type="date" value={meta.insertionDate} onChange={v => setMeta(p => ({ ...p, insertionDate: v }))} /></FormGroup>
          <FormGroup label="Insertion Time"><FormInput type="time" value={meta.insertionTime} onChange={v => setMeta(p => ({ ...p, insertionTime: v }))} /></FormGroup>
          <FormGroup label="Removal Date"><FormInput type="date" value={meta.removalDate} onChange={v => setMeta(p => ({ ...p, removalDate: v }))} /></FormGroup>
          <FormGroup label="Removal Time"><FormInput type="time" value={meta.removalTime} onChange={v => setMeta(p => ({ ...p, removalTime: v }))} /></FormGroup>
        </div>
        {meta.removalDate && meta.insertionDate && new Date(`${meta.removalDate}T${meta.removalTime || '00:00'}`) < new Date(`${meta.insertionDate}T${meta.insertionTime || '00:00'}`) && (
          <p className="text-xs text-red-600 mt-1">⚠ Removal date/time cannot be earlier than insertion date/time.</p>
        )}

        {/* Checklist Items */}
        <SectionTitle>Checklist Items — {bundleType}</SectionTitle>
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-800 flex-1">{item.label}</span>
                <div className="flex gap-1">
                  {(['Yes', 'No', 'N/A'] as BundleVal[]).map(val => (
                    <button key={val} onClick={() => setItemValue(item.id, val)} className={cn(
                      'px-3 py-1 rounded-lg border text-xs font-semibold transition-colors',
                      item.value === val && val === 'Yes' ? 'bg-green-100 border-green-400 text-green-700' :
                      item.value === val && val === 'No' ? 'bg-red-100 border-red-400 text-red-700' :
                      item.value === val && val === 'N/A' ? 'bg-slate-200 border-slate-400 text-slate-700' :
                      'border-slate-200 text-slate-500 hover:border-slate-300'
                    )}>{val}</button>
                  ))}
                </div>
              </div>
              {item.value === 'No' && (
                <FormInput value={item.remarks || ''} onChange={v => setItemRemarks(item.id, v)} placeholder="Reason / remarks..." />
              )}
            </div>
          ))}
        </div>

        <SectionTitle>General</SectionTitle>
        <FormGroup label="Remarks"><FormTextarea value={meta.remarks} onChange={v => setMeta(p => ({ ...p, remarks: v }))} rows={2} /></FormGroup>
        <FormGroup label="Corrective Action" className="mt-3"><FormTextarea value={meta.correctiveAction} onChange={v => setMeta(p => ({ ...p, correctiveAction: v }))} rows={2} /></FormGroup>
      </FormDrawer>
    </div>
  );
}
