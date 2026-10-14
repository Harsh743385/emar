'use client';

import { useState } from 'react';
import { useEMR } from '@/context/EMRContext';
import { generateId, nowDateStr, nowTimeStr } from '@/lib/store';
import { getShiftFromTime, formatDate } from '@/lib/utils';
import { FormDrawer, FormGroup, FormInput, FormSelect, FormTextarea, StatusBadge, EmptyState, CardHeader, TealButton, SoftButton } from '@/components/FormDrawer';
import { Plus, Edit2, FileText } from 'lucide-react';
import type { NursingNote } from '@/lib/types';

export function NursingNotesTab() {
  const { store, selectedPatient, updateStore } = useEMR();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ date: nowDateStr(), time: nowTimeStr(), shift: getShiftFromTime(nowTimeStr()) as 'Morning'|'Afternoon'|'Night', noteType: 'Progress' as NursingNote['noteType'], note: '', nurseName: '' });
  const [activeDate, setActiveDate] = useState(nowDateStr());

  const patientId = selectedPatient!.id;
  const allNotes = store.nursingNotes.filter(r => r.patientId === patientId);
  const dateNotes = allNotes.filter(r => r.date === activeDate);

  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 3 + i); return d.toISOString().substring(0, 10); });
  const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  function openNew() { setForm({ date: nowDateStr(), time: nowTimeStr(), shift: getShiftFromTime(nowTimeStr()), noteType: 'Progress', note: '', nurseName: '' }); setEditId(null); setDrawerOpen(true); }

  function openEdit(r: NursingNote) {
    setForm({ date: r.date, time: r.time, shift: r.shift, noteType: r.noteType, note: r.note, nurseName: r.nurseName });
    setEditId(r.id); setDrawerOpen(true);
  }

  function save(status: 'Completed' | 'Draft') {
    updateStore(prev => {
      if (editId) return { ...prev, nursingNotes: prev.nursingNotes.map(r => r.id === editId ? { ...r, ...form, status } : r) };
      return { ...prev, nursingNotes: [...prev.nursingNotes, { id: generateId(), patientId, ...form, status, createdAt: new Date().toISOString() } as NursingNote] };
    });
    setActiveDate(form.date); setDrawerOpen(false);
  }

  const noteTypeColor: Record<string, string> = {
    'Progress': 'bg-blue-100 text-blue-700',
    'Nursing': 'bg-teal-100 text-teal-700',
    'Observation': 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="ncard">
        <CardHeader title="Progress Notes" actions={<TealButton onClick={openNew} size="sm"><Plus size={14} /> Add Note</TealButton>} />
        <div className="ncard-body">
          <div className="date-strip">
            {days.map(d => { const date = new Date(d); return <div key={d} className={`date-day ${d === activeDate ? 'active' : ''}`} onClick={() => setActiveDate(d)}><div className="dow">{DOW[date.getDay()]}</div><div className="dom">{date.getDate()}</div></div>; })}
            <input type="date" value={activeDate} onChange={e => setActiveDate(e.target.value)} className="px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-400" />
          </div>

          <div className="mb-3 text-sm"><b>{formatDate(activeDate)}</b>&nbsp;<span className="text-slate-500">{dateNotes.length} note{dateNotes.length !== 1 ? 's' : ''}</span></div>

          {dateNotes.length === 0 ? (
            <EmptyState icon={<FileText />} title="No notes for this date" action={<TealButton onClick={openNew}><Plus size={14} /> Add Note</TealButton>} />
          ) : (
            <div className="space-y-3">
              {dateNotes.map(r => (
                <div key={r.id} className="row-item">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${noteTypeColor[r.noteType]}`}>{r.noteType} Note</span>
                      <span className="text-sm font-semibold text-slate-700">{r.time} — {r.shift} Shift</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{r.note}</p>
                    <div className="text-xs text-slate-400 mt-1.5">By {r.nurseName || 'Demo Nurse'}</div>
                  </div>
                  <SoftButton onClick={() => openEdit(r)} size="sm"><Edit2 size={12} /> Edit</SoftButton>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <FormDrawer open={drawerOpen} title={editId ? 'Edit Note' : 'New Progress Note'} subtitle={selectedPatient!.name} onClose={() => setDrawerOpen(false)} onSave={() => save('Completed')} onSaveDraft={() => save('Draft')}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <FormGroup label="Time" required><FormInput type="time" value={form.time} onChange={v => setForm(p => ({ ...p, time: v }))} /></FormGroup>
          <FormGroup label="Shift"><FormSelect value={form.shift} onChange={v => setForm(p => ({ ...p, shift: v as typeof form.shift }))} options={['Morning', 'Afternoon', 'Night']} /></FormGroup>
          <FormGroup label="Date" required><FormInput type="date" value={form.date} onChange={v => setForm(p => ({ ...p, date: v }))} /></FormGroup>
          <FormGroup label="Note Type"><FormSelect value={form.noteType} onChange={v => setForm(p => ({ ...p, noteType: v as typeof form.noteType }))} options={['Progress', 'Nursing', 'Observation']} /></FormGroup>
        </div>
        <FormGroup label="Nurse Name"><FormInput value={form.nurseName} onChange={v => setForm(p => ({ ...p, nurseName: v }))} placeholder="Nurse name" className="mb-3" /></FormGroup>
        <FormGroup label="Note" required><FormTextarea value={form.note} onChange={v => setForm(p => ({ ...p, note: v }))} placeholder="Enter nursing note / progress note..." rows={8} /></FormGroup>
      </FormDrawer>
    </div>
  );
}
